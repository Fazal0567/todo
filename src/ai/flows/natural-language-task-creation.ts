'use server';
/**
 * @fileOverview Flow for creating tasks from natural language input.
 *
 * - createTaskFromNaturalLanguage - A function that takes a natural language input and returns a task object.
 * - CreateTaskFromNaturalLanguageInput - The input type for the createTaskFromNaturalLanguage function.
 * - CreateTaskFromNaturalLanguageOutput - The return type for the createTaskFromNaturalLanguage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CreateTaskFromNaturalLanguageInputSchema = z.object({
  naturalLanguageInput: z.string().describe('A natural language description of the task.'),
});
export type CreateTaskFromNaturalLanguageInput = z.infer<typeof CreateTaskFromNaturalLanguageInputSchema>;

const CreateTaskFromNaturalLanguageOutputSchema = z.object({
  title: z.string().describe('The title of the task.'),
  description: z.string().optional().describe('A more detailed description of the task.'),
  priority: z.enum(['High', 'Medium', 'Low']).describe('The priority of the task.'),
  dueDate: z.string().optional().describe('The due date of the task in ISO format (YYYY-MM-DD).'),
});
export type CreateTaskFromNaturalLanguageOutput = z.infer<typeof CreateTaskFromNaturalLanguageOutputSchema>;

export async function createTaskFromNaturalLanguage(input: CreateTaskFromNaturalLanguageInput): Promise<CreateTaskFromNaturalLanguageOutput> {
  return createTaskFromNaturalLanguageFlow(input);
}

const prompt = ai.definePrompt({
  name: 'createTaskFromNaturalLanguagePrompt',
  input: {schema: CreateTaskFromNaturalLanguageInputSchema},
  output: {schema: CreateTaskFromNaturalLanguageOutputSchema},
  prompt: `You are a task management assistant. Your job is to extract task details from natural language input and return a structured JSON object.

  Input: {{{naturalLanguageInput}}}

  Output format: A JSON object with the following keys:
  - title: The title of the task.
  - description: A more detailed description of the task.  If not present in the input, leave this field blank.
  - priority: The priority of the task (High, Medium, or Low).
  - dueDate: The due date of the task in ISO format (YYYY-MM-DD). If not present in the input, leave this field blank.
  `,
});

const createTaskFromNaturalLanguageFlow = ai.defineFlow(
  {
    name: 'createTaskFromNaturalLanguageFlow',
    inputSchema: CreateTaskFromNaturalLanguageInputSchema,
    outputSchema: CreateTaskFromNaturalLanguageOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
