const screens = document.querySelectorAll('[data-screen-view]');
const historyStores = { items: [] };
let selectedAnalysis = 'message';
let authToken = localStorage.getItem('alertiq_token');

const analysisCopy = {
  message: ['Check a suspicious message', 'Paste an SMS, WhatsApp message, or other text.'],
  email: ['Review a suspicious email', 'Paste the email content and include its sender or link if available.'],
  url: ['Scan a suspicious URL', 'Enter the link you want AlertIQ to review.'],
  image: ['Review a screenshot', 'Describe the important text from the screenshot below.'],
  job: ['Check a job or internship offer', 'Paste the offer, recruiter message, or payment request.'],
  payment: ['Review a payment request', 'Paste the UPI, bank, wallet, or payment-related message.'],
};

function showScreen(name) {
  screens.forEach((screen) => screen.classList.toggle('active', screen.dataset.screenView === name));
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderHistory(targetId, items) {
  const target = document.getElementById(targetId);
  if (!items.length) {
    target.innerHTML = '<p class="muted">No analyses yet.</p>';
    return;
  }
  target.innerHTML = items.map((item) => `
    <article class="history-item">
      <div><strong>${displayRisk(item.risk_level)}</strong><span>${item.source || 'unknown'}</span></div>
      <p>${item.summary}</p><small>Risk score: ${item.risk_score}/100</small>
    </article>
  `).join('');
}

function displayRisk(level) {
  if (level === 'critical') return 'SCAM';
  if (level === 'medium') return 'SUSPICIOUS';
  return 'SAFE';
}

function updateStats() {
  const total = historyStores.items.length;
  const threats = historyStores.items.filter((item) => item.is_suspicious).length;
  document.getElementById('total-scans').textContent = total;
  document.getElementById('threats-found').textContent = threats;
  document.getElementById('safe-inputs').textContent = total - threats;
}

async function loadHistory() {
  if (!authToken) return;
  const response = await fetch('/api/v1/history', {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  if (response.status === 401) {
    authToken = null;
    localStorage.removeItem('alertiq_token');
    showScreen('auth');
  }
  if (!response.ok) throw new Error('History could not be loaded');
  historyStores.items = await response.json();
  renderHistory('dashboard-history', historyStores.items.slice(0, 3));
  renderHistory('full-history', historyStores.items);
  updateStats();
}

document.querySelectorAll('[data-screen]').forEach((button) => {
  button.addEventListener('click', () => showScreen(button.dataset.screen));
});

document.querySelector('[data-logout]').addEventListener('click', () => {
  authToken = null;
  localStorage.removeItem('alertiq_token');
  showScreen('landing');
});

document.querySelectorAll('[data-auth-mode]').forEach((button) => {
  button.addEventListener('click', () => {
    document.querySelectorAll('[data-auth-mode]').forEach((tab) => tab.classList.toggle('active', tab === button));
    document.getElementById('login-form').classList.toggle('hidden', button.dataset.authMode !== 'login');
    document.getElementById('register-form').classList.toggle('hidden', button.dataset.authMode !== 'register');
  });
});

document.querySelectorAll('[data-analysis]').forEach((button) => {
  button.addEventListener('click', () => {
    selectedAnalysis = button.dataset.analysis;
    document.getElementById('analysis-title').textContent = analysisCopy[selectedAnalysis][0];
    document.getElementById('analysis-description').textContent = analysisCopy[selectedAnalysis][1];
    document.getElementById('image-note').classList.toggle('hidden', selectedAnalysis !== 'image');
    document.getElementById('image-upload-field').classList.toggle('hidden', selectedAnalysis !== 'image');
    showScreen('analyze');
  });
});

document.getElementById('login-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const inputs = event.currentTarget.querySelectorAll('input');
  try {
    const response = await fetch('/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: inputs[0].value, password: inputs[1].value }),
    });
    if (!response.ok) throw new Error('Login failed');
    const data = await response.json();
    authToken = data.token;
    localStorage.setItem('alertiq_token', authToken);
    showScreen('dashboard');
    await loadHistory();
  } catch (error) {
    window.alert('Login failed. Check your email and password.');
  }
});

document.getElementById('register-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const inputs = event.currentTarget.querySelectorAll('input');
    try {
      const response = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: inputs[0].value, email: inputs[1].value, password: inputs[2].value }),
      });
      if (!response.ok) throw new Error('Registration failed');
      const data = await response.json();
      authToken = data.token;
      localStorage.setItem('alertiq_token', authToken);
      showScreen('dashboard');
      await loadHistory();
    } catch (error) {
      window.alert('Account could not be created. The email may already be registered.');
    }
  });

document.getElementById('analysis-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const button = event.currentTarget.querySelector('button[type="submit"]');
  const content = document.getElementById('analysis-content').value;
  const image = document.getElementById('analysis-image').files[0];
  const result = document.getElementById('analysis-result');
  button.disabled = true;
  button.textContent = 'Analyzing...';
  try {
    let response;
    if (selectedAnalysis === 'image') {
      const body = new FormData();
      if (!image) throw new Error('Please select an image.');
      body.append('image', image);
      body.append('description', content);
      response = await fetch('/api/v1/analyze-image', {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken}` },
        body,
      });
    } else {
      response = await fetch('/api/v1/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({
          message: content,
          url: document.getElementById('analysis-url').value,
          source: document.getElementById('analysis-source').value,
        }),
      });
    }
    if (!response.ok) throw new Error('Analysis failed');
    const data = await response.json();
    if (data.status === 'needs_text') {
      throw new Error(data.message);
    }
    result.className = `card result-card result-${data.risk_level}`;
    result.innerHTML = `
      <p class="eyebrow">Analysis complete</p>
      <div class="score-row"><span class="risk-label">${displayRisk(data.risk_level)}</span><strong>${data.risk_score}<small>/100</small></strong></div>
      <h2>${data.is_suspicious ? 'Suspicious content detected' : 'No major threat detected'}</h2>
      <p>${data.summary}</p>
      <h3>Why?</h3><ul>${data.indicators.map((item) => `<li>${item}</li>`).join('')}</ul>
      <h3>What to do next</h3><ul>${data.recommendations.map((item) => `<li>${item}</li>`).join('')}</ul>
    `;
    await loadHistory();
  } catch (error) {
    result.className = 'card result-card result-error';
    result.innerHTML = '<h2>Analysis unavailable</h2><p>Please check the server connection and try again.</p>';
  } finally {
    button.disabled = false;
    button.textContent = 'Analyze with AlertIQ';
  }
});

if (authToken) {
  showScreen('dashboard');
  loadHistory().catch(() => {});
}
