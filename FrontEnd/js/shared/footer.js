// Carregar DEPOIS de app.js.
// ===== 8. RODAPÉ =====
// Rodapé partilhado: logo, email e redes sociais (injetado em todas as páginas).
(function renderFooter() {
  if (document.querySelector(".site-footer")) return;
  const logo = new URL("../../imgs/cim-alto-minho.svg", document.currentScript.src).href;
  const email = "example@gmail.com";
  const socials = [
    ["Facebook", "#", "M13.5 21v-7.5h2.6l.4-3h-3V8.6c0-.9.3-1.5 1.5-1.5h1.6V4.4c-.3 0-1.2-.1-2.3-.1-2.3 0-3.8 1.4-3.8 3.9v2.3H8v3h2.5V21z"],
    ["Instagram", "#", "M7.5 3h9A4.5 4.5 0 0 1 21 7.5v9a4.5 4.5 0 0 1-4.5 4.5h-9A4.5 4.5 0 0 1 3 16.5v-9A4.5 4.5 0 0 1 7.5 3zm0 1.8A2.7 2.7 0 0 0 4.8 7.5v9a2.7 2.7 0 0 0 2.7 2.7h9a2.7 2.7 0 0 0 2.7-2.7v-9a2.7 2.7 0 0 0-2.7-2.7zM12 7.8a4.2 4.2 0 1 1 0 8.4 4.2 4.2 0 0 1 0-8.4zm0 1.8a2.4 2.4 0 1 0 0 4.8 2.4 2.4 0 0 0 0-4.8zm4.6-3.3a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"],
    ["LinkedIn", "#", "M5 9h3v10H5zm1.5-4.5a1.7 1.7 0 1 1 0 3.4 1.7 1.7 0 0 1 0-3.4zM10 9h2.9v1.4c.5-.9 1.6-1.6 3.1-1.6 3 0 3.5 2 3.5 4.5V19h-3v-5c0-1.2 0-2.6-1.6-2.6S13 12.7 13 14v5h-3z"]
  ];
  const icons = socials.map(([n, u, d]) =>
    `<a href="${u}" aria-label="${n}"${u === "#" ? " onclick=\"return false\"" : " target=\"_blank\" rel=\"noopener\""}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="${d}"/></svg></a>`).join("");
  const el = document.createElement("footer");
  el.className = "site-footer";
  el.innerHTML = `
    <img class="footer-logo" src="${logo}" alt="CIM Alto Minho">
    <a class="footer-mail" href="mailto:${email}">${email}</a>
    <div class="footer-social"><span>Segue-nos</span>${icons}</div>`;
  const main = document.querySelector("main");
  main ? main.after(el) : document.body.appendChild(el);
})();