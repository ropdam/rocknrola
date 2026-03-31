import { Hono } from "hono";
const app = new Hono<{ Bindings: Env }>();

app.get("/api/", (c) => c.json({ name: "Cloudflare" }));

app.post("/api/verify-code", async (c) => {
	let body: { code?: string };
	try {
		body = await c.req.json();
	} catch {
		return c.json({ valid: false }, 400);
	}

	const input = (body.code ?? "").trim();
	const secret = c.env.CODE?.trim();

	// No secret configured: allow any non-empty input for quick local dev
	if (!secret) {
		return c.json({ valid: true });
	}

	if (!input) {
		return c.json({ valid: false }, 401);
	}

	const ok = input.toLowerCase() === secret.toLowerCase();
	return ok ? c.json({ valid: true }) : c.json({ valid: false }, 401);
});

export default app;
