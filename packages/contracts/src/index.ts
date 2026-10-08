import { z } from "zod";
export const healthSchema = z.object({
  status: z.literal("ok"),
  service: z.enum(["news-draft-api", "news-draft-worker"]),
});
export const readinessSchema = z.object({
  status: z.enum(["ready", "not_ready"]),
  service: healthSchema.shape.service,
  dependencies: z.object({ database: z.enum(["up", "down"]), redis: z.enum(["up", "down"]) }),
});
const publicationSchema = z.object({
  id: z.uuid(),
  title: z.string(),
  sourceId: z.string(),
  url: z.url().nullable(),
  publishedAt: z.iso.datetime(),
});
export const publicationListSchema = z.object({ items: z.array(publicationSchema) });
export type Health = z.infer<typeof healthSchema>;
export type Readiness = z.infer<typeof readinessSchema>;
export type PublicationList = z.infer<typeof publicationListSchema>;
