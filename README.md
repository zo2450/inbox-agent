# Inbox agent

A small Claude agent that triages a nonprofit's shared inbox. It reads each email, searches the FAQ, labels the email **Urgent**, **Answered** or **For a person**, and drafts a reply when the FAQ has the answer.

It's a miniature of a real project: during IBM's pro bono program I helped build an inbox agent for a charity. That version is private, so this one uses a made-up food bank, "Northside Community Pantry", with invented emails and FAQ.

<!-- TODO(Zohair): add a GIF of the demo here -->

## Why

Small nonprofits run on a shared inbox and a few volunteers. Most emails repeat the same five questions, and the urgent one gets buried under them. The agent's job:

- **Answer the repeats.** If the FAQ fully covers the question, draft a reply using only FAQ facts.
- **Surface the urgent ones.** Safety and food-at-risk emails jump the queue.
- **Know when to stop.** Complaints, partnerships and money questions go to a person, with no draft.

## How it works

```
email ──► Claude (claude-opus-5-5)
            │  search_faq("saturday volunteer shift")   ← as many times as it needs
            │  file_email(label, reason, draft_reply)    ← exactly once
            ▼
          label + one-line reason + optional draft
```

- [`lib/agent.ts`](lib/agent.ts): the agent. It uses the Anthropic SDK's tool runner with two tools.
- [`lib/faq.ts`](lib/faq.ts): the knowledge base and a simple keyword search.
- [`lib/emails.ts`](lib/emails.ts): six everyday emails covering each label, plus three "try to break it" emails: one that tries to give the agent new instructions, an angry email that is also urgent, and a question the FAQ only half answers.
- [`scripts/record.ts`](scripts/record.ts): runs the agent on the sample inbox and saves the result.
- [`components/InboxDemo.tsx`](components/InboxDemo.tsx): replays a saved run. Emails move from the inbox into Urgent, Answered and For a person columns. Open any email to see each FAQ search, the decision, and the draft waiting for a person to approve it.

The public demo **replays a saved run**, so watching it costs nothing and needs no API key. (Until the first `npm run record`, [`data/recorded-run.json`](data/recorded-run.json) holds a hand-written stand-in, marked `"source": "placeholder"`.) The "Try your own email" box on the home page appears only when the server has a key, and it is rate limited.

Guardrails: the email is passed as data inside `<email>` tags, and the prompt tells the agent to ignore instructions in it. Its only tools are reading the FAQ and filing a label, so a hostile email can at worst get a wrong label. Drafts are never sent automatically.

## Run it

```bash
npm install
npm run dev            # http://localhost:3003  (replay mode, no key needed)
```

Live mode:

```bash
cp .env.example .env.local   # then add your ANTHROPIC_API_KEY
npm run record               # re-runs the agent on the sample inbox, writes data/recorded-run.json
npm run dev                  # the home page now shows "Try your own email"
```

`/embed` is a compact view for iframes. It's what my portfolio shows.

## What I'd do next

- Measure it: label accuracy and draft quality on a set of real (anonymized) emails, not six samples.
- Send drafts to a review queue in the inbox tool the team already uses, instead of a web page.
- Replace keyword search with embeddings once the FAQ grows past a few dozen entries.

## License

MIT
