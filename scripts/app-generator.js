/* ======================================
   APP GENERATOR
   Lógica principal da aplicação de geração
   ====================================== */

let generatedHTML = null;
let currentCSVData = null;

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

function initializeApp() {
    // Event listeners
    document.getElementById('csvFile').addEventListener('change', handleFileSelect);
    document.getElementById('generatorForm').addEventListener('submit', handleGenerate);
    document.getElementById('downloadBtn').addEventListener('click', handleDownload);
    document.getElementById('openBtn').addEventListener('click', handleOpen);

    // Mostrar/ocultar campo de localização
    document.querySelectorAll('input[name="template"]').forEach(radio => {
        radio.addEventListener('change', handleTemplateChange);
    });

    // Drag and drop
    const fileLabel = document.getElementById('fileLabel');

    fileLabel.addEventListener('dragover', (e) => {
        e.preventDefault();
        fileLabel.classList.remove('border-brand-red/40');
        fileLabel.classList.add('border-brand-red', 'scale-105', 'shadow-2xl');
    });

    fileLabel.addEventListener('dragleave', () => {
        fileLabel.classList.remove('border-brand-red', 'scale-105', 'shadow-2xl');
        fileLabel.classList.add('border-brand-red/40');
    });

    fileLabel.addEventListener('drop', (e) => {
        e.preventDefault();
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            document.getElementById('csvFile').files = files;
            handleFileSelect({ target: { files: files } });
        }
        fileLabel.classList.remove('border-brand-red', 'scale-105', 'shadow-2xl');
        fileLabel.classList.add('border-brand-red/40');
    });
}

// Atualizar label do arquivo
function handleFileSelect(event) {
    const file = event.target.files[0];
    const label = document.getElementById('fileLabel');

    if (file) {
        label.classList.remove('border-dashed', 'border-brand-red/40', 'bg-gradient-to-br', 'from-gray-50', 'to-brand-cream/30');
        label.classList.add('border-solid', 'border-green-500', 'bg-gradient-to-br', 'from-green-50', 'to-emerald-50');
        label.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mx-auto mb-3 text-green-600"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            <div class="text-lg font-bold text-green-800 mb-1">${file.name}</div>
            <div class="text-sm text-green-600">${(file.size / 1024).toFixed(2)} KB</div>
            <div class="mt-2 text-xs text-green-500">Arquivo carregado!</div>
        `;
    }
}

// Mostrar/ocultar campo de localização
function handleTemplateChange(event) {
    const locationGroup = document.getElementById('locationGroup');
    const locationInput = document.getElementById('eventLocation');

    if (event.target.value === 'triathlon') {
        locationGroup.classList.remove('hidden');
        locationInput.required = true;
    } else {
        locationGroup.classList.add('hidden');
        locationInput.required = false;
    }
}

// Gerar relatório
async function handleGenerate(event) {
    event.preventDefault();

    const csvFile = document.getElementById('csvFile').files[0];
    const templateType = document.querySelector('input[name="template"]:checked').value;
    const athleteName = document.getElementById('athleteName').value.trim();
    const eventName = document.getElementById('eventName').value.trim();
    const eventDate = document.getElementById('eventDate').value.trim();
    const eventLocation = document.getElementById('eventLocation').value.trim();

    if (!csvFile) {
        showStatus('error', 'Por favor, selecione um arquivo CSV');
        return;
    }

    try {
        showStatus('loading', 'Processando arquivo...');

        // Parse CSV
        const csvData = await parseCSV(csvFile);
        validateCSV(csvData);
        currentCSVData = csvData;

        showStatus('loading', 'Calculando métricas...');

        // Processar dados
        let processedData;
        if (templateType === 'triathlon') {
            processedData = processForTriathlon(csvData, athleteName, eventName, eventDate, eventLocation);
        } else {
            processedData = processForMarathon(csvData, athleteName, eventName, eventDate);
        }

        showStatus('loading', 'Carregando template...');

        // Carregar e renderizar template
        const templateHTML = await loadTemplate(templateType);
        generatedHTML = renderTemplate(templateHTML, processedData, templateType);

        showStatus('success', '✅ Relatório gerado com sucesso!');
        document.getElementById('previewSection').classList.remove('hidden');

    } catch (error) {
        console.error('Erro ao gerar relatório:', error);
        showStatus('error', 'Erro: ' + error.message);
    }
}

// Download HTML
function handleDownload() {
    if (!generatedHTML) {
        showStatus('error', 'Nenhum relatório gerado ainda');
        return;
    }

    const athleteName = document.getElementById('athleteName').value.trim();
    const filename = `relatorio-${athleteName.toLowerCase().replace(/\s+/g, '-')}.html`;

    downloadHTML(generatedHTML, filename);
    showStatus('success', '✅ Download iniciado!');
}

// Abrir em nova aba
function handleOpen() {
    if (!generatedHTML) {
        showStatus('error', 'Nenhum relatório gerado ainda');
        return;
    }

    openInNewTab(generatedHTML);
    showStatus('success', '✅ Abrindo em nova aba...');
}

// Mostrar status
function showStatus(type, message) {
    const statusEl = document.getElementById('status');
    statusEl.classList.remove('hidden');

    // Limpar classes anteriores
    statusEl.className = 'p-6 rounded-2xl text-center font-semibold text-lg shadow-lg';

    // Adicionar classes baseadas no tipo
    if (type === 'success') {
        statusEl.classList.add('bg-gradient-to-br', 'from-green-50', 'to-emerald-50', 'text-green-800', 'border-2', 'border-green-300');
    } else if (type === 'error') {
        statusEl.classList.add('bg-gradient-to-br', 'from-red-50', 'to-rose-50', 'text-red-800', 'border-2', 'border-red-300');
    } else if (type === 'loading') {
        statusEl.classList.add('bg-gradient-to-br', 'from-blue-50', 'to-cyan-50', 'text-blue-800', 'border-2', 'border-blue-300');
    }

    // Conteúdo
    if (type === 'loading') {
        statusEl.innerHTML = `
            <div class="flex items-center justify-center gap-4">
                <div class="w-6 h-6 border-4 border-blue-800 border-t-transparent rounded-full spinner"></div>
                <span class="text-lg font-bold">${message}</span>
            </div>
        `;
    } else {
        const icon = type === 'success' ? '✅' : '⚠️';
        statusEl.innerHTML = `
            <div class="flex items-center justify-center gap-3">
                <span class="text-3xl">${icon}</span>
                <span>${message}</span>
            </div>
        `;
    }

    // Auto-ocultar após 5 segundos (exceto loading)
    if (type !== 'loading') {
        setTimeout(() => {
            statusEl.classList.add('hidden');
        }, 5000);
    }
}
