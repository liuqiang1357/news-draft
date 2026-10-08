import { forwardApi } from "@news-draft/frontend/server/proxy";
export const dynamic = "force-dynamic";
export async function GET(request: Request, context: { params: Promise<{ path: string[] }> }) {
  return forwardApi((await context.params).path, process.env.API_ORIGIN, request.signal);
}
