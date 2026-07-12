import type { z } from "zod";
import type {
    createProjectSchema,
    projectSchema,
    projectStatusSchema,
    updateProjectSchema,
} from "./schemas";

export type ProjectStatus = z.infer<typeof projectStatusSchema>;
export type Project = z.infer<typeof projectSchema>;
export type CreateProject = z.infer<typeof createProjectSchema>;
export type UpdateProject = z.infer<typeof updateProjectSchema>;
