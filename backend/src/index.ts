// Vercel picks this file up automatically (zero-config Hono). It must import "hono" itself and
// default-export the app, so the app is created here and wired up in core.ts.
import { Hono } from "hono";
import { createApp } from "./core.js";

const app = createApp(new Hono({ strict: false }));

export default app;