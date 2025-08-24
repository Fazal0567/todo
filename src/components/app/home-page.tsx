"use client";

import { useState, useTransition, startTransition } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { AppHeader } from "@/components/app/header";
import { AddTaskDialog } from "@/components/app/add-task-dialog";
import { TaskList } from "@/components/app/task-list";
import { SmartTaskInput } from "@/components/app/smart-task-input";
import type { Task } from "@/lib/types";
import { CreateTaskFromNaturalLanguageOutput } from "@/ai/flows/natural-language-task-creation";
import { addTask, deleteTask, toggleTaskStatus, updateTask } from "@/lib/actions";
import { useToast } from "@/hooks/use-toast";

export default function HomePage({ serverTasks }: { serverTasks: Task[] }) {
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>(serverTasks);
  const [isAddTaskOpen, setAddTaskOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<
    Task | Partial<Task> | undefined
  >(undefined);
  
  const handleAddTask = (task: Omit<Task, "id" | "status">) => {
    startTransition(async () => {
      try {
        await addTask(task);
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Database Error",
          description: (error as Error).message,
        });
      }
    });
  };

  const handleUpdateTask = (updatedTask: Task) => {
    startTransition(async () => {
      await updateTask(updatedTask.id, updatedTask);
    });
  };

  const handleDeleteTask = (taskId: string) => {
    startTransition(async () => {
      await deleteTask(taskId);
    });
  };

  const handleToggleStatus = (taskId: string, currentStatus: 'pending' | 'done') => {
    startTransition(async () => {
      await toggleTaskStatus(taskId, currentStatus);
    });
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
            onToggleStatus={(taskId) => {
              const task = tasks.find(t => t.id === taskId);
              if (task) {
                handleToggleStatus(taskId, task.status);
              }
            }}
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
