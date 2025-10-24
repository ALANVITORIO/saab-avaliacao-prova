/* ======================================
   CSV PARSER
   Parse CSV usando Papa Parse
   ====================================== */

function parseCSV(file) {
    return new Promise((resolve, reject) => {
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            dynamicTyping: true,
            complete: (results) => {
                if (results.errors.length > 0) {
                    reject(new Error('Erro ao processar CSV: ' + results.errors[0].message));
                } else {
                    // ETAPA DE PRÉ-FILTRAGEM ADICIONADA
                    // Define uma lista de todos os tipos de treino que consideramos válidos.
                    const validTypes = ['Run', 'Bike', 'Swim', 'Strength', 'Day Off'];
                    
                    // Filtra os resultados do parser, mantendo apenas as linhas que:
                    // 1. Existem (não são nulas).
                    // 2. Possuem a coluna 'WorkoutType'.
                    // 3. O valor em 'WorkoutType' está na nossa lista de tipos válidos.
                    const filteredData = results.data.filter(row => 
                        row && row.WorkoutType && validTypes.includes(row.WorkoutType)
                    );
                    
                    resolve(filteredData);
                }
            },
            error: (error) => {
                reject(error);
            }
        });
    });
}

// Validar se CSV tem colunas necessárias
function validateCSV(data) {
    if (!data || data.length === 0) {
        throw new Error('CSV vazio ou inválido');
    }

    const requiredColumns = ['WorkoutType'];
    const firstRow = data[0];

    const missingColumns = requiredColumns.filter(col => !(col in firstRow));

    if (missingColumns.length > 0) {
        throw new Error(`Colunas obrigatórias ausentes: ${missingColumns.join(', ')}`);
    }

    return true;
}
