/**
 * Runs the agent on every sample email and saves the result to data/recorded-run.json,
 * which the demo replays. Needs ANTHROPIC_API_KEY (in the environment or .env.local).
 *
 *   npm run record
 */
import { existsSync, writeFileSync } from "node:fs";
import Anthropic from "@anthropic-ai/sdk";
import { MODEL, triageEmail } from "../lib/agent";
import { ALL_EMAILS } from "../lib/emails";
import type { RecordedRun } from "../lib/types";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");

const client = new Anthropic();
const results = [];

for (const email of ALL_EMAILS) {
  process.stdout.write(`Triaging "${email.subject}"... `);
  const result = await triageEmail(email, client);
  console.log(result.label);
  results.push(result);
}

const run: RecordedRun = { source: "model", model: MODEL, recordedAt: new Date().toISOString(), results };
writeFileSync("data/recorded-run.json", `${JSON.stringify(run, null, 2)}\n`);
console.log(`Saved ${results.length} results to data/recorded-run.json`);
