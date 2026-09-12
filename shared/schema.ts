import { z } from "zod";

export const userSchema = z.object({
  id: z.string(),
  username: z.string(),
  password: z.string(),
});

export const insertUserSchema = userSchema.omit({
  id: true,
});

export type User = z.infer<typeof userSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;

