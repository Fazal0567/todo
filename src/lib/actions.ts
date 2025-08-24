
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
import { getSession } from "./auth-client";
import { getRoom } from "./room-actions";


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

function toTaskObject(doc: WithId<TaskDocument>): Task {
  const { _id, ...rest } = doc;
  return {
    id: _id.toHexString(),
    ...rest
  };
}

export async function getTasks(roomId: string): Promise<Task[]> {
  const session = await getSession();
  if (!session) {
    console.error("Authentication Error: No session found.");
    return [];
  }

  // Validate that the user has access to this room
  const room = await getRoom(roomId, session.userId);
  if (!room) {
    console.error("Authorization Error: User does not have access to this room.");
    return [];
  }

  try {
    const collection = await getTasksCollection();
    const tasksFromDb = await collection.find({ roomId }).sort({ _id: -1 }).toArray();
    return tasksFromDb.map(toTaskObject);
  } catch (error) {
    console.error("Database Error: Failed to fetch tasks.", error);
    return [];
  }
}


export async function addTask(taskData: Omit<Task, "id" | "status">) {
  try {
    const collection = await getTasksCollection();
    const newTask: TaskDocument = { ...taskData, status: "pending" };
    const result = await collection.insertOne(newTask);
    
    if (result.insertedId) {
      revalidatePath(`/rooms/${taskData.roomId}`);
      const insertedTask = await collection.findOne({ _id: result.insertedId });
      if (insertedTask) {
        return { success: true, data: toTaskObject(insertedTask) };
      }
    }
    return { success: false, error: "Failed to add task." };
  } catch (error) {
    console.error("Database Error: Failed to add task.", error);
    return { success: false, error: "Could not add task. Please ensure the database is connected and running." };
  }
}

export async function updateTask(taskId: string, taskData: Partial<Omit<Task, "id">>) {
  if (!ObjectId.isValid(taskId)) {
    return { success: false, error: "Invalid task ID." };
  }
  try {
    const collection = await getTasksCollection();
    const { id, ...dataToUpdate } = taskData;
    await collection.updateOne({ _id: new ObjectId(taskId) }, { $set: dataToUpdate });
    const updatedTask = await collection.findOne({_id: new ObjectId(taskId)});
    
    if (updatedTask) {
      revalidatePath(`/rooms/${updatedTask.roomId}`);
      return { success: true, data: toTaskObject(updatedTask) };
    }
     return { success: false, error: "Task not found after update." };
  } catch (error) {
    console.error("Database Error: Failed to update task.", error);
    return { success: false, error: "Failed to update task." };
  }
}

export async function deleteTask(taskId: string) {
  if (!ObjectId.isValid(taskId)) {
     return { success: false, error: "Invalid task ID." };
  }
  try {
    const collection = await getTasksCollection();
    const taskToDelete = await collection.findOne({ _id: new ObjectId(taskId) });
    if (!taskToDelete) {
       return { success: false, error: "Task not found." };
    }
    const roomId = taskToDelete.roomId;
    await collection.deleteOne({ _id: new ObjectId(taskId) });
    revalidatePath(`/rooms/${roomId}`);
    return { success: true };
  } catch (error) {
     console.error("Database Error: Failed to delete task.", error);
    return { success: false, error: "Failed to delete task." };
  }
}

export async function toggleTaskStatus(taskId: string, currentStatus: "pending" | "done") {
  if (!ObjectId.isValid(taskId)) {
    return { success: false, error: "Invalid task ID." };
  }
  try {
    const collection = await getTasksCollection();
    const newStatus = currentStatus === "pending" ? "done" : "pending";
    await collection.updateOne({ _id: new ObjectId(taskId) }, { $set: { status: newStatus } });
    const updatedTask = await collection.findOne({_id: new ObjectId(taskId)});

    if (updatedTask) {
      revalidatePath(`/rooms/${updatedTask.roomId}`);
      return { success: true, data: toTaskObject(updatedTask) };
    }
    return { success: false, error: "Task not found after update." };
  } catch (error) {
    console.error("Database Error: Failed to update task status.", error);
    return { success: false, error: "Failed to update task status." };
  }
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
