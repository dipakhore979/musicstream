import { z } from "zod";

export const searchQuery = z.object({
  q: z.string({ required_error: "Enter something to search" }).trim().min(1, "Enter something to search").max(100),
  limit: z.coerce.number().int().min(1).max(20).default(8), // max results per type
});
