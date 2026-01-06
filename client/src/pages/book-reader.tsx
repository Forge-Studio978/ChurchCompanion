import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ChevronLeft, ChevronRight, BookOpen, List, Highlighter, Trash2 } from "lucide-react";
import type { DevotionalBook, DevotionalChapter, BookHighlight } from "@shared/schema";

export default function BookReader() {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [, params] = useRoute("/books/:id");
  const bookId = params?.id ? parseInt(params.id) : null;

  const [selectedChapterId, setSelectedChapterId] = useState<number | null>(null);
  const [showChapterList, setShowChapterList] = useState(false);
  const [selectedText, setSelectedText] = useState("");
  const [showHighlightDialog, setShowHighlightDialog] = useState(false);
  const [highlightNote, setHighlightNote] = useState("");

  const { data: bookData, isLoading: isLoadingBook } = useQuery<{
    book: DevotionalBook;
    chapters: DevotionalChapter[];
  }>({
    queryKey: ["/api/devotional-books", bookId],
    enabled: !!bookId,
  });

  const { data: chapter, isLoading: isLoadingChapter } = useQuery<DevotionalChapter>({
    queryKey: ["/api/devotional-chapters", selectedChapterId],
    enabled: !!selectedChapterId,
  });

  const { data: progress } = useQuery<{ currentChapterId: number } | null>({
    queryKey: ["/api/book-progress", bookId],
    enabled: !!bookId && isAuthenticated,
  });

  const { data: highlights = [] } = useQuery<BookHighlight[]>({
    queryKey: ["/api/book-highlights", selectedChapterId],
    enabled: !!selectedChapterId && isAuthenticated,
  });

  useEffect(() => {
    if (progress?.currentChapterId && bookData && !selectedChapterId) {
      setSelectedChapterId(progress.currentChapterId);
    }
  }, [progress, bookData, selectedChapterId]);

  const updateProgressMutation = useMutation({
    mutationFn: async (data: { bookId: number; currentChapterId: number }) => {
      return apiRequest("POST", "/api/book-progress", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/book-progress", bookId] });
    },
  });

  const addHighlightMutation = useMutation({
    mutationFn: async (data: { chapterId: number; highlightedText: string; note?: string }) => {
      return apiRequest("POST", "/api/book-highlights", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/book-highlights", selectedChapterId] });
      toast({
        title: "Highlight saved",
        description: "Your highlight and note have been saved.",
      });
    },
  });

  const deleteHighlightMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/book-highlights/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/book-highlights", selectedChapterId] });
      toast({
        title: "Highlight removed",
        description: "The highlight has been deleted.",
      });
    },
  });

  const handleSelectChapter = (chapterId: number) => {
    setSelectedChapterId(chapterId);
    setShowChapterList(false);
    if (bookId && isAuthenticated) {
      updateProgressMutation.mutate({ bookId, currentChapterId: chapterId });
    }
  };

  const handleBack = () => {
    if (selectedChapterId) {
      setSelectedChapterId(null);
    } else {
      navigate("/library");
    }
  };

  const getCurrentChapterIndex = () => {
    if (!bookData || !selectedChapterId) return -1;
    return bookData.chapters.findIndex(c => c.id === selectedChapterId);
  };

  const handlePrevChapter = () => {
    const index = getCurrentChapterIndex();
    if (index > 0 && bookData) {
      handleSelectChapter(bookData.chapters[index - 1].id);
    }
  };

  const handleNextChapter = () => {
    const index = getCurrentChapterIndex();
    if (bookData && index < bookData.chapters.length - 1) {
      handleSelectChapter(bookData.chapters[index + 1].id);
    }
  };

  const handleTextSelection = () => {
    const selection = window.getSelection();
    const text = selection?.toString().trim();
    if (text && text.length > 0) {
      setSelectedText(text);
    }
  };

  const handleAddHighlight = () => {
    if (!selectedChapterId || !selectedText) return;
    addHighlightMutation.mutate({
      chapterId: selectedChapterId,
      highlightedText: selectedText,
      note: highlightNote || undefined,
    });
    setShowHighlightDialog(false);
    setSelectedText("");
    setHighlightNote("");
  };

  const formatContent = (content: string) => {
    return content.split("\n\n").map((paragraph, i) => (
      <p key={i} className="mb-4 leading-relaxed">
        {paragraph}
      </p>
    ));
  };

  if (!bookId) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <BookOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h1 className="font-serif text-2xl font-semibold mb-2">Book not found</h1>
          <Button onClick={() => navigate("/library")} data-testid="button-back-library">
            Back to Library
          </Button>
        </div>
      </Layout>
    );
  }

  if (isLoadingBook) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Skeleton className="h-8 w-48 mb-6" />
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  if (selectedChapterId && chapter) {
    const chapterIndex = getCurrentChapterIndex();
    const hasPrev = chapterIndex > 0;
    const hasNext = bookData && chapterIndex < bookData.chapters.length - 1;

    return (
      <Layout>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
            <Button variant="ghost" onClick={handleBack} data-testid="button-back">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            <div className="flex items-center gap-2">
              {isAuthenticated && selectedText && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => setShowHighlightDialog(true)}
                  data-testid="button-highlight"
                >
                  <Highlighter className="h-4 w-4 mr-2" />
                  Highlight
                </Button>
              )}
              <Button variant="outline" onClick={() => setShowChapterList(true)} data-testid="button-chapters">
                <List className="h-4 w-4 mr-2" />
                Chapters
              </Button>
            </div>
          </div>

          <article
            className="prose prose-lg dark:prose-invert max-w-none"
            onMouseUp={handleTextSelection}
          >
            {isLoadingChapter ? (
              <div className="space-y-4">
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ) : (
              <>
                <h1 className="font-serif text-2xl md:text-3xl font-semibold mb-6">
                  {chapter.title}
                </h1>
                <div className="font-serif text-lg" data-testid="chapter-content">
                  {formatContent(chapter.content)}
                </div>
                {isAuthenticated && (
                  <p className="text-sm text-muted-foreground mt-6 text-center italic">
                    Select any text above to highlight and add notes
                  </p>
                )}
              </>
            )}
          </article>

          {isAuthenticated && highlights.length > 0 && (
            <div className="mt-8 pt-6 border-t">
              <h3 className="font-medium mb-4 flex items-center gap-2">
                <Highlighter className="h-4 w-4" />
                Your Highlights
              </h3>
              <div className="space-y-3">
                {highlights.map((hl) => (
                  <Card key={hl.id} data-testid={`highlight-${hl.id}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <p className="font-serif italic text-muted-foreground">
                            "{hl.highlightedText}"
                          </p>
                          {hl.note && (
                            <p className="mt-2 text-sm">{hl.note}</p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteHighlightMutation.mutate(hl.id)}
                          data-testid={`button-delete-highlight-${hl.id}`}
                        >
                          <Trash2 className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between mt-8 pt-6 border-t gap-4">
            <Button
              variant="outline"
              onClick={handlePrevChapter}
              disabled={!hasPrev}
              data-testid="button-prev-chapter"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              {chapterIndex + 1} of {bookData?.chapters.length || 0}
            </span>
            <Button
              variant="outline"
              onClick={handleNextChapter}
              disabled={!hasNext}
              data-testid="button-next-chapter"
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>

          <Dialog open={showChapterList} onOpenChange={setShowChapterList}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Chapters</DialogTitle>
              </DialogHeader>
              <ScrollArea className="max-h-[60vh]">
                <div className="space-y-2">
                  {bookData?.chapters.map((ch, i) => (
                    <Button
                      key={ch.id}
                      variant={ch.id === selectedChapterId ? "secondary" : "ghost"}
                      className="w-full justify-start"
                      onClick={() => handleSelectChapter(ch.id)}
                      data-testid={`chapter-item-${ch.id}`}
                    >
                      <span className="text-muted-foreground mr-3">{i + 1}.</span>
                      {ch.title}
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            </DialogContent>
          </Dialog>

          <Dialog
            open={showHighlightDialog}
            onOpenChange={(open) => {
              setShowHighlightDialog(open);
              if (!open) {
                setSelectedText("");
                setHighlightNote("");
              }
            }}
          >
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add Highlight</DialogTitle>
                <DialogDescription>Save this passage with an optional note.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="p-3 bg-muted rounded-md">
                  <p className="text-sm italic">"{selectedText}"</p>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Add a note (optional)</label>
                  <Textarea
                    value={highlightNote}
                    onChange={(e) => setHighlightNote(e.target.value)}
                    placeholder="Your thoughts on this passage..."
                    className="resize-none"
                    rows={3}
                    data-testid="input-highlight-note"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowHighlightDialog(false);
                    setSelectedText("");
                    setHighlightNote("");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddHighlight}
                  disabled={addHighlightMutation.isPending}
                  data-testid="button-save-highlight"
                >
                  {addHighlightMutation.isPending ? "Saving..." : "Save Highlight"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </Layout>
    );
  }

  if (bookData) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Button variant="ghost" onClick={handleBack} className="mb-6" data-testid="button-back">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Library
          </Button>

          <div className="mb-8">
            <h1 className="font-serif text-2xl md:text-3xl font-semibold mb-2">
              {bookData.book.title}
            </h1>
            {bookData.book.author && (
              <p className="text-muted-foreground">by {bookData.book.author}</p>
            )}
            {bookData.book.description && (
              <p className="mt-4 text-muted-foreground">{bookData.book.description}</p>
            )}
            {progress && isAuthenticated && (
              <div className="mt-4">
                <Button
                  variant="default"
                  onClick={() => handleSelectChapter(progress.currentChapterId)}
                  data-testid="button-continue-reading"
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  Continue Reading
                </Button>
              </div>
            )}
          </div>

          <h2 className="font-semibold mb-4">Chapters</h2>
          <div className="space-y-2">
            {bookData.chapters.map((ch, i) => (
              <Card
                key={ch.id}
                className="hover-elevate cursor-pointer"
                onClick={() => handleSelectChapter(ch.id)}
                data-testid={`chapter-card-${ch.id}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className="text-muted-foreground text-sm w-6">{i + 1}.</span>
                      <span className="font-medium">{ch.title}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {progress?.currentChapterId === ch.id && (
                        <Badge variant="outline" className="text-xs">Last read</Badge>
                      )}
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  return null;
}
