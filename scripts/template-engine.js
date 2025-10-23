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
    // Substituir informações básicas
    html = html.replace(/Ironman 70\.3 Florianópolis 2025/g, data.eventName);
    html = html.replace(/Sarah Lotif/g, data.athleteName);
    html = html.replace(/26 de Outubro/g, data.eventDate);
    html = html.replace(/Praia dos Ingleses, SC/g, data.eventLocation);

    // Substituir métricas gerais (TODOS os lugares)
    html = html.replace(/11 semanas/g, `${data.totalWeeks} semanas`);
    html = html.replace(/113\.8/g, data.totalHours);
    html = html.replace(/88 treinos/g, `${data.totalWorkouts} treinos`);
    html = html.replace(/\b88\b/g, data.totalWorkouts);
    html = html.replace(/Agosto - Outubro 2025/g, 'Período de Preparação');

    // Substituir dados de Natação (TODOS os lugares)
    html = html.replace(/\b21\b/g, data.swim.workouts);
    html = html.replace(/51\.9/g, data.swim.totalKm);
    html = html.replace(/1:58\/100m/g, data.swim.avgPace);
    html = html.replace(/3\.5km - 1:51\/100m/g, data.swim.bestWorkout);

    // Substituir dados de Ciclismo (TODOS os lugares)
    html = html.replace(/\b35\b/g, data.bike.workouts);
    html = html.replace(/1,756|1756/g, data.bike.totalKm);
    html = html.replace(/29\.8 km\/h/g, `${data.bike.avgSpeed} km/h`);
    html = html.replace(/29\.8/g, data.bike.avgSpeed);
    html = html.replace(/150km - 37\.5km\/h/g, data.bike.bestWorkout);

    // Substituir dados de Corrida (TODOS os lugares)
    html = html.replace(/\b32\b/g, data.run.workouts);
    html = html.replace(/227\.8/g, data.run.totalKm);
    html = html.replace(/5:30\/km/g, data.run.avgPace);
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
