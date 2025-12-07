// src/ui/bridge.js
(function () {
  if (window.__UI_BRIDGE_INSTALLED__) return;
  window.__UI_BRIDGE_INSTALLED__ = true;

  // Create toast container
  const toastRoot = document.createElement("div");
  toastRoot.className = "ui-toast-stack";
  document.body.appendChild(toastRoot);

  function createToast(msg, type = "info", ttl = 2400) {
    const el = document.createElement("div");
    el.className = `ui-toast ui-glass ${type}`;
    el.innerHTML = `<div style="flex:1">${escapeHtml(String(msg))}</div>`;
    toastRoot.appendChild(el);
    setTimeout(() => {
      el.style.transition = "opacity 250ms, transform 250ms";
      el.style.opacity = "0";
      el.style.transform = "translateX(8px)";
      setTimeout(()=> el.remove(), 300);
    }, ttl);
    return el;
  }

  // Confirm / Prompt overlay
  const overlay = document.createElement("div");
  overlay.style.cssText = "position:fixed;inset:0;display:none;align-items:center;justify-content:center;z-index:100000;background:rgba(0,0,0,0.35)";
  document.body.appendChild(overlay);

  function showConfirm(message) {
    return new Promise((resolve) => {
      overlay.innerHTML = "";
      overlay.style.display = "flex";
      const card = document.createElement("div");
      card.className = "ui-glass ui-confirm-card";
      card.innerHTML = `<div style="font-weight:700;margin-bottom:10px;color:var(--accent-primary);">${escapeHtml(String(message))}</div>`;
      const buttons = document.createElement("div");
      buttons.style.display = "flex";
      buttons.style.justifyContent = "center";
      buttons.style.gap = "10px";
      const btnNo = document.createElement("button");
      btnNo.className = "ui-btn";
      btnNo.textContent = "Cancel";
      btnNo.onclick = () => { overlay.style.display="none"; resolve(false); };
      const btnYes = document.createElement("button");
      btnYes.className = "ui-btn";
      btnYes.style.color = "var(--accent-gold)";
      btnYes.textContent = "Yes";
      btnYes.onclick = () => { overlay.style.display="none"; resolve(true); };
      buttons.appendChild(btnNo);
      buttons.appendChild(btnYes);
      card.appendChild(buttons);
      overlay.appendChild(card);
    });
  }

  function showPrompt(message, defaultVal="") {
    return new Promise((resolve) => {
      overlay.innerHTML = "";
      overlay.style.display = "flex";
      const card = document.createElement("div");
      card.className = "ui-glass ui-confirm-card";
      card.innerHTML = `<div style="font-weight:700;margin-bottom:8px;color:var(--accent-primary)">${escapeHtml(String(message))}</div>`;
      const input = document.createElement("input");
      input.className = "ui-prompt-input";
      input.value = defaultVal || "";
      input.placeholder = "";
      input.onkeydown = function(e) { if (e.key === "Enter") { ok(); } };
      card.appendChild(input);
      const buttons = document.createElement("div");
      buttons.style.display = "flex";
      buttons.style.justifyContent = "center";
      buttons.style.gap = "10px";
      const btnCancel = document.createElement("button");
      btnCancel.className = "ui-btn";
      btnCancel.textContent = "Cancel";
      btnCancel.onclick = () => { overlay.style.display="none"; resolve(null); };
      const btnOk = document.createElement("button");
      btnOk.className = "ui-btn";
      btnOk.style.color = "var(--accent-gold)";
      btnOk.textContent = "OK";
      function ok() { overlay.style.display="none"; resolve(input.value); }
      btnOk.onclick = ok;
      buttons.appendChild(btnCancel);
      buttons.appendChild(btnOk);
      card.appendChild(buttons);
      overlay.appendChild(card);
      setTimeout(()=> input.focus(), 30);
    });
  }

  // basic escape helper
  function escapeHtml(s) {
    return s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  // Expose a small bridge
  window.__UI_BRIDGE__ = {
    toast: (msg, type="info") => createToast(msg, type),
    confirm: showConfirm,
    prompt: showPrompt,
    alert: (msg) => createToast(msg, "info")
  };

  // Override native dialogs
  window.alert = function(msg) { window.__UI_BRIDGE__?.alert(msg); };
  window.confirm = function(msg) { return window.__UI_BRIDGE__?.confirm(msg); };
  window.prompt = function(msg, def) { return window.__UI_BRIDGE__?.prompt(msg, def || ""); };

})();
