import Anthropic from "@anthropic-ai/sdk";
import { triageEmail } from "@/lib/agent";

/** Live mode: triage one email the visitor wrote. Off unless ANTHROPIC_API_KEY is set. */

export const maxDuration = 60;

const MAX_CHARS = 1500;
const LIMIT_PER_HOUR = 5;
// Best-effort, per server instance. Put a real limiter (e.g. Vercel KV) in front before sharing widely.
const hits = new Map<string, number[]>();

function rateLimited(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((time) => now - time < 3_600_000);
  if (recent.length >= LIMIT_PER_HOUR) return true;
  hits.set(ip, [...recent, now]);
  return false;
}

export async function POST(request: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: "Live mode is off on this deployment." }, { status: 503 });
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (rateLimited(ip)) {
    return Response.json({ error: "That's the limit for now. Try again in an hour." }, { status: 429 });
  }

  const input = (await request.json().catch(() => null)) as { subject?: unknown; body?: unknown } | null;
  const subject = typeof input?.subject === "string" ? input.subject.trim().slice(0, 120) : "";
  const body = typeof input?.body === "string" ? input.body.trim() : "";
  if (!body) return Response.json({ error: "Write an email first." }, { status: 400 });
  if (body.length > MAX_CHARS) {
    return Response.json({ error: `Keep it under ${MAX_CHARS} characters.` }, { status: 400 });
  }

  try {
    const result = await triageEmail({ id: "visitor", from: "Website visitor", subject: subject || "(no subject)", body });
    return Response.json(result);
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) {
      return Response.json({ error: "The agent is busy. Try again in a minute." }, { status: 429 });
    }
    console.error(error);
    return Response.json({ error: "The agent couldn't finish that one." }, { status: 500 });
  }
}
