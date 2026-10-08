import { loadEnv } from "@news-draft/backend";
import { createApiApplication } from "./api-application.js";
const env = loadEnv(new URL("../.env.local", import.meta.url));
const app = await createApiApplication(env);
await app.listen({ host: env.HOST, port: env.PORT });
