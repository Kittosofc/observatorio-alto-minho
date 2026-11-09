// Carregar ANTES de app.js. Ficheiro editável à mão (catalog-data.js e indicator-values.js são gerados).
// Correções manuais por indicador (chave = nome original no catálogo): permite mudar o nome
// mostrado ou a descrição sem mexer nos ficheiros gerados (catalog-data.js / indicator-values.js).
// Tudo o que se pode editar por indicador fica aqui (chave = nome original no catálogo):
//   name        -> nome mostrado
//   description -> descrição (caixa "Indicador selecionado")
//   dimension   -> "Leitura"
//   area        -> categoria (filtros da tabela): uma de categoryList
//   sub         -> subcategoria (só Demografia): uma de demografiaSubs
//   tab         -> separador da página inicial: Demografia, Habitação, Emprego, Educação, Saúde, Coesão social ou Outros

const catalogOverrides = {
  "Superfície Km2": {
    name:"Superfície Km2",
    description:"Superfície das unidades territoriais por Localização geográfica.",
    dimension:"Superfície do território",
    area:"Demografia",
    tab:"Outros"
  },
  "Índice de envelhecimento": {
    name:"Índice de envelhecimento",
    description:"Onde há mais e menos idosos por 100 jovens",
    dimension:"Pessoas com 65+ anos por 100 jovens",
    area:"Demografia",
    sub:"População",
    tab:"Demografia"
  },
  "Saldo Natural": {
    name:"Saldo Natural",
    description:"Onde há maior e menor diferença entre o número de nascimentos e de mortes.",
    dimension:"Saldo natural anual",
    area:"Demografia",
    sub:"Natalidade",
    tab:"Demografia"
  },
  "Densidade populacional": {
    name:"Densidade populacional",
    description:"Qual a densidade populacional por município",
    dimension:"Habitantes por km²",
    area:"Demografia",
    sub:"População",
    tab:"Demografia"
  },
  "População residente: total 2015 a 2025": {
    name:"Variação população",
    description:"Número de pessoas com residência habitual no território.",
    dimension:"Total",
    area:"Demografia",
    sub:"População",
    tab:"Demografia"
  },
  "Índice de dependência idosos": {
    name:"Dependência idosos",
    description:"Onde há mais e menos idosos por 100 pessoas em idade ativa.",
    dimension:"Pessoas idosas por 100 pessoas em idade ativa",
    area:"Demografia",
    sub:"População",
    tab:"Demografia"
  },
  "Índice de dependência de jovens": {
    name:"Dependência de jovens",
    description:"Onde há mais e menos jovens por 100 pessoas em idade ativa.",
    dimension:"Jovens por 100 pessoas em idade ativa",
    area:"Demografia",
    sub:"População",
    tab:"Demografia"
  },
  "Índice de Longividade": {
    name:"Índice de longevidade",
    description:"Onde há mais e menos pessoas com 75 e mais anos por 100 idosos.",
    dimension:"População com 75+ anos por 100 pessoas com 65+ anos",
    area:"Demografia",
    sub:"Esperança de Vida",
    tab:"Demografia"
  },
  "Nº de índividuos em idade ativa por idoso": {
    name:"Número de indivíduos em idade ativa por idosos",
    description:"Número de indivíduos em idade ativa por idosos.",
    dimension:"Pessoas em idade ativa por pessoa idosa",
    area:"Demografia",
    sub:"População",
    tab:"Demografia"
  },
  "Obitos por algumas causas de morte (%)": {
    name:"Causas de morte",
    description:"Onde morre maior e menor percentagem de pessoas por cancro, diabetes, por doenças do aparelho circulatório, por acidente ou suicídio.",
    dimension:"Doenças do aparelho circulatório",
    area:"Saúde",
    tab:"Demografia"
  },
  "Obitos por residentes total e por grupo etário": {
    name:"Óbitos de residentes",
    description:"Onde há mais e menos mortes.",
    dimension:"Total",
    area:"Demografia",
    sub:"Esperança de Vida",
    tab:"Demografia"
  },
  "Taxa bruta de natalidade": {
    name:"Taxa bruta de natalidade",
    description:"Onde nascem mais e menos bebés por 1.000 residentes.",
    dimension:"por mil habitantes",
    area:"Demografia",
    sub:"Natalidade",
    tab:"Demografia"
  },
  "Taxa bruta de mortalidade": {
    name:"Taxa bruta de mortalidade",
    description:"Onde morrem mais e menos pessoas por 1.000 residentes",
    dimension:"Óbitos por mil habitantes",
    area:"Demografia",
    sub:"Esperança de Vida",
    tab:"Demografia"
  },
  "População estrangeira com estatuto legal de residente: total e por algumas nacionalidades": {
    name:"Nacionalidades",
    description:"Onde há mais e menos cidadãos estrangeiros a viver, por principais países de origem.",
    dimension:"Total",
    area:"Demografia",
    sub:"Migração",
    tab:"Demografia"
  },
  "Saldo Migratório": {
    name:"Saldo migratório",
    description:"Diferença anual entre o número de entradas e saídas por migração no território.",
    dimension:"Saldo migratório anual",
    area:"Demografia",
    sub:"Migração",
    tab:"Demografia"
  },
  "Preço médio m²": {
    name:"Valor de venda de habitação",
    description:"Valor mediano de venda por metro quadrado no mercado habitacional.",
    dimension:"Valor mediano de venda",
    area:"Habitação",
    tab:"Habitação"
  },
  "Desempregados inscritos nos centros de emprego e de formação profissional no total da população residente com 15 a 64 anos (%)": {
    name:"Percentagem de desemprego",
    description:"Onde maior e menor percentagem de pessoas entre os 15 e os 64 anos registadas no IEFP à procura de emprego.",
    dimension:"Total",
    area:"Habitação",
    tab:"Emprego"
  },
  "Desempregados inscritos nos centros de emprego e de formação profissional (média anual): total e por grupo etário": {
    name:"Desempregados inscritos nos centros de emprego e de formação profissional",
    description:"Onde há mais e menos pessoas registadas no IEFP à procura de emprego, por idades.",
    dimension:"Média anual",
    area:"Habitação",
    tab:"Emprego"
  },
  "Rendimento médio": {
    name:"Ganho médio mensal",
    description:"Ganho médio mensal dos trabalhadores por conta de outrem.",
    dimension:"Ganho médio mensal",
    area:"Habitação",
    tab:"Emprego"
  },
  "Taxa de retenção e desistência no ensino básico: total e por ano de escolaridade": {
    name:"Retenção no ensino básico",
    description:"Onde há mais e menos percentagem de alunos matriculados do 1.º ao 9.º ano que reprovam ou desistem.",
    dimension:"Total do ensino básico",
    area:"Educação",
    tab:"Educação"
  },
  "Taxa de retenção e desistência no ensino secundário: total, por modalidade de ensino e ano de escolaridade": {
    name:"Retenção no ensino secundário",
    description:"Onde há mais e menos alunos matriculados do 10.º ao 12.º ano que reprovam ou desistem.",
    dimension:"Total do ensino secundário",
    area:"Educação",
    tab:"Educação"
  },
  "Estabelecimentos nos ensinos pré-escolar, básico e secundário: por nível de ensino": {
    name:"Estabelecimentos de ensino",
    description:"Onde há mais e menos escolas do pré-escolar, básico ou secundário.",
    dimension:"Total e por nível escolar",
    area:"Educação",
    tab:"Educação"
  },
  "Taxa de analfabetismo": {
    name:"Taxa de analfabetismo",
    description:"Percentagem da população residente que não sabe ler nem escrever.",
    dimension:"Percentagem",
    area:"Educação",
    tab:"Habitação"
  },
  "Habitantes por médico e farmacêutico": {
    name:"Habitantes por médico",
    description:"Número médio de habitantes por médico.",
    dimension:"Habitantes por médico",
    area:"Saúde",
    tab:"Saúde"
  },
  "Habitantes por farmácia e posto farmacêutico móvel": {
    name:"Habitantes por farmácia",
    description:"Onde há mais e menos pessoas, em média, por estabelecimento farmacêutico",
    dimension:"Habitantes por farmácia/posto",
    area:"Saúde",
    tab:"Saúde"
  },
  "Profissionais de saúde: médicos, dentistas, enfermeiros e farmacêuticos": {
    name:"Profissionais saúde",
    description:"Onde há mais e menos médicos, dentistas, enfermeiros ou farmacêuticos.",
    dimension:"Total das quatro profissões",
    area:"Saúde",
    tab:"Saúde"
  },
  "Beneficiários do Rendimento Mínimo Garantido e Rendimento Social de Inserção da Segurança Social: total e por sexo": {
    name:"Beneficiários do Rendimento Mínimo Garantido e Rendimento Social de Inserção da Segurança Social",
    description:"Onde há mais e menos homens ou mulheres a receber o apoio da Segurança Social para famílias mais carenciadas",
    dimension:"Total e sexo",
    area:"Social",
    tab:"Coesão social"
  },
  "Pensões da Segurança Social: total, de sobrevivência, de invalidez e de velhice": {
    name:"Pensões SS",
    description:"Onde paga a Segurança Social mais e menos pensões de velhice, invalidez ou sobrevivência.",
    dimension:"Total",
    area:"Social",
    tab:"Coesão social"
  },
  "Subsídio por assistência à 3ª pessoa da Segurança Social": {
    name:"Subsídios 3ª pessoa",
    description:"Onde há mais e menos pessoas a receber o apoio da Segurança Social às famílias com crianças e adultos deficientes que exigem acompanhamento permanente.  ",
    dimension:"Total",
    area:"Social",
    tab:"Coesão social"
  },
  "Pensões: total, da Segurança Social e da Caixa Geral de Aposentações": {
    name:"Pensões totais",
    description:"Onde pagam a Segurança Social e a CGA mais e menos pensões, como as de velhice, aposentação, reforma, invalidez ou sobrevivência.",
    dimension:"Total",
    area:"Social",
    tab:"Coesão social"
  },
  "Beneficiários do subsídio de desemprego da Segurança Social no total de beneficiários ativos (%)": {
    name:"Subsídio desempregado",
    description:"Onde há mais e menos homens ou mulheres desempregados a receber apoio da Segurança Social, por 100 contribuintes.",
    dimension:"Total",
    area:"Social",
    tab:"Coesão social"
  },
  "Beneficiários do Rendimento Mínimo Garantido e Rendimento Social de Inserção da Segurança Social no total da população residente com 15 e mais anos (%)": {
    name:"RSI",
    description:"Onde há mais e menos pessoas a receber o apoio da Segurança Social para famílias mais carenciadas, por 100 residentes.",
    dimension:"Total",
    area:"Social",
    tab:"Coesão social"
  },
  "Abono de família para crianças e jovens da Segurança Social": {
    name:"Abono de família",
    description:"Onde há mais e menos famílias, crianças e jovens a receber o apoio da Segurança Social para sustento e educação dos filhos.",
    dimension:"Total",
    area:"Social",
    tab:"Coesão social"
  },
  "Caixa Geral de Aposentações: reformados/aposentados e pensionistas": {
    name:"Reformados CGA",
    description:"Onde há mais e menos pessoas a receber pensões de reforma,de aposentação ou outras da CGA.",
    dimension:"Total",
    area:"Social",
    tab:"Coesão social"
  },
  "Pop. Estrangeira c/ estatuto residente": {
    name:"População estrangeira total",
    description:"Onde há mais e menos cidadãos estrangeiros a viver em Portugal no total.",
    dimension:"Total",
    area:"Demografia",
    sub:"Migração",
    tab:"Coesão social"
  },
  "% famílias monoparentais": {
    name:"Núcleos familiares monoparentais",
    description:"Número de núcleos familiares monoparentais registados.",
    dimension:"Núcleos familiares monoparentais (N.º)",
    area:"Social",
    sub:"",
    tab:"Demografia"
  },
  "Proporção de pop. residente em movimentos pendulares": {
    name:"Movimentos pendulares",
    description:"Proporção da população residente que sai da unidade territorial.",
    dimension:"População em movimentos pendulares",
    area:"Território",
    tab:"Emprego"
  },
  "Despesa das Câmaras Municipais em cultura e desporto: total, correntes e de capital": {
    name:"Despesa das Câmaras Municipais em cultura e desporto",
    description:"Que autarquias gastam mais e menos em despesas correntes ou em investimento e noutras despesas de capital na área da cultura e desporto",
    dimension:"Despesa total",
    area:"Território",
    tab:"Outros"
  },
  "Poder de compra per capita": {
    name:"Poder de compra",
    description:"Onde há, em média, por pessoa, maior e menor bem estar material?",
    dimension:"Portugal = 100",
    area:"Habitação",
    tab:"Outros"
  },
  "Crimes registados pelas polícias por mil habitantes": {
    name:"Crimes registados",
    description:"Onde há mais e menos crimes por 1.000 residentes, segundo as polícias. ",
    dimension:"Crimes por mil habitantes",
    area:"Território",
    tab:"Outros"
  },
  "Freguesias": {
    name:"Número de Freguesias",
    description:"Onde há mais e menos freguesias",
    dimension:"Total",
    area:"Demografia",
    tab:"Outros"
  },
  "Índice de dependência total": {
    name:"Dependência total decomposta",
    description:"Onde há mais e menos jovens e idosos por 100 pessoas em idade ativa.",
    dimension:"Jovens e idosos por 100 pessoas em idade ativa",
    area:"Demografia",
    sub:"População",
    tab:"Demografia"
  },
  "População residente: total e por sexo": {
    name:"População residente por sexo",
    description:"Onde há mais e menos homens ou mulheres.",
    dimension:"Total e por sexo",
    area:"Demografia",
    sub:"População",
    tab:"Demografia"
  },
  "Ganho médio mensal dos trabalhadores por conta de outrem: total e por sexo": {
    name:"Ganho médio por sexo",
    description:"Onde é maior e menor o ordenado médio, por mês, com horas extra, subsídios ou prémios, dos homens ou mulheres aprendizes, quadros médios e superiores ou outros empregados.",
    dimension:"Total",
    area:"Habitação",
    tab:"Emprego"
  },
  "Beneficiários do Rendimento Mínimo Garantido e Rendimento Social de Inserção da Segurança Social: total e por grupo etário": {
    name:"RSI: grupo etário",
    description:"Onde há mais e menos pessoas, por idades, a receber o apoio da Segurança Social para famílias mais carenciadas.",
    dimension:"Total ",
    area:"Social",
    tab:"Coesão social"
  },
  "População estrangeira com estatuto legal de residente: total e por sexo": {
    name:"População estrangeira por sexo",
    description:"Onde vivem mais e menos cidadãos estrangeiros, homens ou mulheres.",
    dimension:"Total",
    area:"Demografia",
    sub:"Migração",
    tab:"Coesão social"
  },
  "Saldo Total": {
    name:"Saldos populacionais",
    description:"Onde há maior e menor diferença entre o número de nascimentos e de mortes (saldo natural) e entre o número de imigrantes e de emigrantes (saldo migratório).",
    dimension:"Saldo total anual",
    area:"Demografia",
    sub:"Migração",
    tab:"Demografia"
  },
  "Habitantes por farmacêutico": {
    name:"Habitantes por farmacêutico",
    description:"Número médio de habitantes por farmacêutico.",
    dimension:"Habitantes por farmacêutico",
    area:"Saúde",
    tab:"Saúde"
  }

};