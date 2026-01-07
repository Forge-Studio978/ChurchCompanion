import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useSearch } from "wouter";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { ChevronLeft, ChevronRight, Highlighter, Bookmark, PenLine, Search, X, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BibleVerse, Highlight } from "@shared/schema";

const BIBLE_BOOKS = [
  "Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy", "Joshua", "Judges", "Ruth",
  "1 Samuel", "2 Samuel", "1 Kings", "2 Kings", "1 Chronicles", "2 Chronicles", "Ezra",
  "Nehemiah", "Esther", "Job", "Psalms", "Proverbs", "Ecclesiastes", "Song of Solomon",
  "Isaiah", "Jeremiah", "Lamentations", "Ezekiel", "Daniel", "Hosea", "Joel", "Amos",
  "Obadiah", "Jonah", "Micah", "Nahum", "Habakkuk", "Zephaniah", "Haggai", "Zechariah",
  "Malachi", "Matthew", "Mark", "Luke", "John", "Acts", "Romans", "1 Corinthians",
  "2 Corinthians", "Galatians", "Ephesians", "Philippians", "Colossians", "1 Thessalonians",
  "2 Thessalonians", "1 Timothy", "2 Timothy", "Titus", "Philemon", "Hebrews", "James",
  "1 Peter", "2 Peter", "1 John", "2 John", "3 John", "Jude", "Revelation"
];

const HIGHLIGHT_COLORS = [
  { name: "yellow", class: "bg-yellow-200 dark:bg-yellow-500/30" },
  { name: "green", class: "bg-green-200 dark:bg-green-500/30" },
  { name: "blue", class: "bg-blue-200 dark:bg-blue-500/30" },
  { name: "pink", class: "bg-pink-200 dark:bg-pink-500/30" },
  { name: "purple", class: "bg-purple-200 dark:bg-purple-500/30" },
];

export default function Bible() {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const searchParams = useSearch();
  const params = new URLSearchParams(searchParams);
  const urlBook = params.get("book");
  const urlChapter = params.get("chapter");
  const urlVerse = params.get("verse");
  
  const [book, setBook] = useState(urlBook || "John");
  const [chapter, setChapter] = useState(urlChapter ? parseInt(urlChapter) : 1);
  const [targetVerse, setTargetVerse] = useState<number | null>(urlVerse ? parseInt(urlVerse) : null);
  const [selectedVerse, setSelectedVerse] = useState<BibleVerse | null>(null);
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [noteContent, setNoteContent] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [translation, setTranslation] = useState("KJV");
  const verseRefs = useRef<Map<number, HTMLElement>>(new Map());

  const { data: availableTranslations = ["KJV"] } = useQuery<string[]>({
    queryKey: ["/api/bible/translations"],
  });
  
  const { data: verses = [], isLoading } = useQuery<BibleVerse[]>({
    queryKey: ["/api/bible", book, chapter, translation],
    queryFn: async () => {
      const res = await fetch(`/api/bible/${encodeURIComponent(book)}/${chapter}?translation=${translation}`);
      if (!res.ok) throw new Error("Failed to fetch verses");
      return res.json();
    },
    enabled: !!book && !!chapter,
  });

  const { data: chapterCount = 1 } = useQuery<number>({
    queryKey: ["/api/bible/chapters", book, translation],
    queryFn: async () => {
      const res = await fetch(`/api/bible/chapters/${encodeURIComponent(book)}?translation=${translation}`);
      if (!res.ok) throw new Error("Failed to fetch chapter count");
      return res.json();
    },
    enabled: !!book,
  });

  const { data: highlights = [] } = useQuery<Highlight[]>({
    queryKey: ["/api/highlights"],
    enabled: isAuthenticated,
  });

  const { data: searchResults = [], isLoading: isSearching } = useQuery<BibleVerse[]>({
    queryKey: ["/api/bible/search", searchQuery, translation],
    queryFn: async () => {
      const res = await fetch(`/api/bible/search/${encodeURIComponent(searchQuery)}?translation=${translation}`);
      if (!res.ok) throw new Error("Failed to search");
      return res.json();
    },
    enabled: searchQuery.length > 2,
  });

  useEffect(() => {
    if (urlBook) setBook(urlBook);
    if (urlChapter) setChapter(parseInt(urlChapter));
    if (urlVerse) setTargetVerse(parseInt(urlVerse));
  }, [urlBook, urlChapter, urlVerse]);
  
  useEffect(() => {
    if (targetVerse && verses.length > 0) {
      const targetVerseData = verses.find(v => v.verse === targetVerse);
      if (targetVerseData) {
        const element = verseRefs.current.get(targetVerseData.id);
        if (element) {
          setTimeout(() => {
            element.scrollIntoView({ behavior: "smooth", block: "center" });
            element.classList.add("ring-2", "ring-primary", "ring-offset-2");
            setTimeout(() => {
              element.classList.remove("ring-2", "ring-primary", "ring-offset-2");
            }, 2000);
          }, 100);
          setTargetVerse(null);
        }
      }
    }
  }, [targetVerse, verses]);

  const highlightMutation = useMutation({
    mutationFn: async ({ verseId, color }: { verseId: number; color: string }) => {
      return apiRequest("POST", "/api/highlights", { verseId, color });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/highlights"] });
      toast({ title: "Verse highlighted" });
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (verseId: number) => {
      return apiRequest("POST", "/api/saved-verses", { verseId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/saved-verses"] });
      toast({ title: "Verse saved to library" });
    },
  });

  const noteMutation = useMutation({
    mutationFn: async ({ verseId, content }: { verseId: number; content: string }) => {
      return apiRequest("POST", "/api/notes", { verseId, content });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notes"] });
      setNoteDialogOpen(false);
      setNoteContent("");
      toast({ title: "Note saved" });
    },
  });

  const getVerseHighlight = (verseId: number) => {
    const highlight = highlights.find((h) => h.verseId === verseId);
    if (!highlight) return null;
    return HIGHLIGHT_COLORS.find((c) => c.name === highlight.color)?.class || null;
  };

  const goToChapter = (newChapter: number) => {
    if (newChapter >= 1 && newChapter <= chapterCount) {
      setChapter(newChapter);
    }
  };

  const handleSearchResult = (verse: BibleVerse) => {
    setBook(verse.book);
    setChapter(verse.chapter);
    setShowSearch(false);
    setSearchQuery("");
  };

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm -mx-3 px-3 sm:-mx-6 sm:px-6 pb-4 pt-2 border-b mb-4">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Select value={book} onValueChange={(v) => { setBook(v); setChapter(1); }}>
                <SelectTrigger className="flex-1 sm:w-[180px] sm:flex-none" data-testid="select-book">
                  <SelectValue placeholder="Select book" />
                </SelectTrigger>
                <SelectContent>
                  <ScrollArea className="h-[300px]">
                    {BIBLE_BOOKS.map((b) => (
                      <SelectItem key={b} value={b}>{b}</SelectItem>
                    ))}
                  </ScrollArea>
                </SelectContent>
              </Select>

              <Select value={chapter.toString()} onValueChange={(v) => setChapter(parseInt(v))}>
                <SelectTrigger className="w-[80px] sm:w-[100px]" data-testid="select-chapter">
                  <SelectValue placeholder="Ch." />
                </SelectTrigger>
                <SelectContent>
                  <ScrollArea className="h-[200px]">
                    {Array.from({ length: chapterCount }, (_, i) => i + 1).map((c) => (
                      <SelectItem key={c} value={c.toString()}>{c}</SelectItem>
                    ))}
                  </ScrollArea>
                </SelectContent>
              </Select>

              <Select value={translation} onValueChange={setTranslation}>
                <SelectTrigger className="w-[80px] sm:w-[90px]" data-testid="select-translation">
                  <BookOpen className="h-4 w-4 mr-1 shrink-0 hidden sm:block" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableTranslations.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => goToChapter(chapter - 1)}
                  disabled={chapter <= 1}
                  data-testid="button-prev-chapter"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => goToChapter(chapter + 1)}
                  disabled={chapter >= chapterCount}
                  data-testid="button-next-chapter"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowSearch(!showSearch)}
                  data-testid="button-search"
                >
                  {showSearch ? <X className="h-4 w-4" /> : <Search className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {showSearch && (
              <div className="relative">
                <Input
                  placeholder="Search the Bible..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10"
                  autoFocus
                  data-testid="input-search"
                />
                {searchQuery.length > 2 && searchResults.length > 0 && (
                  <Card className="absolute top-full left-0 right-0 z-50 mt-1 max-h-[60vh] overflow-auto">
                    <CardContent className="p-2">
                      {isSearching ? (
                        <div className="p-4 text-center text-muted-foreground">Searching...</div>
                      ) : (
                        searchResults.slice(0, 20).map((verse) => (
                          <button
                            key={verse.id}
                            className="w-full text-left p-4 rounded-md hover:bg-accent active:bg-accent/80 transition-colors"
                            onClick={() => handleSearchResult(verse)}
                            data-testid={`search-result-${verse.id}`}
                          >
                            <div className="font-medium text-sm">
                              {verse.book} {verse.chapter}:{verse.verse}
                            </div>
                            <div className="text-sm text-muted-foreground line-clamp-2">
                              {verse.text}
                            </div>
                          </button>
                        ))
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="text-center mb-6">
          <h2 className="font-serif text-2xl sm:text-3xl font-semibold">
            {book} {chapter}
          </h2>
        </div>

        {isLoading ? (
          <div className="space-y-4 px-2">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="h-6 w-full" />
            ))}
          </div>
        ) : verses.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">
            No verses found. The Bible data may still be loading.
          </p>
        ) : (
          <div className="font-serif text-lg sm:text-xl leading-relaxed sm:leading-loose px-1 sm:px-4">
            {verses.map((verse) => (
              <Popover key={verse.id}>
                <PopoverTrigger asChild>
                  <span
                    ref={(el) => { if (el) verseRefs.current.set(verse.id, el); }}
                    className={cn(
                      "inline cursor-pointer rounded py-1 px-0.5 transition-all hover:bg-accent active:bg-accent/80",
                      getVerseHighlight(verse.id)
                    )}
                    data-testid={`verse-${verse.id}`}
                  >
                    <sup className="text-xs text-primary font-sans font-medium mr-1">{verse.verse}</sup>
                    {verse.text}{" "}
                  </span>
                </PopoverTrigger>
                {isAuthenticated && (
                  <PopoverContent className="w-auto p-3" align="center" side="top">
                    <div className="flex items-center gap-3">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-11 w-11" data-testid={`highlight-${verse.id}`}>
                            <Highlighter className="h-5 w-5" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-3" side="top">
                          <div className="flex gap-2">
                            {HIGHLIGHT_COLORS.map((color) => (
                              <button
                                key={color.name}
                                className={cn(
                                  "w-9 h-9 rounded-full border-2 border-transparent hover:border-foreground/50 active:scale-95 transition-all",
                                  color.class
                                )}
                                onClick={() => highlightMutation.mutate({ verseId: verse.id, color: color.name })}
                                data-testid={`color-${color.name}`}
                              />
                            ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-11 w-11"
                        onClick={() => saveMutation.mutate(verse.id)}
                        data-testid={`save-${verse.id}`}
                      >
                        <Bookmark className="h-5 w-5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-11 w-11"
                        onClick={() => { setSelectedVerse(verse); setNoteDialogOpen(true); }}
                        data-testid={`note-${verse.id}`}
                      >
                        <PenLine className="h-5 w-5" />
                      </Button>
                    </div>
                  </PopoverContent>
                )}
              </Popover>
            ))}
          </div>
        )}

        <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                Add Note - {selectedVerse?.book} {selectedVerse?.chapter}:{selectedVerse?.verse}
              </DialogTitle>
            </DialogHeader>
            <Textarea
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              placeholder="Write your thoughts..."
              className="min-h-[150px]"
              data-testid="textarea-note"
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setNoteDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => selectedVerse && noteMutation.mutate({ verseId: selectedVerse.id, content: noteContent })}
                disabled={!noteContent.trim() || noteMutation.isPending}
                data-testid="button-save-note"
              >
                {noteMutation.isPending ? "Saving..." : "Save Note"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
