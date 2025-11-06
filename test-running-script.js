/**
 * Teste do gerador de relatórios de CORRIDA
 */

const fs = require('fs');
const path = require('path');

// Importar funções do gerador
const {
    generateRunningReport,
    filterRunningWorkouts,
    calculateRunningStats
} = require('./scripts/running-report-generator.js');

// Parser CSV simples
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

console.log('📊 Carregando CSV real...');
const csvPath = path.join(__dirname, 'workouts-38 (2).csv');
const csvText = fs.readFileSync(csvPath, 'utf8');
const csvData = parseCSV(csvText);
console.log(`✅ CSV carregado: ${csvData.length} linhas`);

console.log('\n📄 Carregando template de corrida...');
const templatePath = path.join(__dirname, 'corrida-template.html');
const templateHTML = fs.readFileSync(templatePath, 'utf8');
console.log('✅ Template carregado');

console.log('\n🏃 Gerando relatório de corrida...');
console.log('📋 Dados: {');
console.log('  athleteName: "Sarah Lotif",');
console.log('  eventName: "Meia Maratona de Florianópolis 2025"');
console.log('}');

try {
    // Primeiro testar filtro
    const runWorkouts = filterRunningWorkouts(csvData);
    console.log(`\n🏃 Corridas encontradas: ${runWorkouts.length} treinos`);

    if (runWorkouts.length === 0) {
        console.log('❌ ERRO: Nenhum treino de corrida encontrado no CSV!');
        process.exit(1);
    }

    // Testar estatísticas
    const stats = calculateRunningStats(runWorkouts);
    console.log('\n📊 Estatísticas calculadas:');
    console.log(`   Total de treinos: ${stats.totalWorkouts}`);
    console.log(`   Volume total: ${stats.totalKm}km`);
    console.log(`   Horas totais: ${stats.totalHours}h`);
    console.log(`   Pace médio: ${stats.avgPace}`);
    console.log(`   Período: ${stats.trainingPeriod}`);

    // Gerar relatório completo
    const reportHTML = generateRunningReport(
        csvData,
        'Sarah Lotif',
        'Meia Maratona de Florianópolis 2025',
        templateHTML,
        15000 // Min distance for long runs: 15km
    );

    // Salvar relatório
    const outputPath = path.join(__dirname, 'test-running-output.html');
    fs.writeFileSync(outputPath, reportHTML);

    console.log('\n✅ RELATÓRIO DE CORRIDA GERADO COM SUCESSO!');
    console.log(`📁 Salvo em: ${outputPath}`);

    // Verificar placeholders não substituídos
    const remainingPlaceholders = reportHTML.match(/{{[^}]+}}/g);
    if (remainingPlaceholders && remainingPlaceholders.length > 0) {
        console.log('\n⚠️  AVISO: Placeholders não substituídos encontrados:');
        const unique = [...new Set(remainingPlaceholders)];
        unique.forEach(p => console.log(`   - ${p}`));
    } else {
        console.log('\n✅ Todos os placeholders foram substituídos!');
    }

    console.log('\n════════════════════════════════════════════════════════════');
    console.log('🎉 TESTE CONCLUÍDO!');
    console.log('════════════════════════════════════════════════════════════');
    console.log('\n💡 Para visualizar o relatório, abra test-running-output.html no navegador');

} catch (error) {
    console.error('\n❌ ERRO ao gerar relatório:', error.message);
    console.error(error.stack);
    process.exit(1);
}
