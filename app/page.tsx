import { InboxDemo } from "@/components/InboxDemo";
import { TryYourOwn } from "@/components/TryYourOwn";
import { MODEL } from "@/lib/agent";
import { EMAIL_SETS } from "@/lib/emails";
import type { RecordedRun } from "@/lib/types";
import recorded from "@/data/recorded-run.json";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export default function Home() {
  const live = Boolean(process.env.ANTHROPIC_API_KEY);
  const run = recorded as RecordedRun;

  return (
    <main className={styles.main}>
      <h1 className={styles.title}>Inbox agent</h1>
      <p className={styles.lede}>
        Small nonprofits run on a shared inbox and a few tired volunteers. This agent reads each email, searches the
        FAQ, labels it, and drafts a reply when the FAQ has the answer. Anything that needs judgment goes to a person.
      </p>

      <InboxDemo sets={EMAIL_SETS} run={run} />

      <section className={styles.section}>
        <h2>How it works</h2>
        <ol>
          <li>Each email goes to Claude ({MODEL}) with two tools: search_faq and file_email.</li>
          <li>The agent searches the FAQ as many times as it needs, then files the email exactly once.</li>
          <li>Drafts may only use facts from the FAQ. Complaints, partnerships and money questions go to a person.</li>
          <li>
            The demo above replays a saved run{run.recordedAt ? ` from ${run.recordedAt.slice(0, 10)}` : ""}, so it
            costs nothing to watch.
          </li>
        </ol>
      </section>

      {live && (
        <section className={styles.section}>
          <h2>Try your own email</h2>
          <p>This one runs live. Up to 5 emails an hour.</p>
          <TryYourOwn />
        </section>
      )}

      <p className={styles.footer}>
        Built by <a href="https://zohair-portfolio-eta.vercel.app">Zohair Syed</a>.{" "}
        <a href="https://github.com/zo2450/inbox-agent">Source on GitHub</a>
      </p>
    </main>
  );
}
