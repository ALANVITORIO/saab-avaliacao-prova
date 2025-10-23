# 🏃 SAAB Sports - Gerador de Relatórios

Sistema para gerar relatórios de treino personalizados a partir de arquivos CSV.

## 🎯 Como Usar

1. Abra o arquivo `generator.html` no navegador
2. Faça upload do arquivo CSV com os dados de treino
3. Escolha o template (Triathlon ou Corrida)
4. Preencha as informações do atleta e evento
5. Clique em "Gerar Relatório"
6. Baixe ou abra o HTML gerado

## 📁 Arquivos

- `generator.html` - Interface de geração
- `index.html` - Template Triathlon (NÃO EDITAR)
- `chicago-marathon.html` - Template Corrida (NÃO EDITAR)
- `workouts-36.csv.html` - Exemplo de CSV
- `scripts/` - Lógica do sistema
- `plan.md` - Documentação técnica

## 📊 Formato do CSV

O CSV deve conter as seguintes colunas:
- `WorkoutType` (obrigatório): Swim, Bike ou Run
- `DistanceInMeters`: Distância em metros
- `TimeTotalInHours`: Tempo em horas
- `VelocityAverage`: Velocidade média em m/s
- `PowerAverage`: Potência média em watts
- `HeartRateAverage`: FC média em bpm
- Outras colunas opcionais...

## ✅ Funcionalidades

- ✅ Upload de CSV com validação
- ✅ Dois templates profissionais (Triathlon e Corrida)
- ✅ Cálculo automático de métricas
- ✅ Geração de HTML pronto para uso
- ✅ Download direto ou visualização em nova aba
- ✅ 100% client-side (sem backend)

## 🎨 Templates

### Triathlon (index.html)
- Design roxo/magenta
- Análise de 3 disciplinas (Natação, Ciclismo, Corrida)
- Métricas agregadas por disciplina

### Corrida (chicago-marathon.html)
- Design azul
- Foco em corrida de rua/maratona
- Projeções de tempo e pace

## 🚀 Pronto!

O sistema está completo e pronto para uso. Abra `generator.html` e comece a gerar relatórios!

---

© 2025 SAAB Sports
