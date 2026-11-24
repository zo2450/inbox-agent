export type Label = "urgent" | "faq" | "needs_human";

export interface Email {
  id: string;
  from: string;
  subject: string;
  body: string;
}

/** One thing the agent did while handling an email, in order. */
export type Step =
  | { type: "search"; query: string; hits: string[] }
  | { type: "file"; label: Label; reason: string; draftReply: string | null };

export interface TriageResult {
  emailId: string;
  label: Label;
  reason: string;
  draftReply: string | null;
  steps: Step[];
}

export interface RecordedRun {
  /** "model" for a real recorded run; "placeholder" for the hand-written stand-in shipped before the first recording. */
  source: "model" | "placeholder";
  model: string | null;
  recordedAt: string | null;
  results: TriageResult[];
}
