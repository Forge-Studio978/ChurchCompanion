import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { 
  Plus, Radio, Video, Trash2, Clock, ChevronLeft, Book, Music, 
  FileText, Play, Pause, Volume2, Maximize, Link2, BookOpen, Search
} from "lucide-react";
import type { Livestream, LivestreamNote, BibleVerse, Hymn, DetectedVerse, DetectedHymn } from "@shared/schema";

const livestreamFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  sourceUrl: z.string().url("Please enter a valid URL"),
  sourceType: z.enum(["youtube", "vimeo", "mp4", "hls"]),
});

type LivestreamFormData = z.infer<typeof livestreamFormSchema>;

const BIBLE_VERSE_REGEX = /\b(\d?\s?[A-Za-z]+)\s+(\d+):(\d+)(?:-(\d+))?\b/g;

function formatTimestamp(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function parseTimestamp(timestamp: string): number {
  const parts = timestamp.split(':').map(Number);
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  return 0;
}

function extractBibleReferences(text: string): string[] {
  const matches = text.match(BIBLE_VERSE_REGEX);
  return matches ? Array.from(new Set(matches)) : [];
}

function getEmbedUrl(sourceUrl: string, sourceType: string): string | null {
  if (sourceType === "youtube") {
    const videoId = sourceUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s]+)/)?.[1];
    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}?enablejsapi=1`;
    }
  } else if (sourceType === "vimeo") {
    const videoId = sourceUrl.match(/vimeo\.com\/(\d+)/)?.[1];
    if (videoId) {
      return `https://player.vimeo.com/video/${videoId}`;
    }
  } else if (sourceType === "mp4" || sourceType === "hls") {
    return sourceUrl;
  }
  return null;
}

export default function LivestreamCompanion() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [selectedLivestream, setSelectedLivestream] = useState<Livestream | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [noteContent, setNoteContent] = useState("");
  const [currentTime, setCurrentTime] = useState(0);
  const [detectedVerseText, setDetectedVerseText] = useState<BibleVerse | null>(null);
  const [selectedHymn, setSelectedHymn] = useState<Hymn | null>(null);
  const [addVerseDialogOpen, setAddVerseDialogOpen] = useState(false);
  const [addHymnDialogOpen, setAddHymnDialogOpen] = useState(false);
  const [manualVerseRef, setManualVerseRef] = useState("");
  const [hymnSearchQuery, setHymnSearchQuery] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);

  const form = useForm<LivestreamFormData>({
    resolver: zodResolver(livestreamFormSchema),
    defaultValues: {
      title: "",
      description: "",
      sourceUrl: "",
      sourceType: "youtube",
    },
  });

  const { data: livestreams = [], isLoading } = useQuery<Livestream[]>({
    queryKey: ["/api/livestreams"],
    enabled: isAuthenticated,
  });

  const { data: livestreamNotes = [] } = useQuery<LivestreamNote[]>({
    queryKey: ["/api/livestreams", selectedLivestream?.id, "notes"],
    queryFn: async () => {
      if (!selectedLivestream) return [];
      const res = await fetch(`/api/livestreams/${selectedLivestream.id}/notes`, { credentials: "include" });
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
    enabled: !!selectedLivestream,
  });

  const { data: detectedVerses = [] } = useQuery<DetectedVerse[]>({
    queryKey: ["/api/livestreams", selectedLivestream?.id, "detected-verses"],
    queryFn: async () => {
      if (!selectedLivestream) return [];
      const res = await fetch(`/api/livestreams/${selectedLivestream.id}/detected-verses`, { credentials: "include" });
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
    enabled: !!selectedLivestream,
  });

  const { data: detectedHymns = [] } = useQuery<DetectedHymn[]>({
    queryKey: ["/api/livestreams", selectedLivestream?.id, "detected-hymns"],
    queryFn: async () => {
      if (!selectedLivestream) return [];
      const res = await fetch(`/api/livestreams/${selectedLivestream.id}/detected-hymns`, { credentials: "include" });
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
    enabled: !!selectedLivestream,
  });

  const { data: hymns = [] } = useQuery<Hymn[]>({
    queryKey: ["/api/hymns"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: LivestreamFormData) => {
      return apiRequest("POST", "/api/livestreams", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/livestreams"] });
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
      return apiRequest("DELETE", `/api/livestreams/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/livestreams"] });
      setSelectedLivestream(null);
      toast({ title: "Livestream deleted" });
    },
  });

  const addNoteMutation = useMutation({
    mutationFn: async ({ livestreamId, content, timestampSeconds, bibleReference }: { 
      livestreamId: number; 
      content: string; 
      timestampSeconds: number;
      bibleReference?: string;
    }) => {
      return apiRequest("POST", "/api/livestream-notes", { 
        livestreamId, 
        content, 
        timestampSeconds,
        bibleReference,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/livestreams", selectedLivestream?.id, "notes"] });
      setNoteContent("");
      toast({ title: "Note saved" });
    },
  });

  const deleteNoteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/livestream-notes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/livestreams", selectedLivestream?.id, "notes"] });
      toast({ title: "Note deleted" });
    },
  });

  const addDetectedVerseMutation = useMutation({
    mutationFn: async ({ bibleReference, timestampSeconds }: { bibleReference: string; timestampSeconds: number }) => {
      return apiRequest("POST", `/api/livestreams/${selectedLivestream?.id}/detected-verses`, {
        bibleReference,
        timestampSeconds,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/livestreams", selectedLivestream?.id, "detected-verses"] });
      setAddVerseDialogOpen(false);
      setManualVerseRef("");
      toast({ title: "Bible reference added" });
    },
  });

  const addDetectedHymnMutation = useMutation({
    mutationFn: async ({ hymnId, title, timestampSeconds }: { hymnId?: number; title: string; timestampSeconds: number }) => {
      return apiRequest("POST", `/api/livestreams/${selectedLivestream?.id}/detected-hymns`, {
        hymnId,
        title,
        timestampSeconds,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/livestreams", selectedLivestream?.id, "detected-hymns"] });
      setAddHymnDialogOpen(false);
      setHymnSearchQuery("");
      toast({ title: "Hymn reference added" });
    },
  });

  const updatePositionMutation = useMutation({
    mutationFn: async ({ id, position }: { id: number; position: number }) => {
      return apiRequest("PATCH", `/api/livestreams/${id}/position`, { position });
    },
  });

  useEffect(() => {
    if (selectedLivestream && selectedLivestream.lastViewPosition && videoRef.current) {
      videoRef.current.currentTime = selectedLivestream.lastViewPosition;
    }
  }, [selectedLivestream]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (videoRef.current && selectedLivestream) {
        const time = Math.floor(videoRef.current.currentTime);
        setCurrentTime(time);
        if (time % 30 === 0 && time > 0) {
          updatePositionMutation.mutate({ id: selectedLivestream.id, position: time });
        }
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [selectedLivestream]);

  const handleAddNote = () => {
    if (!selectedLivestream || !noteContent.trim()) return;
    const refs = extractBibleReferences(noteContent);
    addNoteMutation.mutate({
      livestreamId: selectedLivestream.id,
      content: noteContent,
      timestampSeconds: currentTime,
      bibleReference: refs[0],
    });
  };

  const handleNoteTimestampClick = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = seconds;
    }
  };

  const filteredHymns = hymnSearchQuery 
    ? hymns.filter(h => h.title.toLowerCase().includes(hymnSearchQuery.toLowerCase()))
    : [];

  if (authLoading) {
    return (
      <Layout>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Skeleton className="h-8 w-48 mb-6" />
          <Skeleton className="h-64 w-full" />
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
          <p className="text-muted-foreground mb-6">Sign in to watch livestreams and take notes</p>
          <Button asChild data-testid="button-sign-in">
            <a href="/api/login">Sign In</a>
          </Button>
        </div>
      </Layout>
    );
  }

  if (selectedLivestream) {
    const embedUrl = getEmbedUrl(selectedLivestream.sourceUrl, selectedLivestream.sourceType || "youtube");
    const isDirectVideo = selectedLivestream.sourceType === "mp4" || selectedLivestream.sourceType === "hls";

    return (
      <Layout>
        <div className="h-[calc(100vh-120px)] flex flex-col lg:flex-row gap-4 p-4">
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex items-center gap-4 mb-4 flex-wrap">
              <Button variant="ghost" onClick={() => setSelectedLivestream(null)} data-testid="button-back">
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
              <h1 className="font-serif text-xl font-semibold flex-1 truncate">{selectedLivestream.title}</h1>
              <Badge variant="outline" className="gap-1">
                <Clock className="h-3 w-3" />
                {formatTimestamp(currentTime)}
              </Badge>
            </div>

            <div className="flex-1 bg-black rounded-lg overflow-hidden min-h-[200px] lg:min-h-0">
              {isDirectVideo ? (
                <video
                  ref={videoRef}
                  src={embedUrl || ""}
                  className="w-full h-full object-contain"
                  controls
                  data-testid="video-player"
                />
              ) : embedUrl ? (
                <iframe
                  src={embedUrl}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  data-testid="video-iframe"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-white">
                  <p>Unable to load video</p>
                </div>
              )}
            </div>
          </div>

          <div className="w-full lg:w-96 flex flex-col min-h-0 lg:h-full">
            <Tabs defaultValue="notes" className="flex-1 flex flex-col min-h-0">
              <TabsList className="w-full justify-start flex-wrap h-auto gap-1 mb-2">
                <TabsTrigger value="notes" className="gap-1" data-testid="tab-notes">
                  <FileText className="h-4 w-4" />
                  Notes
                  {livestreamNotes.length > 0 && (
                    <Badge variant="secondary" className="ml-1 text-xs">{livestreamNotes.length}</Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="bible" className="gap-1" data-testid="tab-bible">
                  <Book className="h-4 w-4" />
                  Bible
                </TabsTrigger>
                <TabsTrigger value="hymns" className="gap-1" data-testid="tab-hymns">
                  <Music className="h-4 w-4" />
                  Hymns
                </TabsTrigger>
              </TabsList>

              <TabsContent value="notes" className="flex-1 flex flex-col min-h-0 mt-0">
                <div className="flex-1 min-h-0">
                  <ScrollArea className="h-full max-h-[300px] lg:max-h-none">
                    {livestreamNotes.length === 0 ? (
                      <div className="py-8 text-center text-muted-foreground">
                        <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No notes yet</p>
                        <p className="text-xs mt-1">Take notes while watching</p>
                      </div>
                    ) : (
                      <div className="space-y-2 pr-4">
                        {livestreamNotes.map((note) => (
                          <Card key={note.id} className="group" data-testid={`note-${note.id}`}>
                            <CardContent className="p-3">
                              <div className="flex items-start gap-2">
                                <button
                                  onClick={() => handleNoteTimestampClick(note.timestampSeconds)}
                                  className="text-xs text-primary font-mono hover:underline flex-shrink-0"
                                  data-testid={`note-timestamp-${note.id}`}
                                >
                                  {formatTimestamp(note.timestampSeconds)}
                                </button>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm">{note.content}</p>
                                  {note.bibleReference && (
                                    <Badge variant="outline" className="mt-1 text-xs">
                                      <Book className="h-3 w-3 mr-1" />
                                      {note.bibleReference}
                                    </Badge>
                                  )}
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6"
                                  onClick={() => deleteNoteMutation.mutate(note.id)}
                                  data-testid={`delete-note-${note.id}`}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </div>

                <div className="mt-4 space-y-2">
                  <Textarea
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    placeholder="Take a note..."
                    className="resize-none text-sm"
                    rows={3}
                    data-testid="input-note"
                  />
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-muted-foreground">
                      Timestamp: {formatTimestamp(currentTime)}
                    </span>
                    <Button 
                      onClick={handleAddNote} 
                      disabled={!noteContent.trim() || addNoteMutation.isPending}
                      size="sm"
                      data-testid="button-add-note"
                    >
                      {addNoteMutation.isPending ? "Saving..." : "Add Note"}
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="bible" className="flex-1 flex flex-col min-h-0 mt-0">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-muted-foreground">Referenced passages</p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setAddVerseDialogOpen(true)}
                    data-testid="button-add-verse"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </div>
                <ScrollArea className="flex-1 max-h-[400px] lg:max-h-none">
                  {detectedVerses.length === 0 ? (
                    <div className="py-8 text-center text-muted-foreground">
                      <Book className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No Bible references</p>
                      <p className="text-xs mt-1">Add verses mentioned in the livestream</p>
                    </div>
                  ) : (
                    <div className="space-y-2 pr-4">
                      {detectedVerses.map((verse) => (
                        <Card key={verse.id} data-testid={`detected-verse-${verse.id}`}>
                          <CardContent className="p-3">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleNoteTimestampClick(verse.timestampSeconds)}
                                className="text-xs text-primary font-mono hover:underline"
                              >
                                {formatTimestamp(verse.timestampSeconds)}
                              </button>
                              <Badge variant="secondary">{verse.bibleReference}</Badge>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>

              <TabsContent value="hymns" className="flex-1 flex flex-col min-h-0 mt-0">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-muted-foreground">Hymns sung</p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setAddHymnDialogOpen(true)}
                    data-testid="button-add-hymn"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </div>
                <ScrollArea className="flex-1 max-h-[400px] lg:max-h-none">
                  {detectedHymns.length === 0 ? (
                    <div className="py-8 text-center text-muted-foreground">
                      <Music className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No hymns added</p>
                      <p className="text-xs mt-1">Add hymns sung during the livestream</p>
                    </div>
                  ) : (
                    <div className="space-y-2 pr-4">
                      {detectedHymns.map((hymn) => (
                        <Card key={hymn.id} data-testid={`detected-hymn-${hymn.id}`}>
                          <CardContent className="p-3">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleNoteTimestampClick(hymn.timestampSeconds)}
                                className="text-xs text-primary font-mono hover:underline"
                              >
                                {formatTimestamp(hymn.timestampSeconds)}
                              </button>
                              <span className="text-sm font-medium">{hymn.title}</span>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        <Dialog open={addVerseDialogOpen} onOpenChange={setAddVerseDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Bible Reference</DialogTitle>
              <DialogDescription>Add a verse referenced at {formatTimestamp(currentTime)}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                value={manualVerseRef}
                onChange={(e) => setManualVerseRef(e.target.value)}
                placeholder="e.g., John 3:16 or Romans 8:28"
                data-testid="input-verse-ref"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddVerseDialogOpen(false)}>Cancel</Button>
              <Button 
                onClick={() => addDetectedVerseMutation.mutate({ bibleReference: manualVerseRef, timestampSeconds: currentTime })}
                disabled={!manualVerseRef.trim() || addDetectedVerseMutation.isPending}
                data-testid="button-save-verse"
              >
                {addDetectedVerseMutation.isPending ? "Adding..." : "Add Reference"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={addHymnDialogOpen} onOpenChange={setAddHymnDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Hymn</DialogTitle>
              <DialogDescription>Add a hymn sung at {formatTimestamp(currentTime)}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                value={hymnSearchQuery}
                onChange={(e) => setHymnSearchQuery(e.target.value)}
                placeholder="Search hymns..."
                data-testid="input-hymn-search"
              />
              {filteredHymns.length > 0 && (
                <ScrollArea className="h-48">
                  <div className="space-y-1">
                    {filteredHymns.slice(0, 10).map((hymn) => (
                      <Button
                        key={hymn.id}
                        variant="ghost"
                        className="w-full justify-start"
                        onClick={() => {
                          addDetectedHymnMutation.mutate({ 
                            hymnId: hymn.id, 
                            title: hymn.title, 
                            timestampSeconds: currentTime 
                          });
                        }}
                        data-testid={`hymn-option-${hymn.id}`}
                      >
                        {hymn.title}
                      </Button>
                    ))}
                  </div>
                </ScrollArea>
              )}
              {hymnSearchQuery && filteredHymns.length === 0 && (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground mb-2">Hymn not in database</p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      addDetectedHymnMutation.mutate({ 
                        title: hymnSearchQuery, 
                        timestampSeconds: currentTime 
                      });
                    }}
                    data-testid="button-add-custom-hymn"
                  >
                    Add "{hymnSearchQuery}" anyway
                  </Button>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddHymnDialogOpen(false)}>Cancel</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
          <div>
            <h1 className="font-serif text-2xl md:text-3xl font-semibold">Livestream Companion</h1>
            <p className="text-muted-foreground mt-1">Watch services and take notes</p>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)} data-testid="button-add-livestream">
            <Plus className="h-4 w-4 mr-2" />
            Add Livestream
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        ) : livestreams.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Radio className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="font-medium mb-1">No livestreams saved</p>
              <p className="text-sm text-muted-foreground mb-4">
                Add a livestream URL to start watching and taking notes
              </p>
              <Button onClick={() => setCreateDialogOpen(true)} data-testid="button-add-first">
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Livestream
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {livestreams.map((stream) => (
              <Card 
                key={stream.id} 
                className="hover-elevate cursor-pointer group"
                data-testid={`livestream-card-${stream.id}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div 
                      className="flex-1 min-w-0"
                      onClick={() => setSelectedLivestream(stream)}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Video className="h-5 w-5 text-primary flex-shrink-0" />
                        <h3 className="font-medium truncate">{stream.title}</h3>
                      </div>
                      {stream.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                          {stream.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="text-xs">
                          {stream.sourceType || "youtube"}
                        </Badge>
                        {stream.lastViewPosition && stream.lastViewPosition > 0 && (
                          <Badge variant="secondary" className="text-xs gap-1">
                            <Clock className="h-3 w-3" />
                            Resume at {formatTimestamp(stream.lastViewPosition)}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteMutation.mutate(stream.id);
                      }}
                      data-testid={`delete-livestream-${stream.id}`}
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
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Livestream</DialogTitle>
              <DialogDescription>
                Add a YouTube, Vimeo, or direct video link
              </DialogDescription>
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
                        <Input {...field} placeholder="Sunday Service" data-testid="input-title" />
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
                        <Textarea {...field} placeholder="Notes about this service..." className="resize-none" rows={2} data-testid="input-description" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="sourceType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Source Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-source-type">
                            <SelectValue placeholder="Select source type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="youtube">YouTube</SelectItem>
                          <SelectItem value="vimeo">Vimeo</SelectItem>
                          <SelectItem value="mp4">MP4 Video</SelectItem>
                          <SelectItem value="hls">HLS Stream</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="sourceUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Video URL</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="https://youtube.com/watch?v=..." data-testid="input-url" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending} data-testid="button-save">
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
