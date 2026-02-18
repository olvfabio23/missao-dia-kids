let rotinaId = null;
let rotina = null;

// Utilitários
function formatarData(dataString) {
    if (!dataString) return '';
    const [dia, mes, ano] = dataString.split('/');
    return `${dia}/${mes}/${ano}`;
}

function calcularProgresso(progresso, rotina) {
    if (!progresso || !rotina || !rotina.atividades) {
        return { total: 0, concluidas: 0, percentual: 0 };
    }
    
    const diasSemana = rotina.diasSemana || [0, 1, 2, 3, 4, 5, 6];
    const totalTarefas = rotina.atividades.length * diasSemana.length;
    let concluidasCount = 0;
    
    Object.values(progresso).forEach(checked => {
        if (checked) concluidasCount++;
    });
    
    const percentual = totalTarefas > 0 ? Math.round((concluidasCount / totalTarefas) * 100) : 0;
    
    return {
        total: totalTarefas,
        concluidas: concluidasCount,
        percentual: percentual
    };
}

window.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    rotinaId = urlParams.get('rotinaId');
    
    if (!rotinaId) {
        alert('❌ Rotina não encontrada!');
        window.location.href = 'login-crianca.html';
        return;
    }
    
    await carregarHistorico();
});

async function carregarHistorico() {
    try {
        // Buscar dados da rotina
        const rotinaResponse = await fetch(`/api/rotinas/${rotinaId}`);
        const rotinaData = await rotinaResponse.json();
        
        if (!rotinaData.sucesso) {
            throw new Error('Rotina não encontrada');
        }
        
        rotina = rotinaData.rotina;
        const nomeCompleto = rotina.criancaSobrenome 
            ? `${rotina.criancaNome} ${rotina.criancaSobrenome}` 
            : rotina.criancaNome;
        
        const generoEmoji = rotina.criancaGenero === 'menino' ? '👦' : '👧';
        document.getElementById('criancaNome').textContent = `${generoEmoji} ${nomeCompleto}`;
        
        // Buscar histórico
        const historicoResponse = await fetch(`/api/historico/rotina/${rotinaId}`);
        const historicoData = await historicoResponse.json();
        
        document.getElementById('loadingScreen').style.display = 'none';
        document.getElementById('semanasContainer').style.display = 'grid';
        
        if (historicoData.sucesso && historicoData.historicos.length > 0) {
            renderizarHistoricos(historicoData.historicos);
        } else {
            mostrarVazio();
        }
    } catch (error) {
        console.error('❌ Erro ao carregar histórico:', error);
        document.getElementById('loadingScreen').innerHTML = `
            <div style="text-align: center; color: red;">
                <h2>❌ Erro ao carregar histórico</h2>
                <p>${error.message}</p>
                <button onclick="window.location.href='login-crianca.html'" style="padding: 10px 20px; font-size: 18px; margin-top: 20px;">🔙 Voltar</button>
            </div>
        `;
    }
}

function renderizarHistoricos(historicos) {
    const container = document.getElementById('semanasContainer');
    container.innerHTML = '';
    
    historicos.forEach((historico, index) => {
        const progresso = calcularProgresso(historico.progresso, rotina);
        
        const card = document.createElement('div');
        card.className = 'semana-card';
        
        // Determinar cor baseada no percentual
        let corBarra = '#ef4444'; // vermelho
        if (progresso.percentual >= 80) corBarra = '#10b981'; // verde
        else if (progresso.percentual >= 50) corBarra = '#f59e0b'; // amarelo
        
        card.innerHTML = `
            <h2>📅 Semana ${historicos.length - index}</h2>
            <div class="semana-info">
                <div class="info-item">
                    <strong>📆 Período:</strong> 
                    <span>${historico.inicioSemana} a ${historico.fimSemana}</span>
                </div>
                <div class="info-item">
                    <strong>🆔 ID:</strong> 
                    <span>${historico.semanaId}</span>
                </div>
            </div>
            
            <div class="progresso-resumo">
                <div class="progresso-item" style="background: ${corBarra}20; border: 2px solid ${corBarra};">
                    <strong style="color: ${corBarra};">${progresso.percentual}%</strong>
                    <span>Completo</span>
                </div>
                <div class="progresso-item">
                    <strong style="color: #10b981;">✅ ${progresso.concluidas}</strong>
                    <span>Concluídas</span>
                </div>
                <div class="progresso-item">
                    <strong style="color: #6b7280;">📝 ${progresso.total}</strong>
                    <span>Total</span>
                </div>
            </div>
            
            <div style="margin-top: 20px;">
                <button onclick="verDetalhes('${historico.semanaId}')" class="btn-ver-detalhes">
                    👁️ Ver Detalhes
                </button>
            </div>
        `;
        
        container.appendChild(card);
    });
}

function mostrarVazio() {
    const container = document.getElementById('semanasContainer');
    container.innerHTML = `
        <div class="vazio">
            <h2>📭</h2>
            <p>Nenhum histórico encontrado ainda.</p>
            <p style="margin-top: 10px; font-size: 1rem;">Complete suas tarefas semanais para criar um histórico!</p>
        </div>
    `;
}

function verDetalhes(semanaId) {
    window.location.href = `historico-detalhes.html?rotinaId=${rotinaId}&semanaId=${semanaId}`;
}
