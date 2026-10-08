import { loadEnv } from "@news-draft/backend";
import { createWorkerApplication } from "./worker-application.js";
const env = loadEnv(new URL("../.env.local", import.meta.url));
await createWorkerApplication(env);
