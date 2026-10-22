// Local server: `npm run dev` (needs DATABASE_URL in your environment or a .env loaded by your shell).
import { serve } from "@hono/node-server";
import { createApp } from "./core.js";

const port = Number(process.env.PORT ?? 8000);
serve({ fetch: createApp().fetch, port }, () => console.log(`GuardPulse API on http://localhost:${port}`));
