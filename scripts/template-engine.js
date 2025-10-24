/* ======================================
   TEMPLATE ENGINE
   Carrega templates e substitui dados
   ====================================== */

// Carregar template HTML
async function loadTemplate(templateType) {
    const filename = templateType === 'triathlon' ? 'triathlon-template.html' : 'corrida-template.html';

    const response = await fetch(filename);
    if (!response.ok) {
        throw new Error(`Erro ao carregar template: ${filename}`);
    }

    return await response.text();
}

// Renderizar template com dados
function renderTemplate(templateHTML, data, templateType) {
    let html = templateHTML;

    if (templateType === 'triathlon') {
        html = renderTriathlonTemplate(html, data);
    } else if (templateType === 'corrida') {
        html = renderCorridaTemplate(html, data);
    }

    return html;
}

// Renderizar template Triathlon
function renderTriathlonTemplate(html, data) {
    // ==========================================
    // SUBSTITUIÇÃO COM PLACEHOLDERS (SEM REGEX PERIGOSOS)
    // ==========================================

    // Informações básicas
    html = html.replace(/{{ATHLETE_NAME}}/g, data.athleteName);
    html = html.replace(/{{EVENT_NAME}}/g, data.eventName);
    html = html.replace(/{{EVENT_DATE}}/g, data.eventDate);
    html = html.replace(/{{EVENT_LOCATION}}/g, data.eventLocation);

    // Métricas gerais
    html = html.replace(/{{TOTAL_WEEKS}}/g, data.totalWeeks);
    html = html.replace(/{{TOTAL_HOURS}}/g, data.totalHours);
    html = html.replace(/{{TOTAL_WORKOUTS}}/g, data.totalWorkouts);

    // Natação - Métricas
    html = html.replace(/{{SWIM_WORKOUTS}}/g, data.swim.workouts);
    html = html.replace(/{{SWIM_TOTAL_KM}}/g, data.swim.totalKm);
    html = html.replace(/{{SWIM_AVG_PACE}}/g, data.swim.avgPace);
    html = html.replace(/{{SWIM_BEST_WORKOUT}}/g, data.swim.bestWorkout);

    // Ciclismo - Métricas
    html = html.replace(/{{BIKE_WORKOUTS}}/g, data.bike.workouts);
    html = html.replace(/{{BIKE_TOTAL_KM}}/g, data.bike.totalKm);
    html = html.replace(/{{BIKE_AVG_SPEED}}/g, data.bike.avgSpeed);
    html = html.replace(/{{BIKE_BEST_WORKOUT}}/g, data.bike.bestWorkout);

    // Corrida - Métricas
    html = html.replace(/{{RUN_WORKOUTS}}/g, data.run.workouts);
    html = html.replace(/{{RUN_TOTAL_KM}}/g, data.run.totalKm);
    html = html.replace(/{{RUN_AVG_PACE}}/g, data.run.avgPace);
    html = html.replace(/{{RUN_BEST_WORKOUT}}/g, data.run.bestWorkout);

    // ==========================================
    // TABELAS HTML DINÂMICAS
    // ==========================================
    html = html.replace('{{SWIM_WORKOUTS_TABLE}}', data.swimWorkoutsTableHTML || '<p>Nenhum dado disponível</p>');
    html = html.replace('{{SWIM_ZONE_TEMPO_ANALYSIS}}', data.swimZoneTempoHTML || '');

    html = html.replace('{{BIKE_WORKOUTS_TABLE}}', data.bikeWorkoutsTableHTML || '<p>Nenhum dado disponível</p>');
    html = html.replace('{{BIKE_ZONE_TEMPO_ANALYSIS}}', data.bikeZoneTempoHTML || '');

    html = html.replace('{{RUN_WORKOUTS_TABLE}}', data.runWorkoutsTableHTML || '<p>Nenhum dado disponível</p>');
    html = html.replace('{{RUN_RACE_PACE_ANALYSIS}}', data.runRacePaceHTML || '');
    html = html.replace('{{BRICK_RUNS_ANALYSIS}}', data.brickRunsHTML || '');

    // CENÁRIOS DE PROVA
    if (data.raceScenariosHTML) {
        // Meta A
        html = html.replace(/{{META_A_SWIM_TIME}}/g, data.raceScenariosHTML.metaA.swimMin + '-' + data.raceScenariosHTML.metaA.swimMax);
        html = html.replace(/{{META_A_SWIM_PACE}}/g, data.raceScenariosHTML.metaA.swimPaceMin + '-' + data.raceScenariosHTML.metaA.swimPaceMax);
        html = html.replace(/{{META_A_BIKE_TIME}}/g, data.raceScenariosHTML.metaA.bikeMin + '-' + data.raceScenariosHTML.metaA.bikeMax);
        html = html.replace(/{{META_A_BIKE_SPEED}}/g, data.raceScenariosHTML.metaA.bikeSpeedMin + '-' + data.raceScenariosHTML.metaA.bikeSpeedMax);
        html = html.replace(/{{META_A_RUN_TIME}}/g, data.raceScenariosHTML.metaA.runMin + '-' + data.raceScenariosHTML.metaA.runMax);
        html = html.replace(/{{META_A_RUN_PACE}}/g, data.raceScenariosHTML.metaA.runPaceMin + '-' + data.raceScenariosHTML.metaA.runPaceMax);
        html = html.replace(/{{META_A_TOTAL_TIME}}/g, data.raceScenariosHTML.metaA.totalMin + '-' + data.raceScenariosHTML.metaA.totalMax);

        // Meta B
        html = html.replace(/{{META_B_SWIM_TIME}}/g, data.raceScenariosHTML.metaB.swimMin + '-' + data.raceScenariosHTML.metaB.swimMax);
        html = html.replace(/{{META_B_SWIM_PACE}}/g, data.raceScenariosHTML.metaB.swimPaceMin + '-' + data.raceScenariosHTML.metaB.swimPaceMax);
        html = html.replace(/{{META_B_BIKE_TIME}}/g, data.raceScenariosHTML.metaB.bikeMin + '-' + data.raceScenariosHTML.metaB.bikeMax);
        html = html.replace(/{{META_B_BIKE_SPEED}}/g, data.raceScenariosHTML.metaB.bikeSpeedMin + '-' + data.raceScenariosHTML.metaB.bikeSpeedMax);
        html = html.replace(/{{META_B_RUN_TIME}}/g, data.raceScenariosHTML.metaB.runMin + '-' + data.raceScenariosHTML.metaB.runMax);
        html = html.replace(/{{META_B_RUN_PACE}}/g, data.raceScenariosHTML.metaB.runPaceMin + '-' + data.raceScenariosHTML.metaB.runPaceMax);
        html = html.replace(/{{META_B_TOTAL_TIME}}/g, data.raceScenariosHTML.metaB.totalMin + '-' + data.raceScenariosHTML.metaB.totalMax);

        // Meta C
        html = html.replace(/{{META_C_SWIM_TIME}}/g, data.raceScenariosHTML.metaC.swimMin + '-' + data.raceScenariosHTML.metaC.swimMax);
        html = html.replace(/{{META_C_SWIM_PACE}}/g, data.raceScenariosHTML.metaC.swimPaceMin + '-' + data.raceScenariosHTML.metaC.swimPaceMax);
        html = html.replace(/{{META_C_BIKE_TIME}}/g, data.raceScenariosHTML.metaC.bikeMin + '-' + data.raceScenariosHTML.metaC.bikeMax);
        html = html.replace(/{{META_C_BIKE_SPEED}}/g, data.raceScenariosHTML.metaC.bikeSpeedMin + '-' + data.raceScenariosHTML.metaC.bikeSpeedMax);
        html = html.replace(/{{META_C_RUN_TIME}}/g, data.raceScenariosHTML.metaC.runMin + '-' + data.raceScenariosHTML.metaC.runMax);
        html = html.replace(/{{META_C_RUN_PACE}}/g, data.raceScenariosHTML.metaC.runPaceMin + '-' + data.raceScenariosHTML.metaC.runPaceMax);
        html = html.replace(/{{META_C_TOTAL_TIME}}/g, data.raceScenariosHTML.metaC.totalMin + '-' + data.raceScenariosHTML.metaC.totalMax);
    }

    // Injetar dados reais dos gráficos
    const chartDataScript = `
    <script>
        // Dados reais do CSV injetados no template
        window.REAL_CHART_DATA = ${JSON.stringify(data.chartData)};
    </script>`;

    // Inserir antes do script do dashboard
    html = html.replace('<!-- DASHBOARD VISUAL - JavaScript -->', chartDataScript + '\n    <!-- DASHBOARD VISUAL - JavaScript -->');

    return html;
}

// Renderizar template Corrida
function renderCorridaTemplate(html, data) {
    // Substituir informações básicas
    html = html.replace(/Chicago Marathon 2025/g, data.eventName);
    html = html.replace(/Cauê Todeschini/g, data.athleteName);
    html = html.replace(/12 de Outubro 2025/g, data.eventDate);

    // Substituir métricas (TODOS os lugares)
    html = html.replace(/\b53\b/g, data.totalWorkouts);
    html = html.replace(/775/g, data.totalKm);
    html = html.replace(/67\.8/g, data.totalHours);
    html = html.replace(/5:15\/km/g, data.avgPace);
    html = html.replace(/\b145\b/g, data.avgHR);

    // Substituir métricas no rodapé
    html = html.replace(/Este relatório foi desenvolvido com base nos dados de treino de Cauê Todeschini/g,
        `Este relatório foi desenvolvido com base nos dados de treino de ${data.athleteName}`);

    // Substituir período de preparação e metas
    html = html.replace(/Julho - Setembro/g, 'Período de Preparação');
    html = html.replace(/Julho - Setembro 2025/g, 'Período de Preparação');

    // Substituir projeções e metas
    if (data.projectedTime) {
        html = html.replace(/3:30:00/g, data.projectedTime);
        html = html.replace(/3h20 - 3h25/g, data.projectedTime);
    }
    if (data.targetPace) {
        html = html.replace(/5:00\/km/g, data.targetPace);
    }

    // Injetar dados reais dos gráficos
    const chartDataScript = `
    <script>
        // Dados reais do CSV injetados no template
        window.REAL_CHART_DATA = ${JSON.stringify(data.chartData)};
    </script>`;

    // Inserir antes do script do dashboard
    html = html.replace('<!-- DASHBOARD VISUAL - JavaScript -->', chartDataScript + '\n    <!-- DASHBOARD VISUAL - JavaScript -->');

    return html;
}

// Download HTML gerado
function downloadHTML(html, filename) {
    const blob = new Blob([html], { type: 'text/html; charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    URL.revokeObjectURL(url);
}

// Abrir HTML em nova aba
function openInNewTab(html) {
    const blob = new Blob([html], { type: 'text/html; charset=utf-8' });
    const url = URL.createObjectURL(blob);

    window.open(url, '_blank');

    // Limpar após 1 minuto
    setTimeout(() => URL.revokeObjectURL(url), 60000);
}
