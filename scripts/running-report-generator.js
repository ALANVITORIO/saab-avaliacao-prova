/**
 * SAAB Sports - Running Report Generator
 * Gerador de Relatórios de Corrida de Rua
 *
 * Processa CSV do TrainingPeaks e gera relatórios de estratégia
 * para corridas de 5km, 10km, Meia Maratona (21km), Maratona (42km), etc.
 */

// ════════════════════════════════════════════════════════════════════════════════════════
// FUNÇÕES DE CONVERSÃO E FORMATAÇÃO
// ════════════════════════════════════════════════════════════════════════════════════════

/**
 * Converte velocidade (m/s) para pace (min:seg/km)
 */
function convertRunPace(velocityMS) {
    if (!velocityMS || velocityMS <= 0) return '--:--/km';

    const paceSeconds = 1000 / velocityMS;
    const minutes = Math.floor(paceSeconds / 60);
    const seconds = Math.round(paceSeconds % 60);

    return `${minutes}:${seconds.toString().padStart(2, '0')}/km`;
}

/**
 * Formata tempo em horas para formato legível
 */
function formatTime(hours) {
    if (!hours || hours <= 0) return '--';

    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);

    if (h === 0) return `${m}min`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}min`;
}

/**
 * Formata data DD/MM/YYYY para DD/MM
 */
function formatDateShort(dateStr) {
    if (!dateStr) return '--';
    const date = new Date(dateStr);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    return `${day}/${month}`;
}

/**
 * Formata período completo
 */
function formatPeriodFull(startDate, endDate) {
    if (!startDate || !endDate) return '--';

    const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                   'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

    const start = new Date(startDate);
    const end = new Date(endDate);

    const startMonth = months[start.getMonth()];
    const endMonth = months[end.getMonth()];
    const year = end.getFullYear();

    if (startMonth === endMonth) {
        return `${startMonth} ${year}`;
    }

    return `${startMonth} - ${endMonth} ${year}`;
}

// ════════════════════════════════════════════════════════════════════════════════════════
// FUNÇÕES DE PROCESSAMENTO DE DADOS
// ════════════════════════════════════════════════════════════════════════════════════════

/**
 * Filtra apenas treinos de corrida com distância > 0
 */
function filterRunningWorkouts(csvData) {
    return csvData.filter(row => {
        const type = row.WorkoutType || '';
        const distance = parseFloat(row.DistanceInMeters) || 0;

        // Deve ser Run e ter distância registrada
        const isRun = type === 'Run' || /run/i.test(type);
        const hasDistance = distance > 0;

        return isRun && hasDistance;
    });
}

/**
 * Calcula estatísticas gerais dos treinos de corrida
 */
function calculateRunningStats(workouts) {
    if (!workouts || workouts.length === 0) {
        return {
            totalWorkouts: 0,
            totalKm: '0',
            totalHours: '0',
            avgPace: '--',
            trainingPeriod: '--',
            trainingPeriodFull: '--'
        };
    }

    // Total de treinos
    const totalWorkouts = workouts.length;

    // Volume total em km
    const totalMeters = workouts.reduce((sum, w) => {
        return sum + (parseFloat(w.DistanceInMeters) || 0);
    }, 0);
    const totalKm = (totalMeters / 1000).toFixed(1);

    // Horas totais
    const totalHoursNum = workouts.reduce((sum, w) => {
        return sum + (parseFloat(w.TimeTotalInHours) || 0);
    }, 0);
    const totalHours = totalHoursNum.toFixed(1);

    // Pace médio
    const velocities = workouts
        .map(w => parseFloat(w.VelocityAverage))
        .filter(v => v > 0);

    const avgVelocity = velocities.length > 0
        ? velocities.reduce((a, b) => a + b, 0) / velocities.length
        : 0;

    const avgPace = convertRunPace(avgVelocity);

    // Período de treinamento
    const dates = workouts
        .map(w => new Date(w.WorkoutDay))
        .filter(d => !isNaN(d.getTime()))
        .sort((a, b) => a - b);

    const weeks = dates.length > 0
        ? Math.round((dates[dates.length - 1] - dates[0]) / (7 * 24 * 60 * 60 * 1000))
        : 0;

    const trainingPeriod = `${weeks} semanas`;
    const trainingPeriodFull = dates.length > 0
        ? formatPeriodFull(dates[0], dates[dates.length - 1])
        : '--';

    return {
        totalWorkouts,
        totalKm,
        totalHours,
        avgPace,
        avgVelocityRaw: avgVelocity,
        trainingPeriod,
        trainingPeriodFull
    };
}

/**
 * Filtra e calcula estatísticas dos treinos longos (long runs)
 * Threshold padrão: >= 15km (ajustável baseado no tipo de prova)
 */
function calculateLongRunsStats(workouts, minDistance = 15000) {
    const longRuns = workouts.filter(w => {
        const distance = parseFloat(w.DistanceInMeters) || 0;
        return distance >= minDistance;
    });

    if (longRuns.length === 0) {
        return {
            count: 0,
            avgPace: '--',
            avgHR: '--',
            avgPower: '--',
            maxHR: '--',
            keyLongRun: '--'
        };
    }

    // Ordena por distância (maior primeiro)
    longRuns.sort((a, b) => {
        return (parseFloat(b.DistanceInMeters) || 0) - (parseFloat(a.DistanceInMeters) || 0);
    });

    // Pace médio dos long runs
    const velocities = longRuns
        .map(w => parseFloat(w.VelocityAverage))
        .filter(v => v > 0);

    const avgVelocity = velocities.length > 0
        ? velocities.reduce((a, b) => a + b, 0) / velocities.length
        : 0;

    const avgPace = convertRunPace(avgVelocity);

    // FC média
    const hrs = longRuns
        .map(w => parseFloat(w.HeartRateAverage))
        .filter(hr => hr > 0);

    const avgHR = hrs.length > 0
        ? Math.round(hrs.reduce((a, b) => a + b, 0) / hrs.length)
        : '--';

    // Potência média (se disponível)
    const powers = longRuns
        .map(w => parseFloat(w.PowerAverage))
        .filter(p => p > 0);

    const avgPower = powers.length > 0
        ? Math.round(powers.reduce((a, b) => a + b, 0) / powers.length)
        : '--';

    // FC máxima
    const maxHRs = longRuns
        .map(w => parseFloat(w.HeartRateMax))
        .filter(hr => hr > 0);

    const maxHR = maxHRs.length > 0
        ? Math.max(...maxHRs)
        : '--';

    // Treino longo chave (o mais longo)
    const keyRun = longRuns[0];
    const keyDist = ((parseFloat(keyRun.DistanceInMeters) || 0) / 1000).toFixed(1);
    const keyTime = formatTime(parseFloat(keyRun.TimeTotalInHours) || 0);
    const keyPace = convertRunPace(parseFloat(keyRun.VelocityAverage) || 0);
    const keyDate = formatDateShort(keyRun.WorkoutDay);

    const keyLongRun = `${keyDist}km em ${keyTime} (${keyPace}) - ${keyDate}`;

    return {
        count: longRuns.length,
        avgPace: avgPace === '--:--/km' ? '--' : avgPace,
        avgHR: avgHR !== '--' ? `${avgHR} bpm` : '--',
        avgPower: avgPower !== '--' ? `${avgPower}W` : '--',
        maxHR: maxHR !== '--' ? `${maxHR} bpm` : '--',
        keyLongRun
    };
}

/**
 * Gera dados para gráficos (opcional - pode ser implementado futuramente)
 */
function generateChartData(workouts) {
    return {
        totalRuns: workouts.length,
        totalKm: (workouts.reduce((sum, w) => sum + (parseFloat(w.DistanceInMeters) || 0), 0) / 1000).toFixed(1),
        totalHours: workouts.reduce((sum, w) => sum + (parseFloat(w.TimeTotalInHours) || 0), 0).toFixed(1)
    };
}

// ════════════════════════════════════════════════════════════════════════════════════════
// FUNÇÃO PRINCIPAL DE GERAÇÃO DO RELATÓRIO
// ════════════════════════════════════════════════════════════════════════════════════════

/**
 * Gera relatório completo de corrida
 *
 * @param {Array} csvData - Dados do CSV parseado
 * @param {String} athleteName - Nome do atleta
 * @param {String} eventName - Nome da prova
 * @param {String} templateHTML - HTML do template de corrida
 * @param {Number} minLongRunDistance - Distância mínima para long run (metros)
 * @returns {String} HTML completo com placeholders substituídos
 */
function generateRunningReport(csvData, athleteName, eventName, templateHTML, minLongRunDistance = 15000) {
    console.log('🏃 Iniciando geração do relatório de corrida...');
    console.log(`📊 CSV com ${csvData.length} linhas`);

    // Filtrar apenas corridas
    const runWorkouts = filterRunningWorkouts(csvData);
    console.log(`🏃 Corridas: ${runWorkouts.length} treinos`);

    if (runWorkouts.length === 0) {
        throw new Error('Nenhum treino de corrida encontrado no CSV!');
    }

    // Calcular estatísticas gerais
    const stats = calculateRunningStats(runWorkouts);

    // Calcular estatísticas dos long runs
    const longRunsStats = calculateLongRunsStats(runWorkouts, minLongRunDistance);

    // Gerar dados para gráficos
    const chartData = generateChartData(runWorkouts);

    console.log('✅ Estatísticas calculadas:');
    console.log(`   Total de treinos: ${stats.totalWorkouts}`);
    console.log(`   Volume total: ${stats.totalKm}km`);
    console.log(`   Long runs: ${longRunsStats.count}`);

    // Substituir placeholders no template
    let html = templateHTML;

    // Dados básicos
    html = html.replace(/{{ATHLETE_NAME}}/g, athleteName);
    html = html.replace(/{{EVENT_NAME}}/g, eventName);

    // Período de treinamento
    html = html.replace(/{{TRAINING_PERIOD}}/g, stats.trainingPeriod);
    html = html.replace(/{{TRAINING_PERIOD_FULL}}/g, stats.trainingPeriodFull);

    // Métricas gerais
    html = html.replace(/{{TOTAL_WORKOUTS}}/g, stats.totalWorkouts.toString());
    html = html.replace(/{{TOTAL_KM}}/g, stats.totalKm);
    html = html.replace(/{{TOTAL_HOURS}}/g, stats.totalHours);

    // Long runs
    html = html.replace(/{{LONG_RUNS_COUNT}}/g, longRunsStats.count.toString());
    html = html.replace(/{{LONG_RUNS_AVG_PACE}}/g, longRunsStats.avgPace);
    html = html.replace(/{{LONG_RUNS_AVG_HR}}/g, longRunsStats.avgHR);
    html = html.replace(/{{LONG_RUNS_AVG_POWER}}/g, longRunsStats.avgPower);
    html = html.replace(/{{LONG_RUNS_MAX_HR}}/g, longRunsStats.maxHR);
    html = html.replace(/{{KEY_LONG_RUN}}/g, longRunsStats.keyLongRun);

    // Dados para gráficos
    html = html.replace(/{{CHART_TOTAL_RUNS}}/g, chartData.totalRuns.toString());
    html = html.replace(/{{CHART_TOTAL_KM}}/g, chartData.totalKm);
    html = html.replace(/{{CHART_TOTAL_HOURS}}/g, chartData.totalHours);

    console.log('✅ Todos os placeholders substituídos!');
    console.log('🎉 Relatório de corrida gerado com sucesso!');

    return html;
}

// Exportar para uso no navegador ou Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        generateRunningReport,
        filterRunningWorkouts,
        calculateRunningStats,
        calculateLongRunsStats,
        convertRunPace,
        formatTime
    };
}
