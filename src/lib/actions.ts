"use server";

import {
  createTaskFromNaturalLanguage,
  CreateTaskFromNaturalLanguageOutput,
} from "@/ai/flows/natural-language-task-creation";
import {
  suggestTaskPriority,
  SuggestTaskPriorityOutput,
} from "@/ai/flows/suggest-task-priority";
import { summarizeTasks } from "@/ai/flows/summarize-tasks";
import { Task } from "./types";

export async function getSmartTask(
  naturalLanguageInput: string
): Promise<CreateTaskFromNaturalLanguageOutput | { error: string }> {
  try {
    const task = await createTaskFromNaturalLanguage({ naturalLanguageInput });
    return task;
  } catch (error) {
    console.error(error);
    return { error: "Failed to create task from your input. Please try again." };
  }
}

export async function getPrioritySuggestion(
  taskDescription: string,
  deadline?: string
): Promise<SuggestTaskPriorityOutput | { error: string }> {
  try {
    const suggestion = await suggestTaskPriority({ taskDescription, deadline });
    return suggestion;
  } catch (error) {
    console.error(error);
    return { error: "Failed to suggest a priority. Please try again." };
  }
}

export async function getTaskSummary(
  tasks: Task[],
  timePeriod: "daily" | "weekly"
): Promise<{ summary: string } | { error: string }> {
  if (tasks.length === 0) {
    return { summary: "No tasks to summarize for this period." };
  }
  try {
    const result = await summarizeTasks({ tasks, timePeriod });
    return result;
  } catch (error) {
    console.error(error);
    return { error: "Failed to generate summary. Please try again." };
  }
}
