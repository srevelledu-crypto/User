# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A static web app ("12PHY EA Tutor") that gives QCE Year 12 Physics students an
AI tutor scoped to the Unit 3 & 4 external assessment. It's a plain
HTML/CSS/JS frontend plus a single Vercel serverless function that proxies
chat requests to the Claude API, so the API key never reaches the browser.

## Commands

There is no build step, bundler, package manager install, linter, or test
suite in this repo (`package.json` has no `scripts`/`dependencies`).

Local development requires the Vercel CLI, because a plain static file
server won't execute `api/chat.js`:

```bash
npm install -g vercel
cp .env.example .env   # fill in ANTHROPIC_API_KEY
vercel dev
```

Then open the printed local URL. Required env var: `ANTHROPIC_API_KEY`.
Optional: `CLAUDE_MODEL` (default `claude-sonnet-5`), `CLASS_ACCESS_CODE`
(gates `/api/chat` behind a shared passphrase).

## Architecture

- `index.html` — page shell: sidebar (mode/topic selectors, formula sheet
  modal, access-code gate) + chat panel. Loads `marked` and `DOMPurify` from
  a CDN for rendering assistant markdown safely.
- `app.js` — all client-side logic, IIFE, no framework/build step. Owns the
  in-memory `history` array (conversation is **not** persisted — lost on
  reload, never sent anywhere but this tab and the API). Renders assistant
  messages through `marked` + `DOMPurify`; user messages are always rendered
  as `textContent` (never parsed as markdown/HTML). Sends the access code
  (from `localStorage`, key `phy_access_code`) as the `x-access-code` header
  on every `/api/chat` request.
- `api/chat.js` — the only backend code, a Vercel serverless function
  (`module.exports = async (req, res) => {...}`, not Express). Responsibilities:
  1. Validates the class access code (if `CLASS_ACCESS_CODE` is set) and the
     request body (`validateMessages`: role/content shape, `MAX_MESSAGES`,
     `MAX_MESSAGE_CHARS`).
  2. Builds the system prompt by combining `SYSTEM_PROMPT_BASE` with a
     per-`mode` block from `MODE_INSTRUCTIONS` (`concept` / `practice` /
     `general`) and an optional per-`topic` focus line.
  3. Calls `https://api.anthropic.com/v1/messages` directly via `fetch`
     (no Anthropic SDK dependency) and returns `{ reply: text }`.
- `data/content.json` — single source of truth for the topic list and
  formula sheet. Read by both `app.js` (renders the topic `<select>` and the
  formula sheet modal) and `api/chat.js` (`buildTopicReference` /
  `buildFormulaReference`, injected into the system prompt). **Edit this
  file, not the prompt strings, when changing subject content** — the
  frontend and the AI's knowledge scope must stay in sync automatically.
- `style.css` — all styling, no preprocessor.

## Key constraints to preserve when editing

- The API key must stay server-side only — never pass it to the client or
  log it.
- `api/chat.js` is the sole point of contact with the Anthropic API;
  `MODE_INSTRUCTIONS` keys must match the `<select id="mode-select">` values
  in `index.html` (`general`/`concept`/`practice`), since an unrecognized
  mode silently falls back to `general`.
- Conversation history is intentionally client-only/ephemeral — don't add
  server-side persistence without being asked.
