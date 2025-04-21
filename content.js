(async function () {
  let openaiCache = null;
  let originalHtml = null;
  let showingOpenAI = false;
  let alreadyRendered = false;
  let controls, observer;

  // 1) Wait for page load
  await new Promise((r) => {
    if (document.readyState === 'complete') return r();
    window.addEventListener('load', r);
  });

  // 2) Handle toggle
  async function handleToggle() {
    const block = document.querySelector('.LT6XE');
    if (!block) {
      console.error('OpenAI‑overview: .LT6XE not found');
      return;
    }
  
    if (originalHtml === null) {
      originalHtml = block.innerHTML;
    }
  
    if (showingOpenAI) {
      block.innerHTML = originalHtml;
      showingOpenAI = false;
      return;
    }
  
    showingOpenAI = true;
  
    block.innerHTML = `
      <div class="skeleton-wrapper">
        <div class="skeleton-line heading"></div>
        <div class="skeleton-line"></div>
        <div class="skeleton-line"></div>
        <div class="skeleton-line short"></div>
  
        <div class="skeleton-line heading"></div>
        <div class="skeleton-line"></div>
        <div class="skeleton-line"></div>
        <div class="skeleton-line short"></div>
  
        <div class="skeleton-line heading"></div>
        <div class="skeleton-line"></div>
        <div class="skeleton-line short"></div>
        <div class="skeleton-line short"></div>
      </div>
    `;
  
    if (openaiCache !== null) {
      renderOpenAI(block, openaiCache, false); // No typing
      return;
    }
  
    const query = new URLSearchParams(location.search).get('q') || '';
    chrome.runtime.sendMessage({ action: 'getOverview', query }, response => {
      openaiCache = response || 'No summary returned';
      alreadyRendered = true;
      renderOpenAI(block, openaiCache, true); // Type once
    });
  }
  
  

  // 3) Render and format Markdown as clean HTML
  function renderOpenAI(block, markdownText, shouldType = false) {
    const converter = new showdown.Converter({
      tables: true,
      simplifiedAutoLink: true,
      strikethrough: true,
      tasklists: true,
      ghCodeBlocks: true
    });
  
    const html = converter.makeHtml(markdownText);
    const container = document.createElement('div');
    container.className = 'openai-overview';
    container.style.whiteSpace = 'pre-wrap';
    block.innerHTML = '';
    block.appendChild(container);
  
    if (!shouldType) {
      container.innerHTML = html;
      attachRegenerateButton(block);
      return;
    }
  
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    const full = tempDiv.innerHTML;
    let i = 0;
    const speed = 1;
  
    function type() {
      container.innerHTML = full.slice(0, i);
      i += Math.ceil(speed * 10);
      if (i <= full.length) {
        setTimeout(type, 10);
      } else {
        container.innerHTML = full;
        attachRegenerateButton(block);
      }
    }
  
    setTimeout(type, 100);
    container.innerHTML = full;
    attachRegenerateButton(block);

    const regenBtn = container.querySelector('.regenerate-btn');
    if (regenBtn) {
      regenBtn.disabled = false;
      regenBtn.textContent = 'Regenerate';
    }
  }
  
  
  
  function attachRegenerateButton(block) {
    const button = block.querySelector('.regenerate-btn');
    if (button) {
      button.addEventListener('click', async () => {
        button.disabled = true;
        button.textContent = 'Regenerating...';
        const query = new URLSearchParams(location.search).get('q') || '';
        chrome.runtime.sendMessage({ action: 'getOverview', query }, response => {
          openaiCache = response || 'No summary returned';
          renderOpenAI(block, openaiCache, true); // 👈 force typing on regenerate
        });
      });
    }
  }
  
  
  

  function injectToggle() {
    controls = document.querySelector('.Fzsovc');
    if (!controls || document.getElementById('overview-switch')) return;

    if (!document.getElementById('overview-switch-styles')) {
      const style = document.createElement('style');
      style.id = 'overview-switch-styles';
      style.textContent = `
        .overview-label { font-size:14px; color:#202124; }
        .switch {
          position: relative;
          display: inline-block;
          width: 50px;
          height: 24px;
          margin: 0 8px;
        }
        .switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }
        .slider {
          position: absolute;
          cursor: pointer;
          top: 0; left: 0; right: 0; bottom: 0;
          background-color: #ccc;
          transition: .4s;
          border-radius: 24px;
        }
        .slider:before {
          position: absolute;
          content: "";
          height: 20px;
          width: 20px;
          left: 2px;
          bottom: 2px;
          background-color: white;
          transition: .4s;
          border-radius: 50%;
        }
        .switch input:checked + .slider {
          background-color: #4390f7;
        }
        .switch input:checked + .slider:before {
          transform: translateX(26px);
        }

        .skeleton-wrapper {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .skeleton-line {
          height: 12px;
          background: linear-gradient(90deg, #eee 25%, #ddd 37%, #eee 63%);
          background-size: 400% 100%;
          animation: shimmer 2.5s ease infinite;
          border-radius: 6px;
        }
        .skeleton-line.short { width: 60%; }
        .skeleton-line.heading { width: 40%; height: 14px; margin-top: 16px; }

        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        .openai-overview {
          font-family: "Google Sans", Roboto, Arial, sans-serif;
          font-size: 14px;
          line-height: 1.6;
          color: #202124;
          background: #fff;
          padding: 16px;
          border-radius: 12px;
          border: 1px solid #dadce0;
          box-shadow: 0 1px 3px rgba(60,64,67,.15);
          white-space: pre-wrap;
        }

        .openai-overview h2,
        .openai-overview h3 {
          margin-top: 1.2em;
          font-weight: 600;
          color: #1a73e8;
        }

        .openai-overview h2 {
          font-size: 1.1rem;
          border-bottom: 1px solid #e0e0e0;
          padding-bottom: 4px;
        }

        .openai-overview h3 {
          font-size: 1rem;
        }

        .openai-overview p {
          margin: 0.5em 0;
        }

        .openai-overview ul {
          padding-left: 1.2em;
        }

        .openai-overview code {
          background: #f1f3f4;
          padding: 2px 4px;
          border-radius: 4px;
          font-family: monospace;
          font-size: 90%;
        }

        .openai-overview .regenerate-btn {
          font-size: 11px;
          background: transparent;
          color: #1a73e8;
          border: none;
          cursor: pointer;
          padding: 0;
          margin-left: 8px;
          position: relative;
          top: 2px;
        }

        .openai-overview .regenerate-btn:hover {
          text-decoration: underline;
        }

        .openai-overview .bullet-separator {
          display: inline-block;
          transform: translateY(1px);
          margin: 0 4px;
        }
      `;
      document.head.appendChild(style);
    }

    const wrapper = document.createElement('div');
    wrapper.style.display = 'inline-flex';
    wrapper.style.alignItems = 'center';
    wrapper.innerHTML = `
      <span class="overview-label">Google</span>
      <label class="switch">
        <input type="checkbox" id="overview-switch">
        <span class="slider"></span>
      </label>
      <span class="overview-label">OpenAI</span>
    `;

    wrapper.querySelector('#overview-switch')
      .addEventListener('change', handleToggle);

    controls.parentNode.insertBefore(wrapper, controls.nextSibling);

    // Auto-toggle if enabled
    chrome.storage.sync.get(['AUTO_TOGGLE'], data => {
      if (data.AUTO_TOGGLE) {
        const checkbox = document.getElementById('overview-switch');
        if (checkbox && !checkbox.checked) {
          checkbox.checked = true;
          handleToggle();
        }
      }
    });
  }

  observer = new MutationObserver(injectToggle);
  observer.observe(document, { childList: true, subtree: true });
  injectToggle();
})();
