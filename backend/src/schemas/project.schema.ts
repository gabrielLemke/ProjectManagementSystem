import { z } from 'zod';

export const createProjectSchema = z.object({
  name: z
    .string()
    .min(3, 'O nome do projeto deve ter no mínimo 3 caracteres.')
    .max(100, 'O nome do projeto deve ter no máximo 100 caracteres.')
    .trim(),
  description: z
    .string()
    .max(500, 'A descrição deve ter no máximo 500 caracteres.')
    .trim()
    .optional(),
});

export const updateProjectSchema = z.object({
  name: z
    .string()
    .min(3, 'O nome do projeto deve ter no mínimo 3 caracteres.')
    .max(100, 'O nome do projeto deve ter no máximo 100 caracteres.')
    .trim()
    .optional(),
  description: z
    .string()
    .max(500, 'A descrição deve ter no máximo 500 caracteres.')
    .trim()
    .optional(),
});

export const addMemberSchema = z.object({
  email: z
    .string()
    .email('Formato de e-mail inválido.')
    .toLowerCase()
    .trim(),
  role: z.enum(['MEMBER', 'VIEWER'] as const).default('MEMBER'),
});

export const projectParamsSchema = z.object({
  id: z.string().uuid('ID do projeto deve ser um UUID válido.'),
});

export const projectMemberParamsSchema = z.object({
  id: z.string().uuid('ID do projeto deve ser um UUID válido.'),
  memberId: z.string().uuid('ID do membro deve ser um UUID válido.'),
});

export const listProjectsQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(10),
  search: z.string().trim().optional(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type AddMemberInput = z.infer<typeof addMemberSchema>;
export type ListProjectsQuery = z.infer<typeof listProjectsQuerySchema>;
