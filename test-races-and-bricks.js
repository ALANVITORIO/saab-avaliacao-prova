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

// Funções de conversão
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

function formatTime(hours) {
    if (!hours || hours <= 0) return '--';
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    if (h === 0) return `${m}min`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}min`;
}

// Read CSV
const csvText = fs.readFileSync('workouts-38 (2).csv', 'utf8');
const data = parseCSV(csvText);

console.log('═══════════════════════════════════════════════════════════════');
console.log('🏆 TESTE DE HISTÓRICO DE PROVAS E BRICK RUNS');
console.log('═══════════════════════════════════════════════════════════════\n');

// ═══════════════════════════════════════════════════════════════════════════
// TESTE 1: HISTÓRICO DE PROVAS - Troféu Brasil (15/06/2025)
// ═══════════════════════════════════════════════════════════════════════════

console.log('📊 TESTE 1: TROFÉU BRASIL (15/06/2025)');
console.log('─────────────────────────────────────────────────────────────\n');

const trofeoBrasilDate = '2025-06-15';
const trofeoBrasil = data.filter(r => r.WorkoutDay === trofeoBrasilDate);

console.log(`Treinos em ${trofeoBrasilDate}:`);
if (trofeoBrasil.length === 0) {
    console.log(`  🔴 NENHUM TREINO ENCONTRADO nesta data`);
    console.log(`  → Esta prova está FORA do período do CSV (01/08 a 19/10)\n`);
} else {
    trofeoBrasil.forEach(t => {
        console.log(`  - ${t.WorkoutType}: ${t.Title}`);
    });
}

// ═══════════════════════════════════════════════════════════════════════════
// TESTE 2: HISTÓRICO DE PROVAS - Rio Triathlon (14/09/2025)
// ═══════════════════════════════════════════════════════════════════════════

console.log('📊 TESTE 2: RIO TRIATHLON (14/09/2025)');
console.log('─────────────────────────────────────────────────────────────\n');

const rioTriathlonDate = '2025-09-14';
const rioTriathlon = data.filter(r => r.WorkoutDay === rioTriathlonDate);

console.log(`Treinos em ${rioTriathlonDate}:`);
rioTriathlon.forEach(t => {
    const dist = (parseFloat(t.DistanceInMeters) / 1000).toFixed(3);
    const time = formatTime(parseFloat(t.TimeTotalInHours));
    let paceOrSpeed = '';

    if (t.WorkoutType === 'Swim') {
        paceOrSpeed = convertSwimPace(parseFloat(t.VelocityAverage));
    } else if (t.WorkoutType === 'Bike') {
        paceOrSpeed = convertBikeSpeed(parseFloat(t.VelocityAverage));
    } else if (t.WorkoutType === 'Run') {
        paceOrSpeed = convertRunPace(parseFloat(t.VelocityAverage));
    }

    console.log(`  ✓ ${t.WorkoutType}: ${dist}km em ${time} - ${paceOrSpeed}`);
    console.log(`    Título: ${t.Title}`);
});

console.log(`\n🔴 COMPARAÇÃO COM DOCUMENTO DO USUÁRIO:`);
console.log(`  Documento diz:`);
console.log(`    - Natação: 1.656m em 40:51 (2:28/100m)`);
console.log(`    - Ciclismo: 38.5km em 1h17:41 (29.8 km/h)`);
console.log(`    - Corrida: 9.85km em 46:14 (4:41/km)\n`);

// Comparar com dados reais
const rioSwim = rioTriathlon.find(r => r.WorkoutType === 'Swim');
const rioBike = rioTriathlon.find(r => r.WorkoutType === 'Bike');
const rioRun = rioTriathlon.find(r => r.WorkoutType === 'Run');

if (rioSwim) {
    const dist = parseFloat(rioSwim.DistanceInMeters);
    const time = formatTime(parseFloat(rioSwim.TimeTotalInHours));
    const pace = convertSwimPace(parseFloat(rioSwim.VelocityAverage));
    console.log(`  Natação no CSV: ${(dist/1000).toFixed(3)}km em ${time} - ${pace}`);
    console.log(`    ${dist === 1656 ? '✅' : '🔴'} Distância ${dist === 1656 ? 'BATE' : 'DIFERENTE'}`);
}

if (rioBike) {
    const dist = parseFloat(rioBike.DistanceInMeters);
    const time = formatTime(parseFloat(rioBike.TimeTotalInHours));
    const speed = convertBikeSpeed(parseFloat(rioBike.VelocityAverage));
    console.log(`  Ciclismo no CSV: ${(dist/1000).toFixed(1)}km em ${time} - ${speed}`);
    console.log(`    ${Math.abs(dist - 38500) < 100 ? '✅' : '🔴'} Distância ${Math.abs(dist - 38500) < 100 ? 'BATE' : 'DIFERENTE'}`);
}

if (rioRun) {
    const dist = parseFloat(rioRun.DistanceInMeters);
    const time = formatTime(parseFloat(rioRun.TimeTotalInHours));
    const pace = convertRunPace(parseFloat(rioRun.VelocityAverage));
    console.log(`  Corrida no CSV: ${(dist/1000).toFixed(2)}km em ${time} - ${pace}`);
    console.log(`    ${Math.abs(dist - 9850) < 100 ? '✅' : '🔴'} Distância ${Math.abs(dist - 9850) < 100 ? 'BATE' : 'DIFERENTE'}`);
}

console.log('\n═══════════════════════════════════════════════════════════════\n');

// ═══════════════════════════════════════════════════════════════════════════
// TESTE 3: BRICK RUNS (Transições Bike-Run)
// ═══════════════════════════════════════════════════════════════════════════

console.log('📊 TESTE 3: BRICK RUNS (TRANSIÇÕES BIKE-RUN)');
console.log('─────────────────────────────────────────────────────────────\n');

console.log(`🔴 BRICK RUNS DO DOCUMENTO DO USUÁRIO (OUTUBRO):`);
console.log(`  18/10: 10km em 53min (5:18/km) pós 90km bike`);
console.log(`  11/10: 10km em 52min (5:12/km) pós 90km bike`);
console.log(`  04/10: 10km em 55min (5:30/km) pós 115km bike\n`);

// Agrupar por data
const byDate = {};
data.forEach(row => {
    const date = row.WorkoutDay;
    if (!byDate[date]) byDate[date] = [];
    byDate[date].push(row);
});

// Procurar brick runs (bike + run no mesmo dia)
const brickDates = [];
Object.keys(byDate).forEach(date => {
    const workouts = byDate[date];
    const bikes = workouts.filter(w => w.WorkoutType === 'Bike' && parseFloat(w.DistanceInMeters) >= 70000);
    const runs = workouts.filter(w => w.WorkoutType === 'Run' && parseFloat(w.DistanceInMeters) >= 8000);

    if (bikes.length > 0 && runs.length > 0) {
        brickDates.push({
            date,
            bike: bikes[0],
            run: runs[0]
        });
    }
});

console.log(`✓ BRICK RUNS ENCONTRADOS NO CSV:\n`);
brickDates.forEach(brick => {
    const date = new Date(brick.date);
    const dateStr = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}`;

    const bikeDist = (parseFloat(brick.bike.DistanceInMeters) / 1000).toFixed(0);
    const runDist = (parseFloat(brick.run.DistanceInMeters) / 1000).toFixed(1);
    const runTime = formatTime(parseFloat(brick.run.TimeTotalInHours));
    const runPace = convertRunPace(parseFloat(brick.run.VelocityAverage));
    const runHR = Math.round(parseFloat(brick.run.HeartRateAverage) || 0);

    console.log(`  ${dateStr}: ${runDist}km em ${runTime} - Pace ${runPace} - FC ${runHR} bpm`);
    console.log(`         (após ${bikeDist}km de bike)`);
    console.log(`         Bike: ${brick.bike.Title || 'Sem título'}`);
    console.log(`         Run: ${brick.run.Title || 'Sem título'}\n`);
});

// Verificar datas específicas de outubro
console.log(`🔴 VERIFICANDO DATAS ESPECÍFICAS DE OUTUBRO:\n`);
['2025-10-04', '2025-10-11', '2025-10-18'].forEach(dateToCheck => {
    const workouts = byDate[dateToCheck] || [];
    const dateObj = new Date(dateToCheck);
    const dateStr = `${dateObj.getDate()}/${dateObj.getMonth() + 1}`;

    console.log(`  ${dateStr} (${dateToCheck}):`);
    if (workouts.length === 0) {
        console.log(`    🔴 Nenhum treino encontrado`);
    } else {
        workouts.forEach(w => {
            const dist = (parseFloat(w.DistanceInMeters) / 1000).toFixed(1);
            console.log(`    - ${w.WorkoutType}: ${dist}km - ${w.Title || 'Sem título'}`);
        });
    }
    console.log();
});

console.log('═══════════════════════════════════════════════════════════════\n');

// ═══════════════════════════════════════════════════════════════════════════
// TESTE 4: DETECÇÃO AUTOMÁTICA DE PROVAS
// ═══════════════════════════════════════════════════════════════════════════

console.log('📊 TESTE 4: DETECÇÃO AUTOMÁTICA DE PROVAS');
console.log('─────────────────────────────────────────────────────────────\n');

console.log(`Critérios de detecção:`);
console.log(`  - Natação: 1.5-2.0km + velocidade > 0.6 m/s`);
console.log(`  - Ciclismo: 38-42km + velocidade > 7 m/s`);
console.log(`  - Corrida: 9-11km + velocidade > 3 m/s\n`);

const detectedRaces = {
    swim: [],
    bike: [],
    run: []
};

data.forEach(row => {
    const type = row.WorkoutType || '';
    const distance = parseFloat(row.DistanceInMeters) || 0;
    const velocity = parseFloat(row.VelocityAverage) || 0;
    const date = row.WorkoutDay;
    const title = row.Title || '';

    // Detectar prova de natação
    if (type === 'Swim' && distance >= 1500 && distance <= 2000 && velocity > 0.6) {
        detectedRaces.swim.push({
            date,
            distance: (distance / 1000).toFixed(3),
            pace: convertSwimPace(velocity),
            time: formatTime(parseFloat(row.TimeTotalInHours)),
            title
        });
    }

    // Detectar prova de ciclismo
    if ((type === 'Bike' || type === 'Cycling') && distance >= 38000 && distance <= 42000 && velocity > 7) {
        detectedRaces.bike.push({
            date,
            distance: (distance / 1000).toFixed(1),
            speed: convertBikeSpeed(velocity),
            time: formatTime(parseFloat(row.TimeTotalInHours)),
            title
        });
    }

    // Detectar prova de corrida
    if ((type === 'Run' || type === 'Running') && distance >= 9000 && distance <= 11000 && velocity > 3) {
        detectedRaces.run.push({
            date,
            distance: (distance / 1000).toFixed(2),
            pace: convertRunPace(velocity),
            time: formatTime(parseFloat(row.TimeTotalInHours)),
            title
        });
    }
});

console.log(`📋 PROVAS DETECTADAS:\n`);

if (detectedRaces.swim.length > 0) {
    console.log(`  🏊 NATAÇÃO (${detectedRaces.swim.length} provas):`);
    detectedRaces.swim.forEach(race => {
        console.log(`    - ${race.date}: ${race.distance}km em ${race.time} - ${race.pace}`);
        console.log(`      "${race.title}"`);
    });
    console.log();
}

if (detectedRaces.bike.length > 0) {
    console.log(`  🚴 CICLISMO (${detectedRaces.bike.length} provas):`);
    detectedRaces.bike.forEach(race => {
        console.log(`    - ${race.date}: ${race.distance}km em ${race.time} - ${race.speed}`);
        console.log(`      "${race.title}"`);
    });
    console.log();
}

if (detectedRaces.run.length > 0) {
    console.log(`  🏃 CORRIDA (${detectedRaces.run.length} provas):`);
    detectedRaces.run.forEach(race => {
        console.log(`    - ${race.date}: ${race.distance}km em ${race.time} - ${race.pace}`);
        console.log(`      "${race.title}"`);
    });
    console.log();
}

console.log(`\n🔴 TOTAL: ${detectedRaces.swim.length + detectedRaces.bike.length + detectedRaces.run.length} provas detectadas`);
console.log(`   Script reportou: 13 provas detectadas\n`);

console.log('═══════════════════════════════════════════════════════════════\n');
