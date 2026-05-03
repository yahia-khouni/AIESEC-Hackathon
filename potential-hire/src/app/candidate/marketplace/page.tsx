"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import type { Internship } from "@/types";
import {
  Briefcase, Clock, DollarSign, Wifi, WifiOff, Users, Filter, Sparkles, Send,
} from "lucide-react";

const CATEGORY_LABELS: Record<string, string> = {
  data_analysis: "Data Analysis", ui_design: "UI Design", content: "Content",
  dev: "Development", research: "Research", marketing: "Marketing", other: "Other",
};

const CATEGORY_COLORS: Record<string, string> = {
  data_analysis: "bg-blue-500/20 text-blue-400", ui_design: "bg-violet-500/20 text-violet-400",
  content: "bg-amber-500/20 text-amber-400", dev: "bg-emerald-500/20 text-emerald-400",
  research: "bg-pink-500/20 text-pink-400", marketing: "bg-orange-500/20 text-orange-400",
  other: "bg-muted text-muted-foreground",
};

export default function CandidateMarketplacePage() {
  const [internships, setInternships] = useState<Internship[]>([]);
  const [loading, setLoading] = useState(true);
  const [applyOpen, setApplyOpen] = useState<string | null>(null);
  const [coverMessage, setCoverMessage] = useState("");
  const [applying, setApplying] = useState(false);
  const [category, setCategory] = useState("");
  const [paidOnly, setPaidOnly] = useState(false);
  const [remoteOnly, setRemoteOnly] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (category) params.set("category", category);
      if (paidOnly) params.set("is_paid", "true");
      if (remoteOnly) params.set("is_remote", "true");
      const res = await fetch(`/api/marketplace?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setInternships(data.internships ?? []);
    } catch { toast.error("Failed to load marketplace"); }
    finally { setLoading(false); }
  }, [category, paidOnly, remoteOnly]);

  useEffect(() => { load(); }, [load]);

  async function handleApply() {
    if (!applyOpen) return;
    setApplying(true);
    try {
      const res = await fetch(`/api/marketplace/${applyOpen}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coverMessage }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to apply");
      }
      toast.success("Application submitted! 🎉");
      setApplyOpen(null);
      setCoverMessage("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to apply");
    } finally { setApplying(false); }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Briefcase className="w-6 h-6 text-primary" />
          Marketplace
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Discover 2–4 week micro-internship projects to build real experience
        </p>
      </div>

      {/* Filters */}
      <div className="glass rounded-xl p-4 flex flex-wrap items-center gap-3">
        <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
        <Select onValueChange={(v) => setCategory(v ?? "")} value={category}>
          <SelectTrigger className="h-8 w-44 text-xs">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Categories</SelectItem>
            {Object.entries(CATEGORY_LABELS).map(([v, l]) => (
              <SelectItem key={v} value={v}>{l}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <button
          onClick={() => setPaidOnly(!paidOnly)}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${paidOnly ? "bg-emerald-500/20 text-emerald-400" : "bg-muted text-muted-foreground hover:text-foreground"}`}
        >
          <DollarSign className="w-3 h-3 inline mr-1" />Paid only
        </button>
        <button
          onClick={() => setRemoteOnly(!remoteOnly)}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${remoteOnly ? "bg-blue-500/20 text-blue-400" : "bg-muted text-muted-foreground hover:text-foreground"}`}
        >
          <Wifi className="w-3 h-3 inline mr-1" />Remote only
        </button>
        <span className="text-xs text-muted-foreground ml-auto">
          {internships.length} project{internships.length !== 1 ? "s" : ""} available
        </span>
      </div>

      {/* Internships Grid */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => <div key={i} className="glass rounded-xl p-5 h-48 animate-pulse" />)}
        </div>
      ) : internships.length === 0 ? (
        <div className="glass rounded-xl p-12 text-center">
          <Briefcase className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="font-semibold mb-2">No projects found</h3>
          <p className="text-sm text-muted-foreground">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
          {internships.map(internship => (
            <div key={internship.id} className="glass rounded-xl p-5 flex flex-col hover:bg-accent/5 transition-all group">
              <div className="flex items-start justify-between mb-3">
                <Badge className={`text-[10px] ${CATEGORY_COLORS[internship.category] ?? CATEGORY_COLORS.other}`}>
                  {CATEGORY_LABELS[internship.category]}
                </Badge>
                {internship.is_remote ? (
                  <span className="flex items-center gap-1 text-[10px] text-blue-400"><Wifi className="w-3 h-3" />Remote</span>
                ) : (
                  <span className="flex items-center gap-1 text-[10px] text-muted-foreground"><WifiOff className="w-3 h-3" />On-site</span>
                )}
              </div>

              <h3 className="font-semibold text-sm mb-2 line-clamp-2">{internship.title}</h3>
              <p className="text-xs text-muted-foreground line-clamp-3 flex-1 mb-4">{internship.description}</p>

              <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{internship.duration_weeks}w</span>
                <span className="flex items-center gap-1">
                  {internship.is_paid ? (
                    <><DollarSign className="w-3 h-3 text-emerald-400" /><span className="text-emerald-400">${internship.compensation?.toLocaleString()}</span></>
                  ) : (
                    <span>Unpaid</span>
                  )}
                </span>
                <span className="flex items-center gap-1"><Users className="w-3 h-3" />{internship.max_applicants} spots</span>
              </div>

              <Button
                className="w-full gradient-primary text-white text-xs"
                size="sm"
                onClick={() => setApplyOpen(internship.id)}
              >
                <Send className="w-3.5 h-3.5 mr-1.5" />
                Apply Now
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Apply Modal */}
      <Dialog open={!!applyOpen} onOpenChange={() => { setApplyOpen(null); setCoverMessage(""); }}>
        <DialogContent className="glass border-border/50">
          <DialogHeader>
            <DialogTitle>Apply for Internship</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Write a brief cover message to introduce yourself and explain why you&apos;re a great fit.
            </p>
            <textarea
              className="w-full h-32 bg-input border border-border rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="I'm excited about this opportunity because... My relevant experience includes..."
              value={coverMessage}
              onChange={(e) => setCoverMessage(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApplyOpen(null)}>Cancel</Button>
            <Button className="gradient-primary text-white" onClick={handleApply} disabled={applying}>
              {applying ? "Submitting..." : "Submit Application"}
              <Sparkles className="ml-2 w-4 h-4" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
