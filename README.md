# 12PHY External Assessment Tutor

A small web app that gives your QCE Year 12 Physics class an AI tutor scoped
to the **Unit 3 & 4 external assessment** (Gravity and motion, Electromagnetism,
Special relativity, Quantum theory). Static frontend + a single serverless
function that proxies chat requests to the Claude API, so your API key never
reaches students' browsers.

## Features

- **Concept Q&A mode** — explains Unit 3/4 concepts, checks understanding,
  works through examples.
- **Practice exam mode** — generates QCE-style multiple choice / short
  response / extended response questions with mark allocations, and marks
  student answers point-by-point in the style of a QCE Instrument-Specific
  Marking Guide (ISMG).
- **Formula sheet** — a quick-reference panel of the formulas used across
  Unit 3/4, also fed to the AI so its notation stays consistent.
- **Optional class access code** — a shared passphrase so a leaked URL
  doesn't let random visitors burn through your API budget.

> This is a study-support tool built from general QCE Physics syllabus
> knowledge — it is **not** an official QCAA resource. Tell students to
> cross-check anything mark-critical against the current QCAA syllabus and
> the authorised formula and data booklet.

## Project structure

```
index.html          Main page
style.css            Styling
app.js               Chat UI logic (client-side)
api/chat.js          Serverless function that calls the Claude API
data/content.json    Topic list + formula sheet (used by both the UI and the AI's system prompt)
```

## Deploy (Vercel — recommended)

1. Push this repo to GitHub (already done if you're reading this from the repo).
2. Go to [vercel.com](https://vercel.com), "Add New Project", import this repo.
   No build step or framework preset is needed — Vercel will serve the static
   files and deploy `api/chat.js` as a serverless function automatically.
3. In the Vercel project's **Settings → Environment Variables**, add:
   - `ANTHROPIC_API_KEY` — your Anthropic API key. **Required.**
   - `CLAUDE_MODEL` — optional, defaults to `claude-sonnet-5`. Set to
     `claude-haiku-4-5-20251001` for lower cost at higher class volumes.
   - `CLASS_ACCESS_CODE` — optional shared passphrase for your class.
4. Deploy. Share the resulting URL with your class, plus the access code
   (if you set one) separately, e.g. verbally or via your LMS — not in the
   same channel as the link.

## Local development

You need the [Vercel CLI](https://vercel.com/docs/cli) to run the serverless
function locally (a plain static server won't execute `api/chat.js`):

```bash
npm install -g vercel
cp .env.example .env   # fill in ANTHROPIC_API_KEY
vercel dev
```

Then open the printed local URL.

## Cost & usage notes

- Every message round-trip is one Claude API call billed to your key. There's
  no built-in per-student rate limiting — the access code deters casual
  misuse, but a determined user with the code could still send many requests.
  For a single class this is normally a non-issue, but keep an eye on your
  Anthropic usage dashboard, especially in the lead-up to the exam when usage
  will spike.
- Conversation history lives only in the browser tab (not persisted server-side
  or shared between students).

## Customising the content

Edit `data/content.json` to adjust the topic list or formula sheet — both the
sidebar UI and the AI's system prompt (built in `api/chat.js`) read from this
one file, so there's no need to edit the prompt separately for content changes.

## Mole Explorer (chemistry simulator)

`mole-simulator/index.html` is a standalone, no-dependency interactive for
teaching the mole concept. Open it directly in a browser; it is independent
of the tutor app above. Teacher notes are at the bottom of the page.
