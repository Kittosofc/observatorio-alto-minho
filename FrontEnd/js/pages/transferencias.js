// Página Documentos: lista vinda do PHP; o admin pode adicionar e eliminar.
(function () {
  const grid = document.querySelector(".doc-grid");
  if (!grid) return;
  const api = (window.observatorioBackend || "../../Backend/php/") + "documentos.php";
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  let docs = null;

  // Botão "Criar documento" (só admin) + pop-up
  const bar = document.createElement("div");
  bar.className = "doc-toolbar";
  bar.hidden = true;
  bar.innerHTML = `<button class="doc-create" type="button">+ Criar documento</button>`;
  grid.before(bar);

  const box = document.createElement("div");
  box.className = "doc-modal";
  box.hidden = true;
  box.innerHTML = `
    <form class="doc-dialog" role="dialog" aria-modal="true" aria-labelledby="doc-dlg-title">
      <button class="doc-x" type="button" aria-label="Fechar">×</button>
      <h3 id="doc-dlg-title">Novo documento</h3>
      <input type="hidden" name="action" value="add">
      <label>Título<input name="title" maxlength="120" placeholder="Ex.: Relatório anual 2025" required></label>
      <label>Descrição<textarea name="description" maxlength="400" rows="3" placeholder="Breve descrição do documento"></textarea></label>
      <label class="doc-drop">
        <input name="pdf" type="file" accept="application/pdf,.pdf" required>
        <span class="doc-drop-ico">⬆</span>
        <span class="doc-drop-txt">Arrasta o PDF para aqui ou <u>escolhe um ficheiro</u></span>
        <span class="doc-drop-name"></span>
      </label>
      <p class="admin-msg" role="alert"></p>
      <div class="doc-actions">
        <button class="doc-cancel" type="button">Cancelar</button>
        <button class="admin-btn" type="submit">Adicionar</button>
      </div>
    </form>`;
  document.body.appendChild(box);
  const form = box.querySelector("form");
  const msg = box.querySelector(".admin-msg");
  const fileIn = form.querySelector("input[type=file]");
  const fileName = form.querySelector(".doc-drop-name");
  const drop = form.querySelector(".doc-drop");
  const open = () => { box.hidden = false; form.title.focus(); };
  const close = () => { box.hidden = true; form.reset(); fileName.textContent = ""; msg.textContent = ""; };
  bar.querySelector(".doc-create").addEventListener("click", open);
  box.querySelector(".doc-x").addEventListener("click", close);
  box.querySelector(".doc-cancel").addEventListener("click", close);
  box.addEventListener("mousedown", e => { if (e.target === box) close(); });
  document.addEventListener("keydown", e => { if (e.key === "Escape" && !box.hidden) close(); });
  fileIn.addEventListener("change", () => { fileName.textContent = fileIn.files[0] ? fileIn.files[0].name : ""; });
  ["dragenter", "dragover"].forEach(t => drop.addEventListener(t, e => { e.preventDefault(); drop.classList.add("over"); }));
  ["dragleave", "drop"].forEach(t => drop.addEventListener(t, () => drop.classList.remove("over")));

  async function post(fd) {
    fd.append("csrf", window.observatorioAdmin.csrf);
    const r = await fetch(api, { method: "POST", body: fd, credentials: "same-origin" });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.error || "Erro no servidor.");
    return j;
  }

  function render() {
    const adm = !!(window.observatorioAdmin && window.observatorioAdmin.admin);
    bar.hidden = !adm;
    if (!docs) return;
    grid.innerHTML = docs.map(d => `
      <article class="doc-card">
        <img class="doc-thumb" src="../imgs/images.png" alt="Pré-visualização de ${esc(d.title)}" loading="lazy">
        <div class="doc-body">
          <h3>${esc(d.title)}</h3>
          <p>${esc(d.description)}</p>
          <a class="doc-btn" href="../docs/${encodeURIComponent(d.file)}" download="${esc(d.file)}">Transferir PDF</a>
          ${adm ? `<button class="admin-del" type="button" data-id="${esc(d.id)}">Eliminar</button>` : ""}
        </div>
      </article>`).join("");
  }

  form.addEventListener("submit", async e => {
    e.preventDefault();
    msg.textContent = "";
    const btn = form.querySelector(".admin-btn");
    btn.disabled = true;
    try { docs = await post(new FormData(form)); close(); render(); }
    catch (err) { msg.textContent = err.message; }
    btn.disabled = false;
  });

  grid.addEventListener("click", async e => {
    const b = e.target.closest(".admin-del");
    if (!b || !confirm("Eliminar este documento?")) return;
    const fd = new FormData();
    fd.append("action", "delete");
    fd.append("id", b.dataset.id);
    try { docs = await post(fd); render(); } catch (err) { alert(err.message); }
  });

  document.addEventListener("admin-ready", render);
  fetch(api, { credentials: "same-origin" })
    .then(r => r.json()).then(d => { docs = d; render(); })
    .catch(() => {}); // sem PHP: mantém os documentos escritos no HTML
})();