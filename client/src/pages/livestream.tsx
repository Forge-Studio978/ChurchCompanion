import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Plus, Radio, Video, Trash2, Clock, ChevronLeft, Book, Music } from "lucide-react";
import type { Sermon, Note, BibleVerse, Hymn } from "@shared/schema";

const livestreamFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  livestreamUrl: z.string().url("Please enter a valid URL"),
});

type LivestreamFormData = z.infer<typeof livestreamFormSchema>;

const BIBLE_VERSE_REGEX = /\b(\d?\s?[A-Za-z]+)\s+(\d+):(\d+)(?:-(\d+))?\b/g;

function extractBibleReferences(text: string): string[] {
  const matches = text.match(BIBLE_VERSE_REGEX);
  return matches ? Array.from(new Set(matches)) : [];
}

export default function LivestreamCompanion() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [selectedLivestream, setSelectedLivestream] = useState<Sermon | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [noteContent, setNoteContent] = useState("");
  const [noteTimestamp, setNoteTimestamp] = useState("");
  const [detectedVerses, setDetectedVerses] = useState<BibleVerse[]>([]);

  const form = useForm<LivestreamFormData>({
    resolver: zodResolver(livestreamFormSchema),
    defaultValues: {
      title: "",
      description: "",
      livestreamUrl: "",
    },
  });

  const { data: livestreams = [], isLoading } = useQuery<Sermon[]>({
    queryKey: ["/api/sermons"],
    enabled: isAuthenticated,
  });

  const { data: livestreamNotes = [] } = useQuery<Note[]>({
    queryKey: ["/api/notes", "sermon", selectedLivestream?.id],
    enabled: !!selectedLivestream,
  });

  const createMutation = useMutation({
    mutationFn: async (data: LivestreamFormData) => {
      return apiRequest("POST", "/api/sermons", {
        ...data,
        livestreamUrl: data.livestreamUrl,
        textContent: null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sermons"] });
      setCreateDialogOpen(false);
      form.reset();
      toast({ title: "Livestream saved" });
    },
    onError: () => {
      toast({ title: "Failed to save livestream", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/sermons/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sermons"] });
      setSelectedLivestream(null);
      toast({ title: "Livestream deleted" });
    },
  });

  const addNoteMutation = useMutation({
    mutationFn: async ({ sermonId, content, timestamp }: { sermonId: number; content: string; timestamp?: string }) => {
      return apiRequest("POST", "/api/notes", { sermonId, content, timestamp: timestamp || null });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notes", "sermon", selectedLivestream?.id] });
      setNoteContent("");
      setNoteTimestamp("");
      toast({ title: "Note saved" });
    },
  });

  const handleNoteChange = async (text: string) => {
    setNoteContent(text);
    const refs = extractBibleReferences(text);
    if (refs.length > 0) {
      try {
        const searchQuery = refs[0].replace(/\s+/g, ' ').trim();
        const response = await fetch(`/api/bible/search/${encodeURIComponent(searchQuery)}`);
        if (response.ok) {
          const verses = await response.json();
          setDetectedVerses(verses.slice(0, 3));
        }
      } catch {
        setDetectedVerses([]);
      }
    } else {
      setDetectedVerses([]);
    }
  };

  const isVideoUrl = (url: string) => {
    return url.includes("youtube") || url.includes("youtu.be") || url.includes("vimeo");
  };

  const getEmbedUrl = (url: string) => {
    if (url.includes("youtube.com/watch")) {
      const videoId = new URL(url).searchParams.get("v");
      return `https://www.youtube.com/embed/${videoId}`;
    }
    if (url.includes("youtu.be")) {
      const videoId = url.split("/").pop();
      return `https://www.youtube.com/embed/${videoId}`;
    }
    if (url.includes("vimeo")) {
      const videoId = url.split("/").pop();
      return `https://player.vimeo.com/video/${videoId}`;
    }
    return url;
  };

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
          <Radio className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h1 className="font-serif text-2xl font-semibold mb-2">Livestream Companion</h1>
          <p className="text-muted-foreground mb-6">Sign in to save livestreams and take notes</p>
          <Button asChild data-testid="button-sign-in">
            <a href="/api/login">Sign In</a>
          </Button>
        </div>
      </Layout>
    );
  }

  if (selectedLivestream) {
    return (
      <Layout>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Button
            variant="ghost"
            className="mb-4"
            onClick={() => setSelectedLivestream(null)}
            data-testid="button-back"
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to Livestreams
          </Button>

          <div className="grid gap-6 lg:grid-cols-5">
            <div className="lg:col-span-3">
              <Card>
                <CardHeader>
                  <CardTitle className="font-serif">{selectedLivestream.title}</CardTitle>
                  {selectedLivestream.description && (
                    <p className="text-muted-foreground">{selectedLivestream.description}</p>
                  )}
                </CardHeader>
                <CardContent>
                  {selectedLivestream.livestreamUrl && isVideoUrl(selectedLivestream.livestreamUrl) ? (
                    <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                      <iframe
                        src={getEmbedUrl(selectedLivestream.livestreamUrl)}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        data-testid="livestream-video"
                      />
                    </div>
                  ) : (
                    <div className="py-12 text-center text-muted-foreground">
                      No video content available
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-2 space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[200px] mb-4">
                    {livestreamNotes.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-4">
                        No notes yet. Add your first note below.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {livestreamNotes.map((note) => (
                          <div
                            key={note.id}
                            className="p-3 rounded-lg bg-muted/50"
                            data-testid={`livestream-note-${note.id}`}
                          >
                            {note.timestamp && (
                              <div className="flex items-center gap-1 text-xs text-primary mb-1">
                                <Clock className="h-3 w-3" />
                                {note.timestamp}
                              </div>
                            )}
                            <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>

                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        value={noteTimestamp}
                        onChange={(e) => setNoteTimestamp(e.target.value)}
                        placeholder="00:00"
                        className="w-20"
                        data-testid="input-note-timestamp"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          const now = new Date();
                          const minutes = now.getHours() * 60 + now.getMinutes();
                          setNoteTimestamp(`${Math.floor(minutes / 60)}:${(minutes % 60).toString().padStart(2, '0')}`);
                        }}
                        data-testid="button-current-time"
                      >
                        <Clock className="h-4 w-4" />
                      </Button>
                    </div>
                    <Textarea
                      value={noteContent}
                      onChange={(e) => handleNoteChange(e.target.value)}
                      placeholder="Write a note... (Bible references like John 3:16 will be detected)"
                      className="resize-none"
                      rows={3}
                      data-testid="textarea-livestream-note"
                    />
                    <Button
                      onClick={() => addNoteMutation.mutate({
                        sermonId: selectedLivestream.id,
                        content: noteContent,
                        timestamp: noteTimestamp || undefined,
                      })}
                      disabled={!noteContent.trim() || addNoteMutation.isPending}
                      className="w-full"
                      data-testid="button-add-livestream-note"
                    >
                      {addNoteMutation.isPending ? "Saving..." : "Add Note"}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {detectedVerses.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Book className="h-4 w-4" />
                      Referenced Verses
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {detectedVerses.map((verse) => (
                        <div
                          key={verse.id}
                          className="p-3 rounded-lg bg-primary/5 border border-primary/10"
                          data-testid={`detected-verse-${verse.id}`}
                        >
                          <Badge variant="outline" className="mb-2">
                            {verse.book} {verse.chapter}:{verse.verse}
                          </Badge>
                          <p className="text-sm font-serif leading-relaxed">{verse.text}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between gap-4 mb-6">
          <h1 className="font-serif text-2xl md:text-3xl font-semibold">Livestream Companion</h1>
          <Button onClick={() => setCreateDialogOpen(true)} data-testid="button-create-livestream">
            <Plus className="h-4 w-4 mr-2" />
            Add Livestream
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        ) : livestreams.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Radio className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="font-medium mb-2">No livestreams saved</h3>
              <p className="text-muted-foreground mb-6">
                Save a livestream link to start taking notes
              </p>
              <Button onClick={() => setCreateDialogOpen(true)} data-testid="button-create-first">
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Livestream
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {livestreams.map((livestream) => (
              <Card
                key={livestream.id}
                className="cursor-pointer hover:border-primary/30 transition-colors"
                onClick={() => setSelectedLivestream(livestream)}
                data-testid={`livestream-card-${livestream.id}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Video className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">{livestream.title}</h3>
                        {livestream.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">{livestream.description}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(livestream.createdAt!).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteMutation.mutate(livestream.id);
                      }}
                      data-testid={`delete-livestream-${livestream.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Add Livestream</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit((data) => createMutation.mutate(data))} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Sunday Service" {...field} data-testid="input-livestream-title" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (optional)</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Brief description" {...field} data-testid="input-livestream-description" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="livestreamUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Video URL</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://youtube.com/watch?v=..."
                          {...field}
                          data-testid="input-livestream-url"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending} data-testid="button-save-livestream">
                    {createMutation.isPending ? "Saving..." : "Save Livestream"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
