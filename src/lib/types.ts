
import { ObjectId } from "mongodb";

export type Task = {
  id: string;
  title: string;
  description?: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'pending' | 'done';
  dueDate?: string;
};

export type TaskSummary = {
  summary: string;
};

// Raw document from MongoDB
export type TaskDocument = Omit<Task, "id">;


export type User = {
  id: string;
  email: string;
  password?: string; // Should be optional as we don't always send it
  displayName?: string;
  emailNotifications?: boolean;
  avatarUrl?: string;
};

export type UserDocument = Omit<User, "id">;

export interface Session {
  userId: string;
  email: string;
  displayName?: string;
  avatarUrl?: string;
}
