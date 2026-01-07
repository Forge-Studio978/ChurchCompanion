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
          onClick={(e) => {
            e.stopPropagation();
            refetch();
          }}
          disabled={isRefetching}
          data-testid="button-refresh-verse"
        >
          <RefreshCw className={`h-4 w-4 ${isRefetching ? "animate-spin" : ""}`} />
        </Button>
      </CardHeader>
      <Link href={`/bible?book=${encodeURIComponent(verse.book)}&chapter=${verse.chapter}&verse=${verse.verse}`}>
        <CardContent className="pt-0 cursor-pointer hover:bg-primary/5 rounded-b-lg transition-colors">
          <blockquote className="font-serif text-lg md:text-xl leading-relaxed mb-3" data-testid="text-verse-of-day">
            "{verse.text}"
          </blockquote>
          <div className="flex items-center justify-between">
            <cite className="text-sm text-muted-foreground not-italic">
              — {verse.book} {verse.chapter}:{verse.verse} ({verse.translation})
            </cite>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </div>
        </CardContent>
      </Link>
    </Card>
  );
}

export default function Home() {
  const { user } = useAuth();

  return (
    <Layout>
      <div className="max-w-lg mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <div className="text-center mb-8">
          <h1 className="font-serif text-2xl sm:text-3xl font-semibold mb-2">
            Welcome{user?.firstName ? `, ${user.firstName}` : ""}
          </h1>
          <p className="text-muted-foreground">
            What would you like to explore today?
          </p>
        </div>

        <div className="space-y-6">
          <VerseOfDay />

          <div className="grid gap-3 grid-cols-2">
            {quickNavItems.map((item) => (
              <Link key={item.path} href={item.path}>
                <Card className="h-full cursor-pointer transition-all hover:shadow-md active:scale-[0.98] hover:border-primary/30">
                  <CardContent className="p-4 sm:p-6 text-center">
                    <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl ${item.color} flex items-center justify-center mx-auto mb-3`}>
                      <item.icon className="h-7 w-7 sm:h-8 sm:w-8" />
                    </div>
                    <h3 className="font-semibold text-base sm:text-lg">{item.label}</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1 hidden sm:block">{item.description}</p>
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
