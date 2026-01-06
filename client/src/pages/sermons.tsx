import { useState } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Plus, Mic, Video, FileText, Trash2, Play, Clock, ChevronLeft } from "lucide-react";
import type { Sermon, Note } from "@shared/schema";

const sermonFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  livestreamUrl: z.string().url().optional().or(z.literal("")),
  textContent: z.string().optional(),
});

type SermonFormData = z.infer<typeof sermonFormSchema>;

export default function Sermons() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [selectedSermon, setSelectedSermon] = useState<Sermon | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [noteContent, setNoteContent] = useState("");

  const form = useForm<SermonFormData>({
    resolver: zodResolver(sermonFormSchema),
    defaultValues: {
      title: "",
      description: "",
      livestreamUrl: "",
      textContent: "",
    },
  });

  const { data: sermons = [], isLoading } = useQuery<Sermon[]>({
    queryKey: ["/api/sermons"],
    enabled: isAuthenticated,
  });

  const { data: sermonNotes = [] } = useQuery<Note[]>({
    queryKey: ["/api/notes", "sermon", selectedSermon?.id],
    enabled: !!selectedSermon,
  });

  const createMutation = useMutation({
    mutationFn: async (data: SermonFormData) => {
      return apiRequest("POST", "/api/sermons", {
        ...data,
        livestreamUrl: data.livestreamUrl || null,
        textContent: data.textContent || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sermons"] });
      setCreateDialogOpen(false);
      form.reset();
      toast({ title: "Sermon created" });
    },
    onError: () => {
      toast({ title: "Failed to create sermon", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/sermons/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sermons"] });
      setSelectedSermon(null);
      toast({ title: "Sermon deleted" });
    },
  });

  const addNoteMutation = useMutation({
    mutationFn: async ({ sermonId, content, timestamp }: { sermonId: number; content: string; timestamp?: string }) => {
      return apiRequest("POST", "/api/notes", { sermonId, content, timestamp });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notes", "sermon", selectedSermon?.id] });
      setNoteContent("");
      toast({ title: "Note saved" });
    },
  });

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
          <Mic className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h1 className="font-serif text-2xl font-semibold mb-2">Sermon Notes</h1>
          <p className="text-muted-foreground mb-6">Sign in to save sermon notes and study tools</p>
          <Button asChild data-testid="button-sign-in">
            <a href="/api/login">Sign In</a>
          </Button>
        </div>
      </Layout>
    );
  }

  if (selectedSermon) {
    return (
      <Layout>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Button
            variant="ghost"
            className="mb-4"
            onClick={() => setSelectedSermon(null)}
            data-testid="button-back"
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to Sermons
          </Button>

          <div className="grid gap-6 lg:grid-cols-5">
            <div className="lg:col-span-3">
              <Card>
                <CardHeader>
                  <CardTitle className="font-serif">{selectedSermon.title}</CardTitle>
                  {selectedSermon.description && (
                    <p className="text-muted-foreground">{selectedSermon.description}</p>
                  )}
                </CardHeader>
                <CardContent>
                  {selectedSermon.livestreamUrl && isVideoUrl(selectedSermon.livestreamUrl) ? (
                    <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                      <iframe
                        src={getEmbedUrl(selectedSermon.livestreamUrl)}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        data-testid="sermon-video"
                      />
                    </div>
                  ) : selectedSermon.textContent ? (
                    <div className="font-serif leading-relaxed whitespace-pre-wrap" data-testid="sermon-text">
                      {selectedSermon.textContent}
                    </div>
                  ) : (
                    <div className="py-12 text-center text-muted-foreground">
                      No media content available
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-2">
              <Card className="h-full">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Notes</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col h-[calc(100%-4rem)]">
                  <ScrollArea className="flex-1 mb-4 -mx-4 px-4">
                    {sermonNotes.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-4">
                        No notes yet. Add your first note below.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {sermonNotes.map((note) => (
                          <div
                            key={note.id}
                            className="p-3 rounded-lg bg-muted/50"
                            data-testid={`sermon-note-${note.id}`}
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
                    <Textarea
                      value={noteContent}
                      onChange={(e) => setNoteContent(e.target.value)}
                      placeholder="Write a note..."
                      className="resize-none"
                      rows={3}
                      data-testid="textarea-sermon-note"
                    />
                    <Button
                      onClick={() => addNoteMutation.mutate({
                        sermonId: selectedSermon.id,
                        content: noteContent,
                      })}
                      disabled={!noteContent.trim() || addNoteMutation.isPending}
                      className="w-full"
                      data-testid="button-add-sermon-note"
                    >
                      {addNoteMutation.isPending ? "Saving..." : "Add Note"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
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
          <h1 className="font-serif text-2xl md:text-3xl font-semibold">Sermon Notes</h1>
          <Button onClick={() => setCreateDialogOpen(true)} data-testid="button-create-sermon">
            <Plus className="h-4 w-4 mr-2" />
            New Sermon
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        ) : sermons.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Mic className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="font-medium mb-2">No sermons yet</h3>
              <p className="text-muted-foreground mb-6">
                Add a sermon to start taking notes
              </p>
              <Button onClick={() => setCreateDialogOpen(true)} data-testid="button-create-first">
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Sermon
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {sermons.map((sermon) => (
              <Card
                key={sermon.id}
                className="cursor-pointer hover:border-primary/30 transition-colors"
                onClick={() => setSelectedSermon(sermon)}
                data-testid={`sermon-card-${sermon.id}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        {sermon.livestreamUrl ? (
                          <Video className="h-5 w-5 text-primary" />
                        ) : sermon.textContent ? (
                          <FileText className="h-5 w-5 text-primary" />
                        ) : (
                          <Mic className="h-5 w-5 text-primary" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">{sermon.title}</h3>
                        {sermon.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">{sermon.description}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(sermon.createdAt!).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteMutation.mutate(sermon.id);
                      }}
                      data-testid={`delete-sermon-${sermon.id}`}
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
              <DialogTitle>Add New Sermon</DialogTitle>
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
                        <Input placeholder="Sermon title" {...field} data-testid="input-sermon-title" />
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
                        <Textarea placeholder="Brief description" {...field} data-testid="input-sermon-description" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Tabs defaultValue="video">
                  <TabsList className="w-full">
                    <TabsTrigger value="video" className="flex-1">Video/Livestream</TabsTrigger>
                    <TabsTrigger value="text" className="flex-1">Text/Notes</TabsTrigger>
                  </TabsList>
                  <TabsContent value="video" className="mt-4">
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
                              data-testid="input-sermon-url"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TabsContent>
                  <TabsContent value="text" className="mt-4">
                    <FormField
                      control={form.control}
                      name="textContent"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sermon Text</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Paste or type sermon content..."
                              className="min-h-[150px]"
                              {...field}
                              data-testid="input-sermon-text"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TabsContent>
                </Tabs>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending} data-testid="button-save-sermon">
                    {createMutation.isPending ? "Saving..." : "Save Sermon"}
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
