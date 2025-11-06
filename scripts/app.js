/**
 * SAAB Sports - Gerador de Relatórios
 * Main Application Logic
 *
 * Integra o ironman-report-generator.js com a interface do index.html
 */

let generatedHTML = '';

// ════════════════════════════════════════════════════════════════════════════════════════
// ELEMENTOS DO DOM
// ════════════════════════════════════════════════════════════════════════════════════════

const form = document.getElementById('generatorForm');
const csvFileInput = document.getElementById('csvFile');
const fileLabel = document.getElementById('fileLabel');
const athleteNameInput = document.getElementById('athleteName');
const eventNameInput = document.getElementById('eventName');
const eventDateInput = document.getElementById('eventDate');
const eventLocationInput = document.getElementById('eventLocation');
const raceTypeSelect = document.getElementById('raceType');
const templateRadios = document.getElementsByName('template');
const generateBtn = document.getElementById('generateBtn');
const statusDiv = document.getElementById('status');
const previewSection = document.getElementById('previewSection');
const downloadBtn = document.getElementById('downloadBtn');
const downloadPdfBtn = document.getElementById('downloadPdfBtn');
const openBtn = document.getElementById('openBtn');
const raceTypeGroup = document.getElementById('raceTypeGroup');

// ════════════════════════════════════════════════════════════════════════════════════════
// UTILITÁRIOS
// ════════════════════════════════════════════════════════════════════════════════════════

function showStatus(message, type = 'info') {
    statusDiv.className = 'p-4 rounded-xl text-center font-semibold shadow-lg';

    if (type === 'success') {
        statusDiv.className += ' bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 text-green-800';
    } else if (type === 'error') {
        statusDiv.className += ' bg-gradient-to-br from-red-50 to-pink-50 border-2 border-red-300 text-red-800';
    } else {
        statusDiv.className += ' bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-300 text-blue-800';
    }

    statusDiv.textContent = message;
    statusDiv.classList.remove('hidden');
}

function hideStatus() {
    statusDiv.classList.add('hidden');
}

// ════════════════════════════════════════════════════════════════════════════════════════
// FILE UPLOAD HANDLER
// ════════════════════════════════════════════════════════════════════════════════════════

csvFileInput.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        fileLabel.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mx-auto mb-3 text-green-600"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            <div class="text-lg font-bold text-brand-dark mb-1">✅ ${file.name}</div>
            <div class="text-xs text-gray-500">Clique para escolher outro arquivo</div>
        `;
        fileLabel.classList.add('border-green-500', 'bg-green-50');
    }
});

// ════════════════════════════════════════════════════════════════════════════════════════
// TEMPLATE SELECTION HANDLER
// ════════════════════════════════════════════════════════════════════════════════════════

templateRadios.forEach(radio => {
    radio.addEventListener('change', function() {
        // Show/hide race type field based on template selection
        if (this.value === 'triathlon') {
            raceTypeGroup.style.display = 'block';
            raceTypeSelect.required = true;
        } else {
            raceTypeGroup.style.display = 'none';
            raceTypeSelect.required = false;
        }
    });
});

// Initialize race type field visibility
document.querySelector('input[name="template"]:checked').dispatchEvent(new Event('change'));

// ════════════════════════════════════════════════════════════════════════════════════════
// FORM SUBMISSION HANDLER
// ════════════════════════════════════════════════════════════════════════════════════════

form.addEventListener('submit', async function(e) {
    e.preventDefault();

    try {
        // Reset UI
        hideStatus();
        previewSection.classList.add('hidden');
        generateBtn.disabled = true;

        // Get selected template
        const selectedTemplate = document.querySelector('input[name="template"]:checked').value;

        showStatus('⏳ Lendo arquivo CSV...', 'info');

        // Read CSV file
        const file = csvFileInput.files[0];
        if (!file) {
            throw new Error('Nenhum arquivo selecionado');
        }

        const csvText = await file.text();

        showStatus('⏳ Processando dados do CSV...', 'info');

        // Parse CSV with Papa Parse
        const parseResult = Papa.parse(csvText, {
            header: true,
            skipEmptyLines: true,
            dynamicTyping: false // Keep as strings, we'll parse later
        });

        if (parseResult.errors.length > 0) {
            console.warn('CSV parsing warnings:', parseResult.errors);
        }

        const csvData = parseResult.data;
        console.log('📊 CSV parseado:', csvData.length, 'linhas');

        if (csvData.length === 0) {
            throw new Error('CSV vazio ou formato inválido');
        }

        // Get form values
        const athleteName = athleteNameInput.value.trim();
        const eventName = eventNameInput.value.trim();
        const eventDate = eventDateInput.value.trim();
        const eventLocation = eventLocationInput.value.trim();
        const raceType = raceTypeSelect.value;

        // Validate basic fields
        if (!athleteName || !eventName || !eventDate) {
            throw new Error('Preencha todos os campos obrigatórios');
        }

        // Validate race type for triathlon only
        if (selectedTemplate === 'triathlon') {
            if (!raceType) {
                throw new Error('Selecione o tipo de prova (Sprint/Olímpico/70.3/Full)');
            }
        }

        showStatus('⏳ Carregando template...', 'info');

        // Load correct template based on selection
        let templateFile;
        if (selectedTemplate === 'triathlon') {
            templateFile = 'template-saab-com-placeholders.html';
        } else if (selectedTemplate === 'corrida') {
            templateFile = 'corrida-template.html';
        } else {
            throw new Error('Template inválido selecionado');
        }

        const templateResponse = await fetch(templateFile);
        if (!templateResponse.ok) {
            throw new Error(`Erro ao carregar template: ${templateFile}`);
        }
        const templateHTML = await templateResponse.text();

        showStatus('⏳ Gerando relatório... (calculando métricas)', 'info');

        // Generate report using appropriate generator
        if (selectedTemplate === 'triathlon') {
            // Use Ironman/Triathlon generator
            generatedHTML = generateIronmanReport(
                csvData,
                athleteName,
                eventName,
                eventDate,
                eventLocation,
                raceType,
                templateHTML
            );
        } else if (selectedTemplate === 'corrida') {
            // Use Running generator
            generatedHTML = generateRunningReport(
                csvData,
                athleteName,
                eventName,
                templateHTML,
                15000 // Default min distance for long runs: 15km
            );
        } else {
            throw new Error('Gerador não implementado para este template');
        }

        // Success!
        showStatus('✅ Relatório gerado com sucesso!', 'success');
        previewSection.classList.remove('hidden');

        // Scroll to preview section
        previewSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    } catch (error) {
        console.error('Erro ao gerar relatório:', error);
        showStatus('❌ Erro: ' + error.message, 'error');
    } finally {
        generateBtn.disabled = false;
    }
});

// ════════════════════════════════════════════════════════════════════════════════════════
// DOWNLOAD HANDLERS
// ════════════════════════════════════════════════════════════════════════════════════════

downloadBtn.addEventListener('click', function() {
    if (!generatedHTML) {
        alert('❌ Nenhum relatório gerado ainda!');
        return;
    }

    const athleteName = athleteNameInput.value.trim();
    const filename = `relatorio-${athleteName.replace(/\s+/g, '-').toLowerCase()}.html`;

    const blob = new Blob([generatedHTML], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);

    showStatus('✅ Relatório HTML baixado com sucesso!', 'success');
});

openBtn.addEventListener('click', function() {
    if (!generatedHTML) {
        alert('❌ Nenhum relatório gerado ainda!');
        return;
    }

    const newWindow = window.open('', '_blank');
    newWindow.document.write(generatedHTML);
    newWindow.document.close();

    showStatus('✅ Relatório aberto em nova aba!', 'success');
});

downloadPdfBtn.addEventListener('click', async function() {
    if (!generatedHTML) {
        alert('❌ Nenhum relatório gerado ainda!');
        return;
    }

    try {
        showStatus('⏳ Gerando PDF... (isso pode levar alguns segundos)', 'info');
        downloadPdfBtn.disabled = true;

        const athleteName = athleteNameInput.value.trim();
        const filename = `relatorio-${athleteName.replace(/\s+/g, '-').toLowerCase()}.pdf`;

        // Create temporary element
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = generatedHTML;
        tempDiv.style.position = 'absolute';
        tempDiv.style.left = '-9999px';
        document.body.appendChild(tempDiv);

        const opt = {
            margin: 0.5,
            filename: filename,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
        };

        await html2pdf().set(opt).from(tempDiv).save();

        document.body.removeChild(tempDiv);

        showStatus('✅ PDF gerado com sucesso!', 'success');
    } catch (error) {
        console.error('Erro ao gerar PDF:', error);
        showStatus('❌ Erro ao gerar PDF: ' + error.message, 'error');
    } finally {
        downloadPdfBtn.disabled = false;
    }
});

// ════════════════════════════════════════════════════════════════════════════════════════
// INITIALIZATION
// ════════════════════════════════════════════════════════════════════════════════════════

console.log('🚀 SAAB Sports - Gerador de Relatórios v2.0');
console.log('✅ Sistema carregado e pronto!');
