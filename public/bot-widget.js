// public/bot-widget.js
// Widget flotante del bot. Se mete con: <script src="/bot-widget.js" data-code="ABC123"></script>
// El widget arma su propio DOM, fetcha las FAQs del evento, y se renderiza solo en una esquina.

(function () {
  'use strict';

  // ============ CONFIG ============
  // Buscamos el script tag. Hay dos formas: currentScript (carga sincrónica)
  // o data-code en un script previo. Soportamos ambas.
  let scriptEl = document.currentScript;
  if (!scriptEl || !scriptEl.dataset?.code) {
    // Buscar el último script con data-code
    const candidates = document.querySelectorAll('script[data-code]');
    scriptEl = candidates[candidates.length - 1] || scriptEl;
  }
  const code = (scriptEl?.dataset?.code || '').toUpperCase();
  if (!code) {
    console.warn('[bot-widget] Falta data-code en el script tag');
    return;
  }

  // ============ ESTILOS ============
  const css = `
    /* Botón flotante */
    .bw-launcher {
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: linear-gradient(135deg, #e63946 0%, #e63946 50%, #2c7be5 50%, #2c7be5 100%);
      border: 2px solid #ffd60a;
      cursor: pointer;
      box-shadow: 0 8px 30px rgba(0,0,0,0.5), 0 0 0 0 rgba(255, 214, 10, 0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 28px;
      z-index: 9999;
      transition: transform 0.2s, box-shadow 0.2s;
      animation: bw-pulse 2.4s ease-in-out infinite;
    }
    .bw-launcher:hover {
      transform: scale(1.08) rotate(-3deg);
    }
    .bw-launcher.bw-open {
      animation: none;
      background: #1a1b26;
      border-color: #2a2b3a;
    }
    @keyframes bw-pulse {
      0%, 100% { box-shadow: 0 8px 30px rgba(0,0,0,0.5), 0 0 0 0 rgba(255, 214, 10, 0.4); }
      50% { box-shadow: 0 8px 30px rgba(0,0,0,0.5), 0 0 0 12px rgba(255, 214, 10, 0); }
    }
    /* Burbuja de notificación */
    .bw-badge {
      position: absolute;
      top: -4px;
      right: -4px;
      background: #ef476f;
      color: white;
      width: 22px;
      height: 22px;
      border-radius: 50%;
      font-size: 12px;
      font-weight: 700;
      font-family: 'JetBrains Mono', monospace;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2px solid #07070a;
      animation: bw-badge-pop 0.5s ease;
    }
    @keyframes bw-badge-pop {
      from { transform: scale(0); }
      to { transform: scale(1); }
    }
    .bw-launcher.bw-open .bw-badge { display: none; }
    /* Tooltip al lado del launcher (solo en estado cerrado) */
    .bw-tooltip {
      position: absolute;
      right: 70px;
      top: 50%;
      transform: translateY(-50%) translateX(8px);
      background: #1a1b26;
      color: #f4f4f8;
      border: 1px solid #2a2b3a;
      padding: 8px 14px;
      border-radius: 18px;
      white-space: nowrap;
      font-family: 'Inter', system-ui, sans-serif;
      font-size: 13px;
      opacity: 0;
      pointer-events: none;
      transition: all 0.3s;
      box-shadow: 0 4px 20px rgba(0,0,0,0.4);
    }
    .bw-launcher:not(.bw-open):hover .bw-tooltip,
    .bw-launcher.bw-tooltip-show .bw-tooltip {
      opacity: 1;
      transform: translateY(-50%) translateX(0);
    }
    .bw-tooltip::after {
      content: '';
      position: absolute;
      right: -6px;
      top: 50%;
      transform: translateY(-50%);
      width: 0; height: 0;
      border-left: 6px solid #1a1b26;
      border-top: 6px solid transparent;
      border-bottom: 6px solid transparent;
    }

    /* Ventana del chat */
    .bw-window {
      position: fixed;
      bottom: 95px;
      right: 20px;
      width: 380px;
      height: 580px;
      max-height: calc(100vh - 130px);
      background: #07070a;
      border: 1px solid #2a2b3a;
      border-radius: 16px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      box-shadow: 0 20px 60px rgba(0,0,0,0.6);
      z-index: 9998;
      opacity: 0;
      transform: translateY(20px) scale(0.95);
      transform-origin: bottom right;
      pointer-events: none;
      transition: opacity 0.25s, transform 0.25s cubic-bezier(0.22, 1, 0.36, 1);
      font-family: 'Inter', system-ui, sans-serif;
    }
    .bw-window.bw-show {
      opacity: 1;
      transform: translateY(0) scale(1);
      pointer-events: auto;
    }
    @media (max-width: 480px) {
      .bw-window {
        bottom: 0; right: 0; left: 0;
        width: 100%;
        height: 100%;
        max-height: 100vh;
        border-radius: 0;
      }
      .bw-launcher {
        bottom: 16px; right: 16px;
        width: 56px; height: 56px;
      }
    }

    .bw-header {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 14px 14px;
      background: #11121a;
      border-bottom: 1px solid #2a2b3a;
    }
    .bw-avatar {
      width: 40px; height: 40px;
      border-radius: 50%;
      background: linear-gradient(135deg, #e63946 0%, #e63946 50%, #2c7be5 50%, #2c7be5 100%);
      display: flex; align-items: center; justify-content: center;
      font-size: 20px;
      border: 2px solid #ffd60a;
      flex-shrink: 0;
    }
    .bw-info { flex: 1; min-width: 0; color: #f4f4f8; }
    .bw-name {
      font-family: 'Bebas Neue', sans-serif;
      font-size: 18px;
      letter-spacing: 2px;
      line-height: 1.1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .bw-status {
      display: flex; align-items: center; gap: 5px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 10px;
      letter-spacing: 1.5px;
      color: #8a8a9a;
      margin-top: 2px;
    }
    .bw-status .bw-dot {
      width: 7px; height: 7px;
      background: #06d6a0;
      border-radius: 50%;
      animation: bw-dot-pulse 2s ease infinite;
    }
    @keyframes bw-dot-pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
    .bw-close {
      background: transparent;
      border: none;
      color: #8a8a9a;
      width: 32px; height: 32px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 18px;
    }
    .bw-close:hover { background: #1a1b26; color: #f4f4f8; }

    .bw-messages {
      flex: 1;
      padding: 16px 14px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 8px;
      background:
        radial-gradient(ellipse at top, rgba(230, 57, 70, 0.04) 0%, transparent 50%),
        radial-gradient(ellipse at bottom, rgba(44, 123, 229, 0.04) 0%, transparent 50%),
        #07070a;
    }
    .bw-msg {
      max-width: 85%;
      padding: 9px 13px;
      border-radius: 14px;
      font-size: 13px;
      line-height: 1.45;
      word-wrap: break-word;
      white-space: pre-wrap;
      color: #f4f4f8;
      animation: bw-msg-in 0.25s cubic-bezier(0.22, 1, 0.36, 1);
    }
    @keyframes bw-msg-in {
      from { opacity: 0; transform: translateY(6px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .bw-msg-bot {
      background: #1a1b26;
      border: 1px solid #2a2b3a;
      align-self: flex-start;
      border-bottom-left-radius: 4px;
    }
    .bw-msg-user {
      background: linear-gradient(135deg, #2c7be5, #1a5fb5);
      align-self: flex-end;
      border-bottom-right-radius: 4px;
    }
    .bw-msg a {
      color: #ffd60a;
      text-decoration: underline;
    }
    .bw-msg-user a { color: #fff; }

    .bw-typing { display: inline-flex; gap: 4px; padding: 4px 0; }
    .bw-typing span {
      width: 6px; height: 6px;
      background: #8a8a9a;
      border-radius: 50%;
      animation: bw-type-dot 1.2s ease infinite;
    }
    .bw-typing span:nth-child(2) { animation-delay: 0.15s; }
    .bw-typing span:nth-child(3) { animation-delay: 0.3s; }
    @keyframes bw-type-dot {
      0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
      30% { transform: translateY(-4px); opacity: 1; }
    }

    .bw-options {
      padding: 10px 14px 14px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      background: #11121a;
      border-top: 1px solid #2a2b3a;
      max-height: 50%;
      overflow-y: auto;
    }
    .bw-option {
      display: flex;
      align-items: center;
      gap: 9px;
      padding: 10px 12px;
      background: #07070a;
      border: 1px solid #2a2b3a;
      border-radius: 10px;
      color: #f4f4f8;
      font-size: 13px;
      text-align: left;
      cursor: pointer;
      transition: all 0.15s;
      font-family: inherit;
      width: 100%;
    }
    .bw-option:hover {
      background: #1a1b26;
      border-color: #ffd60a;
      transform: translateX(2px);
    }
    .bw-option-emoji { font-size: 16px; flex-shrink: 0; }
    .bw-option-text { flex: 1; line-height: 1.3; }
    .bw-option-register {
      background: linear-gradient(135deg, #06d6a0, #048a6c);
      border-color: #06d6a0;
      color: #fff; font-weight: 600;
    }
    .bw-option-register:hover { filter: brightness(1.1); }
    .bw-option-whatsapp {
      background: linear-gradient(135deg, #25d366, #128c7e);
      border-color: #25d366;
      color: #fff; font-weight: 600;
    }
    .bw-option-whatsapp:hover { filter: brightness(1.1); }

    .bw-back {
      padding: 8px 14px;
      text-align: center;
      background: #07070a;
      border-top: 1px solid #2a2b3a;
    }
    .bw-back button {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 6px 14px;
      background: #1a1b26;
      border: 1px solid #2a2b3a;
      border-radius: 18px;
      cursor: pointer;
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      letter-spacing: 1.5px;
      color: #8a8a9a;
    }
    .bw-back button:hover {
      border-color: #ffd60a;
      color: #ffd60a;
    }

    .bw-loading, .bw-error {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #8a8a9a;
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      letter-spacing: 1.5px;
      text-align: center;
      padding: 20px;
    }
  `;

  // Inyectar el CSS
  const styleTag = document.createElement('style');
  styleTag.textContent = css;
  document.head.appendChild(styleTag);

  // ============ DOM ============
  const launcher = document.createElement('button');
  launcher.className = 'bw-launcher';
  launcher.setAttribute('aria-label', 'Abrir chat con bot del torneo');
  launcher.innerHTML = `
    <span class="bw-icon">🥋</span>
    <span class="bw-badge">1</span>
    <span class="bw-tooltip">¿Dudas? Hablá con el bot 💬</span>
  `;
  document.body.appendChild(launcher);

  const win = document.createElement('div');
  win.className = 'bw-window';
  win.innerHTML = `<div class="bw-loading">CARGANDO...</div>`;
  document.body.appendChild(win);

  // ============ ESTADO ============
  let event = null;
  let faqs = null;
  let isOpen = false;
  let hasInitialized = false;

  // ============ HELPERS ============
  function esc(s) {
    return String(s || '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function linkify(text) {
    return text.replace(/(https?:\/\/[^\s]+)/g, (url) => `<a href="${url}" target="_blank" rel="noopener">${url}</a>`);
  }
  function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

  // ============ FLUJO ============
  launcher.addEventListener('click', toggle);

  // Mostrar tooltip 3 segundos al cargar la página (efecto "hey, mirá acá")
  setTimeout(() => {
    if (!isOpen) {
      launcher.classList.add('bw-tooltip-show');
      setTimeout(() => launcher.classList.remove('bw-tooltip-show'), 4000);
    }
  }, 1500);

  async function toggle() {
    isOpen = !isOpen;
    if (isOpen) {
      launcher.classList.add('bw-open');
      launcher.querySelector('.bw-icon').textContent = '✕';
      launcher.querySelector('.bw-tooltip').style.display = 'none';
      win.classList.add('bw-show');
      if (!hasInitialized) {
        await init();
      }
    } else {
      launcher.classList.remove('bw-open');
      launcher.querySelector('.bw-icon').textContent = '🥋';
      launcher.querySelector('.bw-tooltip').style.display = '';
      win.classList.remove('bw-show');
    }
  }

  async function init() {
    hasInitialized = true;
    try {
      const res = await fetch(`/api/events/${code}`);
      if (!res.ok) {
        win.innerHTML = `<div class="bw-error">EVENTO NO ENCONTRADO</div>`;
        return;
      }
      const data = await res.json();
      event = data;
      faqs = data.faqs || { welcome: '¡Hola! Tocá una pregunta:', whatsapp: '', items: [] };
      renderChat();
    } catch (e) {
      win.innerHTML = `<div class="bw-error">ERROR DE CONEXIÓN</div>`;
    }
  }

  function renderChat() {
    win.innerHTML = `
      <div class="bw-header">
        <div class="bw-avatar">🥋</div>
        <div class="bw-info">
          <div class="bw-name">${esc(event.event.name)}</div>
          <div class="bw-status"><span class="bw-dot"></span>EN LÍNEA · BOT</div>
        </div>
        <button class="bw-close" aria-label="Cerrar">✕</button>
      </div>
      <div class="bw-messages" id="bw-msgs"></div>
      <div class="bw-options" id="bw-opts"></div>
      <div class="bw-back" id="bw-back-row"></div>
    `;
    win.querySelector('.bw-close').addEventListener('click', toggle);
    showWelcome();
  }

  async function showWelcome() {
    const msgs = win.querySelector('#bw-msgs');
    msgs.innerHTML = '';
    await typeBot(faqs.welcome);
    renderMenu();
  }

  function renderMenu() {
    const opts = win.querySelector('#bw-opts');
    opts.innerHTML = '';
    for (const item of faqs.items) {
      const btn = document.createElement('button');
      btn.className = 'bw-option';
      btn.innerHTML = `<span class="bw-option-emoji">${item.emoji || '❓'}</span><span class="bw-option-text">${esc(item.question)}</span>`;
      btn.addEventListener('click', () => answerQuestion(item));
      opts.appendChild(btn);
    }
    // Botón inscribirse (solo si NO estamos ya en la página de inscripción)
    const onRegisterPage = location.pathname.startsWith('/e/');
    if (!onRegisterPage) {
      const regBtn = document.createElement('button');
      regBtn.className = 'bw-option bw-option-register';
      regBtn.innerHTML = `<span class="bw-option-emoji">📝</span><span class="bw-option-text">Quiero inscribirme</span>`;
      regBtn.addEventListener('click', () => {
        location.href = `/e/${event.code}`;
      });
      opts.appendChild(regBtn);
    }
    // Botón WhatsApp
    if (faqs.whatsapp) {
      const waBtn = document.createElement('button');
      waBtn.className = 'bw-option bw-option-whatsapp';
      const waMsg = encodeURIComponent(`Hola! Quiero hablar sobre el torneo "${event.event.name}"`);
      waBtn.innerHTML = `<span class="bw-option-emoji">💬</span><span class="bw-option-text">Hablar con un humano</span>`;
      waBtn.addEventListener('click', () => {
        window.open(`https://wa.me/${faqs.whatsapp}?text=${waMsg}`, '_blank');
      });
      opts.appendChild(waBtn);
    }
    win.querySelector('#bw-back-row').innerHTML = '';
  }

  async function answerQuestion(item) {
    addUserMsg(`${item.emoji || ''} ${item.question}`);
    win.querySelector('#bw-opts').innerHTML = '';
    await typeBot(item.answer);
    const back = document.createElement('button');
    back.innerHTML = '← VOLVER AL MENÚ';
    back.addEventListener('click', () => renderMenu());
    const wrap = win.querySelector('#bw-back-row');
    wrap.innerHTML = '';
    wrap.appendChild(back);
  }

  function addBotMsg(text) {
    const msg = document.createElement('div');
    msg.className = 'bw-msg bw-msg-bot';
    msg.innerHTML = linkify(esc(text));
    win.querySelector('#bw-msgs').appendChild(msg);
    scrollDown();
  }
  function addUserMsg(text) {
    const msg = document.createElement('div');
    msg.className = 'bw-msg bw-msg-user';
    msg.textContent = text;
    win.querySelector('#bw-msgs').appendChild(msg);
    scrollDown();
  }
  function addTyping() {
    const t = document.createElement('div');
    t.className = 'bw-msg bw-msg-bot bw-typing-wrap';
    t.id = '_bw_typing';
    t.innerHTML = '<div class="bw-typing"><span></span><span></span><span></span></div>';
    win.querySelector('#bw-msgs').appendChild(t);
    scrollDown();
  }
  function removeTyping() {
    const t = win.querySelector('#_bw_typing');
    if (t) t.remove();
  }
  async function typeBot(text) {
    addTyping();
    const wait = Math.min(1200, Math.max(500, text.length * 10));
    await sleep(wait);
    removeTyping();
    addBotMsg(text);
  }
  function scrollDown() {
    const m = win.querySelector('#bw-msgs');
    if (m) m.scrollTop = m.scrollHeight;
  }
})();
