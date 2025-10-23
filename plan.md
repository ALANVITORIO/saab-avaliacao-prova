# 📋 PLANO CORRETO - SAAB SPORTS CSV TEMPLATE ENGINE
## Sistema de Geração de Relatórios de Treinos

---

## 🎯 OBJETIVO REAL

**NÃO criar um novo visualizador!**

**SIM criar um sistema que:**
1. Faz upload de CSV com dados do atleta
2. Permite escolher entre 2 templates EXISTENTES
3. SUBSTITUI dados hardcoded por dados do CSV
4. MANTÉM 100% o design/formatação original
5. Gera HTML final pronto para uso

---

## 📁 TEMPLATES EXISTENTES (NÃO MEXER NO DESIGN!)

### Template 1: **index.html** - TRIATHLON
```
Atleta exemplo: Sarah Lotif
Evento: Ironman 70.3 Florianópolis 2025
Design: Roxo/Magenta (#9C27B0, #E91E63)
Disciplinas: Natação, Ciclismo, Corrida
Layout: Cards com métricas, análise de cada disciplina, estratégia
```

**O QUE FAZER:**
- ✅ MANTER todo o CSS
- ✅ MANTER toda a estrutura HTML
- ✅ MANTER todos os gráficos/layout
- ✅ TRANSFORMAR dados fixos em variáveis
- ✅ POPULAR com dados do CSV

### Template 2: **chicago-marathon.html** - CORRIDA
```
Atleta exemplo: Cauê Todeschini
Evento: Maratona de Chicago 2025
Design: Azul (#002D72)
Disciplinas: Apenas Corrida
Layout: Estratégia de pace, nutrição, splits
```

**O QUE FAZER:**
- ✅ MANTER todo o CSS
- ✅ MANTER toda a estrutura HTML
- ✅ MANTER todos os gráficos/layout
- ✅ TRANSFORMAR dados fixos em variáveis
- ✅ POPULAR com dados do CSV

---

## 📊 DADOS DISPONÍVEIS NO CSV

### Arquivo de Exemplo: workouts-36.csv.html

**Colunas principais:**
- `Title` - Título do treino
- `WorkoutType` - Tipo (Run, Bike, Swim)
- `WorkoutDay` - Data
- `DistanceInMeters` - Distância
- `TimeTotalInHours` - Tempo
- `HeartRateAverage`, `HeartRateMax` - FC
- `PowerAverage`, `PowerMax` - Potência
- `CadenceAverage` - Cadência
- `VelocityAverage` - Velocidade
- `TSS` - Training Stress Score
- `IF` - Intensity Factor
- `Rpe` - Esforço percebido
- `HRZone1Minutes` até `HRZone10Minutes` - Zonas FC
- `PWRZone1Minutes` até `PWRZone10Minutes` - Zonas Potência
- `CoachComments` - Comentários do treinador
- `AthleteComments` - Comentários do atleta

**TOTAL:** ~45 colunas

---

## 🏗️ ARQUITETURA DO SISTEMA

### Estrutura de Arquivos

```
saab-rosana/
│
├── generator.html              # Página de upload e geração (NOVA)
├── templates/
│   ├── triathlon-template.js   # index.html convertido em template (NOVO)
│   └── marathon-template.js    # chicago-marathon.html convertido em template (NOVO)
├── scripts/
│   ├── csv-parser.js          # Parse do CSV
│   ├── data-mapper.js         # Mapeia CSV → Variáveis do template
│   └── template-engine.js     # Renderiza template com dados
│
├── index.html                 # Template original TRIATHLON (PRESERVAR)
├── chicago-marathon.html      # Template original CORRIDA (PRESERVAR)
└── workouts-36.csv.html       # Exemplo de dados (PRESERVAR)
```

---

## ⚙️ FLUXO DO SISTEMA

```
┌─────────────────────────────────────────────────┐
│ 1. PÁGINA DE UPLOAD (generator.html)           │
│    - Botão "Escolher CSV"                       │
│    - Escolher template: [Triathlon] [Corrida]  │
│    - Botão "Gerar Relatório"                    │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ 2. PROCESSAMENTO DO CSV                         │
│    - Papa Parse lê o arquivo                    │
│    - Extrai dados de todas as linhas            │
│    - Calcula agregações (total, médias, etc)    │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ 3. MAPEAMENTO DE DADOS                          │
│    - Separa por tipo (Run, Bike, Swim)          │
│    - Calcula métricas específicas               │
│    - Prepara objeto de variáveis                │
│                                                  │
│    Exemplo para Triathlon:                      │
│    {                                             │
│      athleteName: "Nome do Atleta",             │
│      eventName: "Ironman 70.3 ...",             │
│      swimDistance: "1.9 km",                     │
│      swimTime: "35min",                          │
│      bikeDistance: "90 km",                      │
│      bikeTime: "2h 45min",                       │
│      runDistance: "21.1 km",                     │
│      runTime: "1h 45min",                        │
│      ...                                         │
│    }                                             │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ 4. RENDERIZAÇÃO DO TEMPLATE                     │
│    - Carrega template escolhido                 │
│    - Substitui {{variavel}} por valores reais   │
│    - Mantém 100% do HTML/CSS original           │
│    - Gera gráficos com Chart.js                 │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ 5. EXIBIÇÃO/DOWNLOAD                            │
│    - Mostra preview do HTML gerado              │
│    - Opção: [Baixar HTML] [Abrir em nova aba]  │
└─────────────────────────────────────────────────┘
```

---

## 🔧 IMPLEMENTAÇÃO TÉCNICA

### PASSO 1: Converter Templates para Template Strings

#### index.html → triathlon-template.js

**ANTES (HTML fixo):**
```html
<h2>Ironman 70.3 Florianópolis 2025 | Atleta: Sarah Lotif</h2>
<div class="stat-value">35min</div>
<div class="stat-value">2h 45min</div>
```

**DEPOIS (Template com variáveis):**
```javascript
const triathlonTemplate = (data) => `
<h2>${data.eventName} | Atleta: ${data.athleteName}</h2>
<div class="stat-value">${data.swimTime}</div>
<div class="stat-value">${data.bikeTime}</div>
`;
```

#### chicago-marathon.html → marathon-template.js

**ANTES (HTML fixo):**
```html
<h1>Estratégia Chicago Marathon 2025 - Cauê Todeschini</h1>
<div class="pace-value">5:30 /km</div>
```

**DEPOIS (Template com variáveis):**
```javascript
const marathonTemplate = (data) => `
<h1>Estratégia ${data.eventName} - ${data.athleteName}</h1>
<div class="pace-value">${data.targetPace} /km</div>
`;
```

---

### PASSO 2: Mapear Dados do CSV para Variáveis do Template

#### Para Template TRIATHLON

**Dados necessários:**
```javascript
{
  // Informações básicas
  athleteName: string,
  eventName: string,
  eventDate: string,

  // Natação
  swimDistance: string,      // "1.9 km"
  swimTime: string,          // "35min"
  swimPace: string,          // "1:50 /100m"
  swimAvgHR: number,         // 145
  swimMaxHR: number,         // 165

  // Ciclismo
  bikeDistance: string,      // "90 km"
  bikeTime: string,          // "2h 45min"
  bikeAvgSpeed: string,      // "32.7 km/h"
  bikeAvgPower: number,      // 220
  bikeAvgHR: number,         // 155
  bikeFTP: number,           // 250

  // Corrida
  runDistance: string,       // "21.1 km"
  runTime: string,           // "1h 45min"
  runPace: string,           // "5:00 /km"
  runAvgHR: number,          // 165

  // Geral
  totalTime: string,         // "5h 05min"
  totalTSS: number,          // 285

  // Zonas (para gráficos)
  swimHRZones: [0,5,15,10,5,0,0,0,0,0],
  bikeHRZones: [...],
  bikePWRZones: [...],
  runHRZones: [...],

  // Comentários
  coachComments: string,
  strategy: string
}
```

#### Para Template CORRIDA

**Dados necessários:**
```javascript
{
  // Informações básicas
  athleteName: string,
  eventName: string,
  eventDate: string,

  // Corrida
  distance: string,          // "42.2 km"
  targetTime: string,        // "3h 30min"
  targetPace: string,        // "5:00 /km"

  // Splits (5km, 10km, 15km, etc)
  splits: [
    { km: "5", time: "25:00", pace: "5:00" },
    { km: "10", time: "50:00", pace: "5:00" },
    ...
  ],

  // Métricas
  avgHR: number,             // 165
  maxHR: number,             // 180
  avgCadence: number,        // 175

  // Nutrição
  nutrition: [
    { km: "0", item: "Gel energético" },
    { km: "10", item: "Isotônico" },
    ...
  ],

  // Zonas
  hrZones: [...],

  // Treinos históricos
  workouts: [
    { date: "...", distance: "...", pace: "..." },
    ...
  ],

  // Comentários
  coachComments: string,
  strategy: string
}
```

---

### PASSO 3: Processar CSV e Calcular Métricas

```javascript
// data-mapper.js

function processCSVForTriathlon(csvData) {
  // Separar por tipo
  const swimWorkouts = csvData.filter(w => w.WorkoutType === 'Swim');
  const bikeWorkouts = csvData.filter(w => w.WorkoutType === 'Bike');
  const runWorkouts = csvData.filter(w => w.WorkoutType === 'Run');

  // Calcular agregações
  const swimStats = calculateStats(swimWorkouts);
  const bikeStats = calculateStats(bikeWorkouts);
  const runStats = calculateStats(runWorkouts);

  // Montar objeto de dados
  return {
    athleteName: inferAthleteName(csvData),
    eventName: "Ironman 70.3 [Cidade]", // ou pedir ao usuário
    eventDate: "DD/MM/YYYY",

    swimDistance: formatDistance(swimStats.totalDistance),
    swimTime: formatTime(swimStats.totalTime),
    swimPace: calculateSwimPace(swimStats),
    swimAvgHR: swimStats.avgHR,

    bikeDistance: formatDistance(bikeStats.totalDistance),
    bikeTime: formatTime(bikeStats.totalTime),
    bikeAvgSpeed: calculateSpeed(bikeStats),
    bikeAvgPower: bikeStats.avgPower,

    runDistance: formatDistance(runStats.totalDistance),
    runTime: formatTime(runStats.totalTime),
    runPace: calculateRunPace(runStats),
    runAvgHR: runStats.avgHR,

    // Zonas agregadas
    swimHRZones: aggregateZones(swimWorkouts, 'HR'),
    bikeHRZones: aggregateZones(bikeWorkouts, 'HR'),
    bikePWRZones: aggregateZones(bikeWorkouts, 'PWR'),
    runHRZones: aggregateZones(runWorkouts, 'HR'),

    // Total
    totalTime: formatTime(swimStats.totalTime + bikeStats.totalTime + runStats.totalTime),
    totalTSS: swimStats.totalTSS + bikeStats.totalTSS + runStats.totalTSS
  };
}

function processCSVForMarathon(csvData) {
  const runWorkouts = csvData.filter(w => w.WorkoutType === 'Run');

  // Calcular métricas
  const stats = calculateStats(runWorkouts);

  // Gerar splits projetados
  const splits = projectMarathonSplits(stats);

  return {
    athleteName: inferAthleteName(csvData),
    eventName: "Maratona de [Cidade]",
    eventDate: "DD/MM/YYYY",

    distance: "42.2 km",
    targetTime: projectMarathonTime(stats),
    targetPace: calculateTargetPace(stats),

    splits: splits,

    avgHR: stats.avgHR,
    maxHR: stats.maxHR,
    avgCadence: stats.avgCadence,

    hrZones: aggregateZones(runWorkouts, 'HR'),

    workouts: formatWorkoutHistory(runWorkouts),

    nutrition: generateNutritionPlan(),

    coachComments: extractCoachComments(csvData),
    strategy: generateStrategy(stats)
  };
}
```

---

### PASSO 4: Template Engine

```javascript
// template-engine.js

function renderTemplate(templateType, data) {
  let template;

  if (templateType === 'triathlon') {
    template = triathlonTemplate(data);
  } else if (templateType === 'marathon') {
    template = marathonTemplate(data);
  }

  return template;
}

function downloadHTML(html, filename) {
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();

  URL.revokeObjectURL(url);
}
```

---

## 📝 TAREFAS DE IMPLEMENTAÇÃO

### FASE 1: Extrair e Preparar Templates
- [ ] Copiar index.html inteiro
- [ ] Identificar todos os dados hardcoded (nome, tempos, distâncias, etc)
- [ ] Substituir por placeholders `${data.variavel}`
- [ ] Criar triathlon-template.js com função que retorna HTML
- [ ] Copiar chicago-marathon.html inteiro
- [ ] Fazer o mesmo processo
- [ ] Criar marathon-template.js

### FASE 2: Criar Parser e Mapper
- [ ] Criar csv-parser.js (Papa Parse)
- [ ] Criar data-mapper.js
- [ ] Implementar processCSVForTriathlon()
- [ ] Implementar processCSVForMarathon()
- [ ] Implementar funções auxiliares (calculateStats, formatTime, etc)

### FASE 3: Criar Página de Geração
- [ ] Criar generator.html
- [ ] Interface de upload de CSV
- [ ] Seletor de template (radio buttons: Triathlon / Corrida)
- [ ] Inputs adicionais (nome do atleta, evento, data)
- [ ] Botão "Gerar Relatório"
- [ ] Preview do HTML gerado
- [ ] Botões: [Baixar HTML] [Abrir em nova aba]

### FASE 4: Integrar e Testar
- [ ] Conectar todos os módulos
- [ ] Testar com workouts-36.csv.html
- [ ] Verificar se HTML gerado fica IDÊNTICO ao original
- [ ] Testar gráficos Chart.js
- [ ] Testar responsividade
- [ ] Validar dados calculados

### FASE 5: Polimento
- [ ] Mensagens de erro amigáveis
- [ ] Loading states
- [ ] Validação de CSV
- [ ] Documentação de uso

---

## ✅ CRITÉRIOS DE SUCESSO

### ✅ Template Triathlon
- [ ] Design roxo/magenta IDÊNTICO ao index.html original
- [ ] Todas as seções presentes (natação, ciclismo, corrida)
- [ ] Gráficos funcionando
- [ ] Dados calculados corretamente do CSV
- [ ] Layout responsivo mantido

### ✅ Template Corrida
- [ ] Design azul IDÊNTICO ao chicago-marathon.html original
- [ ] Tabela de splits gerada
- [ ] Plano de nutrição
- [ ] Gráficos funcionando
- [ ] Dados calculados corretamente do CSV

### ✅ Sistema
- [ ] Upload de CSV funciona
- [ ] Seleção de template funciona
- [ ] Geração é instantânea
- [ ] HTML gerado é válido e completo
- [ ] Download funciona
- [ ] Preview funciona

---

## 🚨 REGRAS IMPORTANTES

### ❌ NÃO FAZER:
- ❌ NÃO criar novo design
- ❌ NÃO mudar cores dos templates
- ❌ NÃO alterar layout dos templates
- ❌ NÃO remover seções dos templates
- ❌ NÃO criar novos componentes visuais

### ✅ FAZER:
- ✅ PRESERVAR 100% o CSS original
- ✅ PRESERVAR 100% a estrutura HTML
- ✅ APENAS substituir dados fixos por variáveis
- ✅ CALCULAR métricas a partir do CSV
- ✅ MANTER todos os gráficos e animações

---

## 📦 RESULTADO FINAL ESPERADO

```
Cliente:
1. Acessa generator.html
2. Faz upload do CSV
3. Escolhe template (Triathlon OU Corrida)
4. Preenche: Nome do Atleta, Nome do Evento, Data
5. Clica "Gerar Relatório"
6. Vê preview do HTML gerado (IDÊNTICO ao template original)
7. Baixa HTML pronto
8. Abre no navegador → relatório lindo com dados do atleta
```

---

## 🎯 EXEMPLO VISUAL DO PROCESSO

### INPUT (CSV):
```csv
Title,WorkoutType,DistanceInMeters,TimeTotalInHours,...
Treino Natação,Swim,1900,0.583,...
Treino Bike,Bike,90000,2.75,...
Treino Corrida,Run,21100,1.75,...
```

### ESCOLHA:
```
[ • ] Template Triathlon
[   ] Template Corrida

Nome do Atleta: João Silva
Evento: Ironman 70.3 Brasília 2025
Data: 15/11/2025
```

### OUTPUT (HTML):
```html
<!-- EXATAMENTE IGUAL ao index.html mas com: -->
<h2>Ironman 70.3 Brasília 2025 | Atleta: João Silva</h2>
<div class="stat-value">35min</div>  <!-- calculado do CSV -->
<div class="stat-value">2h 45min</div>  <!-- calculado do CSV -->
<!-- ... resto IDÊNTICO ... -->
```

---

## 🛠️ STACK TECNOLÓGICO

- **HTML5** - Templates e página de geração
- **CSS3** - Dos templates originais (NÃO mexer)
- **JavaScript ES6+** - Template engine, parser, mapper
- **Papa Parse** - Parse de CSV
- **Chart.js** - Gráficos (já usado nos templates)

---

## ⏱️ ESTIMATIVA DE TEMPO

- **FASE 1**: Extrair templates - 2-3h
- **FASE 2**: Parser e Mapper - 3-4h
- **FASE 3**: Página de geração - 2-3h
- **FASE 4**: Integração e testes - 2-3h
- **FASE 5**: Polimento - 1-2h

**TOTAL: 10-15 horas**

---

## 📄 ENTREGÁVEIS

1. ✅ `generator.html` - Página de upload e geração
2. ✅ `templates/triathlon-template.js` - Template Triathlon
3. ✅ `templates/marathon-template.js` - Template Corrida
4. ✅ `scripts/csv-parser.js` - Parser CSV
5. ✅ `scripts/data-mapper.js` - Mapeamento de dados
6. ✅ `scripts/template-engine.js` - Engine de renderização
7. ✅ `README-GENERATOR.md` - Documentação de uso
8. ✅ Templates originais PRESERVADOS e funcionando

---

**Versão**: 2.0 (CORRIGIDA)
**Data**: 23/10/2025
**Status**: ✅ Pronto para implementação

---

## 💡 NOTA FINAL

**O OBJETIVO É:**
- Transformar os templates existentes em "moldes" reutilizáveis
- Permitir que qualquer CSV seja usado para gerar relatórios
- Manter a qualidade visual e profissionalismo dos templates originais
- Automatizar o que antes era manual (Claude criando artefatos)

**NÃO É:**
- Criar um novo visualizador
- Mudar o design
- Adicionar funcionalidades novas
- Criar uma aplicação complexa

**É SIMPLES:** CSV → Template → HTML Pronto! 🎉
