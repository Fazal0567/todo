"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useTransition } from "react";
import { Sparkles, CornerDownLeft } from "lucide-react";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { getSmartTask } from "@/lib/actions";
import { CreateTaskFromNaturalLanguageOutput } from "@/ai/flows/natural-language-task-creation";

const formSchema = z.object({
  prompt: z.string().min(1, "Please enter a task."),
});

interface SmartTaskInputProps {
  onTaskCreate: (taskData: CreateTaskFromNaturalLanguageOutput) => void;
}

export function SmartTaskInput({ onTaskCreate }: SmartTaskInputProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      prompt: "",
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    startTransition(async () => {
      const result = await getSmartTask(values.prompt);
      if ("error" in result) {
        toast({
          variant: "destructive",
          title: "AI Error",
          description: result.error,
        });
      } else {
        toast({
          title: "Task Parsed!",
          description: "Review and save your new task.",
        });
        onTaskCreate(result);
        form.reset();
      }
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="prompt"
          render={({ field }) => (
            <FormItem>
              <div className="relative">
                <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  {...field}
                  placeholder="Create a task with AI... e.g., 'Finish report by Friday 5pm'"
                  className="pl-10 pr-10 h-12 text-sm md:text-base"
                  disabled={isPending}
                />
                <button
                  type="submit"
                  disabled={isPending}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  aria-label="Create task"
                >
                  <CornerDownLeft className="h-5 w-5 text-muted-foreground hover:text-foreground" />
                </button>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}
