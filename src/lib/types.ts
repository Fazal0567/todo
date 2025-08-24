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
