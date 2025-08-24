"use client";

import {
  Calendar as CalendarIcon,
  Edit,
  Flame,
  MoreVertical,
  Trash2,
  ArrowDown,
  Minus,
} from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Task } from "@/lib/types";

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string) => void;
}

const priorityIcons = {
  High: <Flame className="h-4 w-4" />,
  Medium: <Minus className="h-4 w-4" />,
  Low: <ArrowDown className="h-4 w-4" />,
};

const priorityColors = {
  High: "bg-red-500/20 text-red-500 border-red-500/30",
  Medium: "bg-yellow-500/20 text-yellow-500 border-yellow-500/30",
  Low: "bg-blue-500/20 text-blue-500 border-blue-500/30",
};

export function TaskCard({
  task,
  onEdit,
  onDelete,
  onToggleStatus,
}: TaskCardProps) {
  const isDone = task.status === "done";

  return (
    <Card
      className={cn(
        "transition-all",
        isDone ? "bg-card/50" : "bg-card"
      )}
    >
      <CardHeader className="flex flex-row items-start justify-between gap-4 p-4">
        <div className="flex items-center gap-4">
          <Checkbox
            id={`task-${task.id}`}
            checked={isDone}
            onCheckedChange={() => onToggleStatus(task.id)}
            aria-label={`Mark ${task.title} as ${isDone ? 'pending' : 'done'}`}
            className="h-5 w-5"
          />
          <div className="grid gap-1">
            <CardTitle
              className={cn(
                "text-lg",
                isDone && "text-muted-foreground line-through"
              )}
            >
              {task.title}
            </CardTitle>
            {task.description && (
              <CardDescription
                className={cn(isDone && "text-muted-foreground/80 line-through")}
              >
                {task.description}
              </CardDescription>
            )}
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
              <MoreVertical className="h-4 w-4" />
              <span className="sr-only">More options</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(task)}>
              <Edit className="mr-2 h-4 w-4" />
              <span>Edit</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete(task.id)}
              className="text-red-500 focus:text-red-500"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              <span>Delete</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent className="flex items-center justify-between p-4 pt-0">
        <Badge
          variant="outline"
          className={cn(
            "flex items-center gap-2",
            priorityColors[task.priority]
          )}
        >
          {priorityIcons[task.priority]}
          {task.priority}
        </Badge>
        {task.dueDate && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarIcon className="h-4 w-4" />
            <span>{format(new Date(task.dueDate), "MMM d, yyyy")}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
