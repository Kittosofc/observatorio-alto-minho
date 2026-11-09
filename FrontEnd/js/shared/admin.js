// Acesso admin e indicadores visíveis. Carregar DEPOIS de app.js (usa catalog, renderCatalog e hiddenIndicators).
// ===== 9. ACESSO ADMIN =====
// Botão no fundo da barra lateral. Sem sessão: leva ao login PHP. Com sessão (backend/php/status.php): mostra "Sair".
// Só o admin vê a área de carregar ficheiros (body[data-admin="on"]).
(function adminAccess() {
  const rail = document.querySelector(".rail");
  if (!rail) return;
  const base = location.pathname.includes("/FrontEnd/html/") ? "../../Backend/php/" : "Backend/php/";
  window.observatorioBackend = base;
  const btn = document.createElement("a");
  btn.className = "admin-toggle";
  const apply = on => {
    document.body.dataset.admin = on ? "on" : "off";
    btn.classList.toggle("on", on);
    btn.href = base + (on ? "logout.php" : "login.php");
    btn.innerHTML = on ? `<span>Administrador</span><b>sair</b>` : `<span>Entrar como administrador</span><b>→</b>`;
  };
  apply(false);
  rail.appendChild(btn);
  fetch(base + "status.php", { credentials: "same-origin" })
    .then(r => r.json()).then(d => {
      window.observatorioAdmin = d;
      apply(!!d.admin);
      document.dispatchEvent(new Event("admin-ready"));
    }).catch(() => {});
})();

// ===== 10. INDICADORES VISÍVEIS =====
// Utilizadores só veem os indicadores não escondidos. O admin vê todos, com caixa de seleção (visível/escondido).
(function indicatorVisibility() {
  const tbody = document.querySelector("#catalog-body");
  if (!tbody) return;
  const api = (window.observatorioBackend || "Backend/php/") + "indicadores.php";
  const rerender = () => renderCatalog(document.querySelector("#indicator-search")?.value || "");
  fetch(api, { credentials: "same-origin" })
    .then(r => r.json()).then(d => { hiddenIndicators = new Set(d.hidden || []); rerender(); }).catch(() => {});
  document.addEventListener("admin-ready", rerender);
  tbody.addEventListener("change", e => {
    const cb = e.target.closest("[data-vis-key]");
    if (!cb) return;
    const item = catalog.find(i => i.key === cb.dataset.visKey);
    if (!item) return;
    cb.checked ? hiddenIndicators.delete(item.rawName) : hiddenIndicators.add(item.rawName);
    cb.closest("tr").classList.toggle("is-hidden", !cb.checked);
    const fd = new FormData();
    fd.append("action", "set");
    fd.append("hidden", JSON.stringify([...hiddenIndicators]));
    fd.append("csrf", window.observatorioAdmin.csrf);
    fetch(api, { method: "POST", body: fd, credentials: "same-origin" })
      .then(async r => { if (!r.ok) { const j = await r.json().catch(() => ({})); throw new Error(j.error || "erro"); } })
      .catch(e => alert("Não foi possível guardar a alteração: " + e.message));
  });
})();