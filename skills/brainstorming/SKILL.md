---
name: brainstorming
description: Draw out what the user actually wants, and why, before building anything non-trivial - features, components, behavior changes, or new projects in software or out of it. Asks one Socratic question at a time, plays understanding back in short chunks, lays out two or three approaches, and gets a short or full design doc approved before any code is written. Use when a request leaves something important unsettled; skip it for clear, fully specified tasks.
license: MIT
metadata:
  origin: ECC direct-port adaptation
---

# Brainstorming

Agents are good at building. They build what they believe the user wants,
and that belief is usually thinner than it feels. This skill finds out what
the user actually wants, and why, before anything gets built. When you
understand the why, you make the hundred unmentioned decisions the way the
user would have made them.

## When to Activate

- A request to build, add, or change something where a non-trivial part of the *what* or *why* is missing
- A new project, feature, component, or behavior change with more than one reasonable shape
- The user asks for brainstorming, a design discussion, or "help me figure out what I want"
- Non-software work with the same shape: a talk, a business plan, a renovation, an event

Do not activate when everything that matters is already in the request
("make the icon cornflower blue"). Do it, and say what you did. If the
request is clear but needs testable acceptance criteria, use
`intent-driven-development` instead.

## How It Works

Before implementing, in order:

1. Look before you ask
2. Hold the conversation: one question per message, playback as you go
3. Lay out the approaches in a message of their own; the user picks one
4. Size the work and write the design doc (short or full)
5. Get the user's approval of that doc
6. Hand off to planning (`/plan` or `blueprint`)

### 1. Look Before You Ask

In an existing project, or when the user gave you context (a spec, a plan,
a handoff, files they pointed at, earlier conversation), read it first, plus
the code or material it connects to. Keep reading until you can explain how
the relevant parts work today and what the change would touch. Never ask
what the project or their context already answers.

### 2. The First Message

Move the work forward with one of these:

- **They already said what they want** (a spec, a plan, a detailed request):
  about 200 words total. Echo the request in your own words - what, who it
  is for, and why, as far as they said. Add what you found that bears on it.
  If you found a constraint, conflict, or cheaper path that would change the
  request, say so plainly. End with one line inviting corrections, then one
  question: the open point whose answer would most change what gets built.
- **They haven't:** one open question, in their terms, about the biggest
  unsettled thing, plus why you're asking.

If they did not ask for brainstorming, add a one-line offer to just get
going instead ("Or if you'd rather I just dive in, say so."). If they take
it, this skill is done: state any significant how-it-gets-made choice
(platform, language, medium) in one line, then proceed normally.

### 3. The Conversation

Each message ends with **one question**: a single sentence with no list of
example answers hanging off it. Plain language, matched to the user's
vocabulary, no process jargon, and never quote this skill at them.

- **Get them describing.** Open questions first; their own words carry intent your options can't. Offer a short menu only when they're stuck. If they say "just guess", propose something concrete.
- **How it gets made.** Find out early which choices (platform, language, libraries, medium, materials) they want to make, which they hand to you, and what they already have. Build on what existing work already uses. Any choice you make goes in the design as *your call*, never as something they agreed to.
- **Make every question specific.** Build each one on their last answer or on something you found, so it surfaces a consequence or case they may have missed. A proposal they can correct, with your reason, often beats a question.
- **Offer recon.** When looking further would help (deeper in the codebase, their files, the web), offer to go look and say what you'd look for. They decide.
- **Show, don't tell.** For screens, layouts, flows, or visually different options, offer a mockup or throwaway prototype using whatever preview the harness provides. Offer it once, in its own message; if declined, stay in text.
- **Spike to feel things out.** A quick throwaway build is often the cheapest way to learn what they want. Spikes skip tests, plans, and review, stay labeled throwaway, and what they teach comes back into the conversation.

Ground to cover - territory, not a script; never read these out as questions:

- what kind of thing this is, and what makes it special
- why now, and what success looks like to them
- goals, non-goals, and anti-goals (what would make it a failure even if it technically works)
- prior art they've seen, loved, or hated
- current state: what exists, what they've tried
- the details they care about

### 4. Play It Back

As soon as you understand one part well enough to describe it, describe it
back in about 200-300 words, then return to questions about the next part.
Only what they said goes in as theirs; anything you filled in is labeled as
your proposal with a reason. End each chunk asking what's wrong or missing.

### 5. Lay Out the Approaches

Once you understand *what* they want, and before writing anything up, put
the ways of building it in a message of their own. Generate several real
alternatives, drop the weak ones (including any that work against the why or
that existing work rules out), and present the two or three that remain with
their trade-offs. Recommend one, say why, and ask which way they want to go.
If there is genuinely one sensible way, say so and explain why the others
don't fit.

### 6. Size the Work and Write the Design

| Size | Design doc |
|------|------------|
| Small change | Short: what you already covered together, a line or two per point |
| Project | Full written design a talented builder could plan from without asking the user |

Both cover: intent and the why; goals, non-goals, anti-goals; constraints;
**Approaches** (what was considered, trade-offs, which was picked and why);
the parts of the *how* the user decided; what's left to the builder.

If the work grows mid-task, stop, say so, and step up a size. If it is
really several independent projects, agree on an order and brainstorm them
one at a time.

**Where it goes:** in a software repo, `docs/specs/YYYY-MM-DD-<topic>-design.md`,
committed. Otherwise ask. The user's or project's conventions override this.

**Builder check (projects only):** before handing over a full design,
dispatch a fresh subagent with the prompt in
[references/builder-check-prompt.md](references/builder-check-prompt.md).
Sort what it raises into: *answered already* (put the answer in the doc),
*minor* (settle it yourself and mark it as your call), and *theirs* (only
the user can answer and it changes what gets built). Bring the "theirs" pile
to the user in one message, most important first - the only extra round of
questions. Without a subagent tool, read the doc as that builder yourself.

### The Gate

Nothing gets built until the user approves the design doc - the short one
for a small change, the full one for a project. Building includes product
code, scaffolding, installing dependencies, creating projects, and starting
an implementation workflow. Reading and exploring are fine.

Exceptions: the user opted out of the questions (the skill and the gate are
done), or a spike they agreed to (it stays throwaway; keeping it is a new
request that comes back through the gate).

After approval, the next step is the plan: `/plan` (or `blueprint` for
multi-session work).

## Examples

**Vague request - "a website for my bakery":**

```text
If it's mostly for people deciding whether to stop by, I'd lead with hours
and what's in the case today; taking orders online is a different site.
What do you want someone to do when they land on it?
```

**Specific, consequence-driven follow-up:**

```text
Voting closes before the meeting, and two members joined this month.
Does someone who joins mid-round get a vote?
```

**Detailed spec - first message shape:**

```text
[~150 words restating the request: what, who, why]
[What you found: how the relevant code works today, what this touches,
 and one constraint that changes the request]
Correct anything I've got wrong.
[One question about the most consequential open point]
```

## Anti-Patterns

| Thought | Reality |
|---------|---------|
| "I'll offer a menu of what they might want" | Options steer. Ask them to describe it first. |
| "I'll fill in sensible defaults" | Fine - say them out loud. A default they never heard is one they couldn't reject. |
| "I've answered their questions, so I'll write the doc" | Lay out the approaches first, in a message of their own. |
| "I should explain the process first" | Ask your question. The process shows itself. |
| "They said 'sounds good' to the idea" | Approval covers what you showed them. An unwritten design doc isn't approved. |
| "The spike works, I'll keep building on it" | Keeping it is a new request. Back through the gate. |
| Asking three questions in one message | One question per message. |

## Related Skills

- `intent-driven-development` - turn a clear request into testable acceptance criteria
- `blueprint` - multi-session construction plan once the design is approved
- `product-capability` - translate a PRD into an implementation-ready capability plan
- `tdd-workflow` - implementation after the plan
- `verification-before-completion` - evidence before claiming the build matches the design

## Attribution

Adapted from the `brainstorming` skill in [obra/superpowers](https://github.com/obra/superpowers)
(MIT License, copyright 2025 Jesse Vincent). This port drops the bundled
browser "visual companion" server and its telemetry, routes the hand-off to
ECC's `/plan` and `blueprint`, and moves design docs to `docs/specs/`.
