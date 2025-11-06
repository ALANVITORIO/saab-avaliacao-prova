const fs = require('fs');

// Simple CSV parser (handles quoted fields)
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

// Funções de conversão (copiadas do script principal)
function convertSwimPace(velocityMS) {
    if (!velocityMS || velocityMS <= 0) return '--:--/100m';
    const paceSeconds = 100 / velocityMS;
    const minutes = Math.floor(paceSeconds / 60);
    const seconds = Math.round(paceSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}/100m`;
}

function convertBikeSpeed(velocityMS) {
    if (!velocityMS || velocityMS <= 0) return '0.0 km/h';
    return `${(velocityMS * 3.6).toFixed(1)} km/h`;
}

function convertRunPace(velocityMS) {
    if (!velocityMS || velocityMS <= 0) return '--:--/km';
    const paceSeconds = 1000 / velocityMS;
    const minutes = Math.floor(paceSeconds / 60);
    const seconds = Math.round(paceSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}/km`;
}

// Read CSV
const csvText = fs.readFileSync('workouts-38 (2).csv', 'utf8');
const data = parseCSV(csvText);

console.log('═══════════════════════════════════════════════════════════════');
console.log('🔍 TESTE DE DISCREPÂNCIAS - VALIDAÇÃO DOS CÁLCULOS');
console.log('═══════════════════════════════════════════════════════════════\n');

// ═══════════════════════════════════════════════════════════════════════════
// TESTE 1: VELOCIDADE MÉDIA DE CICLISMO (29.8 vs 34.6 km/h)
// ═══════════════════════════════════════════════════════════════════════════

console.log('📊 TESTE 1: VELOCIDADE MÉDIA DE CICLISMO');
console.log('─────────────────────────────────────────────────────────────\n');

const bike = data.filter(r => {
    const type = r.WorkoutType || '';
    const distance = parseFloat(r.DistanceInMeters) || 0;
    return (type === 'Bike' || type === 'Ride' || /bike|cycle/i.test(type)) && distance > 0;
});

console.log(`Total de treinos de ciclismo com distância > 0: ${bike.length}\n`);

// Calcular velocidade média de TODOS os treinos de bike
const bikeVelocities = bike
    .map(w => parseFloat(w.VelocityAverage))
    .filter(v => v > 0);

const bikeAvgVelocityMS = bikeVelocities.reduce((a, b) => a + b, 0) / bikeVelocities.length;
const bikeAvgSpeedKMH = bikeAvgVelocityMS * 3.6;

console.log(`✓ TODOS os treinos de bike:`);
console.log(`  Velocidade média: ${bikeAvgSpeedKMH.toFixed(1)} km/h`);
console.log(`  Velocidade em m/s: ${bikeAvgVelocityMS.toFixed(2)} m/s`);
console.log(`  Treinos considerados: ${bikeVelocities.length}\n`);

// Calcular velocidade média de treinos LONGOS (>90km) - ZONA TEMPO
const bikeLong = bike.filter(w => parseFloat(w.DistanceInMeters) >= 90000);
const bikeLongVelocities = bikeLong
    .map(w => parseFloat(w.VelocityAverage))
    .filter(v => v > 0);

if (bikeLongVelocities.length > 0) {
    const bikeLongAvgVelocityMS = bikeLongVelocities.reduce((a, b) => a + b, 0) / bikeLongVelocities.length;
    const bikeLongAvgSpeedKMH = bikeLongAvgVelocityMS * 3.6;

    console.log(`✓ Treinos LONGOS de bike (>90km) - ZONA TEMPO:`);
    console.log(`  Velocidade média: ${bikeLongAvgSpeedKMH.toFixed(1)} km/h`);
    console.log(`  Velocidade em m/s: ${bikeLongAvgVelocityMS.toFixed(2)} m/s`);
    console.log(`  Treinos considerados: ${bikeLongVelocities.length}\n`);

    console.log(`🔴 DISCREPÂNCIA IDENTIFICADA:`);
    console.log(`  Documento principal: 29.8 km/h`);
    console.log(`  Dados do CSV (todos): ${bikeAvgSpeedKMH.toFixed(1)} km/h`);
    console.log(`  Dados do CSV (>90km): ${bikeLongAvgSpeedKMH.toFixed(1)} km/h`);
    console.log(`  Diferença: ${Math.abs(bikeAvgSpeedKMH - 29.8).toFixed(1)} km/h\n`);
}

// Lista os treinos longos de bike
console.log(`📋 Lista de treinos LONGOS de bike (>90km):`);
bikeLong.forEach((w, i) => {
    const dist = (parseFloat(w.DistanceInMeters) / 1000).toFixed(1);
    const vel = parseFloat(w.VelocityAverage);
    const speed = (vel * 3.6).toFixed(1);
    const date = w.WorkoutDay.split('T')[0];
    console.log(`  ${i + 1}. ${date}: ${dist}km - ${speed} km/h`);
});

console.log('\n═══════════════════════════════════════════════════════════════\n');

// ═══════════════════════════════════════════════════════════════════════════
// TESTE 2: PACE MÉDIO DE CORRIDA (5:15 vs 5:11/km)
// ═══════════════════════════════════════════════════════════════════════════

console.log('📊 TESTE 2: PACE MÉDIO DE CORRIDA');
console.log('─────────────────────────────────────────────────────────────\n');

const run = data.filter(r => {
    const type = r.WorkoutType || '';
    const distance = parseFloat(r.DistanceInMeters) || 0;
    return (type === 'Run' || /run/i.test(type)) && distance > 0;
});

console.log(`Total de treinos de corrida com distância > 0: ${run.length}\n`);

// Calcular pace médio de TODOS os treinos de corrida
const runVelocities = run
    .map(w => parseFloat(w.VelocityAverage))
    .filter(v => v > 0);

const runAvgVelocityMS = runVelocities.reduce((a, b) => a + b, 0) / runVelocities.length;
const runAvgPace = convertRunPace(runAvgVelocityMS);

console.log(`✓ TODOS os treinos de corrida:`);
console.log(`  Pace médio: ${runAvgPace}`);
console.log(`  Velocidade em m/s: ${runAvgVelocityMS.toFixed(2)} m/s`);
console.log(`  Treinos considerados: ${runVelocities.length}\n`);

// Calcular pace médio de treinos LONGOS (>18km) - RACE PACE
const runLong = run.filter(w => parseFloat(w.DistanceInMeters) >= 18000);
const runLongVelocities = runLong
    .map(w => parseFloat(w.VelocityAverage))
    .filter(v => v > 0);

if (runLongVelocities.length > 0) {
    const runLongAvgVelocityMS = runLongVelocities.reduce((a, b) => a + b, 0) / runLongVelocities.length;
    const runLongAvgPace = convertRunPace(runLongAvgVelocityMS);

    console.log(`✓ Treinos LONGOS de corrida (>18km) - RACE PACE:`);
    console.log(`  Pace médio: ${runLongAvgPace}`);
    console.log(`  Velocidade em m/s: ${runLongAvgVelocityMS.toFixed(2)} m/s`);
    console.log(`  Treinos considerados: ${runLongVelocities.length}\n`);

    console.log(`🔴 DISCREPÂNCIA IDENTIFICADA:`);
    console.log(`  Documento principal: 5:15/km`);
    console.log(`  Dados do CSV (todos): ${runAvgPace}`);
    console.log(`  Dados do CSV (>18km): ${runLongAvgPace}\n`);
}

// Lista os treinos longos de corrida
console.log(`📋 Lista de treinos LONGOS de corrida (>18km):`);
runLong.forEach((w, i) => {
    const dist = (parseFloat(w.DistanceInMeters) / 1000).toFixed(1);
    const vel = parseFloat(w.VelocityAverage);
    const pace = convertRunPace(vel);
    const date = w.WorkoutDay.split('T')[0];
    console.log(`  ${i + 1}. ${date}: ${dist}km - ${pace}`);
});

console.log('\n═══════════════════════════════════════════════════════════════\n');

// ═══════════════════════════════════════════════════════════════════════════
// TESTE 3: MELHOR TREINO DE NATAÇÃO (1:51 vs 1:41/100m)
// ═══════════════════════════════════════════════════════════════════════════

console.log('📊 TESTE 3: MELHOR TREINO DE NATAÇÃO');
console.log('─────────────────────────────────────────────────────────────\n');

const swim = data.filter(r => {
    const type = r.WorkoutType || '';
    const distance = parseFloat(r.DistanceInMeters) || 0;
    return (type === 'Swim' || /swim/i.test(type)) && distance > 0;
});

console.log(`Total de treinos de natação com distância > 0: ${swim.length}\n`);

// Encontrar o melhor treino (pace mais rápido)
const swimWithPace = swim
    .filter(w => parseFloat(w.VelocityAverage) > 0)
    .map(w => ({
        ...w,
        velocityMS: parseFloat(w.VelocityAverage),
        distance: parseFloat(w.DistanceInMeters),
        pace: convertSwimPace(parseFloat(w.VelocityAverage))
    }))
    .sort((a, b) => b.velocityMS - a.velocityMS);

console.log(`📋 TOP 5 melhores treinos de natação (pace mais rápido):`);
swimWithPace.slice(0, 5).forEach((w, i) => {
    const dist = (w.distance / 1000).toFixed(1);
    const date = w.WorkoutDay.split('T')[0];
    console.log(`  ${i + 1}. ${date}: ${dist}km - ${w.pace}`);
});

console.log(`\n🔴 DISCREPÂNCIA IDENTIFICADA:`);
console.log(`  Documento principal: 3.5km a 1:51/100m (melhor)`);
console.log(`  Dados do CSV (melhor): ${(swimWithPace[0].distance / 1000).toFixed(1)}km - ${swimWithPace[0].pace}`);
console.log(`  Script indica: 2.1km a 1:41/100m (NÃO ENCONTRADO no CSV)\n`);

console.log('\n═══════════════════════════════════════════════════════════════\n');

// ═══════════════════════════════════════════════════════════════════════════
// TESTE 4: TREINOS ZONA TEMPO - QUANTIDADE
// ═══════════════════════════════════════════════════════════════════════════

console.log('📊 TESTE 4: QUANTIDADE DE TREINOS POR ZONA');
console.log('─────────────────────────────────────────────────────────────\n');

const swimZonaTempo = swim.filter(w => parseFloat(w.DistanceInMeters) >= 3000);
const bikeZonaTempo = bike.filter(w => parseFloat(w.DistanceInMeters) >= 90000);
const runRacePace = run.filter(w => parseFloat(w.DistanceInMeters) >= 18000);

console.log(`Natação (>3km):`);
console.log(`  Documento principal: 5 treinos`);
console.log(`  Dados do CSV: ${swimZonaTempo.length} treinos`);
console.log(`  ${swimZonaTempo.length === 5 ? '✅' : '🔴'} ${swimZonaTempo.length === 5 ? 'OK' : 'DISCREPÂNCIA'}\n`);

console.log(`Ciclismo (>90km):`);
console.log(`  Documento principal: 5 treinos`);
console.log(`  Dados do CSV: ${bikeZonaTempo.length} treinos`);
console.log(`  ${bikeZonaTempo.length === 5 ? '✅' : '🔴'} ${bikeZonaTempo.length === 5 ? 'OK' : 'DISCREPÂNCIA'}\n`);

console.log(`Corrida (>18km):`);
console.log(`  Documento principal: 3 treinos`);
console.log(`  Dados do CSV: ${runRacePace.length} treinos`);
console.log(`  ${runRacePace.length === 3 ? '✅' : '🔴'} ${runRacePace.length === 3 ? 'OK' : 'DISCREPÂNCIA'}\n`);

console.log('\n═══════════════════════════════════════════════════════════════\n');

// ═══════════════════════════════════════════════════════════════════════════
// TESTE 5: TIPO DE PROVA - Verificar distâncias usadas nos cenários
// ═══════════════════════════════════════════════════════════════════════════

console.log('📊 TESTE 5: VERIFICAÇÃO DO TIPO DE PROVA');
console.log('─────────────────────────────────────────────────────────────\n');

console.log(`DISTÂNCIAS ESPERADAS:`);
console.log(`  - SPRINT: Swim 0.75km, Bike 20km, Run 5km`);
console.log(`  - OLÍMPICO: Swim 1.5km, Bike 40km, Run 10km`);
console.log(`  - 70.3 (HALF): Swim 1.9km, Bike 90km, Run 21.1km`);
console.log(`  - FULL: Swim 3.8km, Bike 180km, Run 42.2km\n`);

console.log(`🔴 PROBLEMA CRÍTICO IDENTIFICADO:`);
console.log(`  Documento principal mostra tempos para 70.3 (112.9km total)`);
console.log(`  Script parece calcular para FULL (226km total)`);
console.log(`  Isso DOBRA todas as distâncias e tempos!\n`);

console.log(`EVIDÊNCIA no código (linha 298-302 do ironman-report-generator.js):`);
console.log(`  '70.3': { swim: 1.9, bike: 90, run: 21.1, total: 113 }`);
console.log(`  'FULL': { swim: 3.8, bike: 180, run: 42.2, total: 226 }\n`);

console.log(`Verificar qual tipo está sendo passado na chamada do generateIronmanReport()\n`);

console.log('═══════════════════════════════════════════════════════════════\n');
