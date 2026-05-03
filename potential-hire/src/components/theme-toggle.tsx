"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center justify-between w-full p-2 rounded-lg border border-border/50 bg-background/50">
      <span className="text-sm font-medium ml-2 text-muted-foreground">Theme</span>
      <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-md">
        <Button
          variant={theme === "light" ? "default" : "ghost"}
          size="sm"
          className={`h-7 px-2 ${theme === "light" ? "" : "text-muted-foreground"}`}
          onClick={() => setTheme("light")}
        >
          <Sun className="h-4 w-4 mr-1.5" />
          <span className="text-xs">Light</span>
        </Button>
        <Button
          variant={theme === "dark" ? "default" : "ghost"}
          size="sm"
          className={`h-7 px-2 ${theme === "dark" ? "" : "text-muted-foreground"}`}
          onClick={() => setTheme("dark")}
        >
          <Moon className="h-4 w-4 mr-1.5" />
          <span className="text-xs">Dark</span>
        </Button>
      </div>
    </div>
  );
}
