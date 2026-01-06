import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { StickyNote, Book, Radio, Clock, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Link } from "wouter";
import type { Note, Highlight, BibleVerse } from "@shared/schema";

interface NoteWithVerse extends Note {
  verse?: BibleVerse;
}

interface HighlightWithVerse extends Highlight {
  verse?: BibleVerse;
}

export default function NotesPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: allNotes = [], isLoading: notesLoading } = useQuery<Note[]>({
    queryKey: ["/api/notes"],
    enabled: isAuthenticated,
  });

  const { data: highlights = [], isLoading: highlightsLoading } = useQuery<HighlightWithVerse[]>({
    queryKey: ["/api/highlights/full"],
    enabled: isAuthenticated,
  });

  const bibleNotes = allNotes.filter(n => n.verseId && !n.sermonId);
  const livestreamNotes = allNotes.filter(n => n.sermonId);

  const filteredBibleNotes = searchQuery
    ? bibleNotes.filter(n => n.content.toLowerCase().includes(searchQuery.toLowerCase()))
    : bibleNotes;

  const filteredLivestreamNotes = searchQuery
    ? livestreamNotes.filter(n => n.content.toLowerCase().includes(searchQuery.toLowerCase()))
    : livestreamNotes;

  const filteredHighlights = searchQuery
    ? highlights.filter(h => 
        h.note?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        h.verse?.text?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : highlights;

  const isLoading = notesLoading || highlightsLoading;

  if (authLoading) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Skeleton className="h-8 w-48 mb-6" />
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  if (!isAuthenticated) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <StickyNote className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h1 className="font-serif text-2xl font-semibold mb-2">My Notes</h1>
          <p className="text-muted-foreground mb-6">Sign in to view all your notes in one place</p>
          <Button asChild data-testid="button-sign-in">
            <a href="/api/login">Sign In</a>
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
          <h1 className="font-serif text-2xl md:text-3xl font-semibold">My Notes</h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-64"
              data-testid="input-search-notes"
            />
          </div>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="all" data-testid="tab-all-notes">All</TabsTrigger>
            <TabsTrigger value="bible" data-testid="tab-bible-notes">Bible</TabsTrigger>
            <TabsTrigger value="livestream" data-testid="tab-livestream-notes">Livestream</TabsTrigger>
            <TabsTrigger value="highlights" data-testid="tab-highlights">Highlights</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {[...filteredBibleNotes, ...filteredLivestreamNotes].length === 0 && filteredHighlights.length === 0 ? (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <StickyNote className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="font-medium mb-2">No notes yet</h3>
                      <p className="text-muted-foreground mb-4">
                        Start reading the Bible or watching livestreams to add notes
                      </p>
                      <div className="flex gap-2 justify-center">
                        <Button asChild variant="outline">
                          <Link href="/bible">Read Bible</Link>
                        </Button>
                        <Button asChild>
                          <Link href="/livestream">Watch Livestream</Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    {filteredBibleNotes.map((note) => (
                      <NoteCard key={`bible-${note.id}`} note={note} type="bible" />
                    ))}
                    {filteredLivestreamNotes.map((note) => (
                      <NoteCard key={`livestream-${note.id}`} note={note} type="livestream" />
                    ))}
                    {filteredHighlights.filter(h => h.note).map((highlight) => (
                      <HighlightCard key={`highlight-${highlight.id}`} highlight={highlight} />
                    ))}
                  </>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="bible" className="mt-6">
            {filteredBibleNotes.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Book className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="font-medium mb-2">No Bible notes</h3>
                  <p className="text-muted-foreground mb-4">
                    Add notes while reading Scripture
                  </p>
                  <Button asChild>
                    <Link href="/bible">Read Bible</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredBibleNotes.map((note) => (
                  <NoteCard key={note.id} note={note} type="bible" />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="livestream" className="mt-6">
            {filteredLivestreamNotes.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Radio className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="font-medium mb-2">No livestream notes</h3>
                  <p className="text-muted-foreground mb-4">
                    Take notes while watching livestreams
                  </p>
                  <Button asChild>
                    <Link href="/livestream">Watch Livestream</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredLivestreamNotes.map((note) => (
                  <NoteCard key={note.id} note={note} type="livestream" />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="highlights" className="mt-6">
            {filteredHighlights.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Book className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="font-medium mb-2">No highlights</h3>
                  <p className="text-muted-foreground mb-4">
                    Highlight verses while reading
                  </p>
                  <Button asChild>
                    <Link href="/bible">Read Bible</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredHighlights.map((highlight) => (
                  <HighlightCard key={highlight.id} highlight={highlight} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}

function NoteCard({ note, type }: { note: Note; type: 'bible' | 'livestream' }) {
  return (
    <Card data-testid={`note-card-${note.id}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            {type === 'bible' ? (
              <Book className="h-4 w-4 text-primary" />
            ) : (
              <Radio className="h-4 w-4 text-primary" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <Badge variant="secondary" className="text-xs">
                {type === 'bible' ? 'Bible Note' : 'Livestream Note'}
              </Badge>
              {note.timestamp && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {note.timestamp}
                </span>
              )}
            </div>
            <p className="text-sm whitespace-pre-wrap">{note.content}</p>
            <p className="text-xs text-muted-foreground mt-2">
              {new Date(note.createdAt!).toLocaleDateString()}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function HighlightCard({ highlight }: { highlight: HighlightWithVerse }) {
  return (
    <Card data-testid={`highlight-card-${highlight.id}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div 
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${highlight.color}40` }}
          >
            <Book className="h-4 w-4" style={{ color: highlight.color }} />
          </div>
          <div className="flex-1 min-w-0">
            {highlight.verse && (
              <Badge variant="outline" className="mb-2">
                {highlight.verse.book} {highlight.verse.chapter}:{highlight.verse.verse}
              </Badge>
            )}
            {highlight.verse && (
              <p className="text-sm font-serif leading-relaxed mb-2">{highlight.verse.text}</p>
            )}
            {highlight.note && (
              <p className="text-sm text-muted-foreground italic">{highlight.note}</p>
            )}
            <p className="text-xs text-muted-foreground mt-2">
              {new Date(highlight.createdAt!).toLocaleDateString()}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
