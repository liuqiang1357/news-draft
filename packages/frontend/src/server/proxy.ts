const allowedPaths = new Set(["health", "health/ready", "publications"]);
export async function forwardApi(
  path: readonly string[],
  origin: string | undefined,
  signal: AbortSignal,
): Promise<Response> {
  if (!allowedPaths.has(path.join("/")))
    return Response.json({ error: "NOT_FOUND" }, { status: 404 });
  try {
    const base = new URL(origin ?? "http://127.0.0.1:3001");
    if (
      !["http:", "https:"].includes(base.protocol) ||
      base.pathname !== "/" ||
      base.username ||
      base.password ||
      base.search ||
      base.hash
    )
      throw new Error("Invalid API_ORIGIN");
    const response = await fetch(new URL(`/${path.join("/")}`, base), {
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.any([signal, AbortSignal.timeout(5000)]),
    });
    return new Response(response.body, {
      status: response.status,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
  } catch {
    return Response.json({ error: "API_UNAVAILABLE" }, { status: 502 });
  }
}
