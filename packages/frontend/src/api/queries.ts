import { healthSchema, publicationListSchema } from "@news-draft/contracts";
import { queryOptions } from "@tanstack/react-query";
import { requestJson } from "./request.js";

export const healthQueryOptions = queryOptions({
  queryKey: ["public", "health"],
  queryFn: ({ signal }) => requestJson("/api/health", healthSchema, signal),
});

export const publicationsQueryOptions = queryOptions({
  queryKey: ["public", "publications"],
  queryFn: ({ signal }) => requestJson("/api/publications", publicationListSchema, signal),
});
