"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { JobPost } from "@/types";
import {
  Plus,
  MoreHorizontal,
  FileText,
  Users,
  Eye,
  EyeOff,
  Edit,
  X,
  Copy,
  TrendingUp,
  Clock,
  MapPin,
  DollarSign,
} from "lucide-react";

const STATUS_CONFIG = {
  draft: {
    label: "Draft",
    class: "bg-muted text-muted-foreground",
    icon: Clock,
  },
  active: {
    label: "Active",
    class: "bg-emerald-500/20 text-emerald-400",
    icon: TrendingUp,
  },
  closed: {
    label: "Closed",
    class: "bg-red-500/20 text-red-400",
    icon: X,
  },
};

const TYPE_LABELS: Record<string, string> = {
  full_time: "Full-time",
  part_time: "Part-time",
  contract: "Contract",
  internship: "Internship",
};

export default function JobsPage() {
  const [jobs, setJobs] = useState<JobPost[]>([]);
  const [loading, setLoading] = useState(true);

  const loadJobs = useCallback(async () => {
    try {
      const res = await fetch("/api/employers/jobs");
      if (!res.ok) throw new Error("Failed to load jobs");
      const data = await res.json();
      setJobs(data.jobs ?? []);
    } catch {
      toast.error("Failed to load job posts");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  async function handleClose(jobId: string) {
    try {
      const res = await fetch(`/api/employers/jobs/${jobId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to close job");
      toast.success("Job post closed");
      loadJobs();
    } catch {
      toast.error("Failed to close job post");
    }
  }

  async function handleActivate(jobId: string) {
    try {
      const res = await fetch(`/api/employers/jobs/${jobId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "active" }),
      });
      if (!res.ok) throw new Error("Failed to activate job");
      toast.success("Job post activated!");
      loadJobs();
    } catch {
      toast.error("Failed to activate job post");
    }
  }

  async function handleDuplicate(jobId: string) {
    try {
      const res = await fetch(`/api/employers/jobs/${jobId}/duplicate`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to duplicate");
      toast.success("Job post duplicated as draft");
      loadJobs();
    } catch {
      toast.error("Failed to duplicate job post");
    }
  }

  const activeCount = jobs.filter((j) => j.status === "active").length;
  const draftCount = jobs.filter((j) => j.status === "draft").length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Job Posts</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage your open positions and attract top talent
          </p>
        </div>
        <Link href="/employer/jobs/create">
          <Button className="gradient-primary text-white">
            <Plus className="w-4 h-4 mr-2" />
            New Job Post
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Posts", value: jobs.length, icon: FileText, color: "text-primary" },
          { label: "Active", value: activeCount, icon: TrendingUp, color: "text-emerald-400" },
          { label: "Drafts", value: draftCount, icon: Clock, color: "text-amber-400" },
        ].map((stat) => (
          <div key={stat.label} className="glass rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center">
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <div>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Jobs List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass rounded-xl p-5 animate-pulse">
              <div className="h-5 bg-muted rounded w-1/3 mb-3" />
              <div className="h-4 bg-muted rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <div className="glass rounded-xl p-12 text-center">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="font-semibold mb-2">No job posts yet</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Create your first job post to start finding candidates
          </p>
          <Link href="/employer/jobs/create">
            <Button className="gradient-primary text-white">
              <Plus className="w-4 h-4 mr-2" />
              Create Job Post
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3 stagger-children">
          {jobs.map((job) => {
            const status = STATUS_CONFIG[job.status] ?? STATUS_CONFIG.draft;
            const StatusIcon = status.icon;
            return (
              <div
                key={job.id}
                className="glass rounded-xl p-5 hover:bg-accent/5 transition-all duration-200 group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h3 className="font-semibold text-base">{job.title}</h3>
                      <Badge className={`text-xs ${status.class}`}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {status.label}
                      </Badge>
                      {job.blind_mode && (
                        <Badge className="text-xs bg-violet-500/20 text-violet-400">
                          <EyeOff className="w-3 h-3 mr-1" />
                          Blind Mode
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5" />
                        {TYPE_LABELS[job.type] ?? job.type}
                      </span>
                      {job.region && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          {job.region}
                        </span>
                      )}
                      {(job.salary_min || job.salary_max) && (
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-3.5 h-3.5" />
                          {job.salary_min && job.salary_max
                            ? `$${job.salary_min.toLocaleString()} – $${job.salary_max.toLocaleString()}`
                            : job.salary_min
                            ? `$${job.salary_min.toLocaleString()}+`
                            : `up to $${job.salary_max?.toLocaleString()}`}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <TrendingUp className="w-3.5 h-3.5" />
                        Min score: {job.min_potential_score}
                      </span>
                      <span className="flex items-center gap-1 text-muted-foreground/60">
                        <Clock className="w-3 h-3" />
                        {new Date(job.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    {job.description && (
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                        {job.description}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <Link href={`/employer/talent-search?jobId=${job.id}`}>
                      <Button variant="outline" size="sm" className="hidden group-hover:flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5" />
                        Find Candidates
                      </Button>
                    </Link>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        }
                      />
                      <DropdownMenuContent align="end" className="glass">
                        <DropdownMenuItem
                          className="flex items-center gap-2 cursor-pointer"
                          onClick={() => window.location.href = `/employer/jobs/${job.id}/edit`}
                        >
                          <Edit className="w-4 h-4" />
                          Edit
                        </DropdownMenuItem>
                        {job.status === "draft" && (
                          <DropdownMenuItem
                            onClick={() => handleActivate(job.id)}
                            className="flex items-center gap-2 text-emerald-400"
                          >
                            <Eye className="w-4 h-4" />
                            Publish
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => handleDuplicate(job.id)}
                          className="flex items-center gap-2"
                        >
                          <Copy className="w-4 h-4" />
                          Duplicate
                        </DropdownMenuItem>
                        {job.status !== "closed" && (
                          <DropdownMenuItem
                            onClick={() => handleClose(job.id)}
                            className="flex items-center gap-2 text-destructive"
                          >
                            <X className="w-4 h-4" />
                            Close Job
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
