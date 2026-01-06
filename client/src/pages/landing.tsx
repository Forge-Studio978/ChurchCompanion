import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Book, Music, FileText, Heart } from "lucide-react";

const features = [
  {
    icon: Book,
    title: "Bible Reader",
    description: "Read, search, and highlight Scripture with the King James Version",
  },
  {
    icon: Music,
    title: "Hymnal Library",
    description: "Browse classic hymns with lyrics for personal worship",
  },
  {
    icon: FileText,
    title: "Livestream Companion",
    description: "Take notes while watching and attach Scripture references",
  },
  {
    icon: Heart,
    title: "Personal Library",
    description: "Save your favorite verses, hymns, and notes in one place",
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-6">
            <span className="text-primary font-serif text-3xl font-semibold">C</span>
          </div>
          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight mb-4">
            Christian Center
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed">
            Your personal worship companion. Read Scripture, explore hymns, 
            take notes while watching, and deepen your faith in a calm, focused space.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild className="text-base px-8" data-testid="button-get-started">
              <a href="/api/login">Get Started</a>
            </Button>
            <Button size="lg" variant="outline" asChild className="text-base px-8" data-testid="button-learn-more">
              <a href="#features">Learn More</a>
            </Button>
          </div>
        </div>

        <div id="features" className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => (
            <Card key={index} className="border-0 bg-card/50">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-20 text-center">
          <p className="text-sm text-muted-foreground">
            A calm digital worship companion. Private, peaceful, and focused on what matters.
          </p>
        </div>
      </div>
    </div>
  );
}
