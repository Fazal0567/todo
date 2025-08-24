import { ObjectId } from "mongodb";

export type Task = {
  id: string;
  _id?: ObjectId;
  title: string;
  description?: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'pending' | 'done';
  dueDate?: string;
};

export type TaskSummary = {
  summary: string;
};
