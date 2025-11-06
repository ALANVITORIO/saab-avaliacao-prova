/**
 * ════════════════════════════════════════════════════════════════════════════════════════
 * IRONMAN REPORT GENERATOR - SAAB SPORTS
 * ════════════════════════════════════════════════════════════════════════════════════════
 *
 * Script que processa CSV do TrainingPeaks e gera relatório HTML completo
 * Segue EXATAMENTE o protocolo definido em template-saab-com-placeholders.html
 *
 * @author Claude (Anthropic)
 * @version 2.0
 * @date 2025-01-06
 */

// ════════════════════════════════════════════════════════════════════════════════════════
// FUNÇÕES AUXILIARES DE CONVERSÃO
// ════════════════════════════════════════════════════════════════════════════════════════

/**
 * Converte velocidade em m/s para pace de natação (min:ss/100m)
 * Fórmula do template (linha 111-115): pace_segundos = 100 / velocidade_m_s
 */
function convertSwimPace(velocityMS) {
    if (!velocityMS || velocityMS <= 0) return '--:--/100m';

    const paceSeconds = 100 / velocityMS;
    const minutes = Math.floor(paceSeconds / 60);
    const seconds = Math.round(paceSeconds % 60);

    return `${minutes}:${seconds.toString().padStart(2, '0')}/100m`;
}

/**
 * Converte velocidade em m/s para velocidade em km/h (ciclismo)
 * Fórmula do template (linha 117-120): velocidade_kmh = velocidade_m_s * 3.6
 */
function convertBikeSpeed(velocityMS) {
    if (!velocityMS || velocityMS <= 0) return '0.0 km/h';
    return `${(velocityMS * 3.6).toFixed(1)} km/h`;
}

/**
 * Converte velocidade em m/s para pace de corrida (min:ss/km)
 * Fórmula do template (linha 122-127): pace_segundos = 1000 / velocidade_m_s
 */
function convertRunPace(velocityMS) {
    if (!velocityMS || velocityMS <= 0) return '--:--/km';

    const paceSeconds = 1000 / velocityMS;
    const minutes = Math.floor(paceSeconds / 60);
    const seconds = Math.round(paceSeconds % 60);

    return `${minutes}:${seconds.toString().padStart(2, '0')}/km`;
}

/**
 * Formata tempo em horas para formato legível (Xh Ymin)
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
 * Formata tempo em minutos para formato legível
 */
function formatMinutes(minutes) {
    if (!minutes || minutes <= 0) return '--';

    const h = Math.floor(minutes / 60);
    const m = Math.round(minutes % 60);

    if (h === 0) return `${m}min`;
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

// ════════════════════════════════════════════════════════════════════════════════════════
// FUNÇÕES DE FILTRAGEM E CÁLCULO (Seguindo Template Passo 3.1 e 3.2)
// ════════════════════════════════════════════════════════════════════════════════════════

/**
 * Filtra treinos por modalidade
 * Template linha 85-89
 *
 * IMPORTANTE: Filtra apenas treinos com DistanceInMeters > 0
 * (treinos técnicos ou não registrados são excluídos)
 */
function filterByDiscipline(csvData) {
    const swim = [];
    const bike = [];
    const run = [];

    csvData.forEach(row => {
        const type = row.WorkoutType || '';
        const distance = parseFloat(row.DistanceInMeters) || 0;

        // Filtrar apenas treinos com distância registrada (> 0)
        if (distance <= 0) return;

        // Natação
        if (type === 'Swim' || /swim/i.test(type)) {
            swim.push(row);
        }
        // Ciclismo
        else if (type === 'Bike' || type === 'Ride' || /bike|cycle/i.test(type)) {
            bike.push(row);
        }
        // Corrida
        else if (type === 'Run' || /run/i.test(type)) {
            run.push(row);
        }
        // IGNORAR: Day Off, Rest, Strength, e treinos com distância = 0
    });

    return { swim, bike, run };
}

/**
 * Calcula estatísticas para uma modalidade
 * Template linha 95-133
 */
function calculateDisciplineStats(workouts, discipline) {
    if (!workouts || workouts.length === 0) {
        return {
            workouts: 0,
            totalKm: '0.0 km',
            avgPaceOrSpeed: '--',
            bestWorkout: '--'
        };
    }

    // A) TOTAL DE TREINOS
    const totalWorkouts = workouts.length;

    // B) VOLUME TOTAL (Template linha 101-104)
    const totalDistance = workouts.reduce((sum, w) => {
        const dist = parseFloat(w.DistanceInMeters) || 0;
        return sum + dist;
    }, 0);
    const totalKm = (totalDistance / 1000).toFixed(1);

    // C) PACE/VELOCIDADE MÉDIA (Template linha 107-127)
    const validVelocities = workouts
        .map(w => parseFloat(w.VelocityAverage))
        .filter(v => v > 0);

    const avgVelocity = validVelocities.length > 0
        ? validVelocities.reduce((a, b) => a + b) / validVelocities.length
        : 0;

    let avgPaceOrSpeed;
    if (discipline === 'swim') {
        avgPaceOrSpeed = convertSwimPace(avgVelocity);
    } else if (discipline === 'bike') {
        avgPaceOrSpeed = convertBikeSpeed(avgVelocity);
    } else if (discipline === 'run') {
        avgPaceOrSpeed = convertRunPace(avgVelocity);
    }

    // D) MELHOR TREINO (Template linha 129-133)
    let bestWorkout = '--';
    if (discipline === 'swim' || discipline === 'run') {
        // Menor pace = mais rápido
        const best = workouts
            .filter(w => parseFloat(w.VelocityAverage) > 0)
            .reduce((prev, curr) => {
                const prevVel = parseFloat(prev.VelocityAverage) || 0;
                const currVel = parseFloat(curr.VelocityAverage) || 0;
                return currVel > prevVel ? curr : prev;
            }, {});

        if (best.DistanceInMeters) {
            const distKm = (parseFloat(best.DistanceInMeters) / 1000).toFixed(1);
            const pace = discipline === 'swim'
                ? convertSwimPace(parseFloat(best.VelocityAverage))
                : convertRunPace(parseFloat(best.VelocityAverage));
            bestWorkout = `${distKm}km - ${pace}`;
        }
    } else if (discipline === 'bike') {
        // Maior velocidade = melhor
        const best = workouts
            .filter(w => parseFloat(w.VelocityAverage) > 0)
            .reduce((prev, curr) => {
                const prevVel = parseFloat(prev.VelocityAverage) || 0;
                const currVel = parseFloat(curr.VelocityAverage) || 0;
                return currVel > prevVel ? curr : prev;
            }, {});

        if (best.DistanceInMeters) {
            const distKm = (parseFloat(best.DistanceInMeters) / 1000).toFixed(1);
            const speed = convertBikeSpeed(parseFloat(best.VelocityAverage));
            bestWorkout = `${distKm}km - ${speed}`;
        }
    }

    return {
        workouts: totalWorkouts,
        totalKm: `${totalKm} km`,
        avgPaceOrSpeed,
        bestWorkout,
        avgVelocityRaw: avgVelocity // Para cálculos posteriores
    };
}

/**
 * Calcula métricas gerais
 * Template linha 135-138
 *
 * IMPORTANTE: Conta apenas treinos válidos (Swim/Bike/Run com distância > 0)
 */
function calculateGeneralMetrics(csvData) {
    // Filtrar treinos válidos: Swim/Bike/Run com distância > 0
    const validWorkouts = csvData.filter(row => {
        const type = row.WorkoutType || '';
        const distance = parseFloat(row.DistanceInMeters) || 0;

        // Deve ser Swim, Bike ou Run
        const isValidType = ['Swim', 'Bike', 'Run'].includes(type) ||
                           /swim|bike|cycle|run/i.test(type);

        // Deve ter distância registrada
        const hasDistance = distance > 0;

        return isValidType && hasDistance;
    });

    // TOTAL_WEEKS: Diferença entre primeira e última data
    const dates = validWorkouts
        .map(w => new Date(w.WorkoutDay))
        .filter(d => !isNaN(d.getTime()))
        .sort((a, b) => a - b);

    const totalWeeks = dates.length > 0
        ? Math.round((dates[dates.length - 1] - dates[0]) / (7 * 24 * 60 * 60 * 1000))
        : 0;

    // TOTAL_HOURS: SUM(TimeTotalInHours) apenas para treinos válidos
    const totalHours = validWorkouts.reduce((sum, w) => {
        const hours = parseFloat(w.TimeTotalInHours) || 0;
        return sum + hours;
    }, 0);

    // TOTAL_WORKOUTS
    const totalWorkouts = validWorkouts.length;

    // Classificação de Performance (Template linha 316-318)
    const score = (totalWorkouts / totalWeeks) + (totalHours / totalWeeks);
    let classification, description;

    if (score >= 12) {
        classification = 'EXCELENTE';
        description = 'Preparação sólida com volumes adequados e evolução consistente';
    } else if (score >= 8) {
        classification = 'BOA';
        description = 'Preparação adequada com boa progressão';
    } else {
        classification = 'MODERADA';
        description = 'Preparação em desenvolvimento';
    }

    return {
        totalWeeks,
        totalHours: totalHours.toFixed(1),
        totalWorkouts,
        classification,
        description
    };
}

// ════════════════════════════════════════════════════════════════════════════════════════
// FUNÇÕES DE DETECÇÃO DE TIPO DE PROVA E DISTÂNCIAS (Template Passo 1 e 3.3)
// ════════════════════════════════════════════════════════════════════════════════════════

/**
 * Retorna distâncias da prova baseado no tipo
 * Template linha 42-47
 */
function getRaceDistances(raceType) {
    const distances = {
        'SPRINT': { swim: 0.75, bike: 20, run: 5, total: 25.75 },
        'OLÍMPICO': { swim: 1.5, bike: 40, run: 10, total: 51.5 },
        '70.3': { swim: 1.9, bike: 90, run: 21.1, total: 113 },
        'FULL': { swim: 3.8, bike: 180, run: 42.2, total: 226 }
    };

    return distances[raceType] || distances['70.3'];
}

/**
 * Retorna filtros para treinos longos baseado no tipo de prova
 * Template linha 144-165
 */
function getLongWorkoutsFilters(raceType) {
    const filters = {
        'SPRINT': { swim: 600, bike: 15000, run: 3500 },
        'OLÍMPICO': { swim: 1200, bike: 35000, run: 8000 },
        '70.3': { swim: 2500, bike: 70000, run: 15000 },
        'FULL': { swim: 3500, bike: 140000, run: 28000 }
    };

    return filters[raceType] || filters['70.3'];
}

/**
 * Filtra treinos longos
 * Template linha 141-165
 */
function filterLongWorkouts(workouts, minDistance) {
    return workouts
        .filter(w => parseFloat(w.DistanceInMeters) >= minDistance)
        .sort((a, b) => new Date(b.WorkoutDay) - new Date(a.WorkoutDay)); // Mais recentes primeiro
}

// ════════════════════════════════════════════════════════════════════════════════════════
// FUNÇÕES DE GERAÇÃO DE TABELAS HTML (Template Seção 2)
// ════════════════════════════════════════════════════════════════════════════════════════

/**
 * Gera tabela HTML de treinos de natação
 */
function generateSwimTable(swimLongWorkouts) {
    if (swimLongWorkouts.length === 0) {
        return '<p>Nenhum treino longo de natação encontrado.</p>';
    }

    let html = `
    <table style="width:100%;border-collapse:collapse;margin:20px 0">
        <thead>
            <tr style="background:#400404;color:white">
                <th style="padding:15px;text-align:left;border:1px solid #ddd">Data</th>
                <th style="padding:15px;text-align:left;border:1px solid #ddd">Distância</th>
                <th style="padding:15px;text-align:left;border:1px solid #ddd">Tempo</th>
                <th style="padding:15px;text-align:left;border:1px solid #ddd">Pace</th>
                <th style="padding:15px;text-align:left;border:1px solid #ddd">FC Média</th>
            </tr>
        </thead>
        <tbody>`;

    swimLongWorkouts.slice(0, 15).forEach((workout, index) => {
        const bgColor = index % 2 === 0 ? '#f9f9f9' : 'white';
        const date = formatDateShort(workout.WorkoutDay);
        const distance = (parseFloat(workout.DistanceInMeters) / 1000).toFixed(1);
        const time = formatTime(parseFloat(workout.TimeTotalInHours));
        const pace = convertSwimPace(parseFloat(workout.VelocityAverage));
        const hr = parseFloat(workout.HeartRateAverage) || '--';

        html += `
            <tr style="background:${bgColor}">
                <td style="padding:12px;border:1px solid #ddd">${date}</td>
                <td style="padding:12px;border:1px solid #ddd">${distance} km</td>
                <td style="padding:12px;border:1px solid #ddd">${time}</td>
                <td style="padding:12px;border:1px solid #ddd;font-weight:600;color:#D0494E">${pace}</td>
                <td style="padding:12px;border:1px solid #ddd">${hr !== '--' ? hr + ' bpm' : '--'}</td>
            </tr>`;
    });

    html += `
        </tbody>
    </table>`;

    return html;
}

/**
 * Gera tabela HTML de treinos de ciclismo
 */
function generateBikeTable(bikeLongWorkouts) {
    if (bikeLongWorkouts.length === 0) {
        return '<p>Nenhum treino longo de ciclismo encontrado.</p>';
    }

    let html = `
    <table style="width:100%;border-collapse:collapse;margin:20px 0">
        <thead>
            <tr style="background:#400404;color:white">
                <th style="padding:15px;text-align:left;border:1px solid #ddd">Data</th>
                <th style="padding:15px;text-align:left;border:1px solid #ddd">Distância</th>
                <th style="padding:15px;text-align:left;border:1px solid #ddd">Tempo</th>
                <th style="padding:15px;text-align:left;border:1px solid #ddd">Velocidade</th>
                <th style="padding:15px;text-align:left;border:1px solid #ddd">FC Média</th>
            </tr>
        </thead>
        <tbody>`;

    bikeLongWorkouts.slice(0, 15).forEach((workout, index) => {
        const bgColor = index % 2 === 0 ? '#f9f9f9' : 'white';
        const date = formatDateShort(workout.WorkoutDay);
        const distance = (parseFloat(workout.DistanceInMeters) / 1000).toFixed(1);
        const time = formatTime(parseFloat(workout.TimeTotalInHours));
        const speed = convertBikeSpeed(parseFloat(workout.VelocityAverage));
        const hr = parseFloat(workout.HeartRateAverage) || '--';

        html += `
            <tr style="background:${bgColor}">
                <td style="padding:12px;border:1px solid #ddd">${date}</td>
                <td style="padding:12px;border:1px solid #ddd">${distance} km</td>
                <td style="padding:12px;border:1px solid #ddd">${time}</td>
                <td style="padding:12px;border:1px solid #ddd;font-weight:600;color:#D0494E">${speed}</td>
                <td style="padding:12px;border:1px solid #ddd">${hr !== '--' ? hr + ' bpm' : '--'}</td>
            </tr>`;
    });

    html += `
        </tbody>
    </table>`;

    return html;
}

/**
 * Gera tabela HTML de treinos de corrida
 */
function generateRunTable(runLongWorkouts) {
    if (runLongWorkouts.length === 0) {
        return '<p>Nenhum treino longo de corrida encontrado.</p>';
    }

    let html = `
    <table style="width:100%;border-collapse:collapse;margin:20px 0">
        <thead>
            <tr style="background:#400404;color:white">
                <th style="padding:15px;text-align:left;border:1px solid #ddd">Data</th>
                <th style="padding:15px;text-align:left;border:1px solid #ddd">Distância</th>
                <th style="padding:15px;text-align:left;border:1px solid #ddd">Tempo</th>
                <th style="padding:15px;text-align:left;border:1px solid #ddd">Pace</th>
                <th style="padding:15px;text-align:left;border:1px solid #ddd">FC Média</th>
            </tr>
        </thead>
        <tbody>`;

    runLongWorkouts.slice(0, 15).forEach((workout, index) => {
        const bgColor = index % 2 === 0 ? '#f9f9f9' : 'white';
        const date = formatDateShort(workout.WorkoutDay);
        const distance = (parseFloat(workout.DistanceInMeters) / 1000).toFixed(1);
        const time = formatTime(parseFloat(workout.TimeTotalInHours));
        const pace = convertRunPace(parseFloat(workout.VelocityAverage));
        const hr = parseFloat(workout.HeartRateAverage) || '--';

        html += `
            <tr style="background:${bgColor}">
                <td style="padding:12px;border:1px solid #ddd">${date}</td>
                <td style="padding:12px;border:1px solid #ddd">${distance} km</td>
                <td style="padding:12px;border:1px solid #ddd">${time}</td>
                <td style="padding:12px;border:1px solid #ddd;font-weight:600;color:#D0494E">${pace}</td>
                <td style="padding:12px;border:1px solid #ddd">${hr !== '--' ? hr + ' bpm' : '--'}</td>
            </tr>`;
    });

    html += `
        </tbody>
    </table>`;

    return html;
}

// ════════════════════════════════════════════════════════════════════════════════════════
// CÁLCULO DOS 3 CENÁRIOS DE PROVA (Template Passo 4)
// ════════════════════════════════════════════════════════════════════════════════════════

/**
 * Calcula os 3 cenários de prova (Meta A - Agressivo, B - Realista, C - Conservador)
 * Baseado nas velocidades médias dos treinos
 */
function calculate3Scenarios(swimStats, bikeStats, runStats, raceDistances) {
    const scenarios = {
        agressivo: {},
        realista: {},
        conservador: {}
    };

    // ──────────────────────────────────────────────────────────────────────────────
    // NATAÇÃO
    // ──────────────────────────────────────────────────────────────────────────────

    const swimAvgVel = swimStats.avgVelocityRaw || 0;

    // META A: +15% mais rápido que média (agressivo - baseado em melhores treinos)
    const swimVelA = swimAvgVel * 1.15;
    const swimTimeA = (raceDistances.swim * 1000) / swimVelA / 60; // minutos
    scenarios.agressivo.swimTime = formatMinutes(swimTimeA);
    scenarios.agressivo.swimPace = convertSwimPace(swimVelA);

    // META B: velocidade média (realista)
    const swimVelB = swimAvgVel;
    const swimTimeB = (raceDistances.swim * 1000) / swimVelB / 60;
    scenarios.realista.swimTime = formatMinutes(swimTimeB);
    scenarios.realista.swimPace = convertSwimPace(swimVelB);

    // META C: -8% mais lento que média (conservador)
    const swimVelC = swimAvgVel * 0.92;
    const swimTimeC = (raceDistances.swim * 1000) / swimVelC / 60;
    scenarios.conservador.swimTime = formatMinutes(swimTimeC);
    scenarios.conservador.swimPace = convertSwimPace(swimVelC);

    // ──────────────────────────────────────────────────────────────────────────────
    // CICLISMO
    // ──────────────────────────────────────────────────────────────────────────────

    const bikeAvgVel = bikeStats.avgVelocityRaw || 0;

    // META A: +12% mais rápido (agressivo)
    const bikeVelA = bikeAvgVel * 1.12;
    const bikeTimeA = (raceDistances.bike * 1000) / bikeVelA / 60;
    scenarios.agressivo.bikeTime = formatMinutes(bikeTimeA);
    scenarios.agressivo.bikeSpeed = convertBikeSpeed(bikeVelA);

    // META B: velocidade média (realista)
    const bikeVelB = bikeAvgVel;
    const bikeTimeB = (raceDistances.bike * 1000) / bikeVelB / 60;
    scenarios.realista.bikeTime = formatMinutes(bikeTimeB);
    scenarios.realista.bikeSpeed = convertBikeSpeed(bikeVelB);

    // META C: -6% mais lento (conservador)
    const bikeVelC = bikeAvgVel * 0.94;
    const bikeTimeC = (raceDistances.bike * 1000) / bikeVelC / 60;
    scenarios.conservador.bikeTime = formatMinutes(bikeTimeC);
    scenarios.conservador.bikeSpeed = convertBikeSpeed(bikeVelC);

    // ──────────────────────────────────────────────────────────────────────────────
    // CORRIDA
    // ──────────────────────────────────────────────────────────────────────────────

    const runAvgVel = runStats.avgVelocityRaw || 0;

    // META A: +13% mais rápido (agressivo - baseado em race pace)
    const runVelA = runAvgVel * 1.13;
    const runTimeA = (raceDistances.run * 1000) / runVelA / 60;
    scenarios.agressivo.runTime = formatMinutes(runTimeA);
    scenarios.agressivo.runPace = convertRunPace(runVelA);

    // META B: velocidade média (realista)
    const runVelB = runAvgVel;
    const runTimeB = (raceDistances.run * 1000) / runVelB / 60;
    scenarios.realista.runTime = formatMinutes(runTimeB);
    scenarios.realista.runPace = convertRunPace(runVelB);

    // META C: -7% mais lento (conservador)
    const runVelC = runAvgVel * 0.93;
    const runTimeC = (raceDistances.run * 1000) / runVelC / 60;
    scenarios.conservador.runTime = formatMinutes(runTimeC);
    scenarios.conservador.runPace = convertRunPace(runVelC);

    // ──────────────────────────────────────────────────────────────────────────────
    // TEMPO TOTAL (incluindo transições)
    // ──────────────────────────────────────────────────────────────────────────────

    // META A: T1=4min, T2=2min
    const totalA = swimTimeA + 4 + bikeTimeA + 2 + runTimeA;
    scenarios.agressivo.totalTime = formatMinutes(totalA);

    // META B: T1=4min, T2=3min
    const totalB = swimTimeB + 4 + bikeTimeB + 3 + runTimeB;
    scenarios.realista.totalTime = formatMinutes(totalB);

    // META C: T1=4min, T2=4min
    const totalC = swimTimeC + 4 + bikeTimeC + 4 + runTimeC;
    scenarios.conservador.totalTime = formatMinutes(totalC);

    return scenarios;
}

// ════════════════════════════════════════════════════════════════════════════════════════
// FUNÇÃO PRINCIPAL DE GERAÇÃO DO RELATÓRIO
// ════════════════════════════════════════════════════════════════════════════════════════

/**
 * Função principal que gera o relatório completo
 *
 * @param {Array} csvData - Dados parseados do CSV (array de objetos)
 * @param {String} athleteName - Nome do atleta
 * @param {String} eventName - Nome da prova
 * @param {String} eventDate - Data da prova (DD/MM/YYYY)
 * @param {String} eventLocation - Local da prova
 * @param {String} raceType - Tipo de prova (SPRINT/OLÍMPICO/70.3/FULL)
 * @param {String} templateHTML - HTML do template com placeholders
 * @returns {String} HTML completo com todos os placeholders substituídos
 */
function generateIronmanReport(csvData, athleteName, eventName, eventDate, eventLocation, raceType, templateHTML) {

    console.log('🚀 Iniciando geração do relatório...');
    console.log(`📊 CSV com ${csvData.length} linhas`);

    // ══════════════════════════════════════════════════════════════════════════════
    // PASSO 1: FILTRAR POR MODALIDADE
    // ══════════════════════════════════════════════════════════════════════════════

    const { swim, bike, run } = filterByDiscipline(csvData);
    console.log(`🏊 Natação: ${swim.length} treinos`);
    console.log(`🚴 Ciclismo: ${bike.length} treinos`);
    console.log(`🏃 Corrida: ${run.length} treinos`);

    // ══════════════════════════════════════════════════════════════════════════════
    // PASSO 2: CALCULAR ESTATÍSTICAS POR MODALIDADE
    // ══════════════════════════════════════════════════════════════════════════════

    const swimStats = calculateDisciplineStats(swim, 'swim');
    const bikeStats = calculateDisciplineStats(bike, 'bike');
    const runStats = calculateDisciplineStats(run, 'run');

    // ══════════════════════════════════════════════════════════════════════════════
    // PASSO 3: CALCULAR MÉTRICAS GERAIS
    // ══════════════════════════════════════════════════════════════════════════════

    const generalMetrics = calculateGeneralMetrics(csvData);

    // ══════════════════════════════════════════════════════════════════════════════
    // PASSO 4: FILTRAR TREINOS LONGOS
    // ══════════════════════════════════════════════════════════════════════════════

    const filters = getLongWorkoutsFilters(raceType);
    const swimLong = filterLongWorkouts(swim, filters.swim);
    const bikeLong = filterLongWorkouts(bike, filters.bike);
    const runLong = filterLongWorkouts(run, filters.run);

    console.log(`📋 Treinos longos - Natação: ${swimLong.length} | Bike: ${bikeLong.length} | Run: ${runLong.length}`);

    // ══════════════════════════════════════════════════════════════════════════════
    // PASSO 5: GERAR TABELAS HTML
    // ══════════════════════════════════════════════════════════════════════════════

    const swimTable = generateSwimTable(swimLong);
    const bikeTable = generateBikeTable(bikeLong);
    const runTable = generateRunTable(runLong);

    // ══════════════════════════════════════════════════════════════════════════════
    // PASSO 6: CALCULAR 3 CENÁRIOS DE PROVA
    // ══════════════════════════════════════════════════════════════════════════════

    const raceDistances = getRaceDistances(raceType);
    const scenarios = calculate3Scenarios(swimStats, bikeStats, runStats, raceDistances);

    console.log('✅ Cenários calculados:', scenarios);

    // ══════════════════════════════════════════════════════════════════════════════
    // PASSO 7: SUBSTITUIR TODOS OS PLACEHOLDERS NO TEMPLATE
    // ══════════════════════════════════════════════════════════════════════════════

    let html = templateHTML;

    // ─────────────────────────────────────────────────────────────────────────────
    // HEADER
    // ─────────────────────────────────────────────────────────────────────────────
    html = html.replace(/{{ATHLETE_NAME}}/g, athleteName);
    html = html.replace(/{{EVENT_NAME}}/g, eventName);
    html = html.replace(/{{EVENT_DATE}}/g, eventDate);
    html = html.replace(/{{EVENT_LOCATION}}/g, eventLocation);

    // ─────────────────────────────────────────────────────────────────────────────
    // MÉTRICAS GERAIS
    // ─────────────────────────────────────────────────────────────────────────────
    html = html.replace(/{{TOTAL_WEEKS}}/g, generalMetrics.totalWeeks);
    html = html.replace(/{{TOTAL_HOURS}}/g, generalMetrics.totalHours);
    html = html.replace(/{{TOTAL_WORKOUTS}}/g, generalMetrics.totalWorkouts);
    html = html.replace(/{{PERFORMANCE_CLASSIFICATION}}/g, generalMetrics.classification);
    html = html.replace(/{{PERFORMANCE_DESCRIPTION}}/g, generalMetrics.description);

    // ─────────────────────────────────────────────────────────────────────────────
    // SEÇÃO 1: RESUMO DA PREPARAÇÃO
    // ─────────────────────────────────────────────────────────────────────────────
    html = html.replace(/{{SWIM_WORKOUTS}}/g, swimStats.workouts);
    html = html.replace(/{{SWIM_TOTAL_KM}}/g, swimStats.totalKm);
    html = html.replace(/{{SWIM_AVG_PACE}}/g, swimStats.avgPaceOrSpeed);
    html = html.replace(/{{SWIM_BEST_WORKOUT}}/g, swimStats.bestWorkout);

    html = html.replace(/{{BIKE_WORKOUTS}}/g, bikeStats.workouts);
    html = html.replace(/{{BIKE_TOTAL_KM}}/g, bikeStats.totalKm);
    html = html.replace(/{{BIKE_AVG_SPEED}}/g, bikeStats.avgPaceOrSpeed);
    html = html.replace(/{{BIKE_BEST_WORKOUT}}/g, bikeStats.bestWorkout);

    html = html.replace(/{{RUN_WORKOUTS}}/g, runStats.workouts);
    html = html.replace(/{{RUN_TOTAL_KM}}/g, runStats.totalKm);
    html = html.replace(/{{RUN_AVG_PACE}}/g, runStats.avgPaceOrSpeed);
    html = html.replace(/{{RUN_BEST_WORKOUT}}/g, runStats.bestWorkout);

    // ─────────────────────────────────────────────────────────────────────────────
    // SEÇÃO 2: TABELAS DE TREINOS LONGOS
    // ─────────────────────────────────────────────────────────────────────────────
    html = html.replace('<!-- INSERIR TABELA NATAÇÃO AQUI -->', swimTable);
    html = html.replace('<!-- INSERIR TABELA BIKE AQUI -->', bikeTable);
    html = html.replace('<!-- INSERIR TABELA CORRIDA AQUI -->', runTable);

    // ─────────────────────────────────────────────────────────────────────────────
    // SEÇÃO 3: CENÁRIOS DE PROVA - META A (AGRESSIVO)
    // ─────────────────────────────────────────────────────────────────────────────
    html = html.replace(/{{AGRESSIVO_SWIM_TIME}}/g, scenarios.agressivo.swimTime);
    html = html.replace(/{{AGRESSIVO_SWIM_PACE}}/g, scenarios.agressivo.swimPace);
    html = html.replace(/{{AGRESSIVO_BIKE_TIME}}/g, scenarios.agressivo.bikeTime);
    html = html.replace(/{{AGRESSIVO_BIKE_SPEED}}/g, scenarios.agressivo.bikeSpeed);
    html = html.replace(/{{AGRESSIVO_RUN_TIME}}/g, scenarios.agressivo.runTime);
    html = html.replace(/{{AGRESSIVO_RUN_PACE}}/g, scenarios.agressivo.runPace);
    html = html.replace(/{{AGRESSIVO_TOTAL_TIME}}/g, scenarios.agressivo.totalTime);

    // ─────────────────────────────────────────────────────────────────────────────
    // SEÇÃO 3: CENÁRIOS DE PROVA - META B (REALISTA)
    // ─────────────────────────────────────────────────────────────────────────────
    html = html.replace(/{{REALISTA_SWIM_TIME}}/g, scenarios.realista.swimTime);
    html = html.replace(/{{REALISTA_SWIM_PACE}}/g, scenarios.realista.swimPace);
    html = html.replace(/{{REALISTA_BIKE_TIME}}/g, scenarios.realista.bikeTime);
    html = html.replace(/{{REALISTA_BIKE_SPEED}}/g, scenarios.realista.bikeSpeed);
    html = html.replace(/{{REALISTA_RUN_TIME}}/g, scenarios.realista.runTime);
    html = html.replace(/{{REALISTA_RUN_PACE}}/g, scenarios.realista.runPace);
    html = html.replace(/{{REALISTA_TOTAL_TIME}}/g, scenarios.realista.totalTime);

    // ─────────────────────────────────────────────────────────────────────────────
    // SEÇÃO 3: CENÁRIOS DE PROVA - META C (CONSERVADOR)
    // ─────────────────────────────────────────────────────────────────────────────
    html = html.replace(/{{CONSERVADOR_SWIM_TIME}}/g, scenarios.conservador.swimTime);
    html = html.replace(/{{CONSERVADOR_SWIM_PACE}}/g, scenarios.conservador.swimPace);
    html = html.replace(/{{CONSERVADOR_BIKE_TIME}}/g, scenarios.conservador.bikeTime);
    html = html.replace(/{{CONSERVADOR_BIKE_SPEED}}/g, scenarios.conservador.bikeSpeed);
    html = html.replace(/{{CONSERVADOR_RUN_TIME}}/g, scenarios.conservador.runTime);
    html = html.replace(/{{CONSERVADOR_RUN_PACE}}/g, scenarios.conservador.runPace);
    html = html.replace(/{{CONSERVADOR_TOTAL_TIME}}/g, scenarios.conservador.totalTime);

    // ─────────────────────────────────────────────────────────────────────────────
    // SEÇÃO 4: DISTÂNCIAS DA PROVA
    // ─────────────────────────────────────────────────────────────────────────────
    html = html.replace(/{{RACE_DISTANCE_SWIM}}/g, `${raceDistances.swim}km`);
    html = html.replace(/{{RACE_DISTANCE_BIKE}}/g, `${raceDistances.bike}km`);
    html = html.replace(/{{RACE_DISTANCE_RUN}}/g, `${raceDistances.run}km`);

    // ─────────────────────────────────────────────────────────────────────────────
    // PLACEHOLDERS JAVASCRIPT (para interatividade)
    // ─────────────────────────────────────────────────────────────────────────────
    // Estes são usados no objeto scenarios do JavaScript no template
    // Precisam ser preenchidos também para a interatividade funcionar

    // META A - JavaScript
    html = html.replace(/{{JS_AGRESSIVO_SWIM_PACE}}/g, scenarios.agressivo.swimPace);
    html = html.replace(/{{JS_AGRESSIVO_SWIM_TIME}}/g, scenarios.agressivo.swimTime);
    html = html.replace(/{{JS_AGRESSIVO_SWIM_HR}}/g, '132-142 bpm');
    html = html.replace(/{{JS_AGRESSIVO_BIKE_SPEED}}/g, scenarios.agressivo.bikeSpeed);
    html = html.replace(/{{JS_AGRESSIVO_BIKE_TIME}}/g, scenarios.agressivo.bikeTime);
    html = html.replace(/{{JS_AGRESSIVO_BIKE_HR}}/g, '138-148 bpm');
    html = html.replace(/{{JS_AGRESSIVO_BIKE_NP}}/g, '180-190W');
    html = html.replace(/{{JS_AGRESSIVO_RUN_PACE}}/g, scenarios.agressivo.runPace);
    html = html.replace(/{{JS_AGRESSIVO_RUN_TIME}}/g, scenarios.agressivo.runTime);
    html = html.replace(/{{JS_AGRESSIVO_RUN_HR}}/g, '170-177 bpm');

    // META B - JavaScript
    html = html.replace(/{{JS_REALISTA_SWIM_PACE}}/g, scenarios.realista.swimPace);
    html = html.replace(/{{JS_REALISTA_SWIM_TIME}}/g, scenarios.realista.swimTime);
    html = html.replace(/{{JS_REALISTA_SWIM_HR}}/g, '128-138 bpm');
    html = html.replace(/{{JS_REALISTA_BIKE_SPEED}}/g, scenarios.realista.bikeSpeed);
    html = html.replace(/{{JS_REALISTA_BIKE_TIME}}/g, scenarios.realista.bikeTime);
    html = html.replace(/{{JS_REALISTA_BIKE_HR}}/g, '133-143 bpm');
    html = html.replace(/{{JS_REALISTA_BIKE_NP}}/g, '170-180W');
    html = html.replace(/{{JS_REALISTA_RUN_PACE}}/g, scenarios.realista.runPace);
    html = html.replace(/{{JS_REALISTA_RUN_TIME}}/g, scenarios.realista.runTime);
    html = html.replace(/{{JS_REALISTA_RUN_HR}}/g, '165-172 bpm');

    // META C - JavaScript
    html = html.replace(/{{JS_CONSERVADOR_SWIM_PACE}}/g, scenarios.conservador.swimPace);
    html = html.replace(/{{JS_CONSERVADOR_SWIM_TIME}}/g, scenarios.conservador.swimTime);
    html = html.replace(/{{JS_CONSERVADOR_SWIM_HR}}/g, '125-135 bpm');
    html = html.replace(/{{JS_CONSERVADOR_BIKE_SPEED}}/g, scenarios.conservador.bikeSpeed);
    html = html.replace(/{{JS_CONSERVADOR_BIKE_TIME}}/g, scenarios.conservador.bikeTime);
    html = html.replace(/{{JS_CONSERVADOR_BIKE_HR}}/g, '128-138 bpm');
    html = html.replace(/{{JS_CONSERVADOR_BIKE_NP}}/g, '160-170W');
    html = html.replace(/{{JS_CONSERVADOR_RUN_PACE}}/g, scenarios.conservador.runPace);
    html = html.replace(/{{JS_CONSERVADOR_RUN_TIME}}/g, scenarios.conservador.runTime);
    html = html.replace(/{{JS_CONSERVADOR_RUN_HR}}/g, '160-167 bpm');

    // Placeholders de zonas (valores genéricos por enquanto - podem ser calculados depois)
    const zoneDefaults = {
        swim: { zone1: '2:00/100m', zone2: '1:50/100m', zone3: '1:45/100m' },
        bike: { zone1Speed: '28 km/h', zone1Hr: '130 bpm', zone1Np: '160W',
                zone2Speed: '32 km/h', zone2Hr: '140 bpm', zone2Np: '180W',
                zone3Speed: '30 km/h', zone3Hr: '135 bpm', zone3Np: '170W' },
        run: { zone1Pace: '5:20/km', zone1Hr: '165 bpm', zone1Time: '27min',
               zone2Pace: '4:50/km', zone2Hr: '172 bpm', zone2Time: '68min',
               zone3Pace: '4:40/km', zone3Hr: '175 bpm', zone3Time: '10min' }
    };

    // Aplicar defaults para todos os cenários e zonas
    ['AGRESSIVO', 'REALISTA', 'CONSERVADOR'].forEach(scenario => {
        html = html.replace(new RegExp(`{{JS_${scenario}_SWIM_ZONE1_PACE}}`, 'g'), zoneDefaults.swim.zone1);
        html = html.replace(new RegExp(`{{JS_${scenario}_SWIM_ZONE2_PACE}}`, 'g'), zoneDefaults.swim.zone2);
        html = html.replace(new RegExp(`{{JS_${scenario}_SWIM_ZONE3_PACE}}`, 'g'), zoneDefaults.swim.zone3);

        html = html.replace(new RegExp(`{{JS_${scenario}_BIKE_ZONE1_SPEED}}`, 'g'), zoneDefaults.bike.zone1Speed);
        html = html.replace(new RegExp(`{{JS_${scenario}_BIKE_ZONE1_HR}}`, 'g'), zoneDefaults.bike.zone1Hr);
        html = html.replace(new RegExp(`{{JS_${scenario}_BIKE_ZONE1_NP}}`, 'g'), zoneDefaults.bike.zone1Np);
        html = html.replace(new RegExp(`{{JS_${scenario}_BIKE_ZONE2_SPEED}}`, 'g'), zoneDefaults.bike.zone2Speed);
        html = html.replace(new RegExp(`{{JS_${scenario}_BIKE_ZONE2_HR}}`, 'g'), zoneDefaults.bike.zone2Hr);
        html = html.replace(new RegExp(`{{JS_${scenario}_BIKE_ZONE2_NP}}`, 'g'), zoneDefaults.bike.zone2Np);
        html = html.replace(new RegExp(`{{JS_${scenario}_BIKE_ZONE3_SPEED}}`, 'g'), zoneDefaults.bike.zone3Speed);
        html = html.replace(new RegExp(`{{JS_${scenario}_BIKE_ZONE3_HR}}`, 'g'), zoneDefaults.bike.zone3Hr);
        html = html.replace(new RegExp(`{{JS_${scenario}_BIKE_ZONE3_NP}}`, 'g'), zoneDefaults.bike.zone3Np);

        html = html.replace(new RegExp(`{{JS_${scenario}_RUN_ZONE1_PACE}}`, 'g'), zoneDefaults.run.zone1Pace);
        html = html.replace(new RegExp(`{{JS_${scenario}_RUN_ZONE1_HR}}`, 'g'), zoneDefaults.run.zone1Hr);
        html = html.replace(new RegExp(`{{JS_${scenario}_RUN_ZONE1_TIME}}`, 'g'), zoneDefaults.run.zone1Time);
        html = html.replace(new RegExp(`{{JS_${scenario}_RUN_ZONE2_PACE}}`, 'g'), zoneDefaults.run.zone2Pace);
        html = html.replace(new RegExp(`{{JS_${scenario}_RUN_ZONE2_HR}}`, 'g'), zoneDefaults.run.zone2Hr);
        html = html.replace(new RegExp(`{{JS_${scenario}_RUN_ZONE2_TIME}}`, 'g'), zoneDefaults.run.zone2Time);
        html = html.replace(new RegExp(`{{JS_${scenario}_RUN_ZONE3_PACE}}`, 'g'), zoneDefaults.run.zone3Pace);
        html = html.replace(new RegExp(`{{JS_${scenario}_RUN_ZONE3_HR}}`, 'g'), zoneDefaults.run.zone3Hr);
        html = html.replace(new RegExp(`{{JS_${scenario}_RUN_ZONE3_TIME}}`, 'g'), zoneDefaults.run.zone3Time);
    });

    console.log('✅ Todos os placeholders substituídos!');
    console.log('🎉 Relatório gerado com sucesso!');

    return html;
}

// ════════════════════════════════════════════════════════════════════════════════════════
// EXPORTAR FUNÇÃO
// ════════════════════════════════════════════════════════════════════════════════════════

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { generateIronmanReport };
}
