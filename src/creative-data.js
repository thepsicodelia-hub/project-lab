import { z } from "zod";
import { safeImage } from "./proposal-data.js";
const text = z.string().max(500).default("");
const prose = z.string().max(50000).default("");
const image = z
  .string()
  .refine((v) => !v || !!safeImage(v), "Imagem inválida")
  .default("");
export const creativeFields = {
  scripts: z
    .array(
      z.object({
        id: z.string().uuid(),
        name: z.string().trim().min(1).max(150),
        projectId: text,
        content: prose,
      }),
    )
    .max(100)
    .default([]),
  callsheets: z
    .array(
      z.object({
        id: z.string().uuid(),
        name: z.string().trim().min(1).max(150),
        projectId: text,
        date: text,
        time: text,
        location: text,
        timeline: prose,
        crew: prose,
        notes: prose,
      }),
    )
    .max(100)
    .default([]),
  moodboard: z
    .array(z.object({ id: z.string().uuid(), image, caption: text }))
    .max(20)
    .default([]),
  storyFrames: z
    .array(z.object({ id: z.string().uuid(), shot: text, scene: prose, image }))
    .max(40)
    .default([]),
};
