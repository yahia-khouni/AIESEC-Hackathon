"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import type { Internship } from "@/types";
import {
  Plus, Briefcase, Clock, DollarSign, Users, Wifi, WifiOff,
  TrendingUp, MoreHorizontal, CheckCircle2, XCircle,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const STATUS_CONFIG = {
  open: { label: "Open", class: "bg-emerald-500/20 text-emerald-400" },
  in_progress: { label: "In Progress", class: "bg-blue-500/20 text-blue-400" },
  completed: { label: "Completed", class: "bg-muted text-muted-foreground" },
  cancelled: { label: "Cancelled", class: "bg-red-500/20 text-red-400" },
};

const CATEGORY_LABELS: Record<string, string> = {
  data_analysis: "Data Analysis", ui_design: "UI Design", content: "Content",
  dev: "Development", research: "Research", marketing: "Marketing", other: "Other",
};

interface InternshipWithCount extends Internship { applicant_count?: number; }

export default function EmployerMarketplacePage() {
  const [internships, setInternships] = useState<InternshipWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [applicantsView, setApplicantsView] = useState<string | null>(null);
  const [applicants, setApplicants] = useState<any[]>([]);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/marketplace?employer=true");
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setInternships(data.internships ?? []);
    } catch { toast.error("Failed to load internships"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function loadApplicants(internshipId: string) {
    const res = await fetch(`/api/marketplace/${internshipId}/applicants`);
    if (res.ok) {
      const data = await res.json();
      setApplicants(data.applicants ?? []);
    }
    setApplicantsView(internshipId);
  }

  async function handleAccept(applicationId: string) {
    const res = await fetch(`/api/marketplace/applications/${applicationId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "accept" }),
    });
    if (res.ok) { toast.success("Application accepted!"); loadApplicants(applicantsView!); }
    else toast.error("Failed to accept application");
  }

  async function handleReject(applicationId: string) {
    const res = await fetch(`/api/marketplace/applications/${applicationId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reject" }),
    });
    if (res.ok) { toast.success("Application rejected"); loadApplicants(applicantsView!); }
    else toast.error("Failed to reject application");
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-primary" />
            Marketplace
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your micro-internship projects</p>
        </div>
        <Link href="/employer/marketplace/create">
          <Button className="gradient-primary text-white">
            <Plus className="w-4 h-4 mr-2" />
            Post Internship
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="glass rounded-xl p-5 h-28 animate-pulse" />)}</div>
      ) : internships.length === 0 ? (
        <div className="glass rounded-xl p-12 text-center">
          <Briefcase className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="font-semibold mb-2">No internships posted yet</h3>
          <p className="text-sm text-muted-foreground mb-4">Post a micro-internship to find and trial top talent</p>
          <Link href="/employer/marketplace/create">
            <Button className="gradient-primary text-white"><Plus className="w-4 h-4 mr-2" />Post First Internship</Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 stagger-children">
          {internships.map(internship => {
            const status = STATUS_CONFIG[internship.status] ?? STATUS_CONFIG.open;
            const isApplicantsOpen = applicantsView === internship.id;
            return (
              <div key={internship.id} className="glass rounded-xl overflow-hidden">
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h3 className="font-semibold">{internship.title}</h3>
                        <Badge className={`text-[10px] ${status.class}`}>{status.label}</Badge>
                        <Badge className="text-[10px] bg-muted text-muted-foreground">{CATEGORY_LABELS[internship.category]}</Badge>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{internship.duration_weeks} weeks</span>
                        {internship.is_paid ? (
                          <span className="flex items-center gap-1 text-emerald-400"><DollarSign className="w-3 h-3" />${internship.compensation?.toLocaleString()}</span>
                        ) : (
                          <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />Unpaid</span>
                        )}
                        <span className="flex items-center gap-1">
                          {internship.is_remote ? <Wifi className="w-3 h-3 text-blue-400" /> : <WifiOff className="w-3 h-3" />}
                          {internship.is_remote ? "Remote" : "On-site"}
                        </span>
                        <span className="flex items-center gap-1"><Users className="w-3 h-3" />Max {internship.max_applicants} applicants</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" className="text-xs"
                        onClick={() => isApplicantsOpen ? setApplicantsView(null) : loadApplicants(internship.id)}>
                        <Users className="w-3.5 h-3.5 mr-1.5" />
                        Applicants
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Applicants Panel */}
                {isApplicantsOpen && (
                  <div className="border-t border-border/50 bg-muted/20 p-5">
                    <h4 className="text-sm font-semibold mb-3">Applications ({applicants.length})</h4>
                    {applicants.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No applications yet</p>
                    ) : (
                      <div className="space-y-3">
                        {applicants.map((app: any) => (
                          <div key={app.id} className="flex items-center justify-between p-3 bg-card rounded-lg">
                            <div>
                              <p className="text-sm font-medium">Candidate — Score: {app.candidates?.potential_score ?? "N/A"}</p>
                              <Badge className={`text-[10px] mt-1 ${
                                app.status === "accepted" ? "bg-emerald-500/20 text-emerald-400" :
                                app.status === "rejected" ? "bg-red-500/20 text-red-400" :
                                "bg-muted text-muted-foreground"
                              }`}>{app.status}</Badge>
                            </div>
                            {app.status === "applied" && (
                              <div className="flex gap-2">
                                <Button size="sm" className="text-xs bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                                  onClick={() => handleAccept(app.id)}>
                                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" />Accept
                                </Button>
                                <Button size="sm" variant="ghost" className="text-xs text-destructive"
                                  onClick={() => handleReject(app.id)}>
                                  <XCircle className="w-3.5 h-3.5 mr-1" />Reject
                                </Button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
