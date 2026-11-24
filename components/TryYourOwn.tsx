"use client";

import { useState } from "react";
import type { TriageResult } from "@/lib/types";
import styles from "./TryYourOwn.module.css";

const LABEL_TEXT = { urgent: "Urgent", faq: "Answered", needs_human: "For a person" } as const;

/** Live mode: sends one visitor-written email to /api/triage. Only rendered when the server has a key. */
export function TryYourOwn() {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [status, setStatus] = useState<"idle" | "working" | "error">("idle");
  const [error, setError] = useState("");
  const [result, setResult] = useState<TriageResult | null>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setStatus("working");
    setResult(null);
    const response = await fetch("/api/triage", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ subject, body }),
    }).catch(() => null);
    const data = response ? await response.json().catch(() => null) : null;
    if (!response?.ok || !data) {
      setStatus("error");
      setError(data?.error ?? "Something went wrong.");
      return;
    }
    setResult(data as TriageResult);
    setStatus("idle");
  };

  return (
    <form className={styles.form} onSubmit={submit}>
      <label className={styles.field}>
        Subject
        <input value={subject} onChange={(event) => setSubject(event.target.value)} maxLength={120} />
      </label>
      <label className={styles.field}>
        Email
        <textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          maxLength={1500}
          rows={5}
          placeholder="Hi, do you take canned soup that's a month past its best-before date?"
          required
        />
      </label>
      <button type="submit" className={styles.submit} disabled={status === "working"}>
        {status === "working" ? "Agent is working…" : "Send to the agent"}
      </button>
      {status === "error" && <p className={styles.error}>{error}</p>}
      {result && (
        <div className={styles.result}>
          <p>
            <strong>{LABEL_TEXT[result.label]}.</strong> {result.reason}
          </p>
          <ol>
            {result.steps.map((step, index) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: steps never reorder
              <li key={index}>
                {step.type === "search"
                  ? `Searched the FAQ for "${step.query}" (${step.hits.length} matches)`
                  : `Filed it as ${LABEL_TEXT[step.label]}`}
              </li>
            ))}
          </ol>
          {result.draftReply && (
            <p className={styles.draft}>
              <strong>Draft reply: </strong>
              {result.draftReply}
            </p>
          )}
        </div>
      )}
    </form>
  );
}
