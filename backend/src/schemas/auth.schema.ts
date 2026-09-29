import { z } from 'zod';

export const registerSchema = z.object({
  name: z
    .string()
    .min(3, 'O nome deve ter pelo menos 3 caracteres.')
    .max(100, 'O nome não pode exceder 100 caracteres.'),
  email: z
    .string()
    .email('Formato de e-mail inválido.')
    .toLowerCase()
    .trim(),
  password: z
    .string()
    .min(6, 'A senha deve ter no mínimo 6 caracteres.')
    .max(100, 'A senha não pode exceder 100 caracteres.'),
});

export const loginSchema = z.object({
  email: z
    .string()
    .email('Formato de e-mail inválido.')
    .toLowerCase()
    .trim(),
  password: z
    .string()
    .min(1, 'A senha é obrigatória.'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
