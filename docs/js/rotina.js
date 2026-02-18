let rotinaId = null;
let rotina = null;
let celebrouHoje = false;
let mudancasNaoSalvas = false;
let estadoInicial = null;
let modoEdicao = false; // Para edição com PIN
let recompensasSemanal = 0; // Total da semana atual
let recompensasMensal = 0; // Total do mês atual

// ========== UTILITÁRIOS DE SEMANAS ==========

function getInicioSemana(data = new Date()) {
    const d = new Date(data);
    const dia = d.getDay();
    const diff = d.getDate() - dia;
    const inicio = new Date(d.setDate(diff));
    inicio.setHours(0, 0, 0, 0);
    return inicio;
}

function getFimSemana(data = new Date()) {
    const inicio = getInicioSemana(data);
    const fim = new Date(inicio);
    fim.setDate(inicio.getDate() + 6);
    fim.setHours(23, 59, 59, 999);
    return fim;
}

function formatarData(data) {
    const d = new Date(data);
    const dia = String(d.getDate()).padStart(2, '0');
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const ano = d.getFullYear();
    return `${dia}/${mes}/${ano}`;
}

function getIdentificadorSemana(data = new Date()) {
    const inicio = getInicioSemana(data);
    const ano = inicio.getFullYear();
    const primeiroDiaAno = new Date(ano, 0, 1);
    const diasPassados = Math.floor((inicio - primeiroDiaAno) / (24 * 60 * 60 * 1000));
    const numeroSemana = Math.ceil((diasPassados + primeiroDiaAno.getDay() + 1) / 7);
    return `${ano}-${String(numeroSemana).padStart(2, '0')}`;
}

function getRangeSemana(data = new Date()) {
    const inicio = getInicioSemana(data);
    const fim = getFimSemana(data);
    return `${formatarData(inicio)} a ${formatarData(fim)}`;
}

function estaNoPassado(diaSemana) {
    const hoje = new Date();
    const diaHoje = hoje.getDay();
    return diaSemana < diaHoje;
}

function estaNoFuturo(diaSemana) {
    const hoje = new Date();
    const diaHoje = hoje.getDay();
    return diaSemana > diaHoje;
}

// ========== INICIALIZAÇÃO ==========

window.addEventListener('DOMContentLoaded', async () => {
    console.log('🔄 Iniciando carregamento da rotina...');
    const urlParams = new URLSearchParams(window.location.search);
    rotinaId = urlParams.get('id');
    
    if (!rotinaId) {
        alert('❌ Rotina não encontrada!');
        window.location.href = 'login-crianca.html';
        return;
    }
    
    try {
        await carregarRotina();
        mostrarRangeSemana();
        verificarCelebracao();
        verificarMudancaSemana();
        
        // Verificar reset semanal de recompensas (se estiver ativo)
        if (rotina && rotina.usarRecompensas) {
            await verificarResetSemanal();
        }
    } catch (error) {
        console.error('❌ Erro fatal:', error);
        alert('Erro ao carregar rotina.');
        window.location.href = 'login-crianca.html';
    }
});

async function carregarRotina() {
    try {
        const response = await fetch(`/api/rotinas/${rotinaId}`);
        
        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.sucesso) {
            throw new Error(data.erro || 'Erro desconhecido');
        }
        
        rotina = data.rotina;
        
        // Se a rotina tem seções, converter para atividades flat
        if (rotina.secoes && rotina.secoes.length > 0) {
            console.log('🔄 Convertendo seções para atividades...');
            const atividadesDasSecoes = [];
            rotina.secoes.forEach((secao, idx) => {
                console.log(`  Seção ${idx}: ${secao.titulo} com ${secao.atividades?.length || 0} atividades`);
                if (secao.atividades) {
                    secao.atividades.forEach(ativ => {
                        console.log(`    - ${ativ.nome}, valor: ${ativ.valor || 0}`);
                    });
                    atividadesDasSecoes.push(...secao.atividades);
                }
            });
            // Sobrescrever com atividades das seções
            rotina.atividades = atividadesDasSecoes;
        }
        
        console.log('📋 Rotina carregada:', rotina.criancaNome);
        console.log('💰 Usar recompensas:', rotina.usarRecompensas);
        console.log('✅ Total de atividades:', rotina.atividades?.length || 0);
        if (rotina.atividades && rotina.atividades.length > 0) {
            console.log('🎯 Primeira atividade:', rotina.atividades[0]);
        }
        
        renderizarRotina();
        loadProgress();
        
        document.getElementById('loadingScreen').style.display = 'none';
        document.getElementById('rotinaContainer').style.display = 'block';
    } catch (error) {
        console.error('❌ Erro ao carregar rotina:', error);
        document.getElementById('loadingScreen').innerHTML = `
            <div style="text-align: center; color: red;">
                <h2>❌ Erro ao carregar rotina</h2>
                <p>${error.message}</p>
                <button onclick="window.location.href='login-crianca.html'" style="padding: 10px 20px; font-size: 18px; margin-top: 20px;">🔙 Voltar</button>
            </div>
        `;
    }
}

// ========== VERIFICAÇÃO E SALVAMENTO AUTOMÁTICO DE SEMANAS ==========

function verificarMudancaSemana() {
    const semanaAtualId = getIdentificadorSemana();
    const ultimaSemanaSalva = localStorage.getItem(`ultima-semana-${rotinaId}`);
    
    if (ultimaSemanaSalva && ultimaSemanaSalva !== semanaAtualId) {
        console.log('📅 Nova semana detectada! Salvando semana anterior...');
        salvarSemanaAnterior(ultimaSemanaSalva);
    }
    
    localStorage.setItem(`ultima-semana-${rotinaId}`, semanaAtualId);
}

async function salvarSemanaAnterior(semanaId) {
    try {
        const progressoString = localStorage.getItem(`rotina-progresso-${rotinaId}`);
        if (!progressoString) return;
        
        const progresso = JSON.parse(progressoString);
        
        const response = await fetch('/api/historico/salvar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                rotinaId: rotinaId,
                progresso: progresso.estados
            })
        });
        
        const data = await response.json();
        
        if (data.sucesso) {
            console.log('✅ Histórico da semana anterior salvo!');
            // Limpar progresso local da semana anterior
            localStorage.removeItem(`rotina-progresso-${rotinaId}`);
        }
    } catch (error) {
        console.error('❌ Erro ao salvar histórico:', error);
    }
}

function mostrarRangeSemana() {
    const rangeSemana = getRangeSemana();
    const subtitulo = document.getElementById('subtitulo');
    if (subtitulo) {
        const textoOriginal = subtitulo.textContent;
        subtitulo.textContent = `${textoOriginal} | 📅 Semana: ${rangeSemana}`;
    }
}

// ========== RENDERIZAÇÃO ==========

function renderizarRotina() {
    const body = document.getElementById('bodyRotina');
    if (rotina.criancaGenero === 'menino') {
        body.classList.add('tema-menino');
    } else {
        body.classList.add('tema-menina');
    }
    
    const emojisTitulo = rotina.criancaGenero === 'menino' ? '⚽🎮🚀' : '🌸💖✨';
    const nomeCompleto = rotina.criancaSobrenome ? `${rotina.criancaNome} ${rotina.criancaSobrenome}` : rotina.criancaNome;
    document.getElementById('tituloRotina').textContent = `${emojisTitulo} ROTINA ${nomeCompleto.toUpperCase()} ${emojisTitulo}`;
    
    const diasNomes = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    const diasTexto = rotina.diasSemana.map(d => diasNomes[d]).join(', ');
    document.getElementById('subtitulo').textContent = `Dias: ${diasTexto}`;
    
    // Mostrar cofrinho se recompensas estão ativadas
    if (rotina.usarRecompensas) {
        const cofrinhoContainer = document.getElementById('cofrinhoContainer');
        cofrinhoContainer.style.display = 'block';
        carregarRecompensas();
    }
    
    const container = document.getElementById('atividadesContainer');
    container.innerHTML = '';
    
    // Adicionar botões de ação
    const acoesDiv = document.createElement('div');
    acoesDiv.className = 'acoes-rotina';
    acoesDiv.innerHTML = `
        <button onclick="abrirHistorico()" class="btn-historico">📚 Ver Histórico</button>
        <button onclick="solicitarPinEdicao()" class="btn-editar-passado">🔓 Editar Dias Passados</button>
    `;
    container.appendChild(acoesDiv);
    
    // Renderizar por seções se existirem, senão usa formato único
    if (rotina.secoes && rotina.secoes.length > 0) {
        // Renderizar cada seção separadamente com TABELA
        rotina.secoes.forEach((secao, secaoIdx) => {
            if (!secao.atividades || secao.atividades.length === 0) return;
            
            const secaoDiv = document.createElement('div');
            secaoDiv.className = 'secao-container';
            
            let secaoHTML = `<h2 class="titulo-secao">📌 ${secao.titulo || `Seção ${secaoIdx + 1}`}</h2>`;
            
            if (secao.orientacao && secao.orientacao.trim()) {
                secaoHTML += `<div class="orientacao-secao">💡 ${secao.orientacao}</div>`;
            }
            
            // TABELA para as atividades
            secaoHTML += '<div class="tabela-rotina"><table>';
            secaoHTML += '<thead><tr><th>Atividade</th>';
            
            // Cabeçalho com dias da semana
            rotina.diasSemana.forEach((dia) => {
                const diaHoje = new Date().getDay();
                const isHoje = dia === diaHoje;
                secaoHTML += `<th class="${isHoje ? 'dia-hoje' : ''}">${diasNomes[dia]}</th>`;
            });
            secaoHTML += '</tr></thead><tbody>';
            
            // Linhas de atividades
            secao.atividades.forEach((atividade, atividadeIdx) => {
                let indexGlobal = 0;
                for (let i = 0; i < secaoIdx; i++) {
                    indexGlobal += rotina.secoes[i].atividades?.length || 0;
                }
                indexGlobal += atividadeIdx;
                
                secaoHTML += '<tr>';
                secaoHTML += `<td class="atividade-nome">
                    <div class="atividade-info-linha">
                        <span class="atividade-emoji">${atividade.emoji}</span>
                        <span class="atividade-nome-texto">${atividade.nome}</span>
                    </div>`;
                
                // Valor em linha separada
                if (rotina.usarRecompensas && atividade.valor) {
                    secaoHTML += `<div class="valor-linha">💰 R$ ${atividade.valor.toFixed(2)}</div>`;
                }
                
                secaoHTML += '</td>';
                
                // Checkboxes dos dias
                rotina.diasSemana.forEach((dia) => {
                    const diaHoje = new Date().getDay();
                    const isHoje = dia === diaHoje;
                    const isPassed = estaNoPassado(dia);
                    const isFuture = estaNoFuturo(dia);
                    
                    // Desabilitar: dias passados (sem modo edição) OU dias futuros (sempre)
                    const disabled = (isPassed && !modoEdicao) || isFuture;
                    
                    secaoHTML += `<td class="${isHoje ? 'dia-hoje' : ''}">
                        <input type="checkbox" 
                               class="checkbox-dia atividade-checkbox" 
                               data-atividade="${indexGlobal}" 
                               data-dia="${dia}" 
                               data-valor="${atividade.valor || 0}"
                               ${disabled ? 'disabled' : ''}>
                    </td>`;
                });
                
                secaoHTML += '</tr>';
            });
            
            secaoHTML += '</tbody></table></div>';
            secaoDiv.innerHTML = secaoHTML;
            container.appendChild(secaoDiv);
        });
    } else {
        // Formato antigo - uma seção única com TABELA
        const secaoDiv = document.createElement('div');
        secaoDiv.className = 'secao-container';
        
        let secaoHTML = '<h2 class="titulo-secao">✅ Minhas Atividades</h2>';
        secaoHTML += '<div class="tabela-rotina"><table>';
        secaoHTML += '<thead><tr><th>Atividade</th>';
        
        rotina.diasSemana.forEach((dia) => {
            const diaHoje = new Date().getDay();
            const isHoje = dia === diaHoje;
            secaoHTML += `<th class="${isHoje ? 'dia-hoje' : ''}">${diasNomes[dia]}</th>`;
        });
        secaoHTML += '</tr></thead><tbody>';
        
        rotina.atividades.forEach((atividade, indexAtiv) => {
            secaoHTML += '<tr>';
            secaoHTML += `<td class="atividade-nome">
                <div class="atividade-info-linha">
                    <span class="atividade-emoji">${atividade.emoji}</span>
                    <span class="atividade-nome-texto">${atividade.nome}</span>
                </div>`;
            
            if (rotina.usarRecompensas && atividade.valor) {
                secaoHTML += `<div class="valor-linha">💰 R$ ${atividade.valor.toFixed(2)}</div>`;
            }
            
            secaoHTML += '</td>';
            
            rotina.diasSemana.forEach((dia) => {
                const diaHoje = new Date().getDay();
                const isHoje = dia === diaHoje;
                const isPassed = estaNoPassado(dia);
                const isFuture = estaNoFuturo(dia);
                
                // Desabilitar: dias passados (sem modo edição) OU dias futuros (sempre)
                const disabled = (isPassed && !modoEdicao) || isFuture;
                
                secaoHTML += `<td class="${isHoje ? 'dia-hoje' : ''}">
                    <input type="checkbox" 
                           class="checkbox-dia atividade-checkbox" 
                           data-atividade="${indexAtiv}" 
                           data-dia="${dia}" 
                           data-valor="${atividade.valor || 0}"
                           ${disabled ? 'disabled' : ''}>
                </td>`;
            });
            
            secaoHTML += '</tr>';
        });
        
        secaoHTML += '</tbody></table></div>';
        secaoDiv.innerHTML = secaoHTML;
        container.appendChild(secaoDiv);
    }
    
    const footer = document.querySelector('.footer');
    if (footer) {
        const emoji = rotina.criancaGenero === 'menino' ? '🏆' : '👑';
        const texto = rotina.criancaGenero === 'menino' ? 'CAMPEÃO' : 'CAMPEÃ';
        footer.innerHTML = `<p>🌟 PARABÉNS! 🌟</p><p>Você é ${texto === 'CAMPEÃO' ? 'um' : 'uma'} ${texto} quando completa todas as tarefas! ${emoji}</p>`;
    }
    
    if (rotina.observacoes && rotina.observacoes.trim()) {
        document.getElementById('observacoes').style.display = 'block';
        document.getElementById('textoObservacoes').textContent = rotina.observacoes;
    }
    
    // Adicionar event listeners aos checkboxes após renderização
    adicionarEventListenersCheckboxes();
}

// Função para adicionar eventos aos checkboxes
function adicionarEventListenersCheckboxes() {
    const checkboxes = document.querySelectorAll('.checkbox-dia, .atividade-checkbox');
    console.log(`[EVENT LISTENERS] Adicionando eventos a ${checkboxes.length} checkboxes`);
    
    checkboxes.forEach((checkbox, index) => {
        // Remover listeners antigos se existirem
        const novoCheckbox = checkbox.cloneNode(true);
        checkbox.parentNode.replaceChild(novoCheckbox, checkbox);
        
        novoCheckbox.addEventListener('change', function(e) {
            console.log(`[CHANGE EVENT] Checkbox ${index} alterado:`, {
                dia: this.dataset.dia,
                checked: this.checked,
                disabled: this.disabled
            });
            validarMarcacao(this);
        });
        
        // Adicionar listener de click também para debug
        novoCheckbox.addEventListener('click', function(e) {
            console.log(`[CLICK EVENT] Checkbox ${index} clicado:`, {
                dia: this.dataset.dia,
                disabled: this.disabled,
                checked: this.checked
            });
        });
    });
    
    console.log('[EVENT LISTENERS] Eventos adicionados com sucesso!');
}

// ========== VALIDAÇÃO E EDIÇÃO ==========

function validarMarcacao(checkbox) {
    const diaCheckbox = parseInt(checkbox.dataset.dia);
    const diaHoje = new Date().getDay();
    
    console.log(`[VALIDAÇÃO] Dia checkbox: ${diaCheckbox}, Dia hoje: ${diaHoje}, Modo edição: ${modoEdicao}, Checked: ${checkbox.checked}`);
    
    // Se está em modo edição, permitir tudo (exceto futuro)
    if (modoEdicao) {
        // Apenas bloquear futuro mesmo em modo edição
        if (estaNoFuturo(diaCheckbox) && checkbox.checked) {
            const diasNomes = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
            mostrarAvisoFuturo(diasNomes[diaCheckbox]);
            setTimeout(() => { checkbox.checked = false; }, 100);
            return;
        }
        // Permitir qualquer alteração no passado ou hoje
        atualizarRecompensasEProgresso(checkbox);
        return;
    }
    
    // NÃO está em modo edição - regras normais
    
    // 1. FUTURO: Sempre bloquear
    if (estaNoFuturo(diaCheckbox)) {
        if (checkbox.checked) {
            const diasNomes = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
            mostrarAvisoFuturo(diasNomes[diaCheckbox]);
            setTimeout(() => { checkbox.checked = false; }, 100);
        }
        return;
    }
    
    // 2. PASSADO: Bloquear alterações
    if (estaNoPassado(diaCheckbox)) {
        mostrarAvisoPassado();
        setTimeout(() => { checkbox.checked = !checkbox.checked; }, 100);
        return;
    }
    
    // 3. HOJE: Permitir normalmente
    if (diaCheckbox === diaHoje) {
        atualizarRecompensasEProgresso(checkbox);
        return;
    }
    
    // Caso não se encaixe em nenhuma categoria (não deveria acontecer)
    console.warn('[VALIDAÇÃO] Situação inesperada!');
}

function atualizarRecompensasEProgresso(checkbox) {
    // Atualizar recompensas se estiver ativo
    if (rotina.usarRecompensas && checkbox.dataset.valor) {
        const valor = parseFloat(checkbox.dataset.valor);
        if (checkbox.checked) {
            adicionarRecompensa(valor);
        } else {
            removerRecompensa(valor);
        }
    }
    
    detectarMudancas();
    saveProgress();
    checkCompletion();
}

function mostrarAvisoFuturo(nomeDia) {
    const modal = document.createElement('div');
    modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); display: flex; justify-content: center; align-items: center; z-index: 10000;';
    modal.innerHTML = `<div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 40px; border-radius: 20px; text-align: center; max-width: 500px; box-shadow: 0 20px 60px rgba(0,0,0,0.5);"><div style="font-size: 80px; margin-bottom: 20px;">⛔</div><h2 style="color: white; font-size: 32px; margin-bottom: 15px;">Ops! Ainda não!</h2><p style="color: white; font-size: 24px; font-weight: bold; line-height: 1.5;"><strong>${nomeDia}</strong> ainda não chegou!<br>Você não pode marcar tarefas do futuro! ⏰</p><button onclick="this.parentElement.parentElement.remove()" style="margin-top: 30px; padding: 15px 40px; font-size: 24px; background: white; color: #dc2626; border: none; border-radius: 10px; cursor: pointer; font-weight: bold; box-shadow: 0 5px 15px rgba(0,0,0,0.3);">Entendi! ✅</button></div>`;
    document.body.appendChild(modal);
    setTimeout(() => { if (modal.parentElement) modal.remove(); }, 5000);
}

function mostrarAvisoPassado() {
    const modal = document.createElement('div');
    modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); display: flex; justify-content: center; align-items: center; z-index: 10000;';
    modal.innerHTML = `<div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 40px; border-radius: 20px; text-align: center; max-width: 500px; box-shadow: 0 20px 60px rgba(0,0,0,0.5);"><div style="font-size: 80px; margin-bottom: 20px;">🔒</div><h2 style="color: white; font-size: 32px; margin-bottom: 15px;">Dia já passou!</h2><p style="color: white; font-size: 24px; font-weight: bold; line-height: 1.5;">Para alterar dias passados, peça para seus pais<br>usarem o botão "Editar Dias Passados" 👆</p><button onclick="this.parentElement.parentElement.remove()" style="margin-top: 30px; padding: 15px 40px; font-size: 24px; background: white; color: #d97706; border: none; border-radius: 10px; cursor: pointer; font-weight: bold; box-shadow: 0 5px 15px rgba(0,0,0,0.3);">OK! ✅</button></div>`;
    document.body.appendChild(modal);
    setTimeout(() => { if (modal.parentElement) modal.remove(); }, 5000);
}

function mostrarAvisoDia(nomeDia) {
    const modal = document.createElement('div');
    modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); display: flex; justify-content: center; align-items: center; z-index: 10000;';
    modal.innerHTML = `<div style="background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); padding: 40px; border-radius: 20px; text-align: center; max-width: 500px; box-shadow: 0 20px 60px rgba(0,0,0,0.5);"><div style="font-size: 80px; margin-bottom: 20px;">📅</div><h2 style="color: #7c2d12; font-size: 32px; margin-bottom: 15px;">Calma aí!</h2><p style="color: #7c2d12; font-size: 24px; font-weight: bold; line-height: 1.5;">Hoje ainda não é <strong>${nomeDia}</strong>!<br>Você só pode marcar as tarefas do dia de hoje! 😊</p><button onclick="this.parentElement.parentElement.remove()" style="margin-top: 30px; padding: 15px 40px; font-size: 24px; background: white; color: #f59e0b; border: none; border-radius: 10px; cursor: pointer; font-weight: bold; box-shadow: 0 5px 15px rgba(0,0,0,0.3);">OK, Entendi! ✅</button></div>`;
    document.body.appendChild(modal);
    setTimeout(() => { if (modal.parentElement) modal.remove(); }, 5000);
}

// ========== EDIÇÃO COM PIN ==========

function solicitarPinEdicao() {
    // Criar modal para entrada segura do PIN
    const modal = document.createElement('div');
    modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); display: flex; justify-content: center; align-items: center; z-index: 10000;';
    
    modal.innerHTML = `
        <div style="background: white; padding: 40px; border-radius: 20px; text-align: center; max-width: 400px; box-shadow: 0 20px 60px rgba(0,0,0,0.5);">
            <h2 style="color: #2563eb; margin-bottom: 20px;">🔐 Verificação dos Pais</h2>
            <p style="color: #666; margin-bottom: 25px; font-size: 1.1rem;">Digite o PIN para editar dias passados:</p>
            <input type="password" id="pinInput" maxlength="4" placeholder="••••" style="width: 100%; padding: 15px; font-size: 32px; text-align: center; border: 3px solid #2563eb; border-radius: 10px; margin-bottom: 25px; letter-spacing: 15px; font-family: monospace;" autofocus>
            <div style="display: flex; gap: 15px;">
                <button onclick="fecharModalPin()" style="flex: 1; padding: 12px; font-size: 18px; background: #ef4444; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: bold;">❌ Cancelar</button>
                <button onclick="verificarPinEdicao()" style="flex: 1; padding: 12px; font-size: 18px; background: #10b981; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: bold;">✅ Confirmar</button>
            </div>
        </div>
    `;
    
    modal.id = 'modalPin';
    document.body.appendChild(modal);
    
    // Focus no input
    setTimeout(() => {
        document.getElementById('pinInput').focus();
    }, 100);
    
    // Enter para confirmar
    document.getElementById('pinInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            verificarPinEdicao();
        }
    });
}

function fecharModalPin() {
    const modal = document.getElementById('modalPin');
    if (modal) modal.remove();
}

async function verificarPinEdicao() {
    const pinInput = document.getElementById('pinInput');
    const pin = pinInput.value;
    
    if (!pin) {
        alert('⚠️ Por favor, digite o PIN');
        return;
    }
    
    try {
        const response = await fetch('/api/auth/verificar-pin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pin })
        });
        
        const data = await response.json();
        
        if (data.sucesso) {
            fecharModalPin();
            modoEdicao = true;
            alert('✅ Modo de edição ativado! Agora você pode alterar dias passados.');
            mostrarIndicadorModoEdicao();
            atualizarCheckboxesModoEdicao();
        } else {
            pinInput.value = '';
            pinInput.style.borderColor = '#ef4444';
            alert('❌ PIN incorreto!');
            pinInput.focus();
        }
    } catch (error) {
        console.error('Erro ao verificar PIN:', error);
        alert('❌ Erro ao verificar PIN');
    }
}

function mostrarIndicadorModoEdicao() {
    let indicador = document.getElementById('indicadorEdicao');
    if (!indicador) {
        indicador = document.createElement('div');
        indicador.id = 'indicadorEdicao';
        indicador.style.cssText = 'position: fixed; top: 10px; right: 10px; background: #10b981; color: white; padding: 15px 25px; border-radius: 10px; font-weight: bold; z-index: 9999; box-shadow: 0 4px 12px rgba(0,0,0,0.3);';
        indicador.innerHTML = '🔓 Modo Edição Ativo <button onclick="desativarModoEdicao()" style="margin-left: 10px; background: white; color: #10b981; border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer; font-weight: bold;">❌ Sair</button>';
        document.body.appendChild(indicador);
    }
}

function desativarModoEdicao() {
    modoEdicao = false;
    const indicador = document.getElementById('indicadorEdicao');
    if (indicador) indicador.remove();
    alert('✅ Modo de edição desativado!');
    atualizarCheckboxesModoEdicao();
}

// Função para atualizar estado dos checkboxes quando muda modo de edição
function atualizarCheckboxesModoEdicao() {
    const checkboxes = document.querySelectorAll('.checkbox-dia, .atividade-checkbox');
    checkboxes.forEach(checkbox => {
        const dia = parseInt(checkbox.dataset.dia);
        const isPassed = estaNoPassado(dia);
        const isFuture = estaNoFuturo(dia);
        
        // Dias futuros sempre desabilitados
        // Dias passados: desabilitados apenas se NÃO estiver em modo edição
        const shouldDisable = isFuture || (isPassed && !modoEdicao);
        
        checkbox.disabled = shouldDisable;
        
        // Log para debug
        console.log(`[CHECKBOX] Dia ${dia}: passado=${isPassed}, futuro=${isFuture}, disabled=${shouldDisable}, modoEdicao=${modoEdicao}`);
    });
}

// ========== HISTÓRICO ==========

function abrirHistorico() {
    // Abrir histórico diretamente sem PIN
    window.location.href = `historico.html?rotinaId=${rotinaId}`;
}

// ========== PROGRESSO E SALVAMENTO ==========

function checkCompletion() {
    const diaHoje = new Date().getDay();
    const hoje = new Date().toDateString();
    
    // Verificar conclusão por seção
    if (rotina.secoes && rotina.secoes.length > 0) {
        rotina.secoes.forEach((secao, secaoIdx) => {
            if (!secao.atividades || secao.atividades.length === 0) return;
            
            // Pegar índice global das atividades desta seção
            let indexInicial = 0;
            for (let i = 0; i < secaoIdx; i++) {
                indexInicial += rotina.secoes[i].atividades?.length || 0;
            }
            
            // Verificar se todas as atividades desta seção estão completas hoje
            let todasCompletasSecao = true;
            secao.atividades.forEach((atividade, atividadeIdx) => {
                const indexGlobal = indexInicial + atividadeIdx;
                const checkbox = document.querySelector(`.atividade-checkbox[data-atividade="${indexGlobal}"][data-dia="${diaHoje}"]`);
                if (!checkbox || !checkbox.checked) {
                    todasCompletasSecao = false;
                }
            });
            
            // Se completou a seção e ainda não comemorou hoje
            if (todasCompletasSecao && secao.atividades.length > 0) {
                const celebradoSecaoKey = `celebrado-secao-${rotinaId}-${secaoIdx}-${hoje}`;
                if (!localStorage.getItem(celebradoSecaoKey)) {
                    showSectionCelebration(secao.titulo || `Seção ${secaoIdx + 1}`);
                    localStorage.setItem(celebradoSecaoKey, 'true');
                }
            }
        });
    }
    
    // Verificar conclusão TOTAL de todas as atividades do dia
    const checkboxesHoje = document.querySelectorAll(`.atividade-checkbox[data-dia="${diaHoje}"]`);
    let totalCompletas = 0;
    
    checkboxesHoje.forEach((checkbox) => {
        if (checkbox.checked) totalCompletas++;
    });
    
    if (totalCompletas === checkboxesHoje.length && checkboxesHoje.length > 0 && !celebrouHoje) {
        const celebradoKey = `celebrado-${rotinaId}-${hoje}`;
        
        if (!localStorage.getItem(celebradoKey)) {
            showFinalCelebration();
            localStorage.setItem(celebradoKey, 'true');
            celebrouHoje = true;
        }
    }
}

function voltarPagina() {
    if (mudancasNaoSalvas) {
        const confirmar = confirm('⚠️ Você tem mudanças não salvas!\n\nDeseja salvar antes de sair?');
        if (confirmar) {
            saveProgress();
            setTimeout(() => { window.location.href = 'login-crianca.html'; }, 500);
        } else {
            const certeza = confirm('❌ Tem certeza que quer sair sem salvar?');
            if (certeza) window.location.href = 'login-crianca.html';
        }
    } else {
        window.location.href = 'login-crianca.html';
    }
}

// Comemoração ao completar UMA SEÇÃO
function showSectionCelebration(nomeSecao) {
    const modal = document.getElementById('celebrationModal');
    if (!modal) return;
    
    let emojisPrincipais, mensagem, corFundo;
    
    if (rotina.criancaGenero === 'menino') {
        emojisPrincipais = '⭐🎯';
        mensagem = 'BOA GAROTO!';
        corFundo = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
    } else {
        emojisPrincipais = '⭐✨';
        mensagem = 'BOA GAROTA!';
        corFundo = 'linear-gradient(135deg, #f472b6 0%, #ec4899 100%)';
    }
    
    modal.style.display = 'flex';
    const modalContent = modal.querySelector('.celebration-content');
    if (modalContent) modalContent.style.background = corFundo;
    
    const bigEmoji = modal.querySelector('.big-emoji');
    if (bigEmoji) bigEmoji.textContent = '⭐';
    
    const tituloModal = modal.querySelector('.modal-titulo');
    if (tituloModal) tituloModal.textContent = `${emojisPrincipais} ${mensagem} ${emojisPrincipais}`;
    
    const paragrafo = modal.querySelector('.celebration-content p:first-of-type');
    if (paragrafo) paragrafo.textContent = `Você completou a seção "${nomeSecao}"! 💪`;
    
    const paragrafo2 = modal.querySelector('.celebration-content p:nth-of-type(2)');
    if (paragrafo2) paragrafo2.textContent = '🔥 Continue assim! Você está ARRASANDO! 🔥';
    
    playVictorySound();
    createConfetti();
    
    // Auto-fechar após 4 segundos
    setTimeout(() => {
        fecharCelebracao();
    }, 4000);
}

// Comemoração FINAL ao completar TODAS as atividades do dia
function showFinalCelebration() {
    const modal = document.getElementById('celebrationModal');
    if (!modal) return;
    
    let emojisPrincipais, mensagem, corFundo, bigEmoji;
    
    if (rotina.criancaGenero === 'menino') {
        emojisPrincipais = '🏆⚽🎮🚀';
        mensagem = 'VOCÊ É UM CAMPEÃO!';
        corFundo = 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)';
        bigEmoji = '🏆';
    } else {
        emojisPrincipais = '👑🌸💖✨';
        mensagem = 'VOCÊ É UMA CAMPEÃ!';
        corFundo = 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)';
        bigEmoji = '👑';
    }
    
    modal.style.display = 'flex';
    const modalContent = modal.querySelector('.celebration-content');
    if (modalContent) modalContent.style.background = corFundo;
    
    const bigEmojiEl = modal.querySelector('.big-emoji');
    if (bigEmojiEl) bigEmojiEl.textContent = bigEmoji;
    
    const tituloModal = modal.querySelector('.modal-titulo');
    if (tituloModal) tituloModal.textContent = `${emojisPrincipais} ${mensagem} ${emojisPrincipais}`;
    
    const paragrafo = modal.querySelector('.celebration-content p:first-of-type');
    if (paragrafo) paragrafo.textContent = '🎊 Você completou TODAS as atividades de hoje! 💪';
    
    const paragrafo2 = modal.querySelector('.celebration-content p:nth-of-type(2)');
    if (paragrafo2) paragrafo2.textContent = '🎮 AGORA VOCÊ ESTÁ LIBERADO! 🎮';
    
    playVictorySound();
    createConfetti();
    
    // Auto-fechar após 6 segundos (mais tempo na comemoração final)
    setTimeout(() => {
        fecharCelebracao();
    }, 6000);
}

function fecharCelebracao() {
    const modal = document.getElementById('celebrationModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function createConfetti() {
    const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];
    for (let i = 0; i < 50; i++) {
        setTimeout(() => {
            const confetti = document.createElement('div');
            confetti.style.cssText = `position: fixed; width: 10px; height: 10px; background: ${colors[Math.floor(Math.random() * colors.length)]}; left: ${Math.random() * 100}%; top: -10px; z-index: 9999; border-radius: 50%; animation: confetti-fall 3s linear forwards;`;
            document.body.appendChild(confetti);
            setTimeout(() => confetti.remove(), 3000);
        }, i * 30);
    }
}

function playVictorySound() {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const notes = [523.25, 587.33, 659.25, 783.99];
        notes.forEach((freq, index) => {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            oscillator.frequency.value = freq;
            oscillator.type = 'sine';
            const startTime = audioContext.currentTime + (index * 0.2);
            gainNode.gain.setValueAtTime(0.3, startTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);
            oscillator.start(startTime);
            oscillator.stop(startTime + 0.3);
        });
    } catch (e) {}
}

function detectarMudancas() {
    const checkboxes = document.querySelectorAll('.atividade-checkbox');
    const estadoAtual = {};
    
    checkboxes.forEach((checkbox) => {
        const key = `${checkbox.dataset.atividade}-${checkbox.dataset.dia}`;
        estadoAtual[key] = checkbox.checked;
    });
    
    const estadoAtualString = JSON.stringify(estadoAtual);
    
    if (estadoInicial === null) {
        estadoInicial = estadoAtualString;
        mudancasNaoSalvas = false;
    } else if (estadoInicial !== estadoAtualString) {
        mudancasNaoSalvas = true;
    } else {
        mudancasNaoSalvas = false;
    }
}

function saveProgress() {
    try {
        const checkboxes = document.querySelectorAll('.checkbox-dia');
        const dados = { rotinaId: rotinaId, estados: {} };
        
        checkboxes.forEach((checkbox) => {
            const key = `${checkbox.dataset.atividade}-${checkbox.dataset.dia}`;
            dados.estados[key] = checkbox.checked;
        });
        
        localStorage.setItem(`rotina-progresso-${rotinaId}`, JSON.stringify(dados));
        localStorage.setItem(`rotina-salvo-${rotinaId}`, new Date().toLocaleString('pt-BR'));
        
        estadoInicial = JSON.stringify(dados.estados);
        mudancasNaoSalvas = false;
        
        // Feedback visual de salvamento
        const btnSalvar = document.querySelector('.save-button');
        if (btnSalvar) {
            const textoOriginal = btnSalvar.innerHTML;
            btnSalvar.innerHTML = '✅ SALVO!';
            btnSalvar.style.background = '#10b981';
            setTimeout(() => {
                btnSalvar.innerHTML = textoOriginal;
                btnSalvar.style.background = '';
            }, 2000);
        }
        
        // Salvar automaticamente no servidor também
        salvarNoServidor();
        
        console.log('✅ Progresso salvo!');
    } catch (error) {
        console.error('❌ Erro ao salvar:', error);
        alert('❌ Erro ao salvar progresso!');
    }
}

async function salvarNoServidor() {
    try {
        const identificadorSemana = getIdentificadorSemana(new Date());
        const checkboxes = document.querySelectorAll('.atividade-checkbox');
        const progresso = {};
        
        checkboxes.forEach((checkbox) => {
            const key = `${checkbox.dataset.atividade}-${checkbox.dataset.dia}`;
            progresso[key] = checkbox.checked;
        });
        
        await fetch('/api/historico/salvar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ rotinaId, progresso })
        });
    } catch (error) {
        console.error('Erro ao salvar no servidor:', error);
    }
}

function loadProgress() {
    try {
        const dadosString = localStorage.getItem(`rotina-progresso-${rotinaId}`);
        if (!dadosString) {
            estadoInicial = JSON.stringify({});
            return;
        }
        
        const dados = JSON.parse(dadosString);
        const checkboxes = document.querySelectorAll('.checkbox-dia');
        
        // Recalcular recompensas do zero
        if (rotina.usarRecompensas) {
            recompensasSemanal = 0;
            recompensasMensal = 0;
        }
        
        checkboxes.forEach((checkbox) => {
            const key = `${checkbox.dataset.atividade}-${checkbox.dataset.dia}`;
            if (dados.estados[key]) {
                checkbox.checked = true;
                
                // Adicionar recompensa de cada atividade marcada
                if (rotina.usarRecompensas) {
                    const valor = parseFloat(checkbox.dataset.valor) || 0;
                    if (valor > 0) {
                        recompensasSemanal += valor;
                        recompensasMensal += valor;
                    }
                }
            }
        });
        
        // Salvar e atualizar display de recompensas
        if (rotina.usarRecompensas) {
            salvarRecompensas();
            atualizarDisplayRecompensas();
        }
        
        estadoInicial = JSON.stringify(dados.estados);
        mudancasNaoSalvas = false;
        checkCompletion();
        
        console.log('✅ Progresso carregado!');
        if (rotina.usarRecompensas) {
            console.log('💰 Recompensas recalculadas - Semanal:', recompensasSemanal, 'Mensal:', recompensasMensal);
        }
    } catch (error) {
        console.error('❌ Erro ao carregar:', error);
        estadoInicial = JSON.stringify({});
    }
}

function verificarCelebracao() {
    const hoje = new Date().toDateString();
    const celebradoKey = `celebrado-${rotinaId}-${hoje}`;
    celebrouHoje = !!localStorage.getItem(celebradoKey);
}

const style = document.createElement('style');
style.textContent = `
    @keyframes confetti-fall { 
        to { transform: translateY(100vh) rotate(360deg); opacity: 0; } 
    }
    .acoes-rotina {
        display: flex;
        gap: 15px;
        margin-bottom: 20px;
        justify-content: center;
        flex-wrap: wrap;
    }
    .btn-historico, .btn-editar-passado {
        padding: 12px 24px;
        font-size: 16px;
        font-weight: bold;
        border: none;
        border-radius: 10px;
        cursor: pointer;
        box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        transition: all 0.3s;
    }
    .btn-historico {
        background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
        color: white;
    }
    .btn-editar-passado {
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        color: white;
    }
    .btn-historico:hover, .btn-editar-passado:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 12px rgba(0,0,0,0.3);
    }
    td.passado {
        background-color: #fef3c7 !important;
    }
    td.futuro {
        background-color: #e5e7eb !important;
    }
`;
document.head.appendChild(style);

// ========== SISTEMA DE RECOMPENSAS ==========

async function carregarRecompensas() {
    try {
        // Carregar recompensas do localStorage para esta semana e mês
        const semanaAtual = getIdentificadorSemana();
        const mesAtual = new Date().getMonth() + 1;
        const anoAtual = new Date().getFullYear();
        const chaveRecompensaSemanal = `recompensa_${rotinaId}_${semanaAtual}`;
        const chaveRecompensaMensal = `recompensa_mensal_${rotinaId}_${anoAtual}_${mesAtual}`;
        
        recompensasSemanal = parseFloat(localStorage.getItem(chaveRecompensaSemanal)) || 0;
        recompensasMensal = parseFloat(localStorage.getItem(chaveRecompensaMensal)) || 0;
        
        atualizarDisplayRecompensas();
    } catch (error) {
        console.error('Erro ao carregar recompensas:', error);
    }
}

function adicionarRecompensa(valor) {
    recompensasSemanal += valor;
    recompensasMensal += valor;
    salvarRecompensas();
    atualizarDisplayRecompensas();
    animarPorquinho();
    animarMoedas();
}

function removerRecompensa(valor) {
    recompensasSemanal = Math.max(0, recompensasSemanal - valor);
    recompensasMensal = Math.max(0, recompensasMensal - valor);
    salvarRecompensas();
    atualizarDisplayRecompensas();
}

function salvarRecompensas() {
    const semanaAtual = getIdentificadorSemana();
    const mesAtual = new Date().getMonth() + 1;
    const anoAtual = new Date().getFullYear();
    const chaveRecompensaSemanal = `recompensa_${rotinaId}_${semanaAtual}`;
    const chaveRecompensaMensal = `recompensa_mensal_${rotinaId}_${anoAtual}_${mesAtual}`;
    
    localStorage.setItem(chaveRecompensaSemanal, recompensasSemanal.toString());
    localStorage.setItem(chaveRecompensaMensal, recompensasMensal.toString());
}

function atualizarDisplayRecompensas() {
    const valorSemanalEl = document.getElementById('valorSemanal');
    const valorMensalEl = document.getElementById('valorMensal');
    
    if (valorSemanalEl) {
        valorSemanalEl.textContent = `R$ ${recompensasSemanal.toFixed(2)}`;
    }
    if (valorMensalEl) {
        valorMensalEl.textContent = `R$ ${recompensasMensal.toFixed(2)}`;
    }
}

function animarPorquinho() {
    const pigEmoji = document.getElementById('pigEmoji');
    if (!pigEmoji) return;
    
    pigEmoji.classList.add('feliz');
    
    setTimeout(() => {
        pigEmoji.classList.remove('feliz');
    }, 1000);
}

function animarMoedas() {
    const moedasContainer = document.getElementById('moedasEfeito');
    if (!moedasContainer) return;
    
    for (let i = 0; i < 5; i++) {
        setTimeout(() => {
            const moeda = document.createElement('div');
            moeda.className = 'moeda-voando';
            moeda.textContent = '💰';
            moeda.style.left = `${40 + Math.random() * 20}%`;
            moedasContainer.appendChild(moeda);
            
            setTimeout(() => {
                moeda.remove();
            }, 1000);
        }, i * 100);
    }
}

// Verificar se deve zerar recompensas da semana
async function verificarResetSemanal() {
    const hoje = new Date();
    const ultimoDiaDaSemana = Math.max(...rotina.diasSemana);
    
    // Se hoje é o dia seguinte ao último dia de atividades
    if (hoje.getDay() === (ultimoDiaDaSemana + 1) % 7) {
        const semanaAtual = getIdentificadorSemana();
        const ultimoResetKey = `ultimo_reset_${rotinaId}`;
        const ultimoReset = localStorage.getItem(ultimoResetKey);
        
        // Se ainda não resetou nesta semana
        if (ultimoReset !== semanaAtual) {
            // Salvar histórico da semana
            const historicoKey = `historico_recompensa_${rotinaId}_${semanaAtual}`;
            localStorage.setItem(historicoKey, recompensasSemanal.toString());
            
            // Zerar recompensa semanal
            recompensasSemanal = 0;
            salvarRecompensas();
            localStorage.setItem(ultimoResetKey, semanaAtual);
            
            console.log('✅ Recompensas da semana zeradas e salvas no histórico!');
        }
    }
}
