"use client";

import { useState, useTransition } from "react";
import { Loader2, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { getTaskSummary } from "@/lib/actions";
import { useToast } from "@/hooks/use-toast";
import type { Task } from "@/lib/types";

export function TaskSummaryDialog({ tasks }: { tasks: Task[] }) {
  const [isPending, startTransition] = useTransition();
  const [summary, setSummary] = useState<string | null>(null);
  const { toast } = useToast();

  const handleGenerateSummary = (period: "daily" | "weekly") => {
    setSummary(null);
    startTransition(async () => {
      const result = await getTaskSummary(tasks, period);
      if ("error" in result) {
        toast({
          variant: "destructive",
          title: "AI Error",
          description: result.error,
        });
        setSummary(null);
      } else {
        setSummary(result.summary);
      }
    });
  };

  return (
    <Dialog onOpenChange={() => setSummary(null)}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Sparkles className="mr-2 h-4 w-4" />
          Get Summary
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>AI Task Summary</DialogTitle>
          <DialogDescription>
            Get a quick summary of your tasks for the day or week.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center space-x-2">
          <Button
            onClick={() => handleGenerateSummary("daily")}
            disabled={isPending}
            className="flex-1"
          >
            Daily Summary
          </Button>
          <Button
            onClick={() => handleGenerateSummary("weekly")}
            disabled={isPending}
            className="flex-1"
            variant="secondary"
          >
            Weekly Summary
          </Button>
        </div>
        <div className="mt-4 min-h-[100px] rounded-md border bg-muted/50 p-4">
          {isPending && (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
          {summary && (
            <p className="text-sm text-foreground whitespace-pre-wrap">
              {summary}
            </p>
          )}
          {!isPending && !summary && (
            <p className="text-sm text-muted-foreground text-center flex items-center justify-center h-full">
              Select a period to generate a summary.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
