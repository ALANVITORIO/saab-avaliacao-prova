/* ======================================
   TEMPLATE ENGINE
   Carrega templates e substitui dados
   ====================================== */

// Carregar template HTML
async function loadTemplate(templateType) {
    const filename = templateType === 'triathlon' ? 'index.html' : 'chicago-marathon.html';

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
    } else if (templateType === 'marathon') {
        html = renderMarathonTemplate(html, data);
    }

    return html;
}

// Renderizar template Triathlon
function renderTriathlonTemplate(html, data) {
    // Substituir informações básicas
    html = html.replace(/Ironman 70\.3 Florianópolis 2025/g, data.eventName);
    html = html.replace(/Sarah Lotif/g, data.athleteName);
    html = html.replace(/26 de Outubro/g, data.eventDate);
    html = html.replace(/Praia dos Ingleses, SC/g, data.eventLocation);

    // Substituir métricas gerais
    html = html.replace(/11 semanas/g, `${data.totalWeeks} semanas`);
    html = html.replace(/113\.8 h/g, `${data.totalHours} h`);
    html = html.replace(/88 treinos/g, `${data.totalWorkouts} treinos`);

    // Substituir dados de Natação
    html = html.replace(/<span class="stat-value">21<\/span>/,
        `<span class="stat-value">${data.swim.workouts}</span>`);
    html = html.replace(/<span class="stat-value">51\.9 km<\/span>/,
        `<span class="stat-value">${data.swim.totalKm} km</span>`);
    html = html.replace(/<span class="stat-value">1:58\/100m<\/span>/,
        `<span class="stat-value">${data.swim.avgPace}</span>`);
    html = html.replace(/3\.5km - 1:51\/100m/g, data.swim.bestWorkout);

    // Substituir dados de Ciclismo
    html = html.replace(/<span class="stat-value">35<\/span>/,
        `<span class="stat-value">${data.bike.workouts}</span>`);
    html = html.replace(/<span class="stat-value">1,756 km<\/span>/,
        `<span class="stat-value">${data.bike.totalKm} km</span>`);
    html = html.replace(/<span class="stat-value">29\.8 km\/h<\/span>/,
        `<span class="stat-value">${data.bike.avgSpeed} km/h</span>`);
    html = html.replace(/150km - 37\.5km\/h/g, data.bike.bestWorkout);

    // Substituir dados de Corrida
    html = html.replace(/<span class="stat-value">32<\/span>/,
        `<span class="stat-value">${data.run.workouts}</span>`);
    html = html.replace(/<span class="stat-value">227\.8 km<\/span>/,
        `<span class="stat-value">${data.run.totalKm} km</span>`);
    html = html.replace(/<span class="stat-value">5:30\/km<\/span>/,
        `<span class="stat-value">${data.run.avgPace}</span>`);
    html = html.replace(/21\.1km - 5:12\/km/g, data.run.bestWorkout);

    // Atualizar rodapé
    const currentDate = new Date().toLocaleDateString('pt-BR');
    html = html.replace(/Este plano estratégico foi desenvolvido com base nos dados de treino de Sarah Lotif/g,
        `Este plano estratégico foi desenvolvido com base nos dados de treino de ${data.athleteName}`);

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

// Renderizar template Maratona
function renderMarathonTemplate(html, data) {
    // Substituir informações básicas
    html = html.replace(/Chicago Marathon 2025/g, data.eventName);
    html = html.replace(/Cauê Todeschini/g, data.athleteName);

    // Substituir métricas
    html = html.replace(/Este relatório foi desenvolvido com base nos dados de treino de Cauê Todeschini/g,
        `Este relatório foi desenvolvido com base nos dados de treino de ${data.athleteName}`);

    // Substituir projeções
    if (data.projectedTime) {
        html = html.replace(/3:30:00/g, data.projectedTime);
    }
    if (data.targetPace) {
        html = html.replace(/5:00\/km/g, data.targetPace + '/km');
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
