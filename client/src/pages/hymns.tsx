import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Search, Heart, Music, Plus, ListMusic, MoreVertical, ChevronLeft, ChevronRight, Globe } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { Hymn, SavedHymn, Playlist } from "@shared/schema";

const HYMNS_PER_PAGE = 20;
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "fr", label: "Francais" },
];

export default function Hymns() {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedHymn, setSelectedHymn] = useState<Hymn | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [createPlaylistOpen, setCreatePlaylistOpen] = useState(false);
  const [newPlaylistTitle, setNewPlaylistTitle] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("en");

  const { data: hymns = [], isLoading } = useQuery<Hymn[]>({
    queryKey: ["/api/hymns", selectedLanguage],
    queryFn: async () => {
      const res = await fetch(`/api/hymns?language=${selectedLanguage}`);
      if (!res.ok) throw new Error("Failed to fetch hymns");
      return res.json();
    },
  });

  const { data: savedHymns = [] } = useQuery<SavedHymn[]>({
    queryKey: ["/api/saved-hymns"],
    enabled: isAuthenticated,
  });

  const { data: playlists = [] } = useQuery<Playlist[]>({
    queryKey: ["/api/playlists"],
    enabled: isAuthenticated,
  });

  const { data: tags = [] } = useQuery<string[]>({
    queryKey: ["/api/hymns/tags"],
  });

  const saveMutation = useMutation({
    mutationFn: async (hymnId: number) => {
      const isSaved = savedHymns.some((s) => s.hymnId === hymnId);
      if (isSaved) {
        return apiRequest("DELETE", `/api/saved-hymns/${hymnId}`);
      }
      return apiRequest("POST", "/api/saved-hymns", { hymnId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/saved-hymns"] });
    },
  });

  const createPlaylistMutation = useMutation({
    mutationFn: async (title: string) => {
      return apiRequest("POST", "/api/playlists", { title });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/playlists"] });
      setCreatePlaylistOpen(false);
      setNewPlaylistTitle("");
      toast({ title: "Playlist created" });
    },
  });

  const addToPlaylistMutation = useMutation({
    mutationFn: async ({ playlistId, hymnId }: { playlistId: number; hymnId: number }) => {
      return apiRequest("POST", `/api/playlists/${playlistId}/hymns`, { hymnId });
    },
    onSuccess: () => {
      toast({ title: "Hymn added to playlist" });
    },
    onError: () => {
      toast({ title: "Failed to add to playlist", variant: "destructive" });
    },
  });

  const isHymnSaved = (hymnId: number) => savedHymns.some((s) => s.hymnId === hymnId);

  const filteredHymns = useMemo(() => {
    return hymns.filter((hymn) => {
      const matchesSearch = !searchQuery || 
        hymn.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        hymn.lyrics.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTag = !selectedTag || hymn.tags?.includes(selectedTag);
      const matchesLetter = !selectedLetter || hymn.title.toUpperCase().startsWith(selectedLetter);
      return matchesSearch && matchesTag && matchesLetter;
    });
  }, [hymns, searchQuery, selectedTag, selectedLetter]);

  const totalPages = Math.ceil(filteredHymns.length / HYMNS_PER_PAGE);
  const paginatedHymns = filteredHymns.slice(
    (currentPage - 1) * HYMNS_PER_PAGE,
    currentPage * HYMNS_PER_PAGE
  );

  const availableLetters = useMemo(() => {
    const letters = new Set<string>();
    hymns.forEach(hymn => {
      const firstLetter = hymn.title.charAt(0).toUpperCase();
      if (ALPHABET.includes(firstLetter)) {
        letters.add(firstLetter);
      }
    });
    return letters;
  }, [hymns]);

  const handleLetterClick = (letter: string) => {
    if (selectedLetter === letter) {
      setSelectedLetter(null);
    } else {
      setSelectedLetter(letter);
    }
    setCurrentPage(1);
  };

  const formatLyrics = (lyrics: string) => {
    return lyrics.split("\n\n").map((verse, i) => (
      <div key={i} className="mb-6">
        {verse.split("\n").map((line, j) => (
          <p key={j} className="leading-relaxed">{line}</p>
        ))}
      </div>
    ));
  };

  return (
    <Layout>
      <div className="max-w-lg mx-auto px-4 sm:px-6 py-6">
        <div className="text-center mb-6">
          <h1 className="font-serif text-2xl sm:text-3xl font-semibold mb-2">Hymnal Library</h1>
          <p className="text-muted-foreground">Browse and search hymns</p>
          <div className="flex items-center justify-center mt-3">
            <Select value={selectedLanguage} onValueChange={(val) => {
              setSelectedLanguage(val);
              setSelectedTag(null);
              setSelectedLetter(null);
              setCurrentPage(1);
            }}>
              <SelectTrigger className="w-[140px]" data-testid="select-hymn-language">
                <Globe className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((lang) => (
                  <SelectItem key={lang.code} value={lang.code}>
                    {lang.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        {isAuthenticated && (
          <Button 
            variant="outline"
            className="w-full mb-4"
            onClick={() => setCreatePlaylistOpen(true)}
            data-testid="button-create-playlist"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Playlist
          </Button>
        )}
        
        <div className="flex flex-col gap-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search hymns by title or lyrics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-search-hymns"
            />
          </div>

          {tags.length > 0 && (
            <ScrollArea className="w-full">
              <div className="flex gap-2 pb-2">
                <Badge
                  variant={selectedTag === null ? "default" : "outline"}
                  className="cursor-pointer shrink-0"
                  onClick={() => setSelectedTag(null)}
                  data-testid="tag-all"
                >
                  All
                </Badge>
                {tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant={selectedTag === tag ? "default" : "outline"}
                    className="cursor-pointer shrink-0 capitalize"
                    onClick={() => setSelectedTag(tag)}
                    data-testid={`tag-${tag}`}
                  >
                    {tag.charAt(0).toUpperCase() + tag.slice(1).toLowerCase()}
                  </Badge>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>

        <div className="flex gap-2 relative">
          <div className="sm:hidden fixed right-2 z-40 overflow-y-auto py-2 bg-background/95 backdrop-blur-md rounded-2xl shadow-lg border scrollbar-hide" style={{ top: '180px', bottom: '120px' }}>
            <div className="flex flex-col items-center gap-0.5 px-1">
              {ALPHABET.map((letter) => (
                <button
                  key={letter}
                  onClick={() => handleLetterClick(letter)}
                  disabled={!availableLetters.has(letter)}
                  className={cn(
                    "text-xs font-semibold w-7 min-h-[28px] flex items-center justify-center transition-colors shrink-0 rounded-md",
                    selectedLetter === letter 
                      ? "text-primary-foreground bg-primary" 
                      : availableLetters.has(letter)
                        ? "text-foreground/70"
                        : "text-muted-foreground/20"
                  )}
                  data-testid={`letter-${letter}`}
                >
                  {letter}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 min-w-0">
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-4">
                      <Skeleton className="h-5 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-1/2" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredHymns.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Music className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    {searchQuery || selectedTag || selectedLetter ? "No hymns found" : "No hymns available yet"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="flex items-center justify-between mb-3 text-sm text-muted-foreground">
                  <span>{filteredHymns.length} hymns{selectedLetter ? ` starting with "${selectedLetter}"` : ""}</span>
                  {totalPages > 1 && <span>Page {currentPage} of {totalPages}</span>}
                </div>
                <div className="space-y-2">
                  {paginatedHymns.map((hymn) => (
                    <Card
                      key={hymn.id}
                      className="cursor-pointer transition-all hover:shadow-md hover:border-primary/30"
                      onClick={() => setSelectedHymn(hymn)}
                      data-testid={`hymn-card-${hymn.id}`}
                    >
                      <CardContent className="p-3 sm:p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-base sm:text-lg truncate">{hymn.title}</h3>
                            <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground mt-1 flex-wrap">
                              {hymn.composer && <span className="truncate">{hymn.composer}</span>}
                              {hymn.year && <span>({hymn.year})</span>}
                            </div>
                          </div>
                          {isAuthenticated && (
                            <div className="flex items-center shrink-0">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  saveMutation.mutate(hymn.id);
                                }}
                                data-testid={`save-hymn-${hymn.id}`}
                              >
                                <Heart
                                  className={cn(
                                    "h-4 w-4 transition-colors",
                                    isHymnSaved(hymn.id) && "fill-red-500 text-red-500"
                                  )}
                                />
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                  <Button variant="ghost" size="icon" className="h-8 w-8" data-testid={`menu-hymn-${hymn.id}`}>
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  {playlists.length > 0 && (
                                    <>
                                      <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                                        Add to Playlist
                                      </div>
                                      {playlists.map((playlist) => (
                                        <DropdownMenuItem
                                          key={playlist.id}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            addToPlaylistMutation.mutate({ playlistId: playlist.id, hymnId: hymn.id });
                                          }}
                                          data-testid={`add-to-playlist-${playlist.id}`}
                                        >
                                          <ListMusic className="h-4 w-4 mr-2" />
                                          {playlist.title}
                                        </DropdownMenuItem>
                                      ))}
                                      <DropdownMenuSeparator />
                                    </>
                                  )}
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setCreatePlaylistOpen(true);
                                    }}
                                  >
                                    <Plus className="h-4 w-4 mr-2" />
                                    New Playlist
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-4 py-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      data-testid="button-prev-page"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Prev
                    </Button>
                    <span className="text-sm text-muted-foreground px-2">
                      {currentPage} / {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      data-testid="button-next-page"
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <Dialog open={!!selectedHymn} onOpenChange={(open) => !open && setSelectedHymn(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh]">
            <DialogHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <DialogTitle className="font-serif text-2xl">{selectedHymn?.title}</DialogTitle>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1 flex-wrap">
                    {selectedHymn?.composer && <span>{selectedHymn.composer}</span>}
                    {selectedHymn?.year && <span>({selectedHymn.year})</span>}
                    {selectedHymn?.tune && <span>Tune: {selectedHymn.tune}</span>}
                    {selectedHymn?.meter && <span>Meter: {selectedHymn.meter}</span>}
                  </div>
                </div>
                {isAuthenticated && selectedHymn && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => saveMutation.mutate(selectedHymn.id)}
                    data-testid="save-hymn-dialog"
                  >
                    <Heart
                      className={cn(
                        "h-5 w-5 transition-colors",
                        isHymnSaved(selectedHymn.id) && "fill-red-500 text-red-500"
                      )}
                    />
                  </Button>
                )}
              </div>
            </DialogHeader>
            <ScrollArea className="max-h-[60vh] mt-4">
              <div className="font-serif text-lg pr-4" data-testid="hymn-lyrics">
                {selectedHymn && formatLyrics(selectedHymn.lyrics)}
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>

        <Dialog open={createPlaylistOpen} onOpenChange={setCreatePlaylistOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Playlist</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <Input
                placeholder="Playlist name"
                value={newPlaylistTitle}
                onChange={(e) => setNewPlaylistTitle(e.target.value)}
                data-testid="input-playlist-title"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreatePlaylistOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => createPlaylistMutation.mutate(newPlaylistTitle)}
                disabled={!newPlaylistTitle.trim() || createPlaylistMutation.isPending}
                data-testid="button-save-playlist"
              >
                {createPlaylistMutation.isPending ? "Creating..." : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
