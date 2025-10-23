/* ======================================
   DATA MAPPER
   Processa CSV e mapeia para variáveis dos templates
   ====================================== */

// Processar CSV para template Triathlon
function processForTriathlon(csvData, athleteName, eventName, eventDate, eventLocation) {
    // Separar por disciplina
    const swimWorkouts = csvData.filter(w => w.WorkoutType === 'Swim');
    const bikeWorkouts = csvData.filter(w => w.WorkoutType === 'Bike');
    const runWorkouts = csvData.filter(w => w.WorkoutType === 'Run');

    // Calcular estatísticas
    const swimStats = calculateDisciplineStats(swimWorkouts);
    const bikeStats = calculateDisciplineStats(bikeWorkouts);
    const runStats = calculateDisciplineStats(runWorkouts);

    // Calcular geral
    const totalWorkouts = csvData.length;
    const totalHours = csvData.reduce((sum, w) => sum + (parseFloat(w.TimeTotalInHours) || 0), 0);
    const totalWeeks = calculateWeeks(csvData);

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
    const runWorkouts = csvData.filter(w => w.WorkoutType === 'Run');
    const stats = calculateDisciplineStats(runWorkouts);

    // Projetar tempo baseado nos treinos
    const projectedTime = projectMarathonTime(runWorkouts);
    const targetPace = calculateTargetPace(projectedTime);

    // Calcular dados para gráficos
    const workoutsByType = categorizeRunWorkouts(runWorkouts);
    const weeklyVolumes = calculateWeeklyVolumes(runWorkouts);
    const paceByDistance = calculatePaceByDistance(runWorkouts);

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

    const totalDistance = workouts.reduce((sum, w) => sum + (parseFloat(w.DistanceInMeters) || 0), 0);
    const totalTime = workouts.reduce((sum, w) => sum + (parseFloat(w.TimeTotalInHours) || 0), 0);

    // Velocidades válidas
    const velocities = workouts
        .map(w => parseFloat(w.VelocityAverage))
        .filter(v => v && v > 0);
    const avgVelocity = velocities.length > 0
        ? velocities.reduce((sum, v) => sum + v, 0) / velocities.length
        : 0;

    // Potências válidas
    const powers = workouts
        .map(w => parseFloat(w.PowerAverage))
        .filter(p => p && p > 0);
    const avgPower = powers.length > 0
        ? powers.reduce((sum, p) => sum + p, 0) / powers.length
        : 0;

    // FC válidas
    const heartRates = workouts
        .map(w => parseFloat(w.HeartRateAverage))
        .filter(hr => hr && hr > 0);
    const avgHR = heartRates.length > 0
        ? heartRates.reduce((sum, hr) => sum + hr, 0) / heartRates.length
        : 0;

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
