import { Briefcase } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function MarketplacePage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Briefcase className="w-6 h-6 text-primary" />
          Micro-Internship Marketplace
        </h1>
        <p className="text-muted-foreground mt-1">
          Browse and apply for short project-based internships
        </p>
      </div>

      <Card className="border-border/30 border-dashed">
        <CardContent className="py-16 text-center">
          <Briefcase className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-xl font-semibold">Coming Soon</p>
          <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
            The marketplace will be built by Souhaib. Once live, you&apos;ll be able to browse
            micro-internships, apply to projects, and build verified work experience.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
