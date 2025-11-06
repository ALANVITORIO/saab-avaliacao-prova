#!/usr/bin/env node

/**
 * Script de teste para validar o gerador de relatórios Ironman
 * Testa com o CSV real (workouts-38 (2).csv)
 */

const fs = require('fs');
const path = require('path');

// Simular Papa Parse para Node.js
function parseCSV(csvText) {
    const lines = csvText.split('\n');
    const headers = lines[0].split('","').map(h => h.replace(/"/g, ''));

    const data = [];
    for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;

        const values = lines[i].split('","').map(v => v.replace(/"/g, ''));
        const row = {};
        headers.forEach((header, index) => {
            row[header] = values[index] || '';
        });
        data.push(row);
    }

    return data;
}

// Carregar o script gerador
const generatorCode = fs.readFileSync(path.join(__dirname, 'scripts/ironman-report-generator.js'), 'utf8');
eval(generatorCode);

// Carregar CSV real
console.log('📊 Carregando CSV real...');
const csvPath = path.join(__dirname, 'workouts-38 (2).csv');
const csvText = fs.readFileSync(csvPath, 'utf8');
const csvData = parseCSV(csvText);

console.log(`✅ CSV carregado: ${csvData.length} linhas`);

// Carregar template
console.log('📄 Carregando template...');
const templatePath = path.join(__dirname, 'template-saab-com-placeholders.html');
const templateHTML = fs.readFileSync(templatePath, 'utf8');

// Dados de teste (mesmos do exemplo real)
const testData = {
    athleteName: 'Sarah Lotif',
    eventName: 'Ironman 70.3 Florianópolis 2025',
    eventDate: '26 de Outubro',
    eventLocation: 'Praia dos Ingleses, SC',
    raceType: '70.3'
};

console.log('\n🚀 Gerando relatório...');
console.log('📋 Dados:', testData);

// Gerar relatório
const reportHTML = generateIronmanReport(
    csvData,
    testData.athleteName,
    testData.eventName,
    testData.eventDate,
    testData.eventLocation,
    testData.raceType,
    templateHTML
);

// Salvar resultado
const outputPath = path.join(__dirname, 'test-output.html');
fs.writeFileSync(outputPath, reportHTML);

console.log('\n✅ RELATÓRIO GERADO COM SUCESSO!');
console.log(`📁 Salvo em: ${outputPath}`);

// Validar se não há placeholders não substituídos
const remainingPlaceholders = reportHTML.match(/{{[A-Z_]+}}/g);
if (remainingPlaceholders) {
    console.log('\n⚠️  AVISO: Placeholders não substituídos encontrados:');
    const unique = [...new Set(remainingPlaceholders)];
    unique.forEach(p => console.log(`   - ${p}`));
} else {
    console.log('\n✅ Todos os placeholders foram substituídos corretamente!');
}

console.log('\n📊 VALIDAÇÃO DOS DADOS ESPERADOS:');
console.log('─'.repeat(60));

// Valores esperados baseados no exemplo fornecido
const expected = {
    totalWeeks: 11,
    totalWorkouts: 88,
    totalHours: 113.8,
    classification: 'EXCELENTE',

    swimWorkouts: 21,
    swimTotalKm: 51.9,

    bikeWorkouts: 35,
    bikeTotalKm: 1756,

    runWorkouts: 32,
    runTotalKm: 383.4
};

// Extrair valores gerados do HTML
function extractValue(html, pattern) {
    const match = html.match(pattern);
    return match ? match[1] : null;
}

const generated = {
    totalWeeks: parseInt(extractValue(reportHTML, /{{TOTAL_WEEKS}}/)),
    swimWorkouts: parseInt(extractValue(reportHTML, /<span class="stat-value">(\d+)<\/span>[\s\S]*?Treinos Realizados[\s\S]*?NATAÇÃO/i)),
};

console.log('Período:');
console.log(`  Esperado: ${expected.totalWeeks} semanas`);
console.log(`  Status: ${reportHTML.includes(expected.totalWeeks) ? '✅' : '⚠️'}`);

console.log('\nNatação:');
console.log(`  Esperado: ${expected.swimWorkouts} treinos`);
console.log(`  Status: ${reportHTML.includes(expected.swimWorkouts) ? '✅' : '⚠️'}`);

console.log('\nCiclismo:');
console.log(`  Esperado: ${expected.bikeWorkouts} treinos`);
console.log(`  Status: ${reportHTML.includes(expected.bikeWorkouts) ? '✅' : '⚠️'}`);

console.log('\nCorrida:');
console.log(`  Esperado: ${expected.runWorkouts} treinos`);
console.log(`  Status: ${reportHTML.includes(expected.runWorkouts) ? '✅' : '⚠️'}`);

console.log('\n' + '═'.repeat(60));
console.log('🎉 TESTE CONCLUÍDO!');
console.log('═'.repeat(60));
console.log('\n💡 Para visualizar o relatório, abra test-output.html no navegador');
