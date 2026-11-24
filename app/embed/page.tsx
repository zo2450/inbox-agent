import { InboxDemo } from "@/components/InboxDemo";
import { EMAIL_SETS } from "@/lib/emails";
import type { RecordedRun } from "@/lib/types";
import recorded from "@/data/recorded-run.json";

/** Compact view for embedding in another page (the portfolio About card). */
export default function Embed() {
  return <InboxDemo sets={EMAIL_SETS} run={recorded as RecordedRun} compact />;
}
