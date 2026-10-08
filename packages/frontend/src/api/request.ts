export async function requestJson<T>(
  path: string,
  schema: { parse(value: unknown): T },
  signal?: AbortSignal,
): Promise<T> {
  const response = await fetch(path, { cache: "no-store", signal });
  if (!response.ok) throw new Error(`API request failed (${response.status})`);
  return schema.parse(await response.json());
}
