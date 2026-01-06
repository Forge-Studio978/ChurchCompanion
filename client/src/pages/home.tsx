import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Book, Music, Library, Mic, ChevronRight, RefreshCw } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import type { BibleVerse } from "@shared/schema";

const quickNavItems = [
  {
    path: "/bible",
    label: "Bible",
    description: "Read and study Scripture",
    icon: Book,
    color: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  },
  {
    path: "/hymns",
    label: "Hymns",
    description: "Browse hymnal library",
    icon: Music,
    color: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  },
  {
    path: "/library",
    label: "Library",
    description: "Your saved items",
    icon: Library,
    color: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
  {
    path: "/livestream",
    label: "Livestream",
    description: "Watch and take notes",
    icon: Mic,
    color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
];

function VerseOfDay() {
  const { data: verse, isLoading, refetch, isRefetching } = useQuery<BibleVerse>({
    queryKey: ["/api/verse-of-day"],
  });

  if (isLoading) {
    return (
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <CardHeader className="pb-3">
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-6 w-full mb-2" />
          <Skeleton className="h-6 w-3/4 mb-4" />
          <Skeleton className="h-4 w-24" />
        </CardContent>
      </Card>
    );
  }

  if (!verse) {
    return (
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">Unable to load verse of the day</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={() => refetch()}>
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 overflow-visible">
      <CardHeader className="pb-2 flex flex-row items-center justify-between gap-4">
        <CardTitle className="text-sm font-medium text-primary">Verse of the Day</CardTitle>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => refetch()}
          disabled={isRefetching}
          data-testid="button-refresh-verse"
        >
          <RefreshCw className={`h-4 w-4 ${isRefetching ? "animate-spin" : ""}`} />
        </Button>
      </CardHeader>
      <CardContent className="pt-0">
        <blockquote className="font-serif text-lg md:text-xl leading-relaxed mb-3" data-testid="text-verse-of-day">
          "{verse.text}"
        </blockquote>
        <cite className="text-sm text-muted-foreground not-italic">
          — {verse.book} {verse.chapter}:{verse.verse} ({verse.translation})
        </cite>
      </CardContent>
    </Card>
  );
}

export default function Home() {
  const { user } = useAuth();

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">
        <div className="mb-8">
          <h1 className="font-serif text-2xl md:text-3xl font-semibold mb-1">
            Welcome{user?.firstName ? `, ${user.firstName}` : ""}
          </h1>
          <p className="text-muted-foreground">
            What would you like to explore today?
          </p>
        </div>

        <div className="space-y-6">
          <VerseOfDay />

          <div className="grid gap-4 sm:grid-cols-2">
            {quickNavItems.map((item) => (
              <Link key={item.path} href={item.path}>
                <Card className="h-full cursor-pointer transition-all hover:shadow-md hover:border-primary/30">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className={`w-12 h-12 rounded-xl ${item.color} flex items-center justify-center mb-4`}>
                          <item.icon className="h-6 w-6" />
                        </div>
                        <h3 className="font-semibold text-lg mb-1">{item.label}</h3>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground mt-1" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
