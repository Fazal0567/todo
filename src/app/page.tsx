"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { AppHeader } from "@/components/app/header";
import { AddTaskDialog } from "@/components/app/add-task-dialog";
import { TaskList } from "@/components/app/task-list";
import { SmartTaskInput } from "@/components/app/smart-task-input";
import type { Task } from "@/lib/types";
import { CreateTaskFromNaturalLanguageOutput } from "@/ai/flows/natural-language-task-creation";

const initialTasks: Task[] = [
  {
    id: "1",
    title: "Finish project report",
    description: "Complete the final draft of the Q3 project report.",
    priority: "High",
    status: "pending",
    dueDate: new Date(new Date().setDate(new Date().getDate() + 2)).toISOString().split('T')[0],
  },
  {
    id: "2",
    title: "Buy groceries",
    description: "Milk, bread, eggs, and cheese.",
    priority: "Medium",
    status: "pending",
  },
  {
    id: "3",
    title: "Schedule dentist appointment",
    description: "Call Dr. Smith's office for a check-up.",
    priority: "Low",
    status: "done",
  },
    {
    id: "4",
    title: "Team meeting",
    description: "Weekly sync-up with the development team.",
    priority: "High",
    status: "done",
  },
];

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [isAddTaskOpen, setAddTaskOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<
    Task | Partial<Task> | undefined
  >(undefined);
  const [isSummaryOpen, setSummaryOpen] = useState(false);

  const handleAddTask = (task: Omit<Task, "id" | "status">) => {
    const newTask: Task = {
      ...task,
      id: crypto.randomUUID(),
      status: "pending",
    };
    setTasks((prev) => [newTask, ...prev]);
  };

  const handleUpdateTask = (updatedTask: Task) => {
    setTasks((prev) =>
      prev.map((task) => (task.id === updatedTask.id ? updatedTask : task))
    );
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks((prev) => prev.filter((task) => task.id !== taskId));
  };

  const handleToggleStatus = (taskId: string) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId
          ? {
              ...task,
              status: task.status === "pending" ? "done" : "pending",
            }
          : task
      )
    );
  };

  const openEditDialog = (task: Task) => {
    setTaskToEdit(task);
    setAddTaskOpen(true);
  };

  const openNewTaskDialog = (
    prefill?: CreateTaskFromNaturalLanguageOutput
  ) => {
    setTaskToEdit(prefill);
    setAddTaskOpen(true);
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <AppHeader
        tasks={tasks}
        onSummaryOpen={() => setSummaryOpen(true)}
      />
      <main className="flex-1 p-4 sm:p-6 md:p-8">
        <div className="mx-auto max-w-4xl">
          <div className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
            <div className="flex-1">
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                Your Tasks
              </h1>
              <p className="text-muted-foreground">
                Stay organized, stay productive.
              </p>
            </div>
            <Button onClick={() => openNewTaskDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Add Task
            </Button>
          </div>

          <div className="mb-8">
            <SmartTaskInput onTaskCreate={openNewTaskDialog} />
          </div>

          <TaskList
            tasks={tasks}
            onDeleteTask={handleDeleteTask}
            onEditTask={openEditDialog}
            onToggleStatus={handleToggleStatus}
          />
        </div>
      </main>
      <AddTaskDialog
        isOpen={isAddTaskOpen}
        onOpenChange={(open) => {
          if (!open) setTaskToEdit(undefined);
          setAddTaskOpen(open);
        }}
        onSave={(taskData) => {
          if ("id" in taskData && taskData.id) {
            handleUpdateTask(taskData as Task);
          } else {
            handleAddTask(taskData);
          }
        }}
        task={taskToEdit}
      />
    </div>
  );
}
