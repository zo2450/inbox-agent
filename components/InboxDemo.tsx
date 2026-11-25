"use client";

import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import type { Email, Label, RecordedRun, Step, TriageResult } from "@/lib/types";
import styles from "./InboxDemo.module.css";

const LABELS: Record<Label, { text: string; className: string }> = {
  urgent: { text: "Urgent", className: styles.urgent },
  faq: { text: "Answered", className: styles.faq },
  needs_human: { text: "For a person", className: styles.human },
};
const COLUMNS: Label[] = ["urgent", "faq", "needs_human"];

interface EmailSet {
  id: string;
  label: string;
  emails: readonly Email[];
}

interface Props {
  sets: readonly EmailSet[];
  run: RecordedRun;
  /** Embedded in another page: tighter layout, details open in place. */
  compact?: boolean;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function stepText(step: Step) {
  if (step.type === "search") {
    const count = step.hits.length;
    return `search_faq("${step.query}") → ${count ? `${count} match${count === 1 ? "" : "es"}` : "no matches"}`;
  }
  return `file_email → ${LABELS[step.label].text}`;
}

/**
 * Replays a recorded agent run: emails leave the inbox one at a time and land in a column for
 * their label. Plays once by itself when scrolled into view.
 */
export function InboxDemo({ sets, run, compact = false }: Props) {
  const [setId, setSetId] = useState(sets[0].id);
  const [phase, setPhase] = useState<"idle" | "running" | "done">("idle");
  const [filed, setFiled] = useState<Record<string, TriageResult>>({});
  const [activity, setActivity] = useState<{ email: Email; step: Step | null } | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const runToken = useRef(0);
  const root = useRef<HTMLDivElement>(null);
  const autoPlayed = useRef(false);

  const emails = sets.find((set) => set.id === setId)?.emails ?? sets[0].emails;

  /** Applies a state change, animating cards between lists where the browser supports it. */
  const transition = (update: () => void) => {
    const doc = document as Document & { startViewTransition?: (callback: () => void) => unknown };
    if (doc.startViewTransition && !prefersReducedMotion()) doc.startViewTransition(() => flushSync(update));
    else update();
  };

  const play = async (list: readonly Email[]) => {
    const token = ++runToken.current;
    const reduced = prefersReducedMotion();
    const wait = (ms: number) => (reduced ? Promise.resolve() : sleep(ms));
    const cancelled = () => runToken.current !== token;

    setPhase("running");
    setFiled({});
    setSelectedId(null);
    for (const email of list) {
      const result = run.results.find((item) => item.emailId === email.id);
      if (!result) continue;
      setActivity({ email, step: null });
      await wait(500);
      for (const step of result.steps) {
        if (cancelled()) return;
        setActivity({ email, step });
        await wait(850);
      }
      if (cancelled()) return;
      transition(() => setFiled((current) => ({ ...current, [email.id]: result })));
      await wait(350);
    }
    if (cancelled()) return;
    setActivity(null);
    setPhase("done");
  };

  const chooseSet = (id: string) => {
    if (id === setId && phase !== "idle") return;
    setSetId(id);
    const next = sets.find((set) => set.id === id);
    if (next) void play(next.emails);
  };

  // Play once, by itself, the first time most of the demo is on screen.
  useEffect(() => {
    const element = root.current;
    if (!element || prefersReducedMotion()) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.intersectionRatio >= 0.6 && !autoPlayed.current) {
          autoPlayed.current = true;
          void play(sets[0].emails);
        }
      },
      { threshold: [0.6] },
    );
    observer.observe(element);
    return () => {
      observer.disconnect();
      runToken.current++;
    };
    // biome-ignore lint/correctness/useExhaustiveDependencies: runs once on mount
  }, []);

  const queue = emails.filter((email) => !filed[email.id]);
  const selected = selectedId ? filed[selectedId] : null;
  const selectedEmail = emails.find((email) => email.id === selectedId);
  const sortedCount = Object.keys(filed).length;

  let status: React.ReactNode;
  if (phase === "running" && activity) {
    status = activity.step ? (
      <code>{stepText(activity.step)}</code>
    ) : (
      <>Reading &ldquo;{activity.email.subject}&rdquo;…</>
    );
  } else if (phase === "done") {
    status = `Sorted ${sortedCount} email${sortedCount === 1 ? "" : "s"}. Tap one to see how it decided.`;
  } else {
    status = "Watch an agent read each email, check the FAQ and sort it.";
  }

  return (
    <div ref={root} className={`${styles.demo} ${compact ? styles.compact : ""}`}>
      <div className={styles.top}>
        <div>
          <p className={styles.title}>
            Shared inbox <span className={styles.demo}>Demo</span>
          </p>
          <p className={styles.sub}>Northside Community Pantry (a made-up food bank)</p>
        </div>
        <button type="button" className={styles.run} onClick={() => play(emails)} disabled={phase === "running"}>
          {phase === "idle" ? "Run agent" : phase === "running" ? "Running…" : "Replay"}
        </button>
      </div>

      <div className={styles.tabs} role="group" aria-label="Which emails to run">
        {sets.map((set) => (
          <button
            key={set.id}
            type="button"
            className={styles.tab}
            aria-pressed={set.id === setId}
            onClick={() => chooseSet(set.id)}
          >
            {set.label}
          </button>
        ))}
      </div>

      <p className={styles.status} aria-live="polite">
        {status}
      </p>

      {selected && selectedEmail ? (
        <Detail email={selectedEmail} result={selected} compact={compact} onBack={() => setSelectedId(null)} />
      ) : (
        <div className={styles.board}>
          {queue.length > 0 && (
            <ul className={styles.queue} aria-label="Inbox">
              {queue.map((email) => (
                <li
                  key={email.id}
                  className={styles.mail}
                  style={{ viewTransitionName: `mail-${email.id}` }}
                  data-active={activity?.email.id === email.id || undefined}
                >
                  <span className={styles.from}>{email.from}</span>
                  <span className={styles.subject}>{email.subject}</span>
                </li>
              ))}
            </ul>
          )}

          <div className={styles.columns}>
            {COLUMNS.map((label) => {
              const cards = emails.filter((email) => filed[email.id]?.label === label);
              return (
                <section key={label} className={styles.column} aria-label={LABELS[label].text}>
                  <p className={`${styles.columnTitle} ${LABELS[label].className}`}>
                    {LABELS[label].text}
                    <span>{cards.length}</span>
                  </p>
                  <ul>
                    {cards.map((email) => (
                      <li key={email.id}>
                        <button
                          type="button"
                          className={styles.card}
                          style={{ viewTransitionName: `mail-${email.id}` }}
                          disabled={phase === "running"}
                          onClick={() => setSelectedId(email.id)}
                        >
                          {email.subject}
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>
        </div>
      )}

      {run.source === "placeholder" && process.env.NODE_ENV !== "production" && (
        <p className={styles.devNote}>Dev note: placeholder data. Run `npm run record` to replay a real model run.</p>
      )}
    </div>
  );
}

/** How the agent handled one email: its steps, its decision, and the draft waiting for approval. */
function Detail({
  email,
  result,
  compact,
  onBack,
}: {
  email: Email;
  result: TriageResult;
  compact: boolean;
  onBack: () => void;
}) {
  const [approved, setApproved] = useState(false);
  const searches = result.steps.filter((step) => step.type === "search");

  return (
    <div className={styles.detail}>
      <button type="button" className={styles.back} onClick={onBack}>
        ← All emails
      </button>
      <p className={styles.detailSubject}>{email.subject}</p>
      <p className={styles.quote}>
        <span className={styles.quoteFrom}>{email.from}: </span>
        {email.body}
      </p>

      <ol className={styles.trace}>
        {searches.length === 0 && <li>Didn&apos;t need the FAQ for this one.</li>}
        {searches.map((step, index) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: steps never reorder
          <li key={index}>
            Searched the FAQ for <code>&ldquo;{step.query}&rdquo;</code>
            {step.hits.length > 0 ? (
              <span className={styles.hits}>
                {step.hits.map((hit) => (
                  <span key={hit} className={styles.hit}>
                    {hit}
                  </span>
                ))}
              </span>
            ) : (
              <span className={styles.noHits}> no matches</span>
            )}
          </li>
        ))}
        <li>
          Filed as <span className={`${styles.pill} ${LABELS[result.label].className}`}>{LABELS[result.label].text}</span>{" "}
          {result.reason}
        </li>
      </ol>

      {result.draftReply ? (
        <div className={styles.reply}>
          <p className={styles.replyHead}>Draft reply</p>
          <p className={styles.replyBody}>{result.draftReply}</p>
          {compact ? (
            <p className={styles.replyNote}>Nothing sends until a person approves it.</p>
          ) : (
            <div className={styles.replyActions}>
              <button
                type="button"
                className={styles.approve}
                aria-pressed={approved}
                onClick={() => setApproved(true)}
              >
                {approved ? "Approved" : "Approve and send"}
              </button>
              <span className={styles.replyNote}>
                {approved ? "Demo only: nothing was sent." : "Nothing sends until a person approves it."}
              </span>
            </div>
          )}
        </div>
      ) : (
        <p className={styles.noDraft}>No draft. A person writes this reply.</p>
      )}
    </div>
  );
}
