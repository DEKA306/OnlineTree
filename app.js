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

  function getTreeTierCount(count) {
    if (count <= 10) return 5;
    if (count <= 25) return 6;
    if (count <= 50) return 7;
    if (count <= 100) return 9;
    return Math.min(30, 9 + Math.floor((count - 100) / 15));
  }

  function getLayoutMetrics(count) {
    const mobile = window.matchMedia("(max-width: 560px)").matches;
    const columns = mobile ? 1 : 2;
    const rows = Math.max(1, Math.ceil(count / columns));
    const rowPitch = mobile ? 76 : 70;
    const treeHeight = Math.max(410, 190 + rows * rowPitch);
    return { mobile, columns, rows, rowPitch, treeHeight };
  }

  function renderTreeShape(count) {
    const { treeHeight } = getLayoutMetrics(count);
    tree.querySelectorAll(".tree-row").forEach(row => row.remove());

    tree.style.height = `${treeHeight}px`;
    const scene = tree.parentElement;
    scene.style.height = `${treeHeight + 100}px`;

    const tiers = Math.max(getTreeTierCount(count), Math.ceil(treeHeight / 190));
    const colors = ["#38b978", "#259e6a", "#1d8c60", "#187b57", "#146d50"];
    const layerHeight = Math.min(190, Math.max(145, treeHeight / Math.max(2, tiers) * 1.5));
    const firstTop = 16;
    const lastTop = Math.max(firstTop, treeHeight - layerHeight - 8);

    for (let i = 0; i < tiers; i++) {
      const row = document.createElement("div");
      const progress = tiers === 1 ? 1 : i / (tiers - 1);
      row.className = "tree-row";
      row.style.width = `${118 + progress * 312}px`;
      row.style.height = `${layerHeight}px`;
      row.style.top = `${firstTop + progress * (lastTop - firstTop)}px`;
      row.style.background = colors[i % colors.length];
      tree.insertBefore(row, tree.querySelector(".trunk"));
    }
  }

  function updateGrowthLabel(count) {
    const label = document.querySelector("#growth-stage");
    if (!label) return;
    const tiers = getTreeTierCount(count);
    const stage = tiers <= 5 ? "새싹 단계" :
      tiers === 6 ? "성장 단계" :
      tiers <= 8 ? "풍성한 트리" :
      tiers <= 10 ? "거대한 트리" : "전설의 트리";
    label.textContent = `${stage} · 가지 층 ${tiers}단`;
  }

  function showMessage(data) {
    document.querySelector("#dialog-nickname").textContent = data.nickname;
    document.querySelector("#dialog-message").textContent = data.message;
    dialog.showModal();
  }

  function renderTreeMessages(messages) {
    ornamentsEl.replaceChildren();
    const { mobile, columns, rows, rowPitch } = getLayoutMetrics(messages.length);

    messages.forEach((data, index) => {
      const card = document.createElement("button");
      card.type = "button";
      card.className = "tree-message";
      card.style.top = `${20 + Math.floor(index / columns) * rowPitch}px`;
      card.style.left = mobile ? "5%" : (index % 2 === 0 ? "3%" : "51%");
      card.style.width = mobile ? "90%" : "46%";
      card.style.borderLeftColor = data.color || "#ffd875";
      card.setAttribute("aria-label", `${data.nickname}: ${data.message}`);
      card.addEventListener("click", () => showMessage(data));

      const name = document.createElement("span");
      name.className = "tree-message-name";
      name.textContent = data.nickname;

      const text = document.createElement("span");
      text.className = "tree-message-text";
      text.textContent = data.message;

      card.append(name, text);
      ornamentsEl.append(card);
    });
  }

  async function loadTree() {
    if (!configured) {
      statusEl.textContent = "config.js에 Apps Script 웹 앱 URL을 먼저 입력해 주세요.";
      document.querySelector("#count").textContent = "—";
      return;
    }

    try {
      const result = await jsonp({ action: "list" });
      if (!result.ok) throw new Error(result.error || "목록을 불러오지 못했어요.");

      latestMessages = Array.isArray(result.messages) ? result.messages : [];
      renderTreeShape(latestMessages.length);
      renderTreeMessages(latestMessages);
      document.querySelector("#count").textContent = latestMessages.length;
      updateGrowthLabel(latestMessages.length);
    } catch (error) {
      statusEl.textContent = error.message;
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
      statusEl.textContent = "접수 완료! 관리자 승인 후 트리 위에 바로 표시돼요.";
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
  if (configured) setInterval(loadTree, 20000);
})();
