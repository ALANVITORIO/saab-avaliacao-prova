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
// NOVAS FUNÇÕES - ANÁLISES AVANÇADAS E DETECÇÃO DE PROVAS
// ════════════════════════════════════════════════════════════════════════════════════════

/**
 * Detecta provas (races) no CSV
 * Provas são identificadas por: distâncias específicas + velocidades altas
 */
function detectRaces(csvData) {
    const races = [];

    csvData.forEach(row => {
        const type = row.WorkoutType || '';
        const distance = parseFloat(row.DistanceInMeters) || 0;
        const velocity = parseFloat(row.VelocityAverage) || 0;
        const date = row.WorkoutDay;
        const title = row.Title || '';

        // Detectar prova de natação (1.5-1.9km, velocidade alta)
        if (type === 'Swim' && distance >= 1500 && distance <= 2000 && velocity > 0.6) {
            races.push({
                discipline: 'Natação',
                date,
                distance: (distance / 1000).toFixed(3),
                time: formatTime(parseFloat(row.TimeTotalInHours)),
                pace: convertSwimPace(velocity),
                type: distance < 1600 ? 'Sprint' : 'Olímpico',
                title
            });
        }

        // Detectar prova de ciclismo (38-42km, velocidade alta)
        if ((type === 'Bike' || type === 'Cycling') && distance >= 38000 && distance <= 42000 && velocity > 7) {
            races.push({
                discipline: 'Ciclismo',
                date,
                distance: (distance / 1000).toFixed(1),
                time: formatTime(parseFloat(row.TimeTotalInHours)),
                speed: convertBikeSpeed(velocity),
                type: distance < 40000 ? 'Sprint' : 'Olímpico',
                title
            });
        }

        // Detectar prova de corrida (9-11km, velocidade alta)
        if ((type === 'Run' || type === 'Running') && distance >= 9000 && distance <= 11000 && velocity > 3) {
            races.push({
                discipline: 'Corrida',
                date,
                distance: (distance / 1000).toFixed(2),
                time: formatTime(parseFloat(row.TimeTotalInHours)),
                pace: convertRunPace(velocity),
                type: distance < 10000 ? 'Sprint' : 'Olímpico',
                title
            });
        }
    });

    return races;
}

/**
 * Calcula estatísticas de Zona Tempo para Natação (>3km)
 */
function calculateTempoZoneSwimStats(swimWorkouts) {
    const tempoZone = swimWorkouts.filter(w => parseFloat(w.DistanceInMeters) >= 3000);

    if (tempoZone.length === 0) {
        return null;
    }

    // Distância média
    const avgDistance = tempoZone.reduce((sum, w) => sum + parseFloat(w.DistanceInMeters), 0) / tempoZone.length;

    // Pace médio
    const velocities = tempoZone.map(w => parseFloat(w.VelocityAverage)).filter(v => v > 0);
    const avgVelocity = velocities.reduce((a, b) => a + b, 0) / velocities.length;

    // FC médio
    const hrs = tempoZone.map(w => parseFloat(w.HeartRateAverage)).filter(hr => hr > 0);
    const avgHR = hrs.length > 0 ? Math.round(hrs.reduce((a, b) => a + b, 0) / hrs.length) : 0;

    // Melhor performance (mais rápido)
    const sorted = [...tempoZone].sort((a, b) => {
        return parseFloat(b.VelocityAverage) - parseFloat(a.VelocityAverage);
    });
    const best = sorted[0];

    return {
        count: tempoZone.length,
        avgDistance: (avgDistance / 1000).toFixed(1),
        avgPace: convertSwimPace(avgVelocity),
        avgHR,
        bestPerformance: {
            date: formatDateShort(best.WorkoutDay),
            distance: (parseFloat(best.DistanceInMeters) / 1000).toFixed(1),
            time: formatTime(parseFloat(best.TimeTotalInHours)),
            pace: convertSwimPace(parseFloat(best.VelocityAverage)),
            hr: Math.round(parseFloat(best.HeartRateAverage) || 0)
        }
    };
}

/**
 * Calcula estatísticas de Zona Tempo para Ciclismo (>90km)
 */
function calculateTempoZoneBikeStats(bikeWorkouts) {
    const tempoZone = bikeWorkouts.filter(w => parseFloat(w.DistanceInMeters) >= 90000);

    if (tempoZone.length === 0) {
        return null;
    }

    // Distância média
    const avgDistance = tempoZone.reduce((sum, w) => sum + parseFloat(w.DistanceInMeters), 0) / tempoZone.length;

    // Velocidade média
    const velocities = tempoZone.map(w => parseFloat(w.VelocityAverage)).filter(v => v > 0);
    const avgVelocity = velocities.reduce((a, b) => a + b, 0) / velocities.length;

    // FC médio
    const hrs = tempoZone.map(w => parseFloat(w.HeartRateAverage)).filter(hr => hr > 0);
    const avgHR = hrs.length > 0 ? Math.round(hrs.reduce((a, b) => a + b, 0) / hrs.length) : 0;

    // Melhor performance (mais rápido)
    const sorted = [...tempoZone].sort((a, b) => {
        return parseFloat(b.VelocityAverage) - parseFloat(a.VelocityAverage);
    });
    const best = sorted[0];

    return {
        count: tempoZone.length,
        avgDistance: (avgDistance / 1000).toFixed(1),
        avgSpeed: convertBikeSpeed(avgVelocity),
        avgSpeedRaw: avgVelocity * 3.6, // Para usar nos cenários
        avgHR,
        bestPerformance: {
            date: formatDateShort(best.WorkoutDay),
            distance: (parseFloat(best.DistanceInMeters) / 1000).toFixed(1),
            time: formatTime(parseFloat(best.TimeTotalInHours)),
            speed: convertBikeSpeed(parseFloat(best.VelocityAverage)),
            hr: Math.round(parseFloat(best.HeartRateAverage) || 0)
        }
    };
}

/**
 * Calcula estatísticas de Race Pace para Corrida (>18km)
 */
function calculateRacePaceRunStats(runWorkouts) {
    const longRuns = runWorkouts.filter(w => parseFloat(w.DistanceInMeters) >= 18000);

    if (longRuns.length === 0) {
        return null;
    }

    // Distância média
    const avgDistance = longRuns.reduce((sum, w) => sum + parseFloat(w.DistanceInMeters), 0) / longRuns.length;

    // Pace médio
    const velocities = longRuns.map(w => parseFloat(w.VelocityAverage)).filter(v => v > 0);
    const avgVelocity = velocities.reduce((a, b) => a + b, 0) / velocities.length;

    // FC média
    const hrs = longRuns.map(w => parseFloat(w.HeartRateAverage)).filter(hr => hr > 0);
    const avgHR = hrs.length > 0 ? Math.round(hrs.reduce((a, b) => a + b, 0) / hrs.length) : 0;

    // Melhor performance (mais rápido)
    const sorted = [...longRuns].sort((a, b) => {
        return parseFloat(b.VelocityAverage) - parseFloat(a.VelocityAverage);
    });
    const best = sorted[0];
    const top3 = sorted.slice(0, 3);

    return {
        count: longRuns.length,
        avgDistance: (avgDistance / 1000).toFixed(1),
        avgPace: convertRunPace(avgVelocity),
        avgPaceRaw: avgVelocity, // Para usar nos cenários
        avgHR,
        bestPerformance: {
            date: formatDateShort(best.WorkoutDay),
            distance: (parseFloat(best.DistanceInMeters) / 1000).toFixed(1),
            time: formatTime(parseFloat(best.TimeTotalInHours)),
            pace: convertRunPace(parseFloat(best.VelocityAverage)),
            hr: Math.round(parseFloat(best.HeartRateAverage) || 0)
        },
        top3Paces: top3.map(w => convertRunPace(parseFloat(w.VelocityAverage)))
    };
}

/**
 * Detecta Brick Runs (corridas logo após ciclismo)
 * Identifica treinos de corrida no mesmo dia que ciclismo
 */
function detectBrickRuns(csvData) {
    const brickRuns = [];

    // Agrupar por data
    const byDate = {};
    csvData.forEach(row => {
        const date = row.WorkoutDay;
        if (!byDate[date]) byDate[date] = [];
        byDate[date].push(row);
    });

    // Para cada data, verificar se tem bike + run
    Object.keys(byDate).forEach(date => {
        const workouts = byDate[date];
        const bikes = workouts.filter(w => w.WorkoutType === 'Bike' && parseFloat(w.DistanceInMeters) >= 70000);
        const runs = workouts.filter(w => w.WorkoutType === 'Run' && parseFloat(w.DistanceInMeters) >= 8000);

        if (bikes.length > 0 && runs.length > 0) {
            const bike = bikes[0];
            const run = runs[0];

            brickRuns.push({
                date: formatDateShort(date),
                bikeDistance: (parseFloat(bike.DistanceInMeters) / 1000).toFixed(0),
                runDistance: (parseFloat(run.DistanceInMeters) / 1000).toFixed(1),
                runTime: formatTime(parseFloat(run.TimeTotalInHours)),
                runPace: convertRunPace(parseFloat(run.VelocityAverage)),
                runHR: Math.round(parseFloat(run.HeartRateAverage) || 0)
            });
        }
    });

    return brickRuns;
}

/**
 * Detecta sessões de Race Pace (treinos específicos de ritmo)
 * Procura por treinos com "race pace" ou "pace" no título
 */
function detectRacePaceSessions(runWorkouts) {
    const racePaceSessions = [];

    runWorkouts.forEach(row => {
        const title = (row.Title || '').toLowerCase();
        const description = (row.WorkoutDescription || '').toLowerCase();

        // Detectar race pace no título ou descrição
        if (title.includes('race pace') || title.includes('pace') || description.includes('race pace')) {
            const distance = parseFloat(row.DistanceInMeters) || 0;
            if (distance > 0) {
                racePaceSessions.push({
                    date: formatDateShort(row.WorkoutDay),
                    pace: convertRunPace(parseFloat(row.VelocityAverage)),
                    time: formatTime(parseFloat(row.TimeTotalInHours)),
                    title: row.Title
                });
            }
        }
    });

    return racePaceSessions;
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
// FUNÇÕES DE GERAÇÃO DE SEÇÕES AVANÇADAS HTML
// ════════════════════════════════════════════════════════════════════════════════════════

/**
 * Gera HTML para histórico de provas
 */
function generateRaceHistoryHTML(races) {
    if (!races || races.length === 0) {
        return '<p style="color:#666;font-style:italic">Nenhuma prova detectada no período.</p>';
    }

    // Agrupar por disciplina
    const racesByDiscipline = {
        'Natação': races.filter(r => r.discipline === 'Natação'),
        'Ciclismo': races.filter(r => r.discipline === 'Ciclismo'),
        'Corrida': races.filter(r => r.discipline === 'Corrida')
    };

    let html = '';

    Object.keys(racesByDiscipline).forEach(discipline => {
        const disciplineRaces = racesByDiscipline[discipline];
        if (disciplineRaces.length === 0) return;

        html += `<h4 style="color:#400404;margin-top:25px;margin-bottom:15px;font-size:18px">${discipline}</h4>`;

        disciplineRaces.forEach(race => {
            const date = new Date(race.date);
            const formattedDate = date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

            html += `
            <div style="background:#f9f9f9;padding:15px;margin-bottom:15px;border-left:4px solid #D0494E;border-radius:5px">
                <div style="font-weight:600;color:#400404;margin-bottom:8px">${race.title || 'Prova ' + race.type}</div>
                <div style="color:#666;font-size:14px;margin-bottom:5px">${formattedDate}</div>
                <div><strong>Distância:</strong> ${race.distance} km (${race.type})</div>
                <div><strong>Tempo:</strong> ${race.time}</div>
                <div><strong>${discipline === 'Ciclismo' ? 'Velocidade' : 'Pace'}:</strong> ${race.pace || race.speed}</div>
            </div>`;
        });
    });

    return html;
}

/**
 * Gera HTML para análise de zona tempo - Natação
 */
function generateTempoZoneSwimHTML(stats) {
    if (!stats) {
        return '<p style="color:#666;font-style:italic">Sem treinos em zona tempo (&gt;3km) detectados.</p>';
    }

    return `
    <div style="background:#f5f5f5;padding:20px;border-radius:10px;margin:20px 0">
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:15px;margin-bottom:20px">
            <div>
                <div style="font-size:13px;color:#666;margin-bottom:5px">Distância Média</div>
                <div style="font-size:22px;font-weight:700;color:#400404">${stats.avgDistance} km</div>
            </div>
            <div>
                <div style="font-size:13px;color:#666;margin-bottom:5px">Pace Médio</div>
                <div style="font-size:22px;font-weight:700;color:#D0494E">${stats.avgPace}</div>
            </div>
            <div>
                <div style="font-size:13px;color:#666;margin-bottom:5px">FC Médio</div>
                <div style="font-size:22px;font-weight:700;color:#400404">${stats.avgHR > 0 ? stats.avgHR + ' bpm' : '--'}</div>
            </div>
            <div>
                <div style="font-size:13px;color:#666;margin-bottom:5px">Total de Treinos</div>
                <div style="font-size:22px;font-weight:700;color:#400404">${stats.count}</div>
            </div>
        </div>

        <div style="background:white;padding:15px;border-radius:8px;border-left:4px solid #D0494E">
            <strong style="color:#400404;display:block;margin-bottom:10px">📊 Melhor Performance</strong>
            <div><strong>Data:</strong> ${stats.bestPerformance.date}</div>
            <div><strong>Distância:</strong> ${stats.bestPerformance.distance} km</div>
            <div><strong>Tempo:</strong> ${stats.bestPerformance.time}</div>
            <div><strong>Pace:</strong> ${stats.bestPerformance.pace}</div>
            ${stats.bestPerformance.hr > 0 ? `<div><strong>FC:</strong> ${stats.bestPerformance.hr} bpm</div>` : ''}
        </div>
    </div>`;
}

/**
 * Gera HTML para análise de zona tempo - Ciclismo
 */
function generateTempoZoneBikeHTML(stats) {
    if (!stats) {
        return '<p style="color:#666;font-style:italic">Sem treinos em zona tempo (&gt;90km) detectados.</p>';
    }

    return `
    <div style="background:#f5f5f5;padding:20px;border-radius:10px;margin:20px 0">
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:15px;margin-bottom:20px">
            <div>
                <div style="font-size:13px;color:#666;margin-bottom:5px">Distância Média</div>
                <div style="font-size:22px;font-weight:700;color:#400404">${stats.avgDistance} km</div>
            </div>
            <div>
                <div style="font-size:13px;color:#666;margin-bottom:5px">Vel. Média</div>
                <div style="font-size:22px;font-weight:700;color:#D0494E">${stats.avgSpeed}</div>
            </div>
            <div>
                <div style="font-size:13px;color:#666;margin-bottom:5px">FC Médio</div>
                <div style="font-size:22px;font-weight:700;color:#400404">${stats.avgHR > 0 ? stats.avgHR + ' bpm' : '--'}</div>
            </div>
            <div>
                <div style="font-size:13px;color:#666;margin-bottom:5px">Total de Treinos</div>
                <div style="font-size:22px;font-weight:700;color:#400404">${stats.count}</div>
            </div>
        </div>

        <div style="background:white;padding:15px;border-radius:8px;border-left:4px solid #D0494E">
            <strong style="color:#400404;display:block;margin-bottom:10px">📊 Melhor Performance</strong>
            <div><strong>Data:</strong> ${stats.bestPerformance.date}</div>
            <div><strong>Distância:</strong> ${stats.bestPerformance.distance} km</div>
            <div><strong>Tempo:</strong> ${stats.bestPerformance.time}</div>
            <div><strong>Velocidade:</strong> ${stats.bestPerformance.speed}</div>
            ${stats.bestPerformance.hr > 0 ? `<div><strong>FC:</strong> ${stats.bestPerformance.hr} bpm</div>` : ''}
        </div>
    </div>`;
}

/**
 * Gera HTML para análise de race pace - Corrida
 */
function generateRacePaceRunHTML(stats, brickRuns, racePaceSessions) {
    if (!stats) {
        return '<p style="color:#666;font-style:italic">Sem treinos em race pace (&gt;18km) detectados.</p>';
    }

    let html = `
    <div style="background:#f5f5f5;padding:20px;border-radius:10px;margin:20px 0">
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:15px;margin-bottom:20px">
            <div>
                <div style="font-size:13px;color:#666;margin-bottom:5px">Distância Média</div>
                <div style="font-size:22px;font-weight:700;color:#400404">${stats.avgDistance} km</div>
            </div>
            <div>
                <div style="font-size:13px;color:#666;margin-bottom:5px">Pace Médio</div>
                <div style="font-size:22px;font-weight:700;color:#D0494E">${stats.avgPace}</div>
            </div>
            <div>
                <div style="font-size:13px;color:#666;margin-bottom:5px">FC Médio</div>
                <div style="font-size:22px;font-weight:700;color:#400404">${stats.avgHR > 0 ? stats.avgHR + ' bpm' : '--'}</div>
            </div>
            <div>
                <div style="font-size:13px;color:#666;margin-bottom:5px">Total de Treinos</div>
                <div style="font-size:22px;font-weight:700;color:#400404">${stats.count}</div>
            </div>
        </div>

        <div style="margin-bottom:15px">
            <strong style="color:#400404">Top 3 Race Pace:</strong> ${stats.top3Paces.join(' | ')}
        </div>

        <div style="background:white;padding:15px;border-radius:8px;border-left:4px solid #D0494E">
            <strong style="color:#400404;display:block;margin-bottom:10px">📊 Melhor Performance</strong>
            <div><strong>Data:</strong> ${stats.bestPerformance.date}</div>
            <div><strong>Distância:</strong> ${stats.bestPerformance.distance} km</div>
            <div><strong>Tempo:</strong> ${stats.bestPerformance.time}</div>
            <div><strong>Pace:</strong> ${stats.bestPerformance.pace}</div>
            ${stats.bestPerformance.hr > 0 ? `<div><strong>FC:</strong> ${stats.bestPerformance.hr} bpm</div>` : ''}
        </div>
    </div>`;

    // Brick Runs
    if (brickRuns && brickRuns.length > 0) {
        html += `
        <div style="margin-top:25px">
            <h4 style="color:#400404;margin-bottom:15px;font-size:18px">🔄 BRICK RUNS (Transições Bike-Run)</h4>
            <ul style="list-style:none;padding:0">`;

        brickRuns.forEach(brick => {
            html += `
                <li style="background:#f9f9f9;padding:12px;margin-bottom:10px;border-left:3px solid #D0494E;border-radius:5px">
                    <strong>${brick.date}:</strong> ${brick.runDistance}km em ${brick.runTime} - Pace ${brick.runPace} - FC ${brick.runHR} bpm
                    <span style="color:#666">(após ${brick.bikeDistance}km de bike)</span>
                </li>`;
        });

        html += `
            </ul>
        </div>`;
    }

    // Race Pace Sessions
    if (racePaceSessions && racePaceSessions.length > 0) {
        html += `
        <div style="margin-top:25px">
            <h4 style="color:#400404;margin-bottom:15px;font-size:18px">🎯 RACE PACE - Treinos de Ritmo de Prova</h4>
            <ul style="list-style:none;padding:0">`;

        racePaceSessions.forEach(session => {
            html += `
                <li style="background:#f9f9f9;padding:12px;margin-bottom:10px;border-left:3px solid #D0494E;border-radius:5px">
                    <strong>${session.date}:</strong> Pace ${session.pace} - ${session.time}
                    ${session.title ? `<span style="color:#666"> - ${session.title}</span>` : ''}
                </li>`;
        });

        html += `
            </ul>
        </div>`;
    }

    return html;
}

// ════════════════════════════════════════════════════════════════════════════════════════
// FUNÇÕES DE CÁLCULO DINÂMICO (FC, NP, ZONAS)
// ════════════════════════════════════════════════════════════════════════════════════════

/**
 * Calcula ranges de Frequência Cardíaca baseado nos dados reais do CSV
 * Retorna FC para cada modalidade e cenário
 */
function calculateHeartRateRanges(swimWorkouts, bikeWorkouts, runWorkouts) {
    // Calcular FC médio de cada modalidade
    const swimHRs = swimWorkouts
        .map(w => parseFloat(w.HeartRateAverage))
        .filter(hr => !isNaN(hr) && hr > 0);
    const swimAvgHR = swimHRs.length > 0 ? swimHRs.reduce((a, b) => a + b, 0) / swimHRs.length : 130;

    const bikeHRs = bikeWorkouts
        .map(w => parseFloat(w.HeartRateAverage))
        .filter(hr => !isNaN(hr) && hr > 0);
    const bikeAvgHR = bikeHRs.length > 0 ? bikeHRs.reduce((a, b) => a + b, 0) / bikeHRs.length : 140;

    const runHRs = runWorkouts
        .map(w => parseFloat(w.HeartRateAverage))
        .filter(hr => !isNaN(hr) && hr > 0);
    const runAvgHR = runHRs.length > 0 ? runHRs.reduce((a, b) => a + b, 0) / runHRs.length : 165;

    return {
        agressivo: {
            swim: `${Math.round(swimAvgHR * 1.03)}-${Math.round(swimAvgHR * 1.08)} bpm`,
            bike: `${Math.round(bikeAvgHR * 1.03)}-${Math.round(bikeAvgHR * 1.08)} bpm`,
            run: `${Math.round(runAvgHR * 1.03)}-${Math.round(runAvgHR * 1.07)} bpm`
        },
        realista: {
            swim: `${Math.round(swimAvgHR * 0.98)}-${Math.round(swimAvgHR * 1.03)} bpm`,
            bike: `${Math.round(bikeAvgHR * 0.98)}-${Math.round(bikeAvgHR * 1.03)} bpm`,
            run: `${Math.round(runAvgHR * 0.98)}-${Math.round(runAvgHR * 1.02)} bpm`
        },
        conservador: {
            swim: `${Math.round(swimAvgHR * 0.93)}-${Math.round(swimAvgHR * 0.98)} bpm`,
            bike: `${Math.round(bikeAvgHR * 0.93)}-${Math.round(bikeAvgHR * 0.98)} bpm`,
            run: `${Math.round(runAvgHR * 0.95)}-${Math.round(runAvgHR * 0.99)} bpm`
        }
    };
}

/**
 * Calcula ranges de Normalized Power (NP) para ciclismo
 */
function calculatePowerRanges(bikeWorkouts) {
    const powers = bikeWorkouts
        .map(w => parseFloat(w.PowerAverage))
        .filter(p => !isNaN(p) && p > 0);

    const avgPower = powers.length > 0 ? powers.reduce((a, b) => a + b, 0) / powers.length : 175;

    return {
        agressivo: `${Math.round(avgPower * 1.05)}-${Math.round(avgPower * 1.10)}W`,
        realista: `${Math.round(avgPower * 0.98)}-${Math.round(avgPower * 1.03)}W`,
        conservador: `${Math.round(avgPower * 0.92)}-${Math.round(avgPower * 0.97)}W`
    };
}

/**
 * Calcula valores de zonas personalizadas baseado nos dados do CSV
 */
function calculateZoneValues(swimStats, bikeStats, runStats, swimWorkouts, bikeWorkouts, runWorkouts, raceDistances) {
    // Calcular FC médios
    const swimHRs = swimWorkouts.map(w => parseFloat(w.HeartRateAverage)).filter(hr => !isNaN(hr) && hr > 0);
    const swimAvgHR = swimHRs.length > 0 ? Math.round(swimHRs.reduce((a, b) => a + b, 0) / swimHRs.length) : 130;

    const bikeHRs = bikeWorkouts.map(w => parseFloat(w.HeartRateAverage)).filter(hr => !isNaN(hr) && hr > 0);
    const bikeAvgHR = bikeHRs.length > 0 ? Math.round(bikeHRs.reduce((a, b) => a + b, 0) / bikeHRs.length) : 140;

    const runHRs = runWorkouts.map(w => parseFloat(w.HeartRateAverage)).filter(hr => !isNaN(hr) && hr > 0);
    const runAvgHR = runHRs.length > 0 ? Math.round(runHRs.reduce((a, b) => a + b, 0) / runHRs.length) : 165;

    // Calcular Power médio
    const powers = bikeWorkouts.map(w => parseFloat(w.PowerAverage)).filter(p => !isNaN(p) && p > 0);
    const avgPower = powers.length > 0 ? Math.round(powers.reduce((a, b) => a + b, 0) / powers.length) : 175;

    return {
        agressivo: {
            swim: {
                zone1Pace: convertSwimPace(swimStats.avgVelocityRaw * 0.90),
                zone2Pace: convertSwimPace(swimStats.avgVelocityRaw * 1.05),
                zone3Pace: convertSwimPace(swimStats.avgVelocityRaw * 1.10)
            },
            bike: {
                zone1Speed: `${((bikeStats.avgVelocityRaw * 3.6) * 0.85).toFixed(1)} km/h`,
                zone1Hr: `${Math.round(bikeAvgHR * 0.90)} bpm`,
                zone1Np: `${Math.round(avgPower * 0.85)}W`,
                zone2Speed: `${((bikeStats.avgVelocityRaw * 3.6) * 1.05).toFixed(1)} km/h`,
                zone2Hr: `${Math.round(bikeAvgHR * 1.00)} bpm`,
                zone2Np: `${Math.round(avgPower * 1.00)}W`,
                zone3Speed: `${((bikeStats.avgVelocityRaw * 3.6) * 0.95).toFixed(1)} km/h`,
                zone3Hr: `${Math.round(bikeAvgHR * 0.95)} bpm`,
                zone3Np: `${Math.round(avgPower * 0.90)}W`
            },
            run: {
                zone1Pace: convertRunPace(runStats.avgVelocityRaw * 0.88),
                zone1Hr: `${Math.round(runAvgHR * 0.93)} bpm`,
                zone1Time: formatMinutes((raceDistances.run * 0.24) / (runStats.avgVelocityRaw * 0.88) / 60),
                zone2Pace: convertRunPace(runStats.avgVelocityRaw * 1.02),
                zone2Hr: `${Math.round(runAvgHR * 0.98)} bpm`,
                zone2Time: formatMinutes((raceDistances.run * 0.67) / (runStats.avgVelocityRaw * 1.02) / 60),
                zone3Pace: convertRunPace(runStats.avgVelocityRaw * 1.06),
                zone3Hr: `${Math.round(runAvgHR * 1.02)} bpm`,
                zone3Time: formatMinutes((raceDistances.run * 0.09) / (runStats.avgVelocityRaw * 1.06) / 60)
            }
        },
        realista: {
            swim: {
                zone1Pace: convertSwimPace(swimStats.avgVelocityRaw * 0.88),
                zone2Pace: convertSwimPace(swimStats.avgVelocityRaw * 1.00),
                zone3Pace: convertSwimPace(swimStats.avgVelocityRaw * 1.05)
            },
            bike: {
                zone1Speed: `${((bikeStats.avgVelocityRaw * 3.6) * 0.82).toFixed(1)} km/h`,
                zone1Hr: `${Math.round(bikeAvgHR * 0.88)} bpm`,
                zone1Np: `${Math.round(avgPower * 0.82)}W`,
                zone2Speed: `${((bikeStats.avgVelocityRaw * 3.6) * 1.00).toFixed(1)} km/h`,
                zone2Hr: `${Math.round(bikeAvgHR * 0.98)} bpm`,
                zone2Np: `${Math.round(avgPower * 0.95)}W`,
                zone3Speed: `${((bikeStats.avgVelocityRaw * 3.6) * 0.92).toFixed(1)} km/h`,
                zone3Hr: `${Math.round(bikeAvgHR * 0.93)} bpm`,
                zone3Np: `${Math.round(avgPower * 0.88)}W`
            },
            run: {
                zone1Pace: convertRunPace(runStats.avgVelocityRaw * 0.85),
                zone1Hr: `${Math.round(runAvgHR * 0.90)} bpm`,
                zone1Time: formatMinutes((raceDistances.run * 0.24) / (runStats.avgVelocityRaw * 0.85) / 60),
                zone2Pace: convertRunPace(runStats.avgVelocityRaw * 0.98),
                zone2Hr: `${Math.round(runAvgHR * 0.96)} bpm`,
                zone2Time: formatMinutes((raceDistances.run * 0.67) / (runStats.avgVelocityRaw * 0.98) / 60),
                zone3Pace: convertRunPace(runStats.avgVelocityRaw * 1.02),
                zone3Hr: `${Math.round(runAvgHR * 0.99)} bpm`,
                zone3Time: formatMinutes((raceDistances.run * 0.09) / (runStats.avgVelocityRaw * 1.02) / 60)
            }
        },
        conservador: {
            swim: {
                zone1Pace: convertSwimPace(swimStats.avgVelocityRaw * 0.85),
                zone2Pace: convertSwimPace(swimStats.avgVelocityRaw * 0.95),
                zone3Pace: convertSwimPace(swimStats.avgVelocityRaw * 1.00)
            },
            bike: {
                zone1Speed: `${((bikeStats.avgVelocityRaw * 3.6) * 0.78).toFixed(1)} km/h`,
                zone1Hr: `${Math.round(bikeAvgHR * 0.85)} bpm`,
                zone1Np: `${Math.round(avgPower * 0.78)}W`,
                zone2Speed: `${((bikeStats.avgVelocityRaw * 3.6) * 0.95).toFixed(1)} km/h`,
                zone2Hr: `${Math.round(bikeAvgHR * 0.95)} bpm`,
                zone2Np: `${Math.round(avgPower * 0.90)}W`,
                zone3Speed: `${((bikeStats.avgVelocityRaw * 3.6) * 0.88).toFixed(1)} km/h`,
                zone3Hr: `${Math.round(bikeAvgHR * 0.90)} bpm`,
                zone3Np: `${Math.round(avgPower * 0.85)}W`
            },
            run: {
                zone1Pace: convertRunPace(runStats.avgVelocityRaw * 0.82),
                zone1Hr: `${Math.round(runAvgHR * 0.88)} bpm`,
                zone1Time: formatMinutes((raceDistances.run * 0.24) / (runStats.avgVelocityRaw * 0.82) / 60),
                zone2Pace: convertRunPace(runStats.avgVelocityRaw * 0.95),
                zone2Hr: `${Math.round(runAvgHR * 0.94)} bpm`,
                zone2Time: formatMinutes((raceDistances.run * 0.67) / (runStats.avgVelocityRaw * 0.95) / 60),
                zone3Pace: convertRunPace(runStats.avgVelocityRaw * 0.98),
                zone3Hr: `${Math.round(runAvgHR * 0.97)} bpm`,
                zone3Time: formatMinutes((raceDistances.run * 0.09) / (runStats.avgVelocityRaw * 0.98) / 60)
            }
        }
    };
}

// ════════════════════════════════════════════════════════════════════════════════════════
// CÁLCULO DOS 3 CENÁRIOS DE PROVA (Template Passo 4)
// ════════════════════════════════════════════════════════════════════════════════════════

/**
 * Calcula os 3 cenários de prova (Meta A - Agressivo, B - Realista, C - Conservador)
 * Retorna RANGES (min-max) em vez de valores únicos
 */
function calculate3Scenarios(swimStats, bikeStats, runStats, raceDistances) {
    const scenarios = {
        agressivo: {},
        realista: {},
        conservador: {}
    };

    // ──────────────────────────────────────────────────────────────────────────────
    // NATAÇÃO - META A (AGRESSIVO)
    // ──────────────────────────────────────────────────────────────────────────────

    const swimAvgVel = swimStats.avgVelocityRaw || 0;

    // META A: Range de +12% a +18% mais rápido
    const swimVelA_min = swimAvgVel * 1.12;
    const swimVelA_max = swimAvgVel * 1.18;
    const swimTimeA_min = (raceDistances.swim * 1000) / swimVelA_max / 60;
    const swimTimeA_max = (raceDistances.swim * 1000) / swimVelA_min / 60;
    scenarios.agressivo.swimTime = `${Math.floor(swimTimeA_min)}-${Math.ceil(swimTimeA_max)} min`;
    scenarios.agressivo.swimPace = `${convertSwimPace(swimVelA_max).split('/')[0]}-${convertSwimPace(swimVelA_min).split('/')[0]}/100m`;

    // META B: Range de -2% a +2% da média
    const swimVelB_min = swimAvgVel * 0.98;
    const swimVelB_max = swimAvgVel * 1.02;
    const swimTimeB_min = (raceDistances.swim * 1000) / swimVelB_max / 60;
    const swimTimeB_max = (raceDistances.swim * 1000) / swimVelB_min / 60;
    scenarios.realista.swimTime = `${Math.floor(swimTimeB_min)}-${Math.ceil(swimTimeB_max)} min`;
    scenarios.realista.swimPace = `${convertSwimPace(swimVelB_max).split('/')[0]}-${convertSwimPace(swimVelB_min).split('/')[0]}/100m`;

    // META C: Range de -6% a -10% mais lento
    const swimVelC_min = swimAvgVel * 0.90;
    const swimVelC_max = swimAvgVel * 0.94;
    const swimTimeC_min = (raceDistances.swim * 1000) / swimVelC_max / 60;
    const swimTimeC_max = (raceDistances.swim * 1000) / swimVelC_min / 60;
    scenarios.conservador.swimTime = `${Math.floor(swimTimeC_min)}-${Math.ceil(swimTimeC_max)} min`;
    scenarios.conservador.swimPace = `${convertSwimPace(swimVelC_max).split('/')[0]}-${convertSwimPace(swimVelC_min).split('/')[0]}/100m`;

    // ──────────────────────────────────────────────────────────────────────────────
    // CICLISMO
    // ──────────────────────────────────────────────────────────────────────────────

    const bikeAvgVel = bikeStats.avgVelocityRaw || 0;

    // META A: Range de +10% a +14%
    const bikeVelA_min = bikeAvgVel * 1.10;
    const bikeVelA_max = bikeAvgVel * 1.14;
    const bikeTimeA_min = (raceDistances.bike * 1000) / bikeVelA_max / 60;
    const bikeTimeA_max = (raceDistances.bike * 1000) / bikeVelA_min / 60;
    scenarios.agressivo.bikeTime = `${formatMinutes(bikeTimeA_min)}-${formatMinutes(bikeTimeA_max)}`;
    const bikeSpeedA_min = (bikeVelA_min * 3.6).toFixed(1);
    const bikeSpeedA_max = (bikeVelA_max * 3.6).toFixed(1);
    scenarios.agressivo.bikeSpeed = `${bikeSpeedA_min}-${bikeSpeedA_max} km/h`;

    // META B: Range de -2% a +2%
    const bikeVelB_min = bikeAvgVel * 0.98;
    const bikeVelB_max = bikeAvgVel * 1.02;
    const bikeTimeB_min = (raceDistances.bike * 1000) / bikeVelB_max / 60;
    const bikeTimeB_max = (raceDistances.bike * 1000) / bikeVelB_min / 60;
    scenarios.realista.bikeTime = `${formatMinutes(bikeTimeB_min)}-${formatMinutes(bikeTimeB_max)}`;
    const bikeSpeedB_min = (bikeVelB_min * 3.6).toFixed(1);
    const bikeSpeedB_max = (bikeVelB_max * 3.6).toFixed(1);
    scenarios.realista.bikeSpeed = `${bikeSpeedB_min}-${bikeSpeedB_max} km/h`;

    // META C: Range de -4% a -8%
    const bikeVelC_min = bikeAvgVel * 0.92;
    const bikeVelC_max = bikeAvgVel * 0.96;
    const bikeTimeC_min = (raceDistances.bike * 1000) / bikeVelC_max / 60;
    const bikeTimeC_max = (raceDistances.bike * 1000) / bikeVelC_min / 60;
    scenarios.conservador.bikeTime = `${formatMinutes(bikeTimeC_min)}-${formatMinutes(bikeTimeC_max)}`;
    const bikeSpeedC_min = (bikeVelC_min * 3.6).toFixed(1);
    const bikeSpeedC_max = (bikeVelC_max * 3.6).toFixed(1);
    scenarios.conservador.bikeSpeed = `${bikeSpeedC_min}-${bikeSpeedC_max} km/h`;

    // ──────────────────────────────────────────────────────────────────────────────
    // CORRIDA
    // ──────────────────────────────────────────────────────────────────────────────

    const runAvgVel = runStats.avgVelocityRaw || 0;

    // META A: Range de +11% a +15%
    const runVelA_min = runAvgVel * 1.11;
    const runVelA_max = runAvgVel * 1.15;
    const runTimeA_min = (raceDistances.run * 1000) / runVelA_max / 60;
    const runTimeA_max = (raceDistances.run * 1000) / runVelA_min / 60;
    scenarios.agressivo.runTime = `${formatMinutes(runTimeA_min)}-${formatMinutes(runTimeA_max)}`;
    scenarios.agressivo.runPace = `${convertRunPace(runVelA_max).split('/')[0]}-${convertRunPace(runVelA_min).split('/')[0]}/km`;

    // META B: Range de -2% a +2%
    const runVelB_min = runAvgVel * 0.98;
    const runVelB_max = runAvgVel * 1.02;
    const runTimeB_min = (raceDistances.run * 1000) / runVelB_max / 60;
    const runTimeB_max = (raceDistances.run * 1000) / runVelB_min / 60;
    scenarios.realista.runTime = `${formatMinutes(runTimeB_min)}-${formatMinutes(runTimeB_max)}`;
    scenarios.realista.runPace = `${convertRunPace(runVelB_max).split('/')[0]}-${convertRunPace(runVelB_min).split('/')[0]}/km`;

    // META C: Range de -5% a -9%
    const runVelC_min = runAvgVel * 0.91;
    const runVelC_max = runAvgVel * 0.95;
    const runTimeC_min = (raceDistances.run * 1000) / runVelC_max / 60;
    const runTimeC_max = (raceDistances.run * 1000) / runVelC_min / 60;
    scenarios.conservador.runTime = `${formatMinutes(runTimeC_min)}-${formatMinutes(runTimeC_max)}`;
    scenarios.conservador.runPace = `${convertRunPace(runVelC_max).split('/')[0]}-${convertRunPace(runVelC_min).split('/')[0]}/km`;

    // ──────────────────────────────────────────────────────────────────────────────
    // TEMPO TOTAL (ranges incluindo transições)
    // ──────────────────────────────────────────────────────────────────────────────

    // META A: T1=3-4min, T2=2-3min
    const totalA_min = swimTimeA_min + 3 + bikeTimeA_min + 2 + runTimeA_min;
    const totalA_max = swimTimeA_max + 4 + bikeTimeA_max + 3 + runTimeA_max;
    scenarios.agressivo.totalTime = `${formatMinutes(totalA_min)}-${formatMinutes(totalA_max)}`;

    // META B: T1=4-5min, T2=3-4min
    const totalB_min = swimTimeB_min + 4 + bikeTimeB_min + 3 + runTimeB_min;
    const totalB_max = swimTimeB_max + 5 + bikeTimeB_max + 4 + runTimeB_max;
    scenarios.realista.totalTime = `${formatMinutes(totalB_min)}-${formatMinutes(totalB_max)}`;

    // META C: T1=4-5min, T2=4-5min
    const totalC_min = swimTimeC_min + 4 + bikeTimeC_min + 4 + runTimeC_min;
    const totalC_max = swimTimeC_max + 5 + bikeTimeC_max + 5 + runTimeC_max;
    scenarios.conservador.totalTime = `${formatMinutes(totalC_min)}-${formatMinutes(totalC_max)}`;

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
    // PASSO 2.5: ANÁLISES AVANÇADAS (ZONAS TEMPO, RACE PACE, PROVAS, BRICK RUNS)
    // ══════════════════════════════════════════════════════════════════════════════

    console.log('🔬 Executando análises avançadas...');

    // Detectar provas (races) no CSV
    const races = detectRaces(csvData);
    console.log(`🏆 Provas detectadas: ${races.length}`);

    // Análise de Zona Tempo - Natação (>3km)
    const swimTempoZone = calculateTempoZoneSwimStats(swim);
    if (swimTempoZone) {
        console.log(`🏊 Zona Tempo Natação: ${swimTempoZone.count} treinos, pace médio ${swimTempoZone.avgPace}`);
    }

    // Análise de Zona Tempo - Ciclismo (>90km)
    const bikeTempoZone = calculateTempoZoneBikeStats(bike);
    if (bikeTempoZone) {
        console.log(`🚴 Zona Tempo Ciclismo: ${bikeTempoZone.count} treinos, vel. média ${bikeTempoZone.avgSpeed}`);
        // IMPORTANTE: Usar velocidade da zona tempo para o ciclismo (mais preciso)
        bikeStats.avgVelocityRaw = bikeTempoZone.avgSpeedRaw / 3.6; // Converter de km/h para m/s
        bikeStats.avgPaceOrSpeed = bikeTempoZone.avgSpeed;
    }

    // Análise de Race Pace - Corrida (>18km)
    const runRacePace = calculateRacePaceRunStats(run);
    if (runRacePace) {
        console.log(`🏃 Race Pace Corrida: ${runRacePace.count} treinos, pace médio ${runRacePace.avgPace}`);
        // IMPORTANTE: Usar pace da race pace para corrida (mais preciso para prova)
        runStats.avgVelocityRaw = runRacePace.avgPaceRaw;
        runStats.avgPaceOrSpeed = runRacePace.avgPace;
    }

    // Detectar Brick Runs (bike+run no mesmo dia)
    const brickRuns = detectBrickRuns(csvData);
    console.log(`🔄 Brick Runs detectados: ${brickRuns.length}`);

    // Detectar Race Pace Sessions
    const racePaceSessions = detectRacePaceSessions(run);
    console.log(`🎯 Race Pace Sessions: ${racePaceSessions.length}`);

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
    // PASSO 5.5: GERAR HTML PARA SEÇÕES AVANÇADAS
    // ══════════════════════════════════════════════════════════════════════════════

    console.log('📄 Gerando HTML para seções avançadas...');

    const raceHistoryHTML = generateRaceHistoryHTML(races);
    const tempoZoneSwimHTML = generateTempoZoneSwimHTML(swimTempoZone);
    const tempoZoneBikeHTML = generateTempoZoneBikeHTML(bikeTempoZone);
    const racePaceRunHTML = generateRacePaceRunHTML(runRacePace, brickRuns, racePaceSessions);

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
    // SEÇÃO 2.5: HISTÓRICO DE PROVAS E ANÁLISES AVANÇADAS
    // ─────────────────────────────────────────────────────────────────────────────
    html = html.replace('<!-- INSERIR HISTÓRICO DE PROVAS AQUI -->', raceHistoryHTML);
    html = html.replace('<!-- INSERIR ZONA TEMPO NATAÇÃO AQUI -->', tempoZoneSwimHTML);
    html = html.replace('<!-- INSERIR ZONA TEMPO CICLISMO AQUI -->', tempoZoneBikeHTML);
    html = html.replace('<!-- INSERIR RACE PACE CORRIDA AQUI -->', racePaceRunHTML);

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
    // PASSO 6.5: CALCULAR FC, NP E ZONAS DINÂMICAS
    // ─────────────────────────────────────────────────────────────────────────────

    console.log('🔬 Calculando FC, NP e Zonas dinâmicas...');

    const hrRanges = calculateHeartRateRanges(swim, bike, run);
    const powerRanges = calculatePowerRanges(bike);
    const zoneValues = calculateZoneValues(swimStats, bikeStats, runStats, swim, bike, run, raceDistances);

    // ─────────────────────────────────────────────────────────────────────────────
    // PLACEHOLDERS JAVASCRIPT (para interatividade)
    // ─────────────────────────────────────────────────────────────────────────────
    // Estes são usados no objeto scenarios do JavaScript no template
    // Precisam ser preenchidos também para a interatividade funcionar

    // META A - JavaScript (VALORES DINÂMICOS BASEADOS NO CSV)
    html = html.replace(/{{JS_AGRESSIVO_SWIM_PACE}}/g, scenarios.agressivo.swimPace);
    html = html.replace(/{{JS_AGRESSIVO_SWIM_TIME}}/g, scenarios.agressivo.swimTime);
    html = html.replace(/{{JS_AGRESSIVO_SWIM_HR}}/g, hrRanges.agressivo.swim);
    html = html.replace(/{{JS_AGRESSIVO_BIKE_SPEED}}/g, scenarios.agressivo.bikeSpeed);
    html = html.replace(/{{JS_AGRESSIVO_BIKE_TIME}}/g, scenarios.agressivo.bikeTime);
    html = html.replace(/{{JS_AGRESSIVO_BIKE_HR}}/g, hrRanges.agressivo.bike);
    html = html.replace(/{{JS_AGRESSIVO_BIKE_NP}}/g, powerRanges.agressivo);
    html = html.replace(/{{JS_AGRESSIVO_RUN_PACE}}/g, scenarios.agressivo.runPace);
    html = html.replace(/{{JS_AGRESSIVO_RUN_TIME}}/g, scenarios.agressivo.runTime);
    html = html.replace(/{{JS_AGRESSIVO_RUN_HR}}/g, hrRanges.agressivo.run);

    // META B - JavaScript (VALORES DINÂMICOS BASEADOS NO CSV)
    html = html.replace(/{{JS_REALISTA_SWIM_PACE}}/g, scenarios.realista.swimPace);
    html = html.replace(/{{JS_REALISTA_SWIM_TIME}}/g, scenarios.realista.swimTime);
    html = html.replace(/{{JS_REALISTA_SWIM_HR}}/g, hrRanges.realista.swim);
    html = html.replace(/{{JS_REALISTA_BIKE_SPEED}}/g, scenarios.realista.bikeSpeed);
    html = html.replace(/{{JS_REALISTA_BIKE_TIME}}/g, scenarios.realista.bikeTime);
    html = html.replace(/{{JS_REALISTA_BIKE_HR}}/g, hrRanges.realista.bike);
    html = html.replace(/{{JS_REALISTA_BIKE_NP}}/g, powerRanges.realista);
    html = html.replace(/{{JS_REALISTA_RUN_PACE}}/g, scenarios.realista.runPace);
    html = html.replace(/{{JS_REALISTA_RUN_TIME}}/g, scenarios.realista.runTime);
    html = html.replace(/{{JS_REALISTA_RUN_HR}}/g, hrRanges.realista.run);

    // META C - JavaScript (VALORES DINÂMICOS BASEADOS NO CSV)
    html = html.replace(/{{JS_CONSERVADOR_SWIM_PACE}}/g, scenarios.conservador.swimPace);
    html = html.replace(/{{JS_CONSERVADOR_SWIM_TIME}}/g, scenarios.conservador.swimTime);
    html = html.replace(/{{JS_CONSERVADOR_SWIM_HR}}/g, hrRanges.conservador.swim);
    html = html.replace(/{{JS_CONSERVADOR_BIKE_SPEED}}/g, scenarios.conservador.bikeSpeed);
    html = html.replace(/{{JS_CONSERVADOR_BIKE_TIME}}/g, scenarios.conservador.bikeTime);
    html = html.replace(/{{JS_CONSERVADOR_BIKE_HR}}/g, hrRanges.conservador.bike);
    html = html.replace(/{{JS_CONSERVADOR_BIKE_NP}}/g, powerRanges.conservador);
    html = html.replace(/{{JS_CONSERVADOR_RUN_PACE}}/g, scenarios.conservador.runPace);
    html = html.replace(/{{JS_CONSERVADOR_RUN_TIME}}/g, scenarios.conservador.runTime);
    html = html.replace(/{{JS_CONSERVADOR_RUN_HR}}/g, hrRanges.conservador.run);

    // Aplicar ZONAS DINÂMICAS para todos os cenários
    // AGRESSIVO
    html = html.replace(/{{JS_AGRESSIVO_SWIM_ZONE1_PACE}}/g, zoneValues.agressivo.swim.zone1Pace);
    html = html.replace(/{{JS_AGRESSIVO_SWIM_ZONE2_PACE}}/g, zoneValues.agressivo.swim.zone2Pace);
    html = html.replace(/{{JS_AGRESSIVO_SWIM_ZONE3_PACE}}/g, zoneValues.agressivo.swim.zone3Pace);

    html = html.replace(/{{JS_AGRESSIVO_BIKE_ZONE1_SPEED}}/g, zoneValues.agressivo.bike.zone1Speed);
    html = html.replace(/{{JS_AGRESSIVO_BIKE_ZONE1_HR}}/g, zoneValues.agressivo.bike.zone1Hr);
    html = html.replace(/{{JS_AGRESSIVO_BIKE_ZONE1_NP}}/g, zoneValues.agressivo.bike.zone1Np);
    html = html.replace(/{{JS_AGRESSIVO_BIKE_ZONE2_SPEED}}/g, zoneValues.agressivo.bike.zone2Speed);
    html = html.replace(/{{JS_AGRESSIVO_BIKE_ZONE2_HR}}/g, zoneValues.agressivo.bike.zone2Hr);
    html = html.replace(/{{JS_AGRESSIVO_BIKE_ZONE2_NP}}/g, zoneValues.agressivo.bike.zone2Np);
    html = html.replace(/{{JS_AGRESSIVO_BIKE_ZONE3_SPEED}}/g, zoneValues.agressivo.bike.zone3Speed);
    html = html.replace(/{{JS_AGRESSIVO_BIKE_ZONE3_HR}}/g, zoneValues.agressivo.bike.zone3Hr);
    html = html.replace(/{{JS_AGRESSIVO_BIKE_ZONE3_NP}}/g, zoneValues.agressivo.bike.zone3Np);

    html = html.replace(/{{JS_AGRESSIVO_RUN_ZONE1_PACE}}/g, zoneValues.agressivo.run.zone1Pace);
    html = html.replace(/{{JS_AGRESSIVO_RUN_ZONE1_HR}}/g, zoneValues.agressivo.run.zone1Hr);
    html = html.replace(/{{JS_AGRESSIVO_RUN_ZONE1_TIME}}/g, zoneValues.agressivo.run.zone1Time);
    html = html.replace(/{{JS_AGRESSIVO_RUN_ZONE2_PACE}}/g, zoneValues.agressivo.run.zone2Pace);
    html = html.replace(/{{JS_AGRESSIVO_RUN_ZONE2_HR}}/g, zoneValues.agressivo.run.zone2Hr);
    html = html.replace(/{{JS_AGRESSIVO_RUN_ZONE2_TIME}}/g, zoneValues.agressivo.run.zone2Time);
    html = html.replace(/{{JS_AGRESSIVO_RUN_ZONE3_PACE}}/g, zoneValues.agressivo.run.zone3Pace);
    html = html.replace(/{{JS_AGRESSIVO_RUN_ZONE3_HR}}/g, zoneValues.agressivo.run.zone3Hr);
    html = html.replace(/{{JS_AGRESSIVO_RUN_ZONE3_TIME}}/g, zoneValues.agressivo.run.zone3Time);

    // REALISTA
    html = html.replace(/{{JS_REALISTA_SWIM_ZONE1_PACE}}/g, zoneValues.realista.swim.zone1Pace);
    html = html.replace(/{{JS_REALISTA_SWIM_ZONE2_PACE}}/g, zoneValues.realista.swim.zone2Pace);
    html = html.replace(/{{JS_REALISTA_SWIM_ZONE3_PACE}}/g, zoneValues.realista.swim.zone3Pace);

    html = html.replace(/{{JS_REALISTA_BIKE_ZONE1_SPEED}}/g, zoneValues.realista.bike.zone1Speed);
    html = html.replace(/{{JS_REALISTA_BIKE_ZONE1_HR}}/g, zoneValues.realista.bike.zone1Hr);
    html = html.replace(/{{JS_REALISTA_BIKE_ZONE1_NP}}/g, zoneValues.realista.bike.zone1Np);
    html = html.replace(/{{JS_REALISTA_BIKE_ZONE2_SPEED}}/g, zoneValues.realista.bike.zone2Speed);
    html = html.replace(/{{JS_REALISTA_BIKE_ZONE2_HR}}/g, zoneValues.realista.bike.zone2Hr);
    html = html.replace(/{{JS_REALISTA_BIKE_ZONE2_NP}}/g, zoneValues.realista.bike.zone2Np);
    html = html.replace(/{{JS_REALISTA_BIKE_ZONE3_SPEED}}/g, zoneValues.realista.bike.zone3Speed);
    html = html.replace(/{{JS_REALISTA_BIKE_ZONE3_HR}}/g, zoneValues.realista.bike.zone3Hr);
    html = html.replace(/{{JS_REALISTA_BIKE_ZONE3_NP}}/g, zoneValues.realista.bike.zone3Np);

    html = html.replace(/{{JS_REALISTA_RUN_ZONE1_PACE}}/g, zoneValues.realista.run.zone1Pace);
    html = html.replace(/{{JS_REALISTA_RUN_ZONE1_HR}}/g, zoneValues.realista.run.zone1Hr);
    html = html.replace(/{{JS_REALISTA_RUN_ZONE1_TIME}}/g, zoneValues.realista.run.zone1Time);
    html = html.replace(/{{JS_REALISTA_RUN_ZONE2_PACE}}/g, zoneValues.realista.run.zone2Pace);
    html = html.replace(/{{JS_REALISTA_RUN_ZONE2_HR}}/g, zoneValues.realista.run.zone2Hr);
    html = html.replace(/{{JS_REALISTA_RUN_ZONE2_TIME}}/g, zoneValues.realista.run.zone2Time);
    html = html.replace(/{{JS_REALISTA_RUN_ZONE3_PACE}}/g, zoneValues.realista.run.zone3Pace);
    html = html.replace(/{{JS_REALISTA_RUN_ZONE3_HR}}/g, zoneValues.realista.run.zone3Hr);
    html = html.replace(/{{JS_REALISTA_RUN_ZONE3_TIME}}/g, zoneValues.realista.run.zone3Time);

    // CONSERVADOR
    html = html.replace(/{{JS_CONSERVADOR_SWIM_ZONE1_PACE}}/g, zoneValues.conservador.swim.zone1Pace);
    html = html.replace(/{{JS_CONSERVADOR_SWIM_ZONE2_PACE}}/g, zoneValues.conservador.swim.zone2Pace);
    html = html.replace(/{{JS_CONSERVADOR_SWIM_ZONE3_PACE}}/g, zoneValues.conservador.swim.zone3Pace);

    html = html.replace(/{{JS_CONSERVADOR_BIKE_ZONE1_SPEED}}/g, zoneValues.conservador.bike.zone1Speed);
    html = html.replace(/{{JS_CONSERVADOR_BIKE_ZONE1_HR}}/g, zoneValues.conservador.bike.zone1Hr);
    html = html.replace(/{{JS_CONSERVADOR_BIKE_ZONE1_NP}}/g, zoneValues.conservador.bike.zone1Np);
    html = html.replace(/{{JS_CONSERVADOR_BIKE_ZONE2_SPEED}}/g, zoneValues.conservador.bike.zone2Speed);
    html = html.replace(/{{JS_CONSERVADOR_BIKE_ZONE2_HR}}/g, zoneValues.conservador.bike.zone2Hr);
    html = html.replace(/{{JS_CONSERVADOR_BIKE_ZONE2_NP}}/g, zoneValues.conservador.bike.zone2Np);
    html = html.replace(/{{JS_CONSERVADOR_BIKE_ZONE3_SPEED}}/g, zoneValues.conservador.bike.zone3Speed);
    html = html.replace(/{{JS_CONSERVADOR_BIKE_ZONE3_HR}}/g, zoneValues.conservador.bike.zone3Hr);
    html = html.replace(/{{JS_CONSERVADOR_BIKE_ZONE3_NP}}/g, zoneValues.conservador.bike.zone3Np);

    html = html.replace(/{{JS_CONSERVADOR_RUN_ZONE1_PACE}}/g, zoneValues.conservador.run.zone1Pace);
    html = html.replace(/{{JS_CONSERVADOR_RUN_ZONE1_HR}}/g, zoneValues.conservador.run.zone1Hr);
    html = html.replace(/{{JS_CONSERVADOR_RUN_ZONE1_TIME}}/g, zoneValues.conservador.run.zone1Time);
    html = html.replace(/{{JS_CONSERVADOR_RUN_ZONE2_PACE}}/g, zoneValues.conservador.run.zone2Pace);
    html = html.replace(/{{JS_CONSERVADOR_RUN_ZONE2_HR}}/g, zoneValues.conservador.run.zone2Hr);
    html = html.replace(/{{JS_CONSERVADOR_RUN_ZONE2_TIME}}/g, zoneValues.conservador.run.zone2Time);
    html = html.replace(/{{JS_CONSERVADOR_RUN_ZONE3_PACE}}/g, zoneValues.conservador.run.zone3Pace);
    html = html.replace(/{{JS_CONSERVADOR_RUN_ZONE3_HR}}/g, zoneValues.conservador.run.zone3Hr);
    html = html.replace(/{{JS_CONSERVADOR_RUN_ZONE3_TIME}}/g, zoneValues.conservador.run.zone3Time);

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
