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

// Read CSV
const csvText = fs.readFileSync('workouts-38 (2).csv', 'utf8');
const data = parseCSV(csvText);

console.log('📊 ANÁLISE COMPLETA DO CSV\n');
console.log('Total de linhas:', data.length);

// Filter by type
const swim = data.filter(r => r.WorkoutType === 'Swim');
const bike = data.filter(r => r.WorkoutType === 'Bike');
const run = data.filter(r => r.WorkoutType === 'Run');
const brick = data.filter(r => r.WorkoutType === 'Brick');
const dayoff = data.filter(r => r.WorkoutType === 'Day Off');
const strength = data.filter(r => r.WorkoutType === 'Strength');
const other = data.filter(r => r.WorkoutType === 'Other');

console.log('\n📈 CONTAGEM POR TIPO:');
console.log('Swim:', swim.length);
console.log('Bike:', bike.length);
console.log('Run:', run.length);
console.log('Brick:', brick.length);
console.log('Day Off:', dayoff.length);
console.log('Strength:', strength.length);
console.log('Other:', other.length);

// Check for workouts with no distance
console.log('\n🔍 SWIM - Análise de distâncias:');
const swimWithDistance = swim.filter(r => parseFloat(r.DistanceInMeters) > 0);
const swimNoDistance = swim.filter(r => !r.DistanceInMeters || parseFloat(r.DistanceInMeters) === 0);
console.log('Com distância > 0:', swimWithDistance.length);
console.log('Sem distância / 0:', swimNoDistance.length);

// List swim workouts with distances
console.log('\n🏊 LISTA DE TREINOS DE NATAÇÃO:');
swim.forEach((w, i) => {
    const dist = parseFloat(w.DistanceInMeters) || 0;
    const date = w.WorkoutDay;
    console.log(`${i+1}. ${date} - ${(dist/1000).toFixed(2)}km - ${w.Title}`);
});

// Check dates
const dates = data.filter(r => r.WorkoutDay).map(r => new Date(r.WorkoutDay)).filter(d => !isNaN(d));
dates.sort((a, b) => a - b);
console.log('\n📅 PERÍODO:');
console.log('Primeira data:', dates[0].toISOString().split('T')[0]);
console.log('Última data:', dates[dates.length-1].toISOString().split('T')[0]);
const daysDiff = (dates[dates.length-1] - dates[0]) / (1000 * 60 * 60 * 24);
const weeksDiff = Math.ceil(daysDiff / 7);
console.log('Dias:', daysDiff);
console.log('Semanas:', weeksDiff);

// Check workouts per discipline with distance > significant threshold
console.log('\n🎯 TREINOS VÁLIDOS (com distância significativa):');
const swimValid = swim.filter(r => parseFloat(r.DistanceInMeters) >= 1500);
const bikeValid = bike.filter(r => parseFloat(r.DistanceInMeters) >= 20000);
const runValid = run.filter(r => parseFloat(r.DistanceInMeters) >= 5000);
console.log('Swim (≥1.5km):', swimValid.length);
console.log('Bike (≥20km):', bikeValid.length);
console.log('Run (≥5km):', runValid.length);
console.log('Total:', swimValid.length + bikeValid.length + runValid.length);

// Try different thresholds to match expected 21/35/32 = 88
console.log('\n🔬 TESTANDO DIFERENTES THRESHOLDS:');
for (let swimMin = 1000; swimMin <= 1600; swimMin += 100) {
    for (let bikeMin = 18000; bikeMin <= 22000; bikeMin += 1000) {
        for (let runMin = 4000; runMin <= 6000; runMin += 1000) {
            const s = swim.filter(r => parseFloat(r.DistanceInMeters) >= swimMin).length;
            const b = bike.filter(r => parseFloat(r.DistanceInMeters) >= bikeMin).length;
            const r = run.filter(r => parseFloat(r.DistanceInMeters) >= runMin).length;
            const total = s + b + r;

            if (s === 21 && b === 35 && r === 32) {
                console.log(`✅ MATCH! Swim ≥${swimMin/1000}km (${s}), Bike ≥${bikeMin/1000}km (${b}), Run ≥${runMin/1000}km (${r}) = ${total} treinos`);
            }
        }
    }
}

// Try with distance > 0
const swimAny = swim.filter(r => parseFloat(r.DistanceInMeters) > 0);
const bikeAny = bike.filter(r => parseFloat(r.DistanceInMeters) > 0);
const runAny = run.filter(r => parseFloat(r.DistanceInMeters) > 0);
console.log('\n📊 TREINOS COM DISTÂNCIA > 0:');
console.log(`Swim: ${swimAny.length}, Bike: ${bikeAny.length}, Run: ${runAny.length}, Total: ${swimAny.length + bikeAny.length + runAny.length}`);
