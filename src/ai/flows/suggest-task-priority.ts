'use server';

/**
 * @fileOverview Suggests task priorities (High, Medium, Low) based on the task description and any deadlines.
 *
 * - suggestTaskPriority - A function that handles the task priority suggestion process.
 * - SuggestTaskPriorityInput - The input type for the suggestTaskPriority function.
 * - SuggestTaskPriorityOutput - The return type for the suggestTaskPriority function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestTaskPriorityInputSchema = z.object({
  taskDescription: z
    .string()
    .describe('The description of the task to be prioritized.'),
  deadline: z
    .string()
    .optional()
    .describe('The deadline for the task, if any.'),
});
export type SuggestTaskPriorityInput = z.infer<typeof SuggestTaskPriorityInputSchema>;

const SuggestTaskPriorityOutputSchema = z.object({
  priority: z
    .enum(['High', 'Medium', 'Low'])
    .describe('The suggested priority for the task.'),
  reason: z
    .string()
    .describe('The reasoning behind the suggested priority.'),
});
export type SuggestTaskPriorityOutput = z.infer<typeof SuggestTaskPriorityOutputSchema>;

export async function suggestTaskPriority(input: SuggestTaskPriorityInput): Promise<SuggestTaskPriorityOutput> {
  return suggestTaskPriorityFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestTaskPriorityPrompt',
  input: {schema: SuggestTaskPriorityInputSchema},
  output: {schema: SuggestTaskPriorityOutputSchema},
  prompt: `You are a helpful task prioritization assistant.  Given a task description and an optional deadline, you will suggest a priority (High, Medium, or Low) for the task and explain your reasoning.

Task Description: {{{taskDescription}}}
Deadline: {{{deadline}}}

Please provide the suggested priority and a brief explanation for your choice.

Format your response as a JSON object with 'priority' and 'reason' fields.  The 'priority' field MUST be one of "High", "Medium", or "Low".`,
});

const suggestTaskPriorityFlow = ai.defineFlow(
  {
    name: 'suggestTaskPriorityFlow',
    inputSchema: SuggestTaskPriorityInputSchema,
    outputSchema: SuggestTaskPriorityOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
