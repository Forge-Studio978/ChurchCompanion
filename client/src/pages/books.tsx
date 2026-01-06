import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Book, ChevronLeft, ChevronRight, BookOpen, List } from "lucide-react";
import type { DevotionalBook, DevotionalChapter } from "@shared/schema";

export default function Books() {
  const { isAuthenticated } = useAuth();
  const [selectedBookId, setSelectedBookId] = useState<number | null>(null);
  const [selectedChapterId, setSelectedChapterId] = useState<number | null>(null);
  const [showChapterList, setShowChapterList] = useState(false);

  const { data: books = [], isLoading } = useQuery<DevotionalBook[]>({
    queryKey: ["/api/devotional-books"],
  });

  const { data: bookData, isLoading: isLoadingBook } = useQuery<{
    book: DevotionalBook;
    chapters: DevotionalChapter[];
  }>({
    queryKey: ["/api/devotional-books", selectedBookId],
    enabled: !!selectedBookId,
  });

  const { data: chapter, isLoading: isLoadingChapter } = useQuery<DevotionalChapter>({
    queryKey: ["/api/devotional-chapters", selectedChapterId],
    enabled: !!selectedChapterId,
  });

  const updateProgressMutation = useMutation({
    mutationFn: async (data: { bookId: number; currentChapterId: number }) => {
      return apiRequest("POST", "/api/book-progress", data);
    },
  });

  const handleSelectBook = (bookId: number) => {
    setSelectedBookId(bookId);
    setSelectedChapterId(null);
  };

  const handleSelectChapter = (chapterId: number) => {
    setSelectedChapterId(chapterId);
    setShowChapterList(false);
    if (selectedBookId && isAuthenticated) {
      updateProgressMutation.mutate({ bookId: selectedBookId, currentChapterId: chapterId });
    }
  };

  const handleBack = () => {
    if (selectedChapterId) {
      setSelectedChapterId(null);
    } else {
      setSelectedBookId(null);
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

  const formatContent = (content: string) => {
    return content.split("\n\n").map((paragraph, i) => (
      <p key={i} className="mb-4 leading-relaxed">
        {paragraph}
      </p>
    ));
  };

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
            <Button variant="outline" onClick={() => setShowChapterList(true)} data-testid="button-chapters">
              <List className="h-4 w-4 mr-2" />
              Chapters
            </Button>
          </div>

          <article className="prose prose-lg dark:prose-invert max-w-none">
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
              </>
            )}
          </article>

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
        </div>
      </Layout>
    );
  }

  if (selectedBookId && bookData) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Button variant="ghost" onClick={handleBack} className="mb-6" data-testid="button-back">
            <ChevronLeft className="h-4 w-4 mr-1" />
            All Books
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
          </div>

          {isLoadingBook ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <Skeleton className="h-6 w-3/4" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : bookData.chapters.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No chapters available yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {bookData.chapters.map((ch, i) => (
                <Card
                  key={ch.id}
                  className="cursor-pointer transition-all hover:shadow-md hover:border-primary/30"
                  onClick={() => handleSelectChapter(ch.id)}
                  data-testid={`chapter-card-${ch.id}`}
                >
                  <CardContent className="p-4 flex items-center gap-4">
                    <span className="text-2xl font-serif text-muted-foreground w-10 text-center">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{ch.title}</h3>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <h1 className="font-serif text-2xl md:text-3xl font-semibold mb-6">Devotional Books</h1>

        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-24 w-full mb-4" />
                  <Skeleton className="h-6 w-3/4" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : books.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Book className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No devotional books available yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {books.map((book) => (
              <Card
                key={book.id}
                className="cursor-pointer transition-all hover:shadow-md hover:border-primary/30"
                onClick={() => handleSelectBook(book.id)}
                data-testid={`book-card-${book.id}`}
              >
                <CardContent className="p-6">
                  <div
                    className="h-32 rounded-md mb-4 flex items-center justify-center"
                    style={{ backgroundColor: book.coverColor || "#2c4a6e" }}
                  >
                    <Book className="h-12 w-12 text-white/80" />
                  </div>
                  <h3 className="font-serif text-lg font-semibold mb-1">{book.title}</h3>
                  {book.author && (
                    <p className="text-sm text-muted-foreground">{book.author}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
