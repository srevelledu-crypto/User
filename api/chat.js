const fs = require('fs');
const path = require('path');

const content = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'data', 'content.json'), 'utf8')
);

const MODEL = process.env.CLAUDE_MODEL || 'claude-sonnet-5';
const MAX_MESSAGES = 40;
const MAX_MESSAGE_CHARS = 4000;

function buildTopicReference() {
  return content.topics
    .map((t) => `- ${t.unit} — ${t.topic}:\n  ${t.subtopics.join('\n  ')}`)
    .join('\n');
}

function buildFormulaReference() {
  return content.formulas
    .map((f) => `- [${f.section}] ${f.name}: ${f.formula}`)
    .join('\n');
}

const MODE_INSTRUCTIONS = {
  concept: `Mode: CONCEPT Q&A.
Explain concepts clearly using a Socratic approach where useful: check the student's current understanding, use analogies and worked examples, and confirm they can apply the idea before moving on. Keep explanations focused on what is examinable in the QCE Unit 3/4 external assessment (EA).`,
  practice: `Mode: PRACTICE EXAM.
Generate QCE-style exam questions (multiple choice, short response, or extended response) using authentic QCE command terms (e.g. Identify, Describe, Explain, Analyse, Justify, Evaluate). State the mark allocation for each question, in the style of the QCE Physics external assessment.
When the student submits an answer, mark it like a QCE Instrument-Specific Marking Guide (ISMG): award marks point-by-point for each valid piece of physics reasoning/calculation shown, state clearly what was missing for full marks, and give specific, actionable feedback on how to improve the response. Do not just give a total mark with no breakdown.`,
  general: `Mode: GENERAL.
Support the student with whatever mix of explanation and practice suits their question. If they ask a concept question, teach it. If they ask for practice, generate an exam-style question and mark their response using QCE marking-guide conventions when they answer.`,
};

const SYSTEM_PROMPT_BASE = `You are a supportive, knowledgeable physics tutor helping a Year 12 student (QCE — Queensland Certificate of Education, Australia) prepare for their Physics Unit 3 & 4 External Assessment (EA).

Scope: Only Unit 3 (Gravity and motion; Electromagnetism) and Unit 4 (Special relativity; Quantum theory) content, as examined in the QCE Physics external assessment. If asked about something outside this scope (other subjects, Unit 1/2 content, non-physics topics), briefly redirect the student back to Unit 3/4 revision.

Style:
- Be encouraging and clear, but do not pad answers — get to the physics.
- Use correct SI units and significant figures, and show working for any calculation.
- Use plain-text math notation the student can read easily (e.g. "v^2 = u^2 + 2as", "sqrt(x)", Greek letters spelled out like "theta" or "Δ" where natural).
- Reference the formulas below when relevant instead of inventing notation that differs from them.
- Never fabricate QCAA past-paper questions as if they were real; clearly say when a question is a practice question you generated in the QCE style, not an official QCAA question.
- This is a study-support tool, not an official QCAA resource — encourage the student to check the current QCAA-authorised formula and data booklet and syllabus for anything mark-critical.

Reference topic list (Units 3 & 4):
${buildTopicReference()}

Reference formula sheet (for your own consistency — quantities are in SI units unless stated):
${buildFormulaReference()}`;

function validateMessages(messages) {
  if (!Array.isArray(messages) || messages.length === 0) {
    return 'messages must be a non-empty array';
  }
  if (messages.length > MAX_MESSAGES) {
    return `too many messages (max ${MAX_MESSAGES})`;
  }
  for (const m of messages) {
    if (!m || (m.role !== 'user' && m.role !== 'assistant')) {
      return 'each message must have role "user" or "assistant"';
    }
    if (typeof m.content !== 'string' || m.content.length === 0) {
      return 'each message must have non-empty string content';
    }
    if (m.content.length > MAX_MESSAGE_CHARS) {
      return `message content too long (max ${MAX_MESSAGE_CHARS} characters)`;
    }
  }
  return null;
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const accessCode = process.env.CLASS_ACCESS_CODE;
  if (accessCode) {
    const provided = req.headers['x-access-code'];
    if (provided !== accessCode) {
      res.status(401).json({ error: 'Invalid or missing class access code' });
      return;
    }
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'Server is missing ANTHROPIC_API_KEY' });
    return;
  }

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      res.status(400).json({ error: 'Invalid JSON body' });
      return;
    }
  }

  const { messages, mode, topic } = body || {};
  const validationError = validateMessages(messages);
  if (validationError) {
    res.status(400).json({ error: validationError });
    return;
  }

  const modeInstruction = MODE_INSTRUCTIONS[mode] || MODE_INSTRUCTIONS.general;
  const topicInstruction = topic
    ? `\nThe student has currently selected this focus topic: "${topic}". Prioritise this topic unless the student's message clearly asks about something else.`
    : '';

  const system = `${SYSTEM_PROMPT_BASE}\n\n${modeInstruction}${topicInstruction}`;

  try {
    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1500,
        system,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
      }),
    });

    if (!anthropicRes.ok) {
      const errText = await anthropicRes.text();
      console.error('Anthropic API error:', anthropicRes.status, errText);
      res.status(502).json({ error: 'Upstream AI request failed' });
      return;
    }

    const data = await anthropicRes.json();
    const text = (data.content || [])
      .filter((block) => block.type === 'text')
      .map((block) => block.text)
      .join('\n');

    res.status(200).json({ reply: text });
  } catch (err) {
    console.error('Chat handler error:', err);
    res.status(500).json({ error: 'Unexpected server error' });
  }
};
