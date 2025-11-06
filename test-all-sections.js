const fs = require('fs');

// Simple CSV parser
function parseCSV(text) {
    const lines = text.split('\n').filter(l => l.trim());
    const headers = lines[0].split(',').map(h => h.replace(/^"|"$/g, ''));

    const data = [];
    for (let i = 1; i < lines.length; i++) {
        const values = [];
        let current = '';
        let inQuotes = false;

        for (let char of lines[i]) {
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                values.push(current.replace(/^"|"$/g, ''));
                current = '';
            } else {
                current += char;
            }
        }
        values.push(current.replace(/^"|"$/g, ''));

        const row = {};
        headers.forEach((h, idx) => {
            row[h] = values[idx] || '';
        });
        data.push(row);
    }
    return data;
}

// Load generator
eval(fs.readFileSync('scripts/ironman-report-generator.js', 'utf8'));

// Load CSV
const csvText = fs.readFileSync('workouts-38 (2).csv', 'utf8');
const csvData = parseCSV(csvText);

console.log('═══════════════════════════════════════════════════════════════');
console.log('TESTE COMPLETO - TODAS AS SEÇÕES');
console.log('═══════════════════════════════════════════════════════════════\n');

// Filter by discipline
const { swim, bike, run } = filterByDiscipline(csvData);
console.log(`✅ Treinos filtrados: ${swim.length} swim, ${bike.length} bike, ${run.length} run\n`);

// Basic stats
const swimStats = calculateDisciplineStats(swim, 'swim');
const bikeStats = calculateDisciplineStats(bike, 'bike');
const runStats = calculateDisciplineStats(run, 'run');

console.log('📊 ESTATÍSTICAS BÁSICAS:');
console.log(`   Swim: ${swimStats.workouts} treinos, ${swimStats.totalKm}, pace médio ${swimStats.avgPaceOrSpeed}`);
console.log(`   Bike: ${bikeStats.workouts} treinos, ${bikeStats.totalKm}, vel. média ${bikeStats.avgPaceOrSpeed}`);
console.log(`   Run:  ${runStats.workouts} treinos, ${runStats.totalKm}, pace médio ${runStats.avgPaceOrSpeed}\n`);

// Advanced analyses
console.log('🔬 ANÁLISES AVANÇADAS:\n');

// 1. Race detection
const races = detectRaces(csvData);
console.log(`🏆 PROVAS DETECTADAS: ${races.length}`);
races.forEach(race => {
    console.log(`   ${race.discipline}: ${race.title || 'Prova'} - ${race.distance}km - ${race.time} - ${race.pace || race.speed}`);
});
console.log('');

// 2. Tempo Zone - Swim
const swimTempoZone = calculateTempoZoneSwimStats(swim);
if (swimTempoZone) {
    console.log(`🏊 ZONA TEMPO NATAÇÃO (>3km):`);
    console.log(`   Treinos: ${swimTempoZone.count}`);
    console.log(`   Distância média: ${swimTempoZone.avgDistance} km`);
    console.log(`   Pace médio: ${swimTempoZone.avgPace}`);
    console.log(`   FC médio: ${swimTempoZone.avgHR > 0 ? swimTempoZone.avgHR + ' bpm' : '--'}`);
    console.log(`   Melhor: ${swimTempoZone.bestPerformance.date} - ${swimTempoZone.bestPerformance.distance}km - ${swimTempoZone.bestPerformance.pace}\n`);
}

// 3. Tempo Zone - Bike
const bikeTempoZone = calculateTempoZoneBikeStats(bike);
if (bikeTempoZone) {
    console.log(`🚴 ZONA TEMPO CICLISMO (>90km):`);
    console.log(`   Treinos: ${bikeTempoZone.count}`);
    console.log(`   Distância média: ${bikeTempoZone.avgDistance} km`);
    console.log(`   Velocidade média: ${bikeTempoZone.avgSpeed} (${bikeTempoZone.avgSpeedRaw.toFixed(1)} km/h)`);
    console.log(`   FC médio: ${bikeTempoZone.avgHR > 0 ? bikeTempoZone.avgHR + ' bpm' : '--'}`);
    console.log(`   Melhor: ${bikeTempoZone.bestPerformance.date} - ${bikeTempoZone.bestPerformance.distance}km - ${bikeTempoZone.bestPerformance.speed}\n`);

    // Update bikeStats with tempo zone average
    bikeStats.avgVelocityRaw = bikeTempoZone.avgSpeedRaw / 3.6;
    bikeStats.avgPaceOrSpeed = bikeTempoZone.avgSpeed;
    console.log(`   ⚠️ Velocidade média do bike ATUALIZADA para zona tempo: ${bikeStats.avgPaceOrSpeed}\n`);
}

// 4. Race Pace - Run
const runRacePace = calculateRacePaceRunStats(run);
if (runRacePace) {
    console.log(`🏃 RACE PACE CORRIDA (>18km):`);
    console.log(`   Treinos: ${runRacePace.count}`);
    console.log(`   Distância média: ${runRacePace.avgDistance} km`);
    console.log(`   Pace médio: ${runRacePace.avgPace}`);
    console.log(`   FC médio: ${runRacePace.avgHR > 0 ? runRacePace.avgHR + ' bpm' : '--'}`);
    console.log(`   Top 3 paces: ${runRacePace.top3Paces.join(' | ')}`);
    console.log(`   Melhor: ${runRacePace.bestPerformance.date} - ${runRacePace.bestPerformance.distance}km - ${runRacePace.bestPerformance.pace}\n`);

    // Update runStats with race pace average
    runStats.avgVelocityRaw = runRacePace.avgPaceRaw;
    runStats.avgPaceOrSpeed = runRacePace.avgPace;
    console.log(`   ⚠️ Pace médio da corrida ATUALIZADO para race pace: ${runStats.avgPaceOrSpeed}\n`);
}

// 5. Brick Runs
const brickRuns = detectBrickRuns(csvData);
if (brickRuns.length > 0) {
    console.log(`🔄 BRICK RUNS (Bike+Run mesmo dia): ${brickRuns.length}`);
    brickRuns.forEach(brick => {
        console.log(`   ${brick.date}: ${brick.runDistance}km em ${brick.runTime} - Pace ${brick.runPace} - FC ${brick.runHR} bpm (após ${brick.bikeDistance}km de bike)`);
    });
    console.log('');
}

// 6. Race Pace Sessions
const racePaceSessions = detectRacePaceSessions(run);
if (racePaceSessions.length > 0) {
    console.log(`🎯 RACE PACE SESSIONS: ${racePaceSessions.length}`);
    racePaceSessions.forEach(session => {
        console.log(`   ${session.date}: Pace ${session.pace} - ${session.time} ${session.title ? '- ' + session.title : ''}`);
    });
    console.log('');
}

// Calculate scenarios with RANGES
console.log('═══════════════════════════════════════════════════════════════');
console.log('CENÁRIOS DE PROVA (COM RANGES)');
console.log('═══════════════════════════════════════════════════════════════\n');

const raceDistances = getRaceDistances('70.3');
const scenarios = calculate3Scenarios(swimStats, bikeStats, runStats, raceDistances);

console.log('📈 META A (AGRESSIVO):');
console.log(`   Natação 1.9km: ${scenarios.agressivo.swimTime}`);
console.log(`   Pace: ${scenarios.agressivo.swimPace}`);
console.log(`   Bike 90km: ${scenarios.agressivo.bikeTime}`);
console.log(`   Vel: ${scenarios.agressivo.bikeSpeed}`);
console.log(`   Run 21.1km: ${scenarios.agressivo.runTime}`);
console.log(`   Pace: ${scenarios.agressivo.runPace}`);
console.log(`   TOTAL: ${scenarios.agressivo.totalTime}\n`);

console.log('📊 META B (REALISTA):');
console.log(`   Natação 1.9km: ${scenarios.realista.swimTime}`);
console.log(`   Pace: ${scenarios.realista.swimPace}`);
console.log(`   Bike 90km: ${scenarios.realista.bikeTime}`);
console.log(`   Vel: ${scenarios.realista.bikeSpeed}`);
console.log(`   Run 21.1km: ${scenarios.realista.runTime}`);
console.log(`   Pace: ${scenarios.realista.runPace}`);
console.log(`   TOTAL: ${scenarios.realista.totalTime}\n`);

console.log('📉 META C (CONSERVADOR):');
console.log(`   Natação 1.9km: ${scenarios.conservador.swimTime}`);
console.log(`   Pace: ${scenarios.conservador.swimPace}`);
console.log(`   Bike 90km: ${scenarios.conservador.bikeTime}`);
console.log(`   Vel: ${scenarios.conservador.bikeSpeed}`);
console.log(`   Run 21.1km: ${scenarios.conservador.runTime}`);
console.log(`   Pace: ${scenarios.conservador.runPace}`);
console.log(`   TOTAL: ${scenarios.conservador.totalTime}\n`);

console.log('═══════════════════════════════════════════════════════════════');
console.log('✅ TESTE COMPLETO FINALIZADO!');
console.log('═══════════════════════════════════════════════════════════════');
