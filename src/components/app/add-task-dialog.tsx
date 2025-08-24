"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useEffect, useState, useTransition } from "react";
import { Calendar as CalendarIcon, Sparkles } from "lucide-react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { Task } from "@/lib/types";
import { getPrioritySuggestion } from "@/lib/actions";

const taskSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, "Title is required."),
  description: z.string().optional(),
  priority: z.enum(["Low", "Medium", "High"]),
  dueDate: z.string().optional(),
});

type TaskFormData = z.infer<typeof taskSchema>;

interface AddTaskDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSave: (task: TaskFormData) => void;
  task?: Task | Partial<Task>;
}

export function AddTaskDialog({
  isOpen,
  onOpenChange,
  onSave,
  task,
}: AddTaskDialogProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const [suggestionReason, setSuggestionReason] = useState<string | null>(null);

  const form = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: "",
      description: "",
      priority: "Medium",
    },
  });

  useEffect(() => {
    if (task) {
      form.reset({
        id: "id" in task ? task.id : undefined,
        title: task.title || "",
        description: task.description || "",
        priority: task.priority || "Medium",
        dueDate: task.dueDate,
      });
    } else {
      form.reset({
        title: "",
        description: "",
        priority: "Medium",
        dueDate: undefined,
      });
    }
    setSuggestionReason(null);
  }, [task, isOpen, form]);

  const handleSuggestPriority = () => {
    const description = form.getValues("description") || "";
    const title = form.getValues("title");
    const dueDate = form.getValues("dueDate");
    const combinedText = `${title}\n${description}`.trim();
    if (!combinedText) {
      toast({
        variant: "destructive",
        title: "Cannot suggest priority",
        description: "Please provide a title or description first.",
      });
      return;
    }
    startTransition(async () => {
      const result = await getPrioritySuggestion(combinedText, dueDate);
      if ("error" in result) {
        toast({
          variant: "destructive",
          title: "AI Error",
          description: result.error,
        });
      } else {
        form.setValue("priority", result.priority, { shouldValidate: true });
        setSuggestionReason(result.reason);
        toast({
          title: "AI Suggestion",
          description: `Priority set to ${result.priority}.`,
        });
      }
    });
  };

  const onSubmit = (data: TaskFormData) => {
    onSave(data);
    onOpenChange(false);
  };

  const isEditing = !!task && "id" in task;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Task" : "Add New Task"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the details of your task."
              : "Fill in the details for your new task."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Finish project report" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add more details about the task..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <div className="flex items-center gap-2">
                       <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Low">Low</SelectItem>
                          <SelectItem value="Medium">Medium</SelectItem>
                          <SelectItem value="High">High</SelectItem>
                        </SelectContent>
                      </Select>
                       <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={handleSuggestPriority}
                        disabled={isPending}
                        className="h-9 w-9 shrink-0"
                      >
                        <Sparkles className="h-4 w-4" />
                      </Button>
                    </div>
                    {suggestionReason && <p className="text-xs text-muted-foreground mt-1">{suggestionReason}</p>}
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value ? (
                              format(new Date(field.value), "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value ? new Date(field.value) : undefined}
                          onSelect={(date) => field.onChange(date?.toISOString().split('T')[0])}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Saving..." : "Save Task"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
