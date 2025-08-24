import { config } from 'dotenv';
config();

import '@/ai/flows/suggest-task-priority.ts';
import '@/ai/flows/summarize-tasks.ts';
import '@/ai/flows/natural-language-task-creation.ts';