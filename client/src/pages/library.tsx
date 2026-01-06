import { useQuery, useMutation } from "@tanstack/react-query";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Book, Music, FileText, Highlighter, Trash2, Bookmark, FolderOpen } from "lucide-react";
import { useLocation } from "wouter";
import type { BibleVerse, Hymn, Note, Highlight } from "@shared/schema";

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

export default function LibraryPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();

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
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <FolderOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h1 className="font-serif text-2xl font-semibold mb-2">Your Library</h1>
          <p className="text-muted-foreground mb-6">Sign in to save verses, hymns, and notes</p>
          <Button asChild data-testid="button-sign-in">
            <a href="/api/login">Sign In</a>
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <h1 className="font-serif text-2xl md:text-3xl font-semibold mb-6">My Library</h1>

        <Tabs defaultValue="verses" className="w-full">
          <TabsList className="w-full justify-start mb-6 flex-wrap h-auto gap-1">
            <TabsTrigger value="verses" className="gap-2" data-testid="tab-verses">
              <Bookmark className="h-4 w-4" />
              <span className="hidden sm:inline">Saved Verses</span>
              <span className="sm:hidden">Verses</span>
              {savedVerses.length > 0 && (
                <Badge variant="secondary" className="ml-1">{savedVerses.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="hymns" className="gap-2" data-testid="tab-hymns">
              <Music className="h-4 w-4" />
              <span className="hidden sm:inline">Saved Hymns</span>
              <span className="sm:hidden">Hymns</span>
              {savedHymns.length > 0 && (
                <Badge variant="secondary" className="ml-1">{savedHymns.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="highlights" className="gap-2" data-testid="tab-highlights">
              <Highlighter className="h-4 w-4" />
              <span className="hidden sm:inline">Highlights</span>
              <span className="sm:hidden">Marks</span>
              {highlights.length > 0 && (
                <Badge variant="secondary" className="ml-1">{highlights.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="notes" className="gap-2" data-testid="tab-notes">
              <FileText className="h-4 w-4" />
              Notes
              {notes.length > 0 && (
                <Badge variant="secondary" className="ml-1">{notes.length}</Badge>
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
                          <div className="font-medium text-sm text-primary mb-1">
                            {item.verse.book} {item.verse.chapter}:{item.verse.verse}
                          </div>
                          <p className="font-serif leading-relaxed">{item.verse.text}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteSavedVerseMutation.mutate(item.id)}
                          data-testid={`delete-saved-verse-${item.id}`}
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
                description="Save hymns from the hymnal library"
              />
            ) : (
              <div className="space-y-3">
                {savedHymns.map((item) => (
                  <Card
                    key={item.id}
                    className="cursor-pointer hover:border-primary/30 transition-colors"
                    onClick={() => navigate("/hymns")}
                    data-testid={`saved-hymn-${item.id}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="font-semibold">{item.hymn.title}</h3>
                          {item.hymn.composer && (
                            <p className="text-sm text-muted-foreground">{item.hymn.composer}</p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteSavedHymnMutation.mutate(item.hymnId);
                          }}
                          data-testid={`delete-saved-hymn-${item.id}`}
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

          <TabsContent value="highlights">
            {highlightsLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
            ) : highlights.length === 0 ? (
              <EmptyState
                icon={Highlighter}
                title="No highlights"
                description="Highlight verses while reading the Bible"
              />
            ) : (
              <div className="space-y-3">
                {highlights.map((item) => (
                  <Card key={item.id} data-testid={`highlight-${item.id}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <div
                              className={`w-3 h-3 rounded-full bg-${item.color}-400`}
                              style={{ backgroundColor: item.color }}
                            />
                            <span className="font-medium text-sm text-primary">
                              {item.verse.book} {item.verse.chapter}:{item.verse.verse}
                            </span>
                          </div>
                          <p className="font-serif leading-relaxed">{item.verse.text}</p>
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

          <TabsContent value="notes">
            {notesLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-32 w-full" />
                ))}
              </div>
            ) : notes.length === 0 ? (
              <EmptyState
                icon={FileText}
                title="No notes"
                description="Add notes while reading or watching"
              />
            ) : (
              <div className="space-y-3">
                {notes.map((note) => (
                  <Card key={note.id} data-testid={`note-${note.id}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          {note.verse && (
                            <div className="font-medium text-sm text-primary mb-2">
                              {note.verse.book} {note.verse.chapter}:{note.verse.verse}
                            </div>
                          )}
                          <p className="leading-relaxed whitespace-pre-wrap">{note.content}</p>
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
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
