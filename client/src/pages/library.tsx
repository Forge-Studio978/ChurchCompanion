import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { 
  Music, FileText, Highlighter, Trash2, Bookmark, FolderOpen, 
  Search, Radio, Clock, BookOpen
} from "lucide-react";
import { Link } from "wouter";
import type { BibleVerse, Hymn, Note, Highlight, Livestream, LivestreamNote } from "@shared/schema";

interface SavedVerseWithVerse {
  id: number;
  verseId: number;
  createdAt: string;
  verse: BibleVerse;
}

interface SavedHymnWithHymn {
  id: number;
  hymnId: number;
  createdAt: string;
  hymn: Hymn;
}

interface HighlightWithVerse extends Highlight {
  verse: BibleVerse;
}

interface NoteWithContext extends Note {
  verse?: BibleVerse;
}

interface LivestreamNoteWithContext extends LivestreamNote {
  livestream: Livestream;
}


function formatLivestreamTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function LibraryPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: savedVerses = [], isLoading: versesLoading } = useQuery<SavedVerseWithVerse[]>({
    queryKey: ["/api/saved-verses"],
    enabled: isAuthenticated,
  });

  const { data: savedHymns = [], isLoading: hymnsLoading } = useQuery<SavedHymnWithHymn[]>({
    queryKey: ["/api/saved-hymns/full"],
    enabled: isAuthenticated,
  });

  const { data: highlights = [], isLoading: highlightsLoading } = useQuery<HighlightWithVerse[]>({
    queryKey: ["/api/highlights/full"],
    enabled: isAuthenticated,
  });

  const { data: notes = [], isLoading: notesLoading } = useQuery<NoteWithContext[]>({
    queryKey: ["/api/notes"],
    enabled: isAuthenticated,
  });

  const { data: savedLivestreamNotes = [], isLoading: livestreamNotesLoading } = useQuery<LivestreamNoteWithContext[]>({
    queryKey: ["/api/livestream-notes"],
    enabled: isAuthenticated,
  });

  const deleteSavedVerseMutation = useMutation({
    mutationFn: async (id: number) => apiRequest("DELETE", `/api/saved-verses/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/saved-verses"] });
      toast({ title: "Verse removed from library" });
    },
  });

  const deleteSavedHymnMutation = useMutation({
    mutationFn: async (id: number) => apiRequest("DELETE", `/api/saved-hymns/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/saved-hymns"] });
      queryClient.invalidateQueries({ queryKey: ["/api/saved-hymns/full"] });
      toast({ title: "Hymn removed from library" });
    },
  });

  const deleteHighlightMutation = useMutation({
    mutationFn: async (id: number) => apiRequest("DELETE", `/api/highlights/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/highlights"] });
      queryClient.invalidateQueries({ queryKey: ["/api/highlights/full"] });
      toast({ title: "Highlight removed" });
    },
  });

  const deleteNoteMutation = useMutation({
    mutationFn: async (id: number) => apiRequest("DELETE", `/api/notes/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notes"] });
      toast({ title: "Note deleted" });
    },
  });

  const deleteLivestreamNoteMutation = useMutation({
    mutationFn: async (id: number) => apiRequest("DELETE", `/api/livestream-notes/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/livestream-notes"] });
      toast({ title: "Note deleted" });
    },
  });

  const filteredNotes = searchQuery
    ? notes.filter(n => n.content.toLowerCase().includes(searchQuery.toLowerCase()))
    : notes;

  const filteredLivestreamNotes = searchQuery
    ? savedLivestreamNotes.filter(n => 
        n.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.livestream?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.bibleReference?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : savedLivestreamNotes;

  const filteredHighlights = searchQuery
    ? highlights.filter(h => 
        h.note?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        h.verse?.text?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : highlights;

  if (authLoading) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Skeleton className="h-8 w-48 mb-6" />
          <Skeleton className="h-12 w-full mb-4" />
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
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
        <div className="max-w-sm mx-auto px-4 py-16 text-center">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <FolderOpen className="h-10 w-10 text-primary" />
          </div>
          <h1 className="font-serif text-2xl font-semibold mb-2">Your Library</h1>
          <p className="text-muted-foreground mb-8">Sign in to save verses, hymns, and notes</p>
          <Button size="lg" asChild data-testid="button-sign-in">
            <a href="/auth">Sign In</a>
          </Button>
        </div>
      </Layout>
    );
  }

  const EmptyState = ({ icon: Icon, title, description }: { icon: any; title: string; description: string }) => (
    <div className="py-12 text-center">
      <Icon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
      <p className="font-medium mb-1">{title}</p>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );

  return (
    <Layout>
      <div className="max-w-lg mx-auto px-4 sm:px-6 py-6">
        <div className="text-center mb-6">
          <h1 className="font-serif text-2xl sm:text-3xl font-semibold mb-2">My Library</h1>
          <p className="text-muted-foreground">Your saved content and notes</p>
        </div>

        <Tabs defaultValue="verses" className="w-full">
          <TabsList className="w-full flex flex-wrap justify-center mb-6 h-auto gap-1 p-1">
            <TabsTrigger value="verses" className="gap-1 px-2 py-1.5 text-xs sm:text-sm" data-testid="tab-verses">
              <Bookmark className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Verses</span>
              <span className="sm:hidden">Verses</span>
              {savedVerses.length > 0 && (
                <Badge variant="secondary" className="ml-0.5 text-xs px-1.5">{savedVerses.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="hymns" className="gap-1 px-2 py-1.5 text-xs sm:text-sm" data-testid="tab-hymns">
              <Music className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span>Hymns</span>
              {savedHymns.length > 0 && (
                <Badge variant="secondary" className="ml-0.5 text-xs px-1.5">{savedHymns.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="notes" className="gap-1 px-2 py-1.5 text-xs sm:text-sm" data-testid="tab-notes">
              <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span>Notes</span>
              {notes.length > 0 && (
                <Badge variant="secondary" className="ml-0.5 text-xs px-1.5">{notes.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="highlights" className="gap-1 px-2 py-1.5 text-xs sm:text-sm" data-testid="tab-highlights">
              <Highlighter className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Highlights</span>
              <span className="sm:hidden">Marks</span>
              {highlights.length > 0 && (
                <Badge variant="secondary" className="ml-0.5 text-xs px-1.5">{highlights.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="verses">
            {versesLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
            ) : savedVerses.length === 0 ? (
              <EmptyState
                icon={Bookmark}
                title="No saved verses"
                description="Save verses while reading the Bible"
              />
            ) : (
              <div className="space-y-3">
                {savedVerses.map((item) => (
                  <Card key={item.id} data-testid={`saved-verse-${item.id}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <Link 
                            href={`/bible?book=${encodeURIComponent(item.verse.book)}&chapter=${item.verse.chapter}`}
                            className="font-medium text-primary hover:underline"
                          >
                            {item.verse.book} {item.verse.chapter}:{item.verse.verse}
                          </Link>
                          <p className="font-serif mt-2 leading-relaxed">{item.verse.text}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteSavedVerseMutation.mutate(item.id)}
                          data-testid={`delete-verse-${item.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="hymns">
            {hymnsLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : savedHymns.length === 0 ? (
              <EmptyState
                icon={Music}
                title="No saved hymns"
                description="Save your favorite hymns from the hymnal"
              />
            ) : (
              <div className="space-y-3">
                {savedHymns.map((item) => (
                  <Card key={item.id} data-testid={`saved-hymn-${item.id}`}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <Link 
                            href={`/hymns/${item.hymnId}`}
                            className="font-medium text-primary hover:underline"
                          >
                            {item.hymn.title}
                          </Link>
                          {item.hymn.composer && (
                            <p className="text-sm text-muted-foreground truncate">
                              {item.hymn.composer}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteSavedHymnMutation.mutate(item.id)}
                          data-testid={`delete-hymn-${item.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="notes">
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search notes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                  data-testid="input-search-notes"
                />
              </div>
            </div>
            {notesLoading && livestreamNotesLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-32 w-full" />
                ))}
              </div>
            ) : filteredNotes.length === 0 && filteredLivestreamNotes.length === 0 ? (
              <EmptyState
                icon={FileText}
                title="No notes"
                description="Add notes while reading or watching"
              />
            ) : (
              <div className="space-y-3">
                {filteredLivestreamNotes.length > 0 && (
                  <>
                    <h3 className="font-medium text-sm text-muted-foreground flex items-center gap-2 mt-4">
                      <Radio className="h-4 w-4" />
                      Livestream Notes
                    </h3>
                    {filteredLivestreamNotes.map((note) => (
                      <Card key={`ls-${note.id}`} data-testid={`livestream-note-${note.id}`}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2 flex-wrap">
                                <Badge variant="outline" className="gap-1">
                                  <Radio className="h-3 w-3" />
                                  {note.livestream?.title || "Livestream"}
                                </Badge>
                                <Badge variant="secondary" className="gap-1">
                                  <Clock className="h-3 w-3" />
                                  {formatLivestreamTime(note.timestampSeconds)}
                                </Badge>
                              </div>
                              {note.bibleReference && (
                                <Badge variant="outline" className="gap-1 mb-2">
                                  <BookOpen className="h-3 w-3" />
                                  {note.bibleReference}
                                </Badge>
                              )}
                              <p className="leading-relaxed whitespace-pre-wrap">{note.content}</p>
                              <p className="text-xs text-muted-foreground mt-2">
                                {new Date(note.createdAt!).toLocaleDateString()}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteLivestreamNoteMutation.mutate(note.id)}
                              data-testid={`delete-ls-note-${note.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </>
                )}
                {filteredNotes.length > 0 && (
                  <>
                    <h3 className="font-medium text-sm text-muted-foreground flex items-center gap-2 mt-4">
                      <BookOpen className="h-4 w-4" />
                      Bible Notes
                    </h3>
                    {filteredNotes.map((note) => (
                      <Card key={note.id} data-testid={`note-${note.id}`}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                {note.verseId && !note.sermonId && (
                                  <Badge variant="outline" className="gap-1">
                                    <BookOpen className="h-3 w-3" />
                                    Bible
                                  </Badge>
                                )}
                                {note.sermonId && (
                                  <Badge variant="outline" className="gap-1">
                                    <Radio className="h-3 w-3" />
                                    Sermon
                                  </Badge>
                                )}
                                {note.timestamp && (
                                  <Badge variant="secondary">{note.timestamp}</Badge>
                                )}
                              </div>
                              {note.verse && (
                                <Link 
                                  href={`/bible?book=${encodeURIComponent(note.verse.book)}&chapter=${note.verse.chapter}`}
                                  className="text-sm text-primary hover:underline"
                                >
                                  {note.verse.book} {note.verse.chapter}:{note.verse.verse}
                                </Link>
                              )}
                              <p className="leading-relaxed whitespace-pre-wrap mt-1">{note.content}</p>
                              <p className="text-xs text-muted-foreground mt-2">
                                {new Date(note.createdAt!).toLocaleDateString()}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteNoteMutation.mutate(note.id)}
                              data-testid={`delete-note-${note.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="highlights">
            {highlightsLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-32 w-full" />
                ))}
              </div>
            ) : highlights.length === 0 ? (
              <EmptyState
                icon={Highlighter}
                title="No highlights"
                description="Highlight verses while reading"
              />
            ) : (
              <div className="space-y-3">
                {filteredHighlights.map((item) => (
                  <Card key={item.id} data-testid={`highlight-${item.id}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <Link 
                            href={`/bible?book=${encodeURIComponent(item.verse.book)}&chapter=${item.verse.chapter}`}
                            className="font-medium text-primary hover:underline"
                          >
                            {item.verse.book} {item.verse.chapter}:{item.verse.verse}
                          </Link>
                          <p className="font-serif leading-relaxed mt-2">{item.verse.text}</p>
                          {item.note && (
                            <p className="text-sm text-muted-foreground mt-2 italic">
                              Note: {item.note}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteHighlightMutation.mutate(item.id)}
                          data-testid={`delete-highlight-${item.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

      </div>
    </Layout>
  );
}
