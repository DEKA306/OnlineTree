(() => {
  const endpoint = window.TREE_CONFIG?.SCRIPT_URL || "";
  const form = document.querySelector("#message-form");
  const statusEl = document.querySelector("#form-status");
  const submitBtn = document.querySelector("#submit-btn");
  const messageInput = document.querySelector("#message");
  const countEl = document.querySelector("#char-count");
  const ornamentsEl = document.querySelector("#ornaments");
  const dialog = document.querySelector("#message-dialog");
  const configured = endpoint.startsWith("https://script.google.com/macros/s/");

  messageInput.addEventListener("input", () => countEl.textContent = `${messageInput.value.length} / 100`);

  function jsonp(params) {
    return new Promise((resolve, reject) => {
      const callback = `treeCallback_${Date.now()}_${Math.floor(Math.random()*1e6)}`;
      const script = document.createElement("script");
      const timer = setTimeout(() => { cleanup(); reject(new Error("요청 시간이 초과됐어요.")); }, 15000);
      function cleanup() { clearTimeout(timer); delete window[callback]; script.remove(); }
      window[callback] = data => { cleanup(); resolve(data); };
      const url = new URL(endpoint);
      Object.entries({...params, callback, nonce: Date.now()}).forEach(([k,v]) => url.searchParams.set(k, v));
      script.onerror = () => { cleanup(); reject(new Error("서버에 연결할 수 없어요.")); };
      script.src = url.toString();
      document.head.append(script);
    });
  }

  async function loadTree() {
    if (!configured) {
      statusEl.textContent = "config.js에 Apps Script 웹 앱 URL을 먼저 입력해 주세요.";
      document.querySelector("#count").textContent = "—";
      return;
    }
    try {
      const result = await jsonp({action:"list"});
      if (!result.ok) throw new Error(result.error || "목록을 불러오지 못했어요.");
      ornamentsEl.replaceChildren();
      document.querySelector("#count").textContent = result.messages.length;
      result.messages.forEach(data => {
        const ornament = document.createElement("button");
        ornament.type = "button";
        ornament.className = `ornament ${data.kind === "star" ? "star" : ""}`;
        ornament.style.left = `${data.x}%`;
        ornament.style.top = `${data.y}%`;
        ornament.style.background = data.color;
        ornament.style.color = data.color;
        ornament.setAttribute("aria-label", `메시지: ${data.message}`);
        if (data.kind === "star") ornament.textContent = "★";
        ornament.addEventListener("click", () => {
          document.querySelector("#dialog-nickname").textContent = data.nickname;
          document.querySelector("#dialog-message").textContent = data.message;
          dialog.showModal();
        });
        ornamentsEl.append(ornament);
      });
    } catch (error) {
      statusEl.textContent = error.message;
      console.error(error);
    }
  }

  form.addEventListener("submit", async event => {
    event.preventDefault();
    if (!configured) { statusEl.textContent = "먼저 config.js에 Apps Script URL을 입력해 주세요."; return; }
    const nickname = document.querySelector("#nickname").value.trim();
    const message = messageInput.value.trim();
    const honeypot = document.querySelector("#website").value;
    if (honeypot) return;
    if (!nickname || !message || nickname.length > 16 || message.length > 100) {
      statusEl.textContent = "닉네임과 메시지를 확인해 주세요."; return;
    }
    submitBtn.disabled = true;
    statusEl.textContent = "메시지를 접수하는 중...";
    try {
      const result = await jsonp({action:"submit", nickname, message, client: getClientId()});
      if (!result.ok) throw new Error(result.error || "접수에 실패했어요.");
      form.reset(); countEl.textContent = "0 / 100";
      statusEl.textContent = "접수 완료! 관리자 승인 후 트리에 나타나요.";
    } catch (error) {
      statusEl.textContent = `${error.message} 잠시 후 다시 시도해 주세요.`;
    } finally { submitBtn.disabled = false; }
  });

  function getClientId() {
    const key = "pixelTreeClient";
    let id = localStorage.getItem(key);
    if (!id) {
      id = (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`);
      localStorage.setItem(key, id);
    }
    return id;
  }

  document.querySelector("#dialog-close").addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", event => { if (event.target === dialog) dialog.close(); });
  loadTree();
  if (configured) setInterval(loadTree, 20000);
})();