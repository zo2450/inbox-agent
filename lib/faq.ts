/**
 * Knowledge base for a fictional food bank, "Northside Community Pantry".
 * The agent may only answer questions from these entries.
 */
export const FAQ = [
  {
    question: "When are volunteer shifts?",
    answer:
      "Volunteer shifts run Tuesday and Thursday 4-7pm and Saturday 9am-12pm. Sign up at northsidepantry.example/volunteer. Saturday sign-ups close Friday at noon.",
  },
  {
    question: "Can I bring a friend or a group to volunteer?",
    answer:
      "Yes. Groups of up to 6 can sign up together on the volunteer page. Larger groups should email the coordinator.",
  },
  {
    question: "What are your opening hours?",
    answer: "Food pickup is Monday, Wednesday and Friday 10am-2pm, and Saturday 9am-12pm.",
  },
  {
    question: "Are you open on holidays?",
    answer: "We close on statutory holidays. The pickup day before a holiday runs one hour longer.",
  },
  {
    question: "Do I get a receipt for my donation?",
    answer:
      "Yes. Tax receipts are emailed within 14 days for donations of $20 or more. If yours hasn't arrived after 14 days, reply with the date and amount.",
  },
  {
    question: "What food can I donate?",
    answer:
      "Unopened, non-perishable food that is not past its best-before date. We can't accept home-cooked food or opened packages.",
  },
  {
    question: "Who can get food from the pantry?",
    answer: "Anyone living in the Northside area. Bring any ID with your address on your first visit.",
  },
  {
    question: "Where are you located?",
    answer: "120 Example Street, side entrance. Free parking behind the building.",
  },
] as const;

const STOPWORDS = new Set(
  "a an and are as at be but by can do for from get have how i if in is it me my of on or our so that the this to we what when where who will with you your food pantry".split(
    " ",
  ),
);

const words = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2 && !STOPWORDS.has(word))
    // crude stemming so "receipts" matches "receipt" and "volunteering" matches "volunteer"
    .map((word) => word.replace(/(ing|s)$/, ""));

/** Keyword search over the FAQ. Returns up to 3 entries, best match first. */
export function searchFaq(query: string) {
  const queryWords = new Set(words(query));
  return FAQ.map((entry) => ({
    entry,
    score: words(`${entry.question} ${entry.answer}`).filter((word) => queryWords.has(word)).length,
  }))
    .filter((hit) => hit.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((hit) => hit.entry);
}
