'use server';

/**
 * @fileOverview This file defines a Genkit flow for summarizing tasks. 
 * It takes a list of tasks as input and returns a concise summary of those tasks.
 *
 * - summarizeTasks - A function that summarizes tasks.
 * - SummarizeTasksInput - The input type for the summarizeTasks function.
 * - SummarizeTasksOutput - The return type for the summarizeTasks function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeTasksInputSchema = z.object({
  tasks: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
      priority: z.enum(['High', 'Medium', 'Low']),
      status: z.enum(['pending', 'done']),
    })
  ).describe('An array of tasks to summarize.'),
  timePeriod: z.enum(['daily', 'weekly']).describe('The time period for the task summary (daily or weekly).'),
});
export type SummarizeTasksInput = z.infer<typeof SummarizeTasksInputSchema>;

const SummarizeTasksOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the tasks.'),
});
export type SummarizeTasksOutput = z.infer<typeof SummarizeTasksOutputSchema>;

export async function summarizeTasks(input: SummarizeTasksInput): Promise<SummarizeTasksOutput> {
  return summarizeTasksFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeTasksPrompt',
  input: {schema: SummarizeTasksInputSchema},
  output: {schema: SummarizeTasksOutputSchema},
  prompt: `You are a helpful AI assistant that summarizes a list of tasks for a user.

  Summarize the following tasks for the given time period:

  Time Period: {{{timePeriod}}}

  Tasks:
  {{#each tasks}}
  - Title: {{this.title}}, Description: {{this.description}}, Priority: {{this.priority}}, Status: {{this.status}}
  {{/each}}

  Summary:`,
});

const summarizeTasksFlow = ai.defineFlow(
  {
    name: 'summarizeTasksFlow',
    inputSchema: SummarizeTasksInputSchema,
    outputSchema: SummarizeTasksOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
