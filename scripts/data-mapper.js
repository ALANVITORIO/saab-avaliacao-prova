/* ======================================
   DATA MAPPER
   Processa CSV e mapeia para variáveis dos templates
   ====================================== */

// Processar CSV para template Triathlon
function processForTriathlon(csvData, athleteName, eventName, eventDate, eventLocation) {
    // FILTRAR APENAS TREINOS VÁLIDOS (excluir avisos, promoções, etc)
    const validWorkouts = csvData.filter(w => {
        const validTypes = ['Run', 'Bike', 'Swim', 'Strength'];
        return w.WorkoutType && validTypes.includes(w.WorkoutType);
    });

    // Separar por disciplina (usando apenas treinos válidos)
    const swimWorkouts = validWorkouts.filter(w => w.WorkoutType === 'Swim');
    const bikeWorkouts = validWorkouts.filter(w => w.WorkoutType === 'Bike');
    const runWorkouts = validWorkouts.filter(w => w.WorkoutType === 'Run');

    // Calcular estatísticas
    const swimStats = calculateDisciplineStats(swimWorkouts);
    const bikeStats = calculateDisciplineStats(bikeWorkouts);
    const runStats = calculateDisciplineStats(runWorkouts);

    // Calcular geral (usando apenas treinos válidos)
    const totalWorkouts = validWorkouts.length;
    const totalHours = validWorkouts.reduce((sum, w) => sum + (parseFloat(w.TimeTotalInHours) || 0), 0);
    const totalWeeks = calculateWeeks(validWorkouts);

    // GERAR TABELAS HTML DINÂMICAS
    const swimWorkoutsTable = generateSwimWorkoutsTable(swimWorkouts);
    const swimZoneTempoAnalysis = generateSwimZoneTempoAnalysis(swimWorkouts);

    const bikeWorkoutsTable = generateBikeWorkoutsTable(bikeWorkouts);
    const bikeZoneTempoAnalysis = generateBikeZoneTempoAnalysis(bikeWorkouts);

    const runWorkoutsTable = generateRunWorkoutsTable(runWorkouts);
    const runRacePaceAnalysis = generateRunRacePaceAnalysis(runWorkouts);
    const brickRunsAnalysis = generateBrickRunsAnalysis(runWorkouts, bikeWorkouts);

    // CALCULAR CENÁRIOS DE PROVA
    const raceScenarios = calculateRaceScenarios(swimStats, bikeStats, runStats);

    return {
        // Informações básicas
        athleteName: athleteName || 'Atleta',
        eventName: eventName || 'Ironman 70.3',
        eventDate: eventDate || 'Data da Prova',
        eventLocation: eventLocation || 'Local',

        // Métricas gerais
        totalWeeks: totalWeeks,
        totalHours: totalHours.toFixed(1),
        totalWorkouts: totalWorkouts,

        // Natação
        swim: {
            workouts: swimWorkouts.length,
            totalKm: (swimStats.totalDistance / 1000).toFixed(1),
            avgPace: calculateSwimPace(swimStats.avgVelocity),
            bestWorkout: findBestSwimWorkout(swimWorkouts),
            totalHours: swimStats.totalTime.toFixed(1)
        },

        // Ciclismo
        bike: {
            workouts: bikeWorkouts.length,
            totalKm: (bikeStats.totalDistance / 1000).toFixed(0),
            avgSpeed: (bikeStats.avgVelocity * 3.6).toFixed(1),
            avgPower: bikeStats.avgPower ? bikeStats.avgPower.toFixed(0) : 'N/A',
            bestWorkout: findBestBikeWorkout(bikeWorkouts),
            totalHours: bikeStats.totalTime.toFixed(1)
        },

        // Corrida
        run: {
            workouts: runWorkouts.length,
            totalKm: (runStats.totalDistance / 1000).toFixed(1),
            avgPace: calculateRunPace(runStats.avgVelocity),
            avgHR: runStats.avgHR ? runStats.avgHR.toFixed(0) : 'N/A',
            bestWorkout: findBestRunWorkout(runWorkouts),
            totalHours: runStats.totalTime.toFixed(1)
        },

        // TABELAS HTML GERADAS DINAMICAMENTE
        swimWorkoutsTableHTML: swimWorkoutsTable,
        swimZoneTempoHTML: swimZoneTempoAnalysis,
        bikeWorkoutsTableHTML: bikeWorkoutsTable,
        bikeZoneTempoHTML: bikeZoneTempoAnalysis,
        runWorkoutsTableHTML: runWorkoutsTable,
        runRacePaceHTML: runRacePaceAnalysis,
        brickRunsHTML: brickRunsAnalysis,
        raceScenariosHTML: raceScenarios,

        // Dados para gráficos (usados pelo dashboard visual)
        chartData: {
            swim: {
                workouts: swimWorkouts.length,
                totalKm: parseFloat((swimStats.totalDistance / 1000).toFixed(1)),
                totalHours: parseFloat(swimStats.totalTime.toFixed(1)),
                avgPaceValue: swimStats.avgVelocity > 0 ? (100 / swimStats.avgVelocity / 60).toFixed(2) : 0
            },
            bike: {
                workouts: bikeWorkouts.length,
                totalKm: parseFloat((bikeStats.totalDistance / 1000).toFixed(0)),
                totalHours: parseFloat(bikeStats.totalTime.toFixed(1)),
                avgSpeed: parseFloat((bikeStats.avgVelocity * 3.6).toFixed(1))
            },
            run: {
                workouts: runWorkouts.length,
                totalKm: parseFloat((runStats.totalDistance / 1000).toFixed(1)),
                totalHours: parseFloat(runStats.totalTime.toFixed(1)),
                avgPaceValue: runStats.avgVelocity > 0 ? (1000 / runStats.avgVelocity / 60).toFixed(2) : 0
            }
        }
    };
}

// Processar CSV para template Corrida
function processForCorrida(csvData, athleteName, eventName, eventDate) {
    // FILTRAR APENAS TREINOS DE CORRIDA VÁLIDOS
    const runWorkouts = csvData.filter(w => w.WorkoutType === 'Run');
    const stats = calculateDisciplineStats(runWorkouts);

    // Projetar tempo baseado nos treinos
    const projectedTime = projectMarathonTime(runWorkouts);
    const targetPace = calculateTargetPace(projectedTime);

    // Calcular dados para gráficos
    const workoutsByType = categorizeRunWorkouts(runWorkouts);
    const weeklyVolumes = calculateWeeklyVolumes(runWorkouts);
    const paceByDistance = calculatePaceByDistance(runWorkouts);

    // NOVOS CÁLCULOS: Longões e métricas específicas
    const longRunsData = calculateLongRunsData(runWorkouts);
    const trainingPeriod = calculateTrainingPeriod(runWorkouts);

    return {
        // Informações básicas
        athleteName: athleteName || 'Atleta',
        eventName: eventName || 'Corrida',
        eventDate: eventDate || 'Data da Prova',

        // Métricas
        totalWorkouts: runWorkouts.length,
        totalKm: (stats.totalDistance / 1000).toFixed(1),
        totalHours: stats.totalTime.toFixed(1),
        avgPace: calculateRunPace(stats.avgVelocity),
        avgHR: stats.avgHR ? stats.avgHR.toFixed(0) : 'N/A',

        // Projeções
        projectedTime: projectedTime,
        targetPace: targetPace,

        // Melhor treino
        bestWorkout: findBestRunWorkout(runWorkouts),

        // NOVOS: Dados dos longões ≥20km
        longRunsCount: longRunsData.count,
        longRunsAvgPace: longRunsData.avgPace,
        longRunsAvgHR: longRunsData.avgHR,
        longRunsAvgPower: longRunsData.avgPower,
        longRunsMaxHR: longRunsData.maxHR,
        keyLongRun: longRunsData.keyLongRun,

        // NOVO: Período de preparação
        trainingPeriod: trainingPeriod.short,
        trainingPeriodFull: trainingPeriod.full,

        // Dados para gráficos (usados pelo dashboard visual)
        chartData: {
            workoutTypes: workoutsByType,
            weeklyVolume: weeklyVolumes,
            paceByDistance: paceByDistance,
            totalRuns: runWorkouts.length,
            totalKm: parseFloat((stats.totalDistance / 1000).toFixed(1)),
            totalHours: parseFloat(stats.totalTime.toFixed(1)),
            avgPaceValue: stats.avgVelocity > 0 ? parseFloat((1000 / stats.avgVelocity / 60).toFixed(2)) : 5.5,
            avgHR: stats.avgHR ? parseFloat(stats.avgHR.toFixed(0)) : 145
        }
    };
}

// ======================================
// FUNÇÕES AUXILIARES
// ======================================

function calculateDisciplineStats(workouts) {
    if (workouts.length === 0) {
        return {
            totalDistance: 0,
            totalTime: 0,
            avgVelocity: 0,
            avgPower: 0,
            avgHR: 0
        };
    }

    // ETAPA 1: FILTRAGEM DE QUALIDADE - A PARTE MAIS IMPORTANTE DA SOLUÇÃO
    // Esta etapa cria uma nova lista contendo apenas os treinos que são 100% válidos.
    const validWorkouts = workouts.filter(w => {
        const distance = parseFloat(w.DistanceInMeters);
        const time = parseFloat(w.TimeTotalInHours);
        const velocity = parseFloat(w.VelocityAverage);

        // Um treino é considerado válido SE E SOMENTE SE:
        // 1. Ele tem um 'WorkoutType' definido.
        // 2. A distância é um número (não NaN) e é maior que zero.
        // 3. O tempo é um número (não NaN) e é maior que zero.
        // 4. A velocidade é um número (não NaN) e é maior que zero.
        return w.WorkoutType &&
               !isNaN(distance) && distance > 0 &&
               !isNaN(time) && time > 0 &&
               !isNaN(velocity) && velocity > 0;
    });

    // Se após a filtragem não sobrar nenhum treino, retornamos um objeto zerado
    if (validWorkouts.length === 0) {
        return {
            totalDistance: 0,
            totalTime: 0,
            avgVelocity: 0,
            avgPower: 0,
            avgHR: 0
        };
    }

    // ETAPA 2: CÁLCULOS SEGUROS (usando apenas validWorkouts)
    const totalDistance = validWorkouts.reduce((sum, w) => sum + parseFloat(w.DistanceInMeters), 0);
    const totalTime = validWorkouts.reduce((sum, w) => sum + parseFloat(w.TimeTotalInHours), 0);

    // Velocidades (já validadas na etapa de filtragem)
    const velocities = validWorkouts.map(w => parseFloat(w.VelocityAverage));
    const avgVelocity = velocities.reduce((sum, v) => sum + v, 0) / velocities.length;

    // Para Power e HR, filtramos novamente para garantir que não haja NaN ou zeros
    const powers = validWorkouts.map(w => parseFloat(w.PowerAverage)).filter(p => !isNaN(p) && p > 0);
    const avgPower = powers.length > 0 ? powers.reduce((sum, p) => sum + p, 0) / powers.length : 0;

    const heartRates = validWorkouts.map(w => parseFloat(w.HeartRateAverage)).filter(hr => !isNaN(hr) && hr > 0);
    const avgHR = heartRates.length > 0 ? heartRates.reduce((sum, hr) => sum + hr, 0) / heartRates.length : 0;

    return {
        totalDistance,
        totalTime,
        avgVelocity,
        avgPower,
        avgHR
    };
}

function calculateSwimPace(velocity) {
    if (!velocity || velocity <= 0) return 'N/A';

    // velocity em m/s, converter para min/100m
    const secondsPer100m = 100 / velocity;
    const minutes = Math.floor(secondsPer100m / 60);
    const seconds = Math.round(secondsPer100m % 60);

    return `${minutes}:${seconds.toString().padStart(2, '0')}/100m`;
}

function calculateRunPace(velocity) {
    if (!velocity || velocity <= 0) return 'N/A';

    // velocity em m/s, converter para min/km
    const secondsPerKm = 1000 / velocity;
    const minutes = Math.floor(secondsPerKm / 60);
    const seconds = Math.round(secondsPerKm % 60);

    return `${minutes}:${seconds.toString().padStart(2, '0')}/km`;
}

function calculateWeeks(csvData) {
    if (csvData.length === 0) return 0;

    const dates = csvData
        .map(w => new Date(w.WorkoutDay))
        .filter(d => !isNaN(d.getTime()))
        .sort((a, b) => a - b);

    if (dates.length < 2) return 1;

    const firstDate = dates[0];
    const lastDate = dates[dates.length - 1];
    const diffTime = Math.abs(lastDate - firstDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const weeks = Math.ceil(diffDays / 7);

    return weeks;
}

function findBestSwimWorkout(workouts) {
    if (workouts.length === 0) return 'N/A';

    const best = workouts.reduce((best, current) => {
        const currentVel = parseFloat(current.VelocityAverage) || 0;
        const bestVel = parseFloat(best.VelocityAverage) || 0;
        return currentVel > bestVel ? current : best;
    });

    const distance = ((parseFloat(best.DistanceInMeters) || 0) / 1000).toFixed(1);
    const pace = calculateSwimPace(parseFloat(best.VelocityAverage));

    return `${distance}km - ${pace}`;
}

function findBestBikeWorkout(workouts) {
    if (workouts.length === 0) return 'N/A';

    const best = workouts.reduce((best, current) => {
        const currentVel = parseFloat(current.VelocityAverage) || 0;
        const bestVel = parseFloat(best.VelocityAverage) || 0;
        return currentVel > bestVel ? current : best;
    });

    const distance = ((parseFloat(best.DistanceInMeters) || 0) / 1000).toFixed(0);
    const speed = ((parseFloat(best.VelocityAverage) || 0) * 3.6).toFixed(1);

    return `${distance}km - ${speed}km/h`;
}

function findBestRunWorkout(workouts) {
    if (workouts.length === 0) return 'N/A';

    const best = workouts.reduce((best, current) => {
        const currentVel = parseFloat(current.VelocityAverage) || 0;
        const bestVel = parseFloat(best.VelocityAverage) || 0;
        return currentVel > bestVel ? current : best;
    });

    const distance = ((parseFloat(best.DistanceInMeters) || 0) / 1000).toFixed(1);
    const pace = calculateRunPace(parseFloat(best.VelocityAverage));

    return `${distance}km - ${pace}`;
}

function projectMarathonTime(runWorkouts) {
    if (runWorkouts.length === 0) return '3:30:00';

    // Pegar os últimos 10 treinos longos
    const longRuns = runWorkouts
        .filter(w => (parseFloat(w.DistanceInMeters) || 0) > 10000)
        .sort((a, b) => new Date(b.WorkoutDay) - new Date(a.WorkoutDay))
        .slice(0, 10);

    if (longRuns.length === 0) return '3:30:00';

    // Calcular pace médio dos longões
    const avgVelocity = longRuns.reduce((sum, w) =>
        sum + (parseFloat(w.VelocityAverage) || 0), 0) / longRuns.length;

    // Projetar para 42.2km (ajustar para fadiga)
    const marathonVelocity = avgVelocity * 0.92; // 8% mais lento
    const timeInSeconds = 42200 / marathonVelocity;

    const hours = Math.floor(timeInSeconds / 3600);
    const minutes = Math.floor((timeInSeconds % 3600) / 60);
    const seconds = Math.floor(timeInSeconds % 60);

    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function calculateTargetPace(timeStr) {
    // timeStr formato: "3:30:00"
    const parts = timeStr.split(':');
    const hours = parseInt(parts[0]);
    const minutes = parseInt(parts[1]);
    const seconds = parseInt(parts[2] || 0);

    const totalSeconds = hours * 3600 + minutes * 60 + seconds;
    const secondsPerKm = totalSeconds / 42.2;

    const min = Math.floor(secondsPerKm / 60);
    const sec = Math.round(secondsPerKm % 60);

    return `${min}:${sec.toString().padStart(2, '0')}`;
}

// Categorizar treinos de corrida por tipo
function categorizeRunWorkouts(runWorkouts) {
    const long = runWorkouts.filter(w => (parseFloat(w.DistanceInMeters) || 0) >= 15000).length;
    const tempo = runWorkouts.filter(w => {
        const dist = parseFloat(w.DistanceInMeters) || 0;
        const velocity = parseFloat(w.VelocityAverage) || 0;
        return dist >= 8000 && dist < 15000 && velocity > 3.5; // > 4:44/km
    }).length;
    const intervals = runWorkouts.filter(w => {
        const dist = parseFloat(w.DistanceInMeters) || 0;
        const velocity = parseFloat(w.VelocityAverage) || 0;
        return dist < 8000 && velocity > 3.7; // > 4:30/km
    }).length;
    const recovery = runWorkouts.length - long - tempo - intervals;

    return {
        long: long,
        tempo: tempo,
        intervals: intervals,
        recovery: Math.max(0, recovery)
    };
}

// Calcular volume semanal (últimas 4 semanas)
function calculateWeeklyVolumes(runWorkouts) {
    if (runWorkouts.length === 0) return [0, 0, 0, 0];

    // Ordenar por data
    const sorted = runWorkouts
        .filter(w => w.WorkoutDay)
        .sort((a, b) => new Date(b.WorkoutDay) - new Date(a.WorkoutDay));

    if (sorted.length === 0) return [0, 0, 0, 0];

    // Agrupar por semana (últimas 4 semanas)
    const now = new Date(sorted[0].WorkoutDay);
    const weeks = [[], [], [], []];

    sorted.forEach(w => {
        const date = new Date(w.WorkoutDay);
        const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
        const weekIndex = Math.floor(diffDays / 7);

        if (weekIndex < 4) {
            weeks[weekIndex].push(w);
        }
    });

    // Calcular km por semana
    return weeks.map(week => {
        const totalKm = week.reduce((sum, w) => sum + (parseFloat(w.DistanceInMeters) || 0), 0) / 1000;
        return Math.round(totalKm);
    }).reverse(); // Ordem cronológica
}

// Calcular pace médio por faixa de distância
function calculatePaceByDistance(runWorkouts) {
    const ranges = {
        short: runWorkouts.filter(w => {
            const dist = parseFloat(w.DistanceInMeters) || 0;
            return dist < 10000 && dist > 3000;
        }),
        medium: runWorkouts.filter(w => {
            const dist = parseFloat(w.DistanceInMeters) || 0;
            return dist >= 10000 && dist < 15000;
        }),
        long: runWorkouts.filter(w => {
            const dist = parseFloat(w.DistanceInMeters) || 0;
            return dist >= 15000 && dist < 25000;
        }),
        veryLong: runWorkouts.filter(w => {
            const dist = parseFloat(w.DistanceInMeters) || 0;
            return dist >= 25000;
        })
    };

    const calculateAvgPace = (workouts) => {
        if (workouts.length === 0) return 5.5; // default
        const avgVelocity = workouts.reduce((sum, w) =>
            sum + (parseFloat(w.VelocityAverage) || 0), 0) / workouts.length;
        return avgVelocity > 0 ? parseFloat((1000 / avgVelocity / 60).toFixed(2)) : 5.5;
    };

    return {
        short: calculateAvgPace(ranges.short),
        medium: calculateAvgPace(ranges.medium),
        long: calculateAvgPace(ranges.long),
        veryLong: calculateAvgPace(ranges.veryLong)
    };
}

// Calcular dados dos longões ≥20km
function calculateLongRunsData(runWorkouts) {
    // Filtrar longões ≥20km
    const longRuns = runWorkouts.filter(w => {
        const dist = parseFloat(w.DistanceInMeters) || 0;
        return dist >= 20000;
    });

    if (longRuns.length === 0) {
        return {
            count: 0,
            avgPace: 'N/A',
            avgHR: 'N/A',
            avgPower: 'N/A',
            maxHR: 'N/A',
            keyLongRun: 'Nenhum longão ≥20km encontrado'
        };
    }

    // Calcular médias dos longões
    const velocities = longRuns.map(w => parseFloat(w.VelocityAverage)).filter(v => !isNaN(v) && v > 0);
    const avgVelocity = velocities.length > 0 ? velocities.reduce((sum, v) => sum + v, 0) / velocities.length : 0;
    const avgPace = calculateRunPace(avgVelocity);

    const heartRates = longRuns.map(w => parseFloat(w.HeartRateAverage)).filter(hr => !isNaN(hr) && hr > 0);
    const avgHR = heartRates.length > 0 ? Math.round(heartRates.reduce((sum, hr) => sum + hr, 0) / heartRates.length) : 0;

    const powers = longRuns.map(w => parseFloat(w.PowerAverage)).filter(p => !isNaN(p) && p > 0);
    const avgPower = powers.length > 0 ? Math.round(powers.reduce((sum, p) => sum + p, 0) / powers.length) : 0;

    const allHRs = longRuns.map(w => parseFloat(w.HeartRateMax)).filter(hr => !isNaN(hr) && hr > 0);
    const maxHR = allHRs.length > 0 ? Math.max(...allHRs) : 0;

    // Encontrar o longão chave (maior distância)
    const bestLongRun = longRuns.reduce((best, current) => {
        const currentDist = parseFloat(current.DistanceInMeters) || 0;
        const bestDist = parseFloat(best.DistanceInMeters) || 0;
        return currentDist > bestDist ? current : best;
    }, longRuns[0]);

    const keyDistance = ((parseFloat(bestLongRun.DistanceInMeters) || 0) / 1000).toFixed(0);
    const keyPace = calculateRunPace(parseFloat(bestLongRun.VelocityAverage));
    const keyDate = new Date(bestLongRun.WorkoutDay).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const keyHR = Math.round(parseFloat(bestLongRun.HeartRateAverage) || 0);
    const keyPower = Math.round(parseFloat(bestLongRun.PowerAverage) || 0);

    const keyLongRunText = `${keyDistance}km em ${keyPace} (${keyDate})${keyHR > 0 ? ` - FC: ${keyHR} bpm` : ''}${keyPower > 0 ? ` - Power Avg: ${keyPower}W` : ''}`;

    return {
        count: longRuns.length,
        avgPace: avgPace,
        avgHR: avgHR > 0 ? `${avgHR} bpm` : 'N/A',
        avgPower: avgPower > 0 ? `${avgPower}W` : 'N/A',
        maxHR: maxHR > 0 ? `${maxHR} bpm` : 'N/A',
        keyLongRun: keyLongRunText
    };
}

// Calcular período de preparação
function calculateTrainingPeriod(runWorkouts) {
    if (runWorkouts.length === 0) {
        return {
            short: 'Período de Preparação',
            full: 'Período de Preparação'
        };
    }

    const dates = runWorkouts
        .map(w => new Date(w.WorkoutDay))
        .filter(d => !isNaN(d.getTime()))
        .sort((a, b) => a - b);

    if (dates.length === 0) {
        return {
            short: 'Período de Preparação',
            full: 'Período de Preparação'
        };
    }

    const firstDate = dates[0];
    const lastDate = dates[dates.length - 1];

    const monthsShort = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const monthsFull = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

    const firstMonthShort = monthsShort[firstDate.getMonth()];
    const lastMonthShort = monthsShort[lastDate.getMonth()];
    const lastYear = lastDate.getFullYear();

    const short = firstMonthShort === lastMonthShort ?
        firstMonthShort :
        `${firstMonthShort} - ${lastMonthShort}`;

    const full = firstMonthShort === lastMonthShort ?
        `${firstMonthShort} ${lastYear}` :
        `${firstMonthShort} - ${lastMonthShort} ${lastYear}`;

    return {
        short: short,
        full: full
    };
}

// ======================================
// FUNÇÕES GERADORAS DE HTML
// ======================================

function generateSwimWorkoutsTable(swimWorkouts) {
    if (swimWorkouts.length === 0) {
        return '<p>Nenhum treino de natação encontrado.</p>';
    }

    // Filtrar e ordenar os treinos longos (>= 1.5km)
    const longSwims = swimWorkouts
        .filter(w => (parseFloat(w.DistanceInMeters) || 0) >= 1500)
        .sort((a, b) => new Date(b.WorkoutDay) - new Date(a.WorkoutDay))
        .slice(0, 13); // Top 13

    if (longSwims.length === 0) {
        return '<p>Nenhum treino longo de natação encontrado.</p>';
    }

    let html = `<table class="data-table">
    <thead>
        <tr>
            <th>Data</th>
            <th>Distância</th>
            <th>Tempo</th>
            <th>Pace</th>
            <th>FC Média</th>
        </tr>
    </thead>
    <tbody>`;

    longSwims.forEach((w, index) => {
        const date = new Date(w.WorkoutDay).toLocaleDateString('pt-BR');
        const distance = ((parseFloat(w.DistanceInMeters) || 0) / 1000).toFixed(1);
        const time = formatTime(parseFloat(w.TimeTotalInHours) || 0);
        const pace = calculateSwimPace(parseFloat(w.VelocityAverage));
        const hr = Math.round(parseFloat(w.HeartRateAverage) || 0);

        // Destacar os 3 melhores
        const highlightClass = (parseFloat(w.DistanceInMeters) >= 3000) ? ' class="highlight"' : '';

        html += `
        <tr${highlightClass}>
            <td>${date}</td>
            <td><strong>${distance} km</strong></td>
            <td>${time}</td>
            <td>${pace}</td>
            <td>${hr} bpm</td>
        </tr>`;
    });

    html += `
    </tbody>
</table>`;

    return html;
}

function generateSwimZoneTempoAnalysis(swimWorkouts) {
    // Filtrar treinos em zona tempo (>= 3km)
    const zoneTempo = swimWorkouts.filter(w => (parseFloat(w.DistanceInMeters) || 0) >= 3000);

    if (zoneTempo.length === 0) {
        return '<p>Nenhum treino em zona tempo encontrado.</p>';
    }

    const stats = calculateDisciplineStats(zoneTempo);
    const avgDistance = (stats.totalDistance / zoneTempo.length / 1000).toFixed(1);
    const avgPace = calculateSwimPace(stats.avgVelocity);
    const avgHR = stats.avgHR > 0 ? Math.round(stats.avgHR) : 'N/A';

    // Melhor performance
    const best = zoneTempo.reduce((best, curr) => {
        const currVel = parseFloat(curr.VelocityAverage) || 0;
        const bestVel = parseFloat(best.VelocityAverage) || 0;
        return currVel > bestVel ? curr : best;
    });

    const bestDate = new Date(best.WorkoutDay).toLocaleDateString('pt-BR');
    const bestDist = ((parseFloat(best.DistanceInMeters) || 0) / 1000).toFixed(1);
    const bestTime = formatTime(parseFloat(best.TimeTotalInHours) || 0);
    const bestPace = calculateSwimPace(parseFloat(best.VelocityAverage));
    const bestHR = Math.round(parseFloat(best.HeartRateAverage) || 0);

    return `
<div style="background: linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%); border-left: 5px solid #D0494E; border-radius: 12px; padding: 30px; margin: 30px 0;">
    <h4 style="color: #400404; font-size: 1.3em; font-weight: 700; margin-bottom: 20px;">ANÁLISE DOS TREINOS EM ZONA TEMPO - NATAÇÃO</h4>
    <p style="margin-bottom: 20px; color: #333;">Treinos acima de 3.0km considerados em Zona Tempo (destacados):</p>

    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-top: 20px;">
        <div style="background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <div style="font-size: 0.9em; color: #666; margin-bottom: 5px;">Distância Média</div>
            <div style="font-size: 1.8em; font-weight: 700; color: #400404;">${avgDistance} km</div>
        </div>
        <div style="background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <div style="font-size: 0.9em; color: #666; margin-bottom: 5px;">Pace Médio</div>
            <div style="font-size: 1.8em; font-weight: 700; color: #400404;">${avgPace}</div>
        </div>
        <div style="background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <div style="font-size: 0.9em; color: #666; margin-bottom: 5px;">FC Médio</div>
            <div style="font-size: 1.8em; font-weight: 700; color: #400404;">${avgHR} bpm</div>
        </div>
        <div style="background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <div style="font-size: 0.9em; color: #666; margin-bottom: 5px;">Total de Treinos</div>
            <div style="font-size: 1.8em; font-weight: 700; color: #400404;">${zoneTempo.length}</div>
        </div>
    </div>

    <div style="margin-top: 25px; padding: 20px; background: white; border-radius: 10px;">
        <strong style="color: #400404; display: block; margin-bottom: 10px;">Melhor Performance:</strong>
        <p style="margin: 0; color: #333;">${bestDate} - ${bestDist}km em ${bestTime} - Pace ${bestPace} - FC ${bestHR}bpm</p>
    </div>
</div>`;
}

function generateBikeWorkoutsTable(bikeWorkouts) {
    if (bikeWorkouts.length === 0) {
        return '<p>Nenhum treino de ciclismo encontrado.</p>';
    }

    // Filtrar e ordenar os treinos longos (>= 70km)
    const longRides = bikeWorkouts
        .filter(w => (parseFloat(w.DistanceInMeters) || 0) >= 70000)
        .sort((a, b) => new Date(b.WorkoutDay) - new Date(a.WorkoutDay))
        .slice(0, 9); // Top 9

    if (longRides.length === 0) {
        return '<p>Nenhum treino longo de ciclismo encontrado.</p>';
    }

    let html = `<table class="data-table">
    <thead>
        <tr>
            <th>Data</th>
            <th>Distância</th>
            <th>Tempo</th>
            <th>Velocidade</th>
            <th>FC Média</th>
            <th>Tipo</th>
        </tr>
    </thead>
    <tbody>`;

    longRides.forEach(w => {
        const date = new Date(w.WorkoutDay).toLocaleDateString('pt-BR');
        const distance = ((parseFloat(w.DistanceInMeters) || 0) / 1000).toFixed(1);
        const time = formatTime(parseFloat(w.TimeTotalInHours) || 0);
        const speed = ((parseFloat(w.VelocityAverage) || 0) * 3.6).toFixed(1);
        const hr = Math.round(parseFloat(w.HeartRateAverage) || 0);

        // Determinar tipo baseado na distância
        const tipo = (parseFloat(w.DistanceInMeters) >= 90000) ?
            '<td style="color: #D0494E; font-weight: 700;">Transição</td>' :
            '<td>Longo</td>';

        // Destacar os transição
        const highlightClass = (parseFloat(w.DistanceInMeters) >= 90000) ? ' class="highlight"' : '';

        html += `
        <tr${highlightClass}>
            <td>${date}</td>
            <td><strong>${distance} km</strong></td>
            <td>${time}</td>
            <td>${speed} km/h</td>
            <td>${hr} bpm</td>
            ${tipo}
        </tr>`;
    });

    html += `
    </tbody>
</table>`;

    return html;
}

function generateBikeZoneTempoAnalysis(bikeWorkouts) {
    // Filtrar treinos em zona tempo (>= 90km)
    const zoneTempo = bikeWorkouts.filter(w => (parseFloat(w.DistanceInMeters) || 0) >= 90000);

    if (zoneTempo.length === 0) {
        return '<p>Nenhum treino em zona tempo encontrado.</p>';
    }

    const stats = calculateDisciplineStats(zoneTempo);
    const avgDistance = (stats.totalDistance / zoneTempo.length / 1000).toFixed(1);
    const avgSpeed = (stats.avgVelocity * 3.6).toFixed(1);
    const avgHR = stats.avgHR > 0 ? Math.round(stats.avgHR) : 'N/A';

    // Melhor performance
    const best = zoneTempo.reduce((best, curr) => {
        const currVel = parseFloat(curr.VelocityAverage) || 0;
        const bestVel = parseFloat(best.VelocityAverage) || 0;
        return currVel > bestVel ? curr : best;
    });

    const bestDate = new Date(best.WorkoutDay).toLocaleDateString('pt-BR');
    const bestDist = ((parseFloat(best.DistanceInMeters) || 0) / 1000).toFixed(0);
    const bestTime = formatTime(parseFloat(best.TimeTotalInHours) || 0);
    const bestSpeed = ((parseFloat(best.VelocityAverage) || 0) * 3.6).toFixed(1);
    const bestHR = Math.round(parseFloat(best.HeartRateAverage) || 0);

    return `
<div style="background: linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%); border-left: 5px solid #D0494E; border-radius: 12px; padding: 30px; margin: 30px 0;">
    <h4 style="color: #400404; font-size: 1.3em; font-weight: 700; margin-bottom: 20px;">ANÁLISE DOS TREINOS EM ZONA TEMPO - CICLISMO</h4>
    <p style="margin-bottom: 20px; color: #333;">Treinos acima de 90km considerados em Zona Tempo (destacados):</p>

    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-top: 20px;">
        <div style="background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <div style="font-size: 0.9em; color: #666; margin-bottom: 5px;">Distância Média</div>
            <div style="font-size: 1.8em; font-weight: 700; color: #400404;">${avgDistance} km</div>
        </div>
        <div style="background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <div style="font-size: 0.9em; color: #666; margin-bottom: 5px;">Vel. Média</div>
            <div style="font-size: 1.8em; font-weight: 700; color: #400404;">${avgSpeed} km/h</div>
        </div>
        <div style="background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <div style="font-size: 0.9em; color: #666; margin-bottom: 5px;">FC Médio</div>
            <div style="font-size: 1.8em; font-weight: 700; color: #400404;">${avgHR} bpm</div>
        </div>
        <div style="background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <div style="font-size: 0.9em; color: #666; margin-bottom: 5px;">Total de Treinos</div>
            <div style="font-size: 1.8em; font-weight: 700; color: #400404;">${zoneTempo.length}</div>
        </div>
    </div>

    <div style="margin-top: 25px; padding: 20px; background: white; border-radius: 10px;">
        <strong style="color: #400404; display: block; margin-bottom: 10px;">Melhor Performance:</strong>
        <p style="margin: 0; color: #333;">${bestDate} - ${bestDist}km em ${bestTime} - Velocidade ${bestSpeed} km/h - FC ${bestHR}bpm</p>
    </div>
</div>`;
}

function generateRunWorkoutsTable(runWorkouts) {
    if (runWorkouts.length === 0) {
        return '<p>Nenhum treino de corrida encontrado.</p>';
    }

    // Filtrar e ordenar os treinos longos (>= 10km)
    const longRuns = runWorkouts
        .filter(w => (parseFloat(w.DistanceInMeters) || 0) >= 10000)
        .sort((a, b) => new Date(b.WorkoutDay) - new Date(a.WorkoutDay))
        .slice(0, 12); // Top 12

    if (longRuns.length === 0) {
        return '<p>Nenhum treino longo de corrida encontrado.</p>';
    }

    let html = `<table class="data-table">
    <thead>
        <tr>
            <th>Data</th>
            <th>Distância</th>
            <th>Tempo</th>
            <th>Pace</th>
            <th>FC Média</th>
            <th>Tipo</th>
        </tr>
    </thead>
    <tbody>`;

    longRuns.forEach(w => {
        const date = new Date(w.WorkoutDay).toLocaleDateString('pt-BR');
        const distance = ((parseFloat(w.DistanceInMeters) || 0) / 1000).toFixed(1);
        const time = formatTime(parseFloat(w.TimeTotalInHours) || 0);
        const pace = calculateRunPace(parseFloat(w.VelocityAverage));
        const hr = Math.round(parseFloat(w.HeartRateAverage) || 0);

        const distMeters = parseFloat(w.DistanceInMeters) || 0;
        const velocity = parseFloat(w.VelocityAverage) || 0;

        // Determinar tipo
        let tipo = 'Longo';
        let color = '';
        if (distMeters >= 18000) {
            tipo = 'Longo';
            color = '';
        } else if (velocity > 3.5) {
            tipo = 'Race Pace';
            color = ' style="color: #4CAF50; font-weight: 700;"';
        } else {
            tipo = 'Transição';
            color = ' style="color: #FF6F00; font-weight: 700;"';
        }

        // Destacar os longos >= 18km
        const highlightClass = (distMeters >= 18000) ? ' class="highlight"' : '';

        html += `
        <tr${highlightClass}>
            <td>${date}</td>
            <td><strong>${distance} km</strong></td>
            <td>${time}</td>
            <td>${pace}</td>
            <td>${hr} bpm</td>
            <td${color}>${tipo}</td>
        </tr>`;
    });

    html += `
    </tbody>
</table>`;

    return html;
}

function generateRunRacePaceAnalysis(runWorkouts) {
    // Filtrar treinos de race pace (>= 18km)
    const racePaceRuns = runWorkouts.filter(w => (parseFloat(w.DistanceInMeters) || 0) >= 18000);

    if (racePaceRuns.length === 0) {
        return '<p>Nenhum treino de race pace encontrado.</p>';
    }

    const stats = calculateDisciplineStats(racePaceRuns);
    const avgDistance = (stats.totalDistance / racePaceRuns.length / 1000).toFixed(1);
    const avgPace = calculateRunPace(stats.avgVelocity);
    const avgHR = stats.avgHR > 0 ? Math.round(stats.avgHR) : 'N/A';

    // Melhor performance
    const best = racePaceRuns.reduce((best, curr) => {
        const currVel = parseFloat(curr.VelocityAverage) || 0;
        const bestVel = parseFloat(best.VelocityAverage) || 0;
        return currVel > bestVel ? curr : best;
    });

    const bestDate = new Date(best.WorkoutDay).toLocaleDateString('pt-BR');
    const bestDist = ((parseFloat(best.DistanceInMeters) || 0) / 1000).toFixed(1);
    const bestTime = formatTime(parseFloat(best.TimeTotalInHours) || 0);
    const bestPace = calculateRunPace(parseFloat(best.VelocityAverage));
    const bestHR = Math.round(parseFloat(best.HeartRateAverage) || 0);

    // Top 3 paces
    const top3 = racePaceRuns
        .map(w => ({ pace: calculateRunPace(parseFloat(w.VelocityAverage)), vel: parseFloat(w.VelocityAverage) }))
        .sort((a, b) => b.vel - a.vel)
        .slice(0, 3)
        .map(w => w.pace)
        .join(' | ');

    return `
<div style="background: linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%); border-left: 5px solid #D0494E; border-radius: 12px; padding: 30px; margin: 30px 0;">
    <h4 style="color: #400404; font-size: 1.3em; font-weight: 700; margin-bottom: 20px;">ANÁLISE DOS TREINOS EM RACE PACE - CORRIDA</h4>
    <p style="margin-bottom: 20px; color: #333;">Treinos acima de 18km considerados Longs Runs com análise de Race Pace (destacados):</p>

    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-top: 20px;">
        <div style="background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <div style="font-size: 0.9em; color: #666; margin-bottom: 5px;">Distância Média</div>
            <div style="font-size: 1.8em; font-weight: 700; color: #400404;">${avgDistance} km</div>
        </div>
        <div style="background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <div style="font-size: 0.9em; color: #666; margin-bottom: 5px;">Pace Médio</div>
            <div style="font-size: 1.8em; font-weight: 700; color: #400404;">${avgPace}</div>
        </div>
        <div style="background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <div style="font-size: 0.9em; color: #666; margin-bottom: 5px;">FC Média</div>
            <div style="font-size: 1.8em; font-weight: 700; color: #400404;">${avgHR} bpm</div>
        </div>
        <div style="background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <div style="font-size: 0.9em; color: #666; margin-bottom: 5px;">Total de Treinos</div>
            <div style="font-size: 1.8em; font-weight: 700; color: #400404;">${racePaceRuns.length}</div>
        </div>
    </div>

    <div style="margin-top: 25px; padding: 20px; background: white; border-radius: 10px;">
        <strong style="color: #400404; display: block; margin-bottom: 10px;">Melhor Performance em Race Pace:</strong>
        <p style="margin: 0; color: #333;">${bestDate} - ${bestDist}km em ${bestTime} - Pace ${bestPace} - FC ${bestHR}bpm</p>
        <p style="margin: 10px 0 0 0; color: #333;"><strong>Top 3 Race Pace:</strong> ${top3}</p>
    </div>
</div>`;
}

function generateBrickRunsAnalysis(runWorkouts, bikeWorkouts) {
    // Tentar identificar brick runs (corridas após bike no mesmo dia)
    const brickRuns = [];

    runWorkouts.forEach(run => {
        const runDate = new Date(run.WorkoutDay).toDateString();
        const bikeOnSameDay = bikeWorkouts.find(bike =>
            new Date(bike.WorkoutDay).toDateString() === runDate
        );

        if (bikeOnSameDay) {
            brickRuns.push({
                run: run,
                bike: bikeOnSameDay
            });
        }
    });

    if (brickRuns.length === 0) {
        return '<p>Nenhum brick run encontrado.</p>';
    }

    // Pegar os 3 últimos
    const recent = brickRuns.slice(-3);

    let html = `
<div style="margin-top: 25px; padding: 20px; background: rgba(208, 73, 78, 0.1); border-radius: 10px; border: 2px solid #D0494E;">
    <strong style="color: #400404; display: block; margin-bottom: 10px; font-size: 1.1em;">BRICK RUNS (Transições Bike-Run)</strong>
    <p style="margin: 10px 0; color: #333;">Treinos realizados imediatamente após sessões de ciclismo para simular a transição T2:</p>
    <ul style="margin: 10px 0; padding-left: 20px; color: #333;">`;

    recent.forEach(brick => {
        const date = new Date(brick.run.WorkoutDay).toLocaleDateString('pt-BR');
        const runDist = ((parseFloat(brick.run.DistanceInMeters) || 0) / 1000).toFixed(1);
        const runTime = formatTime(parseFloat(brick.run.TimeTotalInHours) || 0);
        const runPace = calculateRunPace(parseFloat(brick.run.VelocityAverage));
        const runHR = Math.round(parseFloat(brick.run.HeartRateAverage) || 0);
        const bikeDist = ((parseFloat(brick.bike.DistanceInMeters) || 0) / 1000).toFixed(0);

        html += `
        <li><strong>${date}:</strong> ${runDist}km em ${runTime} - Pace ${runPace} - FC ${runHR} bpm após ${bikeDist}km de bike</li>`;
    });

    // Calcular média
    const avgStats = calculateDisciplineStats(recent.map(b => b.run));
    const avgPace = calculateRunPace(avgStats.avgVelocity);
    const avgHR = avgStats.avgHR > 0 ? Math.round(avgStats.avgHR) : 'N/A';

    html += `
    </ul>
    <div style="margin-top: 15px; padding: 15px; background: white; border-radius: 8px;">
        <strong style="color: #400404;">Média dos Brick Runs:</strong>
        <p style="margin: 5px 0 0 0; color: #333;">Pace médio: ${avgPace} | FC médio: ${avgHR} bpm</p>
    </div>
</div>`;

    return html;
}

function calculateRaceScenarios(swimStats, bikeStats, runStats) {
    // Calcular tempos baseados nos stats reais

    // NATAÇÃO
    const swimPace = swimStats.avgVelocity > 0 ? swimStats.avgVelocity : 1.0; // m/s
    const swimTime_A = 1900 / (swimPace * 1.05); // 5% mais rápido
    const swimTime_B = 1900 / swimPace; // média
    const swimTime_C = 1900 / (swimPace * 0.95); // 5% mais lento

    // BIKE
    const bikeSpeed = bikeStats.avgVelocity > 0 ? bikeStats.avgVelocity : 8.0; // m/s
    const bikeTime_A = 90000 / (bikeSpeed * 1.07); // 7% mais rápido
    const bikeTime_B = 90000 / bikeSpeed;
    const bikeTime_C = 90000 / (bikeSpeed * 0.93); // 7% mais lento

    // RUN
    const runSpeed = runStats.avgVelocity > 0 ? runStats.avgVelocity : 3.2; // m/s
    const runTime_A = 21100 / (runSpeed * 1.03); // 3% mais rápido
    const runTime_B = 21100 / runSpeed;
    const runTime_C = 21100 / (runSpeed * 0.97); // 3% mais lento

    // Transições
    const t1_A = 4 * 60;
    const t1_B = 4 * 60;
    const t1_C = 5 * 60;
    const t2_A = 2 * 60;
    const t2_B = 3 * 60;
    const t2_C = 3 * 60;

    // Totais
    const total_A = swimTime_A + t1_A + bikeTime_A + t2_A + runTime_A;
    const total_B = swimTime_B + t1_B + bikeTime_B + t2_B + runTime_B;
    const total_C = swimTime_C + t1_C + bikeTime_C + t2_C + runTime_C;

    return {
        metaA: {
            swimMin: formatMinSec(swimTime_A * 0.97),
            swimMax: formatMinSec(swimTime_A * 1.03),
            swimPaceMin: calculateSwimPace(swimPace * 1.08),
            swimPaceMax: calculateSwimPace(swimPace * 1.02),
            bikeMin: formatHourMin(bikeTime_A * 0.97),
            bikeMax: formatHourMin(bikeTime_A * 1.03),
            bikeSpeedMin: ((bikeSpeed * 1.04) * 3.6).toFixed(1),
            bikeSpeedMax: ((bikeSpeed * 1.10) * 3.6).toFixed(1),
            runMin: formatHourMin(runTime_A * 0.97),
            runMax: formatHourMin(runTime_A * 1.03),
            runPaceMin: calculateRunPace(runSpeed * 1.06),
            runPaceMax: calculateRunPace(runSpeed * 1.00),
            totalMin: formatHourMin(total_A * 0.98),
            totalMax: formatHourMin(total_A * 1.02)
        },
        metaB: {
            swimMin: formatMinSec(swimTime_B * 0.97),
            swimMax: formatMinSec(swimTime_B * 1.03),
            swimPaceMin: calculateSwimPace(swimPace * 1.03),
            swimPaceMax: calculateSwimPace(swimPace * 0.97),
            bikeMin: formatHourMin(bikeTime_B * 0.97),
            bikeMax: formatHourMin(bikeTime_B * 1.03),
            bikeSpeedMin: ((bikeSpeed * 0.97) * 3.6).toFixed(1),
            bikeSpeedMax: ((bikeSpeed * 1.03) * 3.6).toFixed(1),
            runMin: formatHourMin(runTime_B * 0.97),
            runMax: formatHourMin(runTime_B * 1.03),
            runPaceMin: calculateRunPace(runSpeed * 1.03),
            runPaceMax: calculateRunPace(runSpeed * 0.97),
            totalMin: formatHourMin(total_B * 0.98),
            totalMax: formatHourMin(total_B * 1.02)
        },
        metaC: {
            swimMin: formatMinSec(swimTime_C * 0.97),
            swimMax: formatMinSec(swimTime_C * 1.03),
            swimPaceMin: calculateSwimPace(swimPace * 0.98),
            swimPaceMax: calculateSwimPace(swimPace * 0.92),
            bikeMin: formatHourMin(bikeTime_C * 0.97),
            bikeMax: formatHourMin(bikeTime_C * 1.03),
            bikeSpeedMin: ((bikeSpeed * 0.90) * 3.6).toFixed(1),
            bikeSpeedMax: ((bikeSpeed * 0.96) * 3.6).toFixed(1),
            runMin: formatHourMin(runTime_C * 0.97),
            runMax: formatHourMin(runTime_C * 1.03),
            runPaceMin: calculateRunPace(runSpeed * 1.00),
            runPaceMax: calculateRunPace(runSpeed * 0.94),
            totalMin: formatHourMin(total_C * 0.98),
            totalMax: formatHourMin(total_C * 1.02)
        }
    };
}

// Funções auxiliares de formatação
function formatTime(hours) {
    const totalMinutes = Math.round(hours * 60);
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;

    if (h > 0) {
        return `${h}h${m.toString().padStart(2, '0')}min`;
    }
    return `${m}min`;
}

function formatMinSec(seconds) {
    const min = Math.floor(seconds / 60);
    return `${min} min`;
}

function formatHourMin(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h${minutes.toString().padStart(2, '0')} min`;
}
