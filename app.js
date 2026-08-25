(() => {
  const messagesEl = document.getElementById('messages');
  const formEl = document.getElementById('chat-form');
  const inputEl = document.getElementById('chat-input');
  const sendBtn = document.getElementById('send-btn');
  const modeSelect = document.getElementById('mode-select');
  const topicSelect = document.getElementById('topic-select');
  const resetBtn = document.getElementById('reset-btn');
  const formulaBtn = document.getElementById('formula-btn');
  const formulaModal = document.getElementById('formula-modal');
  const formulaClose = document.getElementById('formula-close');
  const formulaList = document.getElementById('formula-list');
  const accessGate = document.getElementById('access-gate');
  const accessInput = document.getElementById('access-code');
  const accessSave = document.getElementById('access-save');

  let history = [];
  let content = null;

  function getAccessCode() {
    return localStorage.getItem('phy_access_code') || '';
  }

  function renderBubble(el, text, role) {
    if (role === 'user' || !window.marked || !window.DOMPurify) {
      el.textContent = text;
      return;
    }
    const html = window.DOMPurify.sanitize(window.marked.parse(text));
    el.innerHTML = html;
  }

  function addMessage(role, text) {
    const wrapper = document.createElement('div');
    wrapper.className = `message ${role}`;
    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    renderBubble(bubble, text, role);
    wrapper.appendChild(bubble);
    messagesEl.appendChild(wrapper);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return bubble;
  }

  function addErrorMessage(text) {
    const wrapper = document.createElement('div');
    wrapper.className = 'message assistant';
    const bubble = document.createElement('div');
    bubble.className = 'bubble error';
    bubble.textContent = text;
    wrapper.appendChild(bubble);
    messagesEl.appendChild(wrapper);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  async function loadContent() {
    try {
      const res = await fetch('data/content.json');
      content = await res.json();
      content.topics.forEach((t) => {
        const opt = document.createElement('option');
        opt.value = t.topic;
        opt.textContent = `${t.unit} — ${t.topic}`;
        topicSelect.appendChild(opt);
      });
      renderFormulas();
    } catch (err) {
      console.error('Failed to load content.json', err);
    }
  }

  function renderFormulas() {
    if (!content) return;
    formulaList.innerHTML = '';
    const bySection = {};
    content.formulas.forEach((f) => {
      bySection[f.section] = bySection[f.section] || [];
      bySection[f.section].push(f);
    });
    Object.entries(bySection).forEach(([section, formulas]) => {
      const title = document.createElement('div');
      title.className = 'formula-section-title';
      title.textContent = section;
      formulaList.appendChild(title);
      formulas.forEach((f) => {
        const row = document.createElement('div');
        row.className = 'formula-row';
        row.innerHTML = `<span>${f.name}</span><span class="formula-expr"></span>`;
        row.querySelector('.formula-expr').textContent = f.formula;
        formulaList.appendChild(row);
      });
    });
  }

  async function sendMessage(text) {
    history.push({ role: 'user', content: text });
    addMessage('user', text);
    inputEl.value = '';
    sendBtn.disabled = true;

    const thinkingBubble = addMessage('assistant', 'Thinking…');

    try {
      const headers = { 'content-type': 'application/json' };
      const accessCode = getAccessCode();
      if (accessCode) headers['x-access-code'] = accessCode;

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          messages: history,
          mode: modeSelect.value,
          topic: topicSelect.value,
        }),
      });

      if (res.status === 401) {
        thinkingBubble.parentElement.remove();
        addErrorMessage('Access code missing or incorrect. Enter it in the sidebar.');
        accessGate.classList.remove('hidden');
        history.pop();
        return;
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        thinkingBubble.parentElement.remove();
        addErrorMessage(err.error || 'Something went wrong talking to the tutor. Try again.');
        history.pop();
        return;
      }

      const data = await res.json();
      renderBubble(thinkingBubble, data.reply, 'assistant');
      history.push({ role: 'assistant', content: data.reply });
    } catch (err) {
      console.error(err);
      thinkingBubble.parentElement.remove();
      addErrorMessage('Network error talking to the tutor. Check your connection and try again.');
      history.pop();
    } finally {
      sendBtn.disabled = false;
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }
  }

  formEl.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = inputEl.value.trim();
    if (!text) return;
    sendMessage(text);
  });

  inputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      formEl.requestSubmit();
    }
  });

  resetBtn.addEventListener('click', () => {
    history = [];
    messagesEl.innerHTML = '';
    addMessage('assistant', "New conversation started. What would you like to work on?");
  });

  formulaBtn.addEventListener('click', () => formulaModal.classList.remove('hidden'));
  formulaClose.addEventListener('click', () => formulaModal.classList.add('hidden'));
  formulaModal.addEventListener('click', (e) => {
    if (e.target === formulaModal) formulaModal.classList.add('hidden');
  });

  accessSave.addEventListener('click', () => {
    const code = accessInput.value.trim();
    if (code) {
      localStorage.setItem('phy_access_code', code);
      accessGate.classList.add('hidden');
    }
  });

  if (getAccessCode()) {
    accessInput.value = getAccessCode();
  }

  loadContent();
})();
