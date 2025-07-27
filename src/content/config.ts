import { defineCollection, z } from 'astro:content';

const notepadsCollection = defineCollection({
  type: 'data',
  schema: z.object({
    id: z.string(),
    title: z.string(),
    description: z.string(),
    filePath: z.string(),
    readmeFile: z.string().optional(),
    tags: z.array(z.string()),
    author: z.string(),
    lastUpdated: z.string(),
    dependencies: z.array(z.string()),
    annotationsFile: z.string().nullable().optional(),
  }),
});

const scriptsCollection = defineCollection({
  type: 'data',
  schema: z.object({
    type: z.enum(['python', 'markdown', 'json', 'readme']),
    title: z.string(),
    description: z.string(),
    filePath: z.string(),
    url: z.string(),
    content: z.string().optional(),
    processed: z.boolean().optional(),
  }),
});

export const collections = {
  'notepads': notepadsCollection,
  'scripts': scriptsCollection,
};