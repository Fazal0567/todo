
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  roomUrl: z.string().url("Please enter a valid room URL."),
});

export function JoinRoomForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { roomUrl: "" },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    try {
      const url = new URL(values.roomUrl);
      const pathSegments = url.pathname.split('/').filter(Boolean); // filter removes empty strings
      
      if (pathSegments.length >= 2 && pathSegments[0] === 'rooms') {
        const roomId = pathSegments[1];
        // Redirect to the extracted room ID
        router.push(`/rooms/${roomId}`);
      } else {
        throw new Error("URL does not seem to be a valid room link.");
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Invalid Link",
        description: (error as Error).message || "Please check the URL and try again.",
      });
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="roomUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Room Link</FormLabel>
              <FormControl>
                <Input placeholder="https://app.example.com/rooms/..." {...field} disabled={isLoading} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? "Joining..." : "Join Room"}
        </Button>
      </form>
    </Form>
  );
}
