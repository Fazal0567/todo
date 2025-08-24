
"use client";

import { useState, startTransition, useEffect } from "react";
import { Plus } from "lucide-react";
import { useParams, useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { AddTaskDialog } from "@/components/app/add-task-dialog";
import { TaskList } from "@/components/app/task-list";
import { SmartTaskInput } from "@/components/app/smart-task-input";
import type { Task, Session } from "@/lib/types";
import { CreateTaskFromNaturalLanguageOutput } from "@/ai/flows/natural-language-task-creation";
import { addTask, deleteTask, toggleTaskStatus, updateTask } from "@/lib/actions";
import { useToast } from "@/hooks/use-toast";
import { getRoom } from "@/lib/room-actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import Link from "next/link";

export default function HomePage({ serverTasks, session }: { serverTasks: Task[], session: Session | null }) {
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const roomId = params.roomId as string;

  const [tasks, setTasks] = useState<Task[]>(serverTasks);
  const [isAddTaskOpen, setAddTaskOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<
    Task | Partial<Task> | undefined
  >(undefined);

  useEffect(() => {
    setTasks(serverTasks);
  }, [serverTasks]);

   if (!session || !roomId) {
    return (
       <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle className="text-2xl">Welcome to CollabTaskAI</CardTitle>
            <CardDescription>
              Please log in to manage your tasks.
            </CardDescription>
          </CardHeader>
          <CardContent>
             <Button asChild>
                <Link href="/login">Login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  const handleAddTask = (task: Omit<Task, "id" | "status" | "roomId">) => {
    startTransition(async () => {
      try {
        const result = await addTask({ ...task, roomId });
        if (result.success && result.data) {
          setTasks(prev => [...prev, result.data]);
        } else {
           toast({
            variant: "destructive",
            title: "Error adding task",
            description: result.error || "An unknown error occurred.",
          });
        }
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
      const result = await updateTask(updatedTask.id, updatedTask);
       if (result.success && result.data) {
          setTasks(prev => prev.map(t => t.id === result.data!.id ? result.data! : t));
        } else {
           toast({
            variant: "destructive",
            title: "Error updating task",
            description: result.error || "An unknown error occurred.",
          });
        }
    });
  };

  const handleDeleteTask = (taskId: string) => {
    startTransition(async () => {
      const result = await deleteTask(taskId);
       if (result.success) {
          setTasks(prev => prev.filter(t => t.id !== taskId));
        } else {
           toast({
            variant: "destructive",
            title: "Error deleting task",
            description: result.error || "An unknown error occurred.",
          });
        }
    });
  };

  const handleToggleStatus = (taskId: string) => {
     const task = tasks.find(t => t.id === taskId);
     if (!task) return;

    startTransition(async () => {
      const result = await toggleTaskStatus(taskId, task.status);
       if (result.success && result.data) {
          setTasks(prev => prev.map(t => t.id === result.data!.id ? result.data! : t));
        } else {
           toast({
            variant: "destructive",
            title: "Error updating status",
            description: result.error || "An unknown error occurred.",
          });
        }
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
  
  if (!roomId) {
    return null;
  }

  return (
    <>
      <div className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
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
    </>
  );
}
