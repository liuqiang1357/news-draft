import { copyFileSync, existsSync } from "node:fs";
for (const app of ["api", "worker", "web"]) {
  const base = new URL(`../apps/${app}/`, import.meta.url);
  const target = new URL(".env.local", base);
  if (!existsSync(target)) {
    copyFileSync(new URL(".env.example", base), target);
    console.log(`Created apps/${app}/.env.local`);
  }
}
console.log("Existing local configuration was preserved.");
