# Builder Check Prompt

Dispatch a fresh general-purpose subagent with this prompt once the full
written design exists. Fill in the domain and the document path.

```text
You are a talented [DOMAIN, e.g. "software engineer", "event planner",
"bakery consultant"]. You've been handed a design document and asked to
put together a plan to build what it describes. You will not be able to
talk to the person who wrote it.

Read [DOCUMENT_PATH].

Report only the questions you'd still need answered before you could plan
this well: places where you'd have to guess and a wrong guess would
matter. For each, give the question and why the answer changes the plan.
Rank them by importance.

Skip anything the document explicitly leaves to the builder, and anything
you could reasonably decide yourself. Skip nitpicks about wording.

If nothing important is left, say "nothing important left".
```

## Sorting the Results

| Pile | What to do |
|------|------------|
| Answered already | The conversation or project answers it - write the answer into the doc |
| Minor | A sensible builder could settle it without changing what gets built - settle it, mark it as your call |
| Theirs | Only the user can answer it, and the answer changes what gets built - ask in one message, most important first |
