"use client";

import { AnimatePresence, motion } from "framer-motion";
import { TaskCard } from "./task-card";
import type { Task } from "@/lib/types";

interface TaskListProps {
  tasks: Task[];
  onEditTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
  onToggleStatus: (id: string) => void;
}

export function TaskList({
  tasks,
  onEditTask,
  onDeleteTask,
  onToggleStatus,
}: TaskListProps) {
  const pendingTasks = tasks.filter((task) => task.status === "pending");
  const doneTasks = tasks.filter((task) => task.status === "done");

  return (
    <div className="space-y-8">
      <div>
        <h2 className="mb-4 text-xl font-semibold text-foreground">Pending</h2>
        {pendingTasks.length > 0 ? (
          <div className="grid gap-4">
            <AnimatePresence>
              {pendingTasks.map((task) => (
                <motion.div
                  key={task.id}
                  layout
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                >
                  <TaskCard
                    task={task}
                    onEdit={onEditTask}
                    onDelete={onDeleteTask}
                    onToggleStatus={onToggleStatus}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <p className="text-muted-foreground">
            No pending tasks. Way to go!
          </p>
        )}
      </div>

      <div>
        <h2 className="mb-4 text-xl font-semibold text-foreground">Done</h2>
        {doneTasks.length > 0 ? (
          <div className="grid gap-4">
            <AnimatePresence>
              {doneTasks.map((task) => (
                 <motion.div
                  key={task.id}
                  layout
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                >
                  <TaskCard
                    task={task}
                    onEdit={onEditTask}
                    onDelete={onDeleteTask}
                    onToggleStatus={onToggleStatus}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <p className="text-muted-foreground">No tasks completed yet.</p>
        )}
      </div>
    </div>
  );
}
