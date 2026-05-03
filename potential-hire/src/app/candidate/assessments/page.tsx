"use client";

import { useState } from "react";
import { createBrowserSupabase } from "@/lib/db/supabase.browser";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { ShieldCheck, Loader2, CheckCircle2, XCircle, ArrowRight, Brain } from "lucide-react";

const AVAILABLE_SKILLS = [
  "JavaScript", "TypeScript", "Python", "React", "Next.js",
  "Node.js", "HTML", "CSS", "SQL", "Git",
  "Data Analysis", "Machine Learning", "Figma",
];

interface QuizQuestion {
  question: string;
  options: string[];
  correct_index: number;
  explanation: string;
}

export default function AssessmentsPage() {
  const supabase = createBrowserSupabase();
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function startQuiz(skill: string) {
    setSelectedSkill(skill);
    setGenerating(true);
    setCurrentQ(0);
    setAnswers([]);
    setShowResult(false);
    setSubmitted(false);

    try {
      // Call AI to generate quiz (using client-side fetch to our API)
      const res = await fetch("/api/assessments/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skill, difficulty: "intermediate", count: 5 }),
      });

      const data = await res.json();
      if (data.questions) {
        setQuestions(data.questions);
        setAnswers(new Array(data.questions.length).fill(null));
      } else {
        toast.error("Failed to generate quiz");
        setSelectedSkill(null);
      }
    } catch {
      toast.error("Failed to generate quiz");
      setSelectedSkill(null);
    } finally {
      setGenerating(false);
    }
  }

  function selectAnswer(index: number) {
    if (submitted) return;
    const newAnswers = [...answers];
    newAnswers[currentQ] = index;
    setAnswers(newAnswers);
  }

  function nextQuestion() {
    if (currentQ < questions.length - 1) {
      setCurrentQ(currentQ + 1);
    }
  }

  function prevQuestion() {
    if (currentQ > 0) {
      setCurrentQ(currentQ - 1);
    }
  }

  async function submitQuiz() {
    setSubmitted(true);
    setShowResult(true);

    const correct = answers.filter((a, i) => a === questions[i].correct_index).length;
    const score = Math.round((correct / questions.length) * 100);

    // Save to database
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: candidate } = await supabase
        .from("candidates")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!candidate) return;

      // Find or create skill
      const { data: skillRow } = await supabase
        .from("skills")
        .select("id")
        .ilike("name", selectedSkill || "")
        .single();

      if (skillRow) {
        await supabase.from("assessments").insert({
          candidate_id: candidate.id,
          skill_id: skillRow.id,
          type: "quiz",
          score,
          max_score: 100,
        });

        toast.success(`Quiz completed! Score: ${score}/100`);
      }
    } catch (error) {
      console.error(error);
    }
  }

  // Quiz in progress
  if (selectedSkill && questions.length > 0 && !showResult) {
    const q = questions[currentQ];
    const progress = ((currentQ + 1) / questions.length) * 100;

    return (
      <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
        <div className="flex items-center justify-between">
          <Badge variant="secondary" className="bg-primary/10 text-primary">
            {selectedSkill} Assessment
          </Badge>
          <span className="text-sm text-muted-foreground">
            Question {currentQ + 1} of {questions.length}
          </span>
        </div>

        <Progress value={progress} className="h-2" />

        <Card className="border-border/30">
          <CardContent className="pt-6 space-y-6">
            <p className="text-lg font-medium">{q.question}</p>
            <div className="space-y-2">
              {q.options.map((option, i) => (
                <button
                  key={i}
                  onClick={() => selectAnswer(i)}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${
                    answers[currentQ] === i
                      ? "border-primary bg-primary/10"
                      : "border-border/30 hover:border-primary/40"
                  }`}
                >
                  <span className="text-sm">{option}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-between">
          <Button variant="outline" onClick={prevQuestion} disabled={currentQ === 0}>
            Previous
          </Button>
          {currentQ === questions.length - 1 ? (
            <Button
              onClick={submitQuiz}
              disabled={answers.includes(null)}
              className="gradient-primary text-white"
            >
              Submit Quiz
            </Button>
          ) : (
            <Button onClick={nextQuestion} disabled={answers[currentQ] === null}>
              Next <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Results
  if (showResult) {
    const correct = answers.filter((a, i) => a === questions[i].correct_index).length;
    const score = Math.round((correct / questions.length) * 100);

    return (
      <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
        <Card className="gradient-card border-border/30 text-center">
          <CardContent className="pt-8 pb-8 space-y-4">
            <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-3xl font-bold">{score}</span>
            </div>
            <p className="text-lg font-bold">
              {score >= 80 ? "Excellent! 🎉" : score >= 60 ? "Good job! 👍" : "Keep practicing! 💪"}
            </p>
            <p className="text-sm text-muted-foreground">
              You got {correct} out of {questions.length} correct in {selectedSkill}
            </p>
          </CardContent>
        </Card>

        {/* Review answers */}
        <div className="space-y-3">
          {questions.map((q, i) => {
            const isCorrect = answers[i] === q.correct_index;
            return (
              <Card key={i} className={`border ${isCorrect ? "border-green-500/20" : "border-red-500/20"}`}>
                <CardContent className="pt-4 space-y-2">
                  <div className="flex items-start gap-2">
                    {isCorrect ? (
                      <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                    )}
                    <p className="text-sm font-medium">{q.question}</p>
                  </div>
                  {!isCorrect && (
                    <p className="text-xs text-muted-foreground ml-7">
                      Correct answer: {q.options[q.correct_index]}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground ml-7 italic">{q.explanation}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Button onClick={() => { setSelectedSkill(null); setQuestions([]); setShowResult(false); }} variant="outline" className="w-full">
          Take Another Assessment
        </Button>
      </div>
    );
  }

  // Skill selection (loading state)
  if (generating) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Brain className="w-12 h-12 text-primary animate-pulse" />
        <p className="text-lg font-medium">Generating your {selectedSkill} quiz...</p>
        <p className="text-sm text-muted-foreground">Our AI is crafting personalized questions</p>
        <Loader2 className="w-6 h-6 animate-spin text-primary mt-2" />
      </div>
    );
  }

  // Skill picker
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-primary" />
          Skill Assessments
        </h1>
        <p className="text-muted-foreground mt-1">
          Take AI-generated quizzes to verify your skills and boost your score
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {AVAILABLE_SKILLS.map((skill) => (
          <Card
            key={skill}
            className="border-border/30 hover:border-primary/40 transition-all cursor-pointer group"
            onClick={() => startQuiz(skill)}
          >
            <CardContent className="p-4 text-center">
              <div className="w-10 h-10 mx-auto rounded-lg bg-primary/10 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-5 h-5 text-primary" />
              </div>
              <p className="text-sm font-medium">{skill}</p>
              <p className="text-xs text-muted-foreground mt-1">5 questions</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
