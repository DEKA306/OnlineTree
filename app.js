(() => {
  const endpoint = window.TREE_CONFIG?.SCRIPT_URL || "";
  const form = document.querySelector("#message-form");
  const statusEl = document.querySelector("#form-status");
  const submitBtn = document.querySelector("#submit-btn");
  const messageInput = document.querySelector("#message");
  const countEl = document.querySelector("#char-count");
  const tree = document.querySelector("#tree");
  const ornamentsEl = document.querySelector("#ornaments");
  const dialog = document.querySelector("#message-dialog");
  const configured = endpoint.startsWith("https://script.google.com/macros/s/");
  let latestMessages = [];

  messageInput.addEventListener("input", () => {
    countEl.textContent = `${messageInput.value.length} / 30`;
  });

  function jsonp(params) {
    return new Promise((resolve, reject) => {
      const callback = `treeCallback_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
      const script = document.createElement("script");
      const timer = setTimeout(() => {
        cleanup();
        reject(new Error("요청 시간이 초과됐어요."));
      }, 15000);

      function cleanup() {
        clearTimeout(timer);
        delete window[callback];
        script.remove();
      }

      window[callback] = data => {
        cleanup();
        resolve(data);
      };

      const url = new URL(endpoint);
      Object.entries({ ...params, callback, nonce: Date.now() }).forEach(([key, value]) => {
        url.searchParams.set(key, value);
      });

      script.onerror = () => {
        cleanup();
        reject(new Error("서버에 연결할 수 없어요."));
      };
      script.src = url.toString();
      document.head.append(script);
    });
  }

  function layoutFor(count) {
    const mobile = window.matchMedia("(max-width: 560px)").matches;
    const columns = mobile ? 1 : 2;
    const rows = Math.max(1, Math.ceil(count / columns));
    const rowPitch = mobile ? 82 : 78;
    const cardTop = 28;
    const treeHeight = Math.max(470, cardTop + rows * rowPitch + 50);
    const tierCount = Math.max(5, Math.min(60, Math.ceil((treeHeight - 220) / 115) + 1));
    return { mobile, columns, rows, rowPitch, cardTop, treeHeight, tierCount };
  }

  function renderTreeShape(count) {
    const metrics = layoutFor(count);
    tree.querySelectorAll(".tree-row").forEach(node => node.remove());

    tree.style.height = `${metrics.treeHeight}px`;
    tree.parentElement.style.height = `${metrics.treeHeight + 95}px`;

    const layerHeight = Math.min(300, Math.max(220, metrics.treeHeight / 4));
    const firstTop = 0;
    const lastTop = Math.max(0, metrics.treeHeight - layerHeight);
    const colors = ["#38b978", "#259e6a", "#1d8c60", "#187b57", "#146d50"];

    for (let i = 0; i < metrics.tierCount; i++) {
      const row = document.createElement("div");
      const progress = metrics.tierCount === 1 ? 1 : i / (metrics.tierCount - 1);
      row.className = "tree-row";
      row.style.width = `${440 + progress * 120}px`;
      row.style.height = `${layerHeight}px`;
      row.style.top = `${firstTop + progress * (lastTop - firstTop)}px`;
      row.style.background = colors[i % colors.length];
      row.style.zIndex = String(i + 1);
      tree.insertBefore(row, tree.querySelector(".trunk"));
    }
  }

  function updateGrowthLabel(count) {
    const label = document.querySelector("#growth-stage");
    if (!label) return;
    const tiers = layoutFor(count).tierCount;
    const stage = count < 11 ? "새싹 단계" :
      count < 26 ? "성장 단계" :
      count < 51 ? "풍성한 트리" :
      count < 101 ? "거대한 트리" : "전설의 트리";
    label.textContent = `${stage} · 가지 층 ${tiers}단`;
  }

  function showMessage(data) {
    document.querySelector("#dialog-nickname").textContent = data.nickname || "익명";
    document.querySelector("#dialog-message").textContent = data.message || "";
    dialog.showModal();
  }

  function renderTreeMessages(messages) {
    ornamentsEl.replaceChildren();

    if (!messages.length) {
      const empty = document.createElement("p");
      empty.className = "tree-empty";
      empty.textContent = "첫 번째 메시지를 기다리고 있어요.";
      ornamentsEl.append(empty);
      return;
    }

    const metrics = layoutFor(messages.length);

    messages.forEach((data, index) => {
      const row = Math.floor(index / metrics.columns);
      const column = index % metrics.columns;

      const card = document.createElement("button");
      card.type = "button";
      card.className = "tree-message";
      card.style.top = `${metrics.cardTop + row * metrics.rowPitch}px`;
      card.style.left = metrics.mobile ? "5%" : (column === 0 ? "3%" : "52%");
      card.style.width = metrics.mobile ? "90%" : "45%";
      card.style.borderLeftColor = data.color || "#ffd875";
      card.setAttribute("aria-label", `${data.nickname || "익명"}: ${data.message || ""}`);
      card.addEventListener("click", () => showMessage(data));

      const nickname = document.createElement("span");
      nickname.className = "tree-message-name";
      nickname.textContent = data.nickname || "익명";

      const message = document.createElement("span");
      message.className = "tree-message-text";
      message.textContent = data.message || "";

      card.append(nickname, message);
      ornamentsEl.append(card);
    });
  }

  async function loadTree() {
    if (!configured) {
      statusEl.textContent = "config.js에 Apps Script 웹 앱 URL을 입력해 주세요.";
      document.querySelector("#count").textContent = "—";
      return;
    }

    try {
      const result = await jsonp({ action: "list" });
      if (!result || result.ok !== true || !Array.isArray(result.messages)) {
        throw new Error(result?.error || "서버 응답 형식이 올바르지 않아요.");
      }

      latestMessages = result.messages;
      renderTreeShape(latestMessages.length);
      renderTreeMessages(latestMessages);
      document.querySelector("#count").textContent = latestMessages.length;
      updateGrowthLabel(latestMessages.length);
    } catch (error) {
      statusEl.textContent = `메시지를 불러오지 못했어요: ${error.message}`;
      console.error(error);
    }
  }

  form.addEventListener("submit", async event => {
    event.preventDefault();

    if (!configured) {
      statusEl.textContent = "먼저 config.js에 Apps Script URL을 입력해 주세요.";
      return;
    }

    const nickname = document.querySelector("#nickname").value.trim();
    const message = messageInput.value.trim();
    const honeypot = document.querySelector("#website").value;

    if (honeypot) return;
    if (!nickname || !message || nickname.length > 16 || message.length > 30) {
      statusEl.textContent = "닉네임은 16자, 메시지는 30자 이내로 입력해 주세요.";
      return;
    }

    submitBtn.disabled = true;
    statusEl.textContent = "메시지를 접수하는 중...";
    try {
      const result = await jsonp({
        action: "submit",
        nickname,
        message,
        client: getClientId()
      });
      if (!result.ok) throw new Error(result.error || "접수에 실패했어요.");

      form.reset();
      countEl.textContent = "0 / 30";
      statusEl.textContent = "접수 완료! 관리자 승인 후 최대 20초 안에 트리 위에 표시돼요.";
      // Refresh once immediately; pending messages stay hidden until approved.
      await loadTree();
    } catch (error) {
      statusEl.textContent = `${error.message} 잠시 후 다시 시도해 주세요.`;
    } finally {
      submitBtn.disabled = false;
    }
  });

  function getClientId() {
    const key = "pixelTreeClient";
    let id = localStorage.getItem(key);
    if (!id) {
      id = crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      localStorage.setItem(key, id);
    }
    return id;
  }

  document.querySelector("#dialog-close").addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", event => {
    if (event.target === dialog) dialog.close();
  });

  window.addEventListener("resize", () => {
    renderTreeShape(latestMessages.length);
    renderTreeMessages(latestMessages);
  });

  loadTree();
  if (configured) window.setInterval(loadTree, 20000);
})();
