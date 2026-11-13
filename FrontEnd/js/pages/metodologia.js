// Página Metodologia: o admin pode criar e eliminar cartões (os 3 primeiros ficam no HTML).
(function () {
  const grid = document.querySelector(".method-grid");
  if (!grid) return;
  const api = (window.observatorioBackend || "../../Backend/php/") + "cartoes.php";
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const baseCount = grid.children.length;
  let cards = null;

  // Botão "Criar cartão" (só admin)
  const bar = document.createElement("div");
  bar.className = "method-toolbar";
  bar.hidden = true;
  bar.innerHTML = `<button class="method-create" type="button">+ Criar cartão</button>`;
  grid.before(bar);

  // Pop-up
  const box = document.createElement("div");
  box.className = "method-modal";
  box.hidden = true;
  box.innerHTML = `
    <form class="method-dialog" role="dialog" aria-modal="true" aria-labelledby="method-dlg-title">
      <button class="method-x" type="button" aria-label="Fechar">×</button>
      <h3 id="method-dlg-title">Novo cartão</h3>
      <input type="hidden" name="action" value="add">
      <label><span class="method-lbl">Título <small class="method-count" data-for="title" data-max="80">máx. 80 caracteres</small></span><input name="title" maxlength="80" placeholder="Ex.: Limitações dos dados" required></label>
      <label><span class="method-lbl">Texto <small class="method-count" data-for="text" data-max="500">máx. 500 caracteres</small></span><textarea name="text" maxlength="500" rows="4" placeholder="Explicação que aparece no cartão" required></textarea></label>
      <label><span class="method-lbl">Etiquetas <small>opcional, separadas por vírgula (máx. 6)</small></span><input name="tags" placeholder="Ex.: INE, Anual"></label>
      <p class="admin-msg" role="alert"></p>
      <div class="method-actions">
        <button class="method-cancel" type="button">Cancelar</button>
        <button class="admin-btn" type="submit">Adicionar</button>
      </div>
    </form>`;
  document.body.appendChild(box);
  const form = box.querySelector("form"), msg = box.querySelector(".admin-msg");
  const counts = form.querySelectorAll(".method-count");
  const updCounts = () => counts.forEach(c => {
    const n = form.elements[c.dataset.for].value.length, max = +c.dataset.max;
    c.textContent = n ? `${n}/${max} caracteres` : `máx. ${max} caracteres`;
    c.classList.toggle("full", n >= max);
  });
  form.addEventListener("input", updCounts);
  const open = () => { box.hidden = false; form.elements.title.focus(); };
  const close = () => { box.hidden = true; form.reset(); updCounts(); msg.textContent = ""; };
  bar.querySelector(".method-create").addEventListener("click", open);
  box.querySelector(".method-x").addEventListener("click", close);
  box.querySelector(".method-cancel").addEventListener("click", close);
  box.addEventListener("mousedown", e => { if (e.target === box) close(); });
  document.addEventListener("keydown", e => { if (e.key === "Escape" && !box.hidden) close(); });

  // Lê a resposta como texto e ignora lixo antes do JSON (BOM, avisos do PHP).
  const parse = t => {
    try { return JSON.parse(t.replace(/^\uFEFF/, "")); } catch (_) {}
    const m = t.match(/(\[[\s\S]*\]|\{[\s\S]*\})\s*$/);
    try { return m ? JSON.parse(m[1]) : null; } catch (_) { return null; }
  };
  async function post(fd) {
    fd.append("csrf", window.observatorioAdmin.csrf);
    const r = await fetch(api, { method: "POST", body: fd, credentials: "same-origin" });
    const t = await r.text(), j = parse(t);
    if (!r.ok || !Array.isArray(j))
      throw new Error((j && j.error) || `Resposta inesperada do servidor (HTTP ${r.status}): ${t.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 200) || "(vazia)"}`);
    return j;
  }

  function render() {
    const adm = !!(window.observatorioAdmin && window.observatorioAdmin.admin);
    bar.hidden = !adm;
    if (!cards) return;
    grid.querySelectorAll(".method-card[data-id]").forEach(n => n.remove());
    grid.insertAdjacentHTML("beforeend", cards.map((c, i) => `
      <article class="method-card" data-id="${esc(c.id)}">
        <span class="method-num">${String(baseCount + i + 1).padStart(2, "0")}</span>
        <h2>${esc(c.title)}</h2>
        <p>${esc(c.text)}</p>
        ${(c.tags || []).length ? `<div class="tags">${c.tags.map(t => `<span>${esc(t)}</span>`).join("")}</div>` : ""}
        ${adm ? `<button class="admin-del" type="button" data-id="${esc(c.id)}">Eliminar</button>` : ""}
      </article>`).join(""));
  }

  form.addEventListener("submit", async e => {
    e.preventDefault();
    msg.textContent = "";
    const btn = form.querySelector(".admin-btn");
    btn.disabled = true;
    try { cards = await post(new FormData(form)); close(); render(); }
    catch (err) { msg.textContent = err.message; }
    btn.disabled = false;
  });

  grid.addEventListener("click", async e => {
    const b = e.target.closest(".admin-del");
    if (!b || !confirm("Eliminar este cartão?")) return;
    const fd = new FormData();
    fd.append("action", "delete");
    fd.append("id", b.dataset.id);
    try { cards = await post(fd); render(); } catch (err) { alert(err.message); }
  });

  document.addEventListener("admin-ready", render);
  fetch(api, { credentials: "same-origin" })
    .then(r => r.text()).then(t => { const d = parse(t); if (Array.isArray(d)) { cards = d; render(); } })
    .catch(() => {}); // sem PHP: ficam só os cartões do HTML
})();