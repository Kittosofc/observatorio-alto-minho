# Estrutura do Observatório Alto Minho

## Ficheiros principais
- `index.html` — página inicial / Retrato e estrutura HTML principal.
- `app.js` — núcleo partilhado: catálogo, território selecionado, renderização comum e eventos partilhados.
- `style.css` — estilos globais e componentes comuns.

## FrontEnd
- `FrontEnd/html/` — páginas específicas: Indicadores, Comparar, Metodologia, Documentos e Município.
- `FrontEnd/css/` — estilos específicos por página (`indicadores.css`, `municipio.css`, `paginas.css`, `transferencias.css`).
- `FrontEnd/js/` — módulos específicos e dados locais. `indicadores.js` trata do modal da página Indicadores; `comparar.js` da comparação; `municipio.js` do Retrato e das páginas municipais.
- `FrontEnd/imgs/` — imagens e ícones.
- `data/` e `scripts/` — fontes de dados e processos de atualização.

## Regras de manutenção
1. Antes de criar uma função, verificar se já existe uma função partilhada em `app.js`.
2. Não duplicar funções utilitárias; acrescentar ou reutilizar uma implementação comum.
3. Manter lógica exclusiva de uma página no respetivo módulo.
4. Comentar responsabilidades e decisões não óbvias, evitando comentários redundantes.
5. Os ficheiros `catalog-data.js`, `indicator-values.js` e `map-data.js` são dados gerados/estruturados; evitar editar manualmente quando forem atualizados pelos scripts.
