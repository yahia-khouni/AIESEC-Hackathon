"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  MapPin,
  Banknote,
  CheckCircle2,
  XCircle,
  Briefcase,
  Star,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import type { JobPost } from "@/types";

export default function OpportunitiesPage() {
  const [candidateScore] = useState(88); // TODO: Fetch real candidate score
  const [jobs, setJobs] = useState<(JobPost & { company?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [appliedJobs, setAppliedJobs] = useState<string[]>([]);

  // Load applied jobs from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("applied_jobs");
    if (saved) {
      try {
        setAppliedJobs(JSON.parse(saved));
      } catch (e) {
        // ignore JSON parse error
      }
    }
  }, []);

  useEffect(() => {
    async function fetchJobs() {
      try {
        const res = await fetch("/api/jobs");
        if (!res.ok) throw new Error("Failed to fetch jobs");
        const data = await res.json();
        setJobs(data.jobs || []);
      } catch (error) {
        toast.error("Failed to load partner roles.");
      } finally {
        setLoading(false);
      }
    }
    fetchJobs();
  }, []);

  const handleApply = (jobId: string) => {
    setAppliedJobs((prev) => {
      if (prev.includes(jobId)) return prev;
      const next = [...prev, jobId];
      localStorage.setItem("applied_jobs", JSON.stringify(next));
      return next;
    });
    toast.success("Application submitted successfully!");
  };

  const TYPE_LABELS: Record<string, string> = {
    full_time: "Full-time",
    part_time: "Part-time",
    contract: "Contract",
    internship: "Internship",
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Apply jobs</h1>
          <p className="text-muted-foreground mt-1">
            Exclusive job opportunities from our partner network.
          </p>
        </div>
        
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Star className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Your Potential Score</p>
              <p className="text-2xl font-bold text-primary">{candidateScore}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No jobs available at the moment. Please check back later.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {jobs.map((job) => {
            const isEligible = candidateScore >= job.min_potential_score;
            const hasApplied = appliedJobs.includes(job.id);

            return (
              <Card key={job.id} className="overflow-hidden border-border/50 hover:border-primary/50 transition-colors">
                <CardHeader className="bg-muted/30 pb-4">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div>
                      <CardTitle className="text-xl flex items-center gap-2">
                        {job.title}
                        {isEligible && !hasApplied && (
                          <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20 ml-2">
                            <CheckCircle2 className="w-3 h-3 mr-1" /> Match
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-2 text-base">
                        <Building2 className="w-4 h-4" />
                        {job.company || "Confidential"}
                      </CardDescription>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {job.region}
                      </Badge>
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Briefcase className="w-3 h-3" /> {TYPE_LABELS[job.type] || job.type}
                      </Badge>
                      {(job.salary_min || job.salary_max) && (
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <Banknote className="w-3 h-3" /> 
                          {job.salary_min && job.salary_max
                              ? `$${job.salary_min.toLocaleString()} - $${job.salary_max.toLocaleString()}`
                              : job.salary_min
                              ? `$${job.salary_min.toLocaleString()}+`
                              : `up to $${job.salary_max?.toLocaleString()}`}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-6">
                  <p className="text-muted-foreground text-sm mb-6 whitespace-pre-wrap">
                    {job.description}
                  </p>
                  
                  {job.required_skills && job.required_skills.length > 0 && (
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-medium mb-2">Required Skills</h4>
                        <div className="flex flex-wrap gap-2">
                          {job.required_skills.map((skill) => (
                            <Badge key={skill} variant="outline">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
                
                <CardFooter className="bg-muted/10 flex flex-col sm:flex-row justify-between items-center gap-4 border-t border-border/10 pt-4">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Min. Score Required:</span>
                    <span className={`font-semibold ${isEligible ? 'text-green-500' : 'text-destructive'}`}>
                      {job.min_potential_score}
                    </span>
                    {!isEligible && (
                      <span className="text-xs text-destructive flex items-center gap-1 ml-2">
                        <XCircle className="w-3 h-3" /> Score too low
                      </span>
                    )}
                  </div>
                  
                  <Button 
                    onClick={() => handleApply(job.id)}
                    disabled={!isEligible || hasApplied}
                    className={isEligible && !hasApplied ? "gradient-primary text-white" : ""}
                  >
                    {hasApplied ? "Applied" : "Apply Now"}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
