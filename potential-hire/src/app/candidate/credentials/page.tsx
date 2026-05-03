"use client";

import { useEffect, useState } from "react";
import { createBrowserSupabase } from "@/lib/db/supabase.browser";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Award, Plus, Loader2, CheckCircle2, Clock, Trash2, ExternalLink } from "lucide-react";
import type { Credential } from "@/types";

const PROVIDERS = [
  { value: "coursera", label: "Coursera" },
  { value: "udemy", label: "Udemy" },
  { value: "freecodecamp", label: "freeCodeCamp" },
  { value: "university", label: "University" },
  { value: "internal", label: "Internal" },
  { value: "other", label: "Other" },
];

export default function CredentialsPage() {
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ provider: "coursera", title: "", credential_url: "" });

  useEffect(() => {
    loadCredentials();
  }, []);

  async function loadCredentials() {
    try {
      const res = await fetch("/api/credentials");
      const data = await res.json();
      setCredentials(data.credentials || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd() {
    if (!form.title.trim() || !form.credential_url.trim()) {
      toast.error("Please fill in all fields");
      return;
    }
    setAdding(true);
    try {
      const res = await fetch("/api/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.credential) {
        setCredentials([data.credential, ...credentials]);
        setForm({ provider: "coursera", title: "", credential_url: "" });
        setDialogOpen(false);
        toast.success("Credential added! Verification in progress...");
      } else {
        toast.error(data.error || "Failed to add credential");
      }
    } catch {
      toast.error("Failed to add credential");
    } finally {
      setAdding(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await fetch(`/api/credentials?id=${id}`, { method: "DELETE" });
      setCredentials(credentials.filter((c) => c.id !== id));
      toast.success("Credential removed");
    } catch {
      toast.error("Failed to remove credential");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Award className="w-6 h-6 text-primary" />
            Credentials
          </h1>
          <p className="text-muted-foreground mt-1">
            Add and verify your certificates and courses
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger>
            <Button className="gradient-primary text-white">
              <Plus className="w-4 h-4 mr-2" /> Add Credential
            </Button>
          </DialogTrigger>
          <DialogContent className="glass border-border/50">
            <DialogHeader>
              <DialogTitle>Add a Credential</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Provider</Label>
                <Select value={form.provider} onValueChange={(v) => v && setForm({ ...form, provider: v })}>
                  <SelectTrigger className="bg-input/50"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PROVIDERS.map((p) => (
                      <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Certificate Title</Label>
                <Input
                  placeholder="e.g., Responsive Web Design"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="bg-input/50"
                />
              </div>
              <div className="space-y-2">
                <Label>Credential URL</Label>
                <Input
                  placeholder="https://..."
                  value={form.credential_url}
                  onChange={(e) => setForm({ ...form, credential_url: e.target.value })}
                  className="bg-input/50"
                />
              </div>
              <Button onClick={handleAdd} disabled={adding} className="w-full gradient-primary text-white">
                {adding ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Add Credential
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Credentials list */}
      {credentials.length === 0 ? (
        <Card className="border-border/30 border-dashed">
          <CardContent className="py-12 text-center">
            <Award className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-lg font-medium">No credentials yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Add your certificates from Coursera, Udemy, freeCodeCamp, or any other platform
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {credentials.map((cred) => (
            <Card key={cred.id} className="border-border/30 hover:border-primary/20 transition-all">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Award className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{cred.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-[10px] capitalize">{cred.provider}</Badge>
                    {cred.verified ? (
                      <Badge className="bg-green-500/10 text-green-400 border-green-500/20 text-[10px]">
                        <CheckCircle2 className="w-3 h-3 mr-1" /> Verified
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] text-yellow-400 border-yellow-400/20">
                        <Clock className="w-3 h-3 mr-1" /> Pending
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <a href={cred.credential_url} target="_blank" rel="noopener noreferrer">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </a>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(cred.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
