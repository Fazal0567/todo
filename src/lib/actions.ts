"use server";

import { revalidatePath } from "next/cache";
import { Collection, ObjectId, WithId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import {
  createTaskFromNaturalLanguage,
  CreateTaskFromNaturalLanguageOutput,
} from "@/ai/flows/natural-language-task-creation";
import {
  suggestTaskPriority,
  SuggestTaskPriorityOutput,
} from "@/ai/flows/suggest-task-priority";
import { summarizeTasks } from "@/ai/flows/summarize-tasks";
import type { Task } from "./types";
import dotenv from 'dotenv';

// A type for the task document stored in MongoDB, which uses _id
type TaskDocument = Omit<Task, 'id'>;

let tasksCollection: Collection<TaskDocument>;

async function getTasksCollection() {
  if (tasksCollection) {
    return tasksCollection;
  }
  try {
    const client = await clientPromise;
    const db = client.db();
    tasksCollection = db.collection<TaskDocument>("tasks");
    return tasksCollection;
  } catch (error) {
     console.error("Database connection failed:", error);
     throw new Error("Could not connect to the database. Please check your connection string and ensure the database server is running.");
  }
}

export async function getTasks(): Promise<Task[]> {
  try {
    const collection = await getTasksCollection();
    const tasksFromDb: WithId<TaskDocument>[] = await collection.find({}).sort({ _id: -1 }).toArray();
    
    // Manually convert the tasks to plain objects to avoid serialization issues
    return tasksFromDb.map((task) => {
      const { _id, ...rest } = task;
      return {
        id: _id.toHexString(),
        ...rest,
      };
    });
  } catch (error) {
    console.error("Database Error: Failed to fetch tasks.", error);
    // In case of an error, return an empty array to prevent the app from crashing.
    return [];
  }
}


export async function addTask(taskData: Omit<Task, "id" | "status">) {
  try {
    const collection = await getTasksCollection();
    const newTask: Omit<Task, "id"> = { ...taskData, status: "pending" };
    await collection.insertOne(newTask);
    revalidatePath("/");
  } catch (error) {
    console.error("Database Error: Failed to add task.", error);
    throw new Error("Could not add task. Please ensure the database is connected and running.");
  }
}

export async function updateTask(taskId: string, taskData: Partial<Omit<Task, "id">>) {
  if (!ObjectId.isValid(taskId)) {
    throw new Error("Invalid task ID");
  }
  const collection = await getTasksCollection();
  await collection.updateOne({ _id: new ObjectId(taskId) }, { $set: taskData });
  revalidatePath("/");
}

export async function deleteTask(taskId: string) {
  if (!ObjectId.isValid(taskId)) {
    throw new Error("Invalid task ID");
  }
  const collection = await getTasksCollection();
  await collection.deleteOne({ _id: new ObjectId(taskId) });
  revalidatePath("/");
}

export async function toggleTaskStatus(taskId: string, currentStatus: "pending" | "done") {
  if (!ObjectId.isValid(taskId)) {
    throw new Error("Invalid task ID");
  }
  const collection = await getTasksCollection();
  const newStatus = currentStatus === "pending" ? "done" : "pending";
  await collection.updateOne({ _id: new ObjectId(taskId) }, { $set: { status: newStatus } });
  revalidatePath("/");
}


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