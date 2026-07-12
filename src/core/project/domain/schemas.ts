import { z } from "zod";

export const projectStatusSchema = z.enum(["active", "archived"]);

/** Wire shape: timestamps are ISO strings (mapped from Date at the repo boundary). */
export const projectSchema = z.object({
    id: z.string(),
    userId: z.string(),
    name: z.string().min(1),
    description: z.string().nullable(),
    status: projectStatusSchema,
    createdAt: z.string(),
    updatedAt: z.string(),
});

export const createProjectSchema = z.object({
    name: z.string().min(1).max(200),
    description: z.string().max(2000).optional(),
    status: projectStatusSchema.optional(),
});

export const updateProjectSchema = z.object({
    name: z.string().min(1).max(200).optional(),
    description: z.string().max(2000).nullable().optional(),
    status: projectStatusSchema.optional(),
});
