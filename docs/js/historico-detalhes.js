let rotinaId = null;
let semanaId = null;
let rotina = null;
let historico = null;

window.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    rotinaId = urlParams.get('rotinaId');
    semanaId = urlParams.get('semanaId');
    
    if (!rotinaId || !semanaId) {
        alert('❌ Dados incompletos!');
        history.back();
        return;
    }
    
    await carregarDetalhes();
});

async function carregarDetalhes() {
    try {
        // Buscar rotina
        const rotinaResponse = await fetch(`/api/rotinas/${rotinaId}`);
        const rotinaData = await rotinaResponse.json();
        
        if (!rotinaData.sucesso) {
            throw new Error('Rotina não encontrada');
        }
        
        rotina = rotinaData.rotina;
        
        // Buscar histórico específico
        const historicoResponse = await fetch(`/api/historico/semana/${rotinaId}/${semanaId}`);
        const historicoData = await historicoResponse.json();
        
        if (!historicoData.sucesso) {
            throw new Error('Histórico não encontrado');
        }
        
        historico = historicoData.historico;
        
        document.getElementById('loadingScreen').style.display = 'none';
        renderizarDetalhes();
        
    } catch (error) {
        console.error('❌ Erro:', error);
        document.getElementById('loadingScreen').innerHTML = `
            <div style="text-align: center; color: red;">
                <h2>❌ Erro ao carregar detalhes</h2>
                <p>${error.message}</p>
                <button onclick="history.back()" style="padding: 10px 20px; font-size: 18px; margin-top: 20px;">🔙 Voltar</button>
            </div>
        `;
    }
}

function renderizarDetalhes() {
    // Aplicar tema
    const body = document.getElementById('bodyRotina');
    if (rotina.criancaGenero === 'menino') {
        body.classList.add('tema-menino');
    } else {
        body.classList.add('tema-menina');
    }
    
    // Título
    const generoEmoji = rotina.criancaGenero === 'menino' ? '👦' : '👧';
    const nomeCompleto = rotina.criancaSobrenome 
        ? `${rotina.criancaNome} ${rotina.criancaSobrenome}` 
        : rotina.criancaNome;
    
    document.getElementById('tituloDetalhes').textContent = `📋 ${nomeCompleto} - Semana ${semanaId}`;
    
    // Info da semana
    const infoDiv = document.getElementById('infoSemana');
    infoDiv.innerHTML = `
        <div style="margin-top: 15px;">
            <span class="info-badge">📅 ${historico.inicioSemana} a ${historico.fimSemana}</span>
            <span class="info-badge">🆔 ${semanaId}</span>
        </div>
    `;
    
    // Renderizar tabela
    const container = document.getElementById('tabelaContainer');
    const diasNomes = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    
    let tabelaHTML = '<h2>✅ Atividades da Semana</h2><table><thead><tr><th>Atividade</th>';
    
    rotina.diasSemana.forEach(dia => {
        tabelaHTML += `<th>${diasNomes[dia]}</th>`;
    });
    tabelaHTML += '</tr></thead><tbody>';
    
    rotina.atividades.forEach((atividade, indexAtiv) => {
        tabelaHTML += `<tr><td><span class="atividade-emoji">${atividade.emoji}</span> ${atividade.nome}</td>`;
        
        rotina.diasSemana.forEach((dia) => {
            const key = `${indexAtiv}-${dia}`;
            const isChecked = historico.progresso && historico.progresso[key] ? 'checked' : '';
            tabelaHTML += `<td style="text-align: center;"><input type="checkbox" class="checkbox-readonly" ${isChecked} disabled></td>`;
        });
        
        tabelaHTML += '</tr>';
    });
    
    tabelaHTML += '</tbody></table>';
    container.innerHTML = tabelaHTML;
    container.style.display = 'block';
}
