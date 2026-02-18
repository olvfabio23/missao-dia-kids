let atividadesPreDefinidas = [];
let atividadeAtual = null;
let indiceAtividadeAtual = -1;
let mudancasNaoSalvas = false;
let contadorSecoes = 0;
let usandoRecompensas = false;

function voltarMenu() {
    if (mudancasNaoSalvas) {
        const confirmar = confirm('⚠️ Você tem mudanças não salvas no formulário!\n\nDeseja descartar as mudanças?');
        if (confirmar) {
            window.location.href = 'menu-principal.html';
        }
    } else {
        window.location.href = 'menu-principal.html';
    }
}

// Verificar autenticação ao carregar
window.addEventListener('DOMContentLoaded', async () => {
    await verificarAutenticacao();
    await carregarAtividadesPreDefinidas();
    await carregarRotinas();
});

async function verificarAutenticacao() {
    try {
        const response = await fetch('/api/auth/verificar');
        const data = await response.json();
        
        if (!data.autenticado) {
            window.location.href = 'login.html';
            return;
        }
        
        // Verificar se tem PIN cadastrado
        if (!data.temPin) {
            window.location.href = 'cadastro-pin.html';
            return;
        }
        
        document.getElementById('nomeUsuario').textContent = `Olá, ${data.usuario.nome}! 👋`;
    } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
        window.location.href = 'login.html';
    }
}

async function logout() {
    try {
        await fetch('/api/auth/logout', { method: 'POST' });
        window.location.href = 'login.html';
    } catch (error) {
        console.error('Erro ao fazer logout:', error);
    }
}

async function carregarAtividadesPreDefinidas() {
    try {
        const response = await fetch('/api/rotinas/atividades-pre-definidas');
        const data = await response.json();
        
        if (data.sucesso) {
            atividadesPreDefinidas = data.atividades || [];
        } else {
            atividadesPreDefinidas = [];
        }
    } catch (error) {
        console.error('Erro ao carregar atividades:', error);
        atividadesPreDefinidas = [];
    }
}

async function carregarRotinas() {
    const listaRotinas = document.getElementById('listaRotinas');
    listaRotinas.innerHTML = '<div class="loading"><div class="spinner"></div><p>Carregando rotinas...</p></div>';
    
    try {
        const response = await fetch('/api/rotinas');
        const data = await response.json();
        
        if (data.sucesso) {
            if (data.rotinas.length === 0) {
                listaRotinas.innerHTML = '<p style="text-align: center; color: #666; padding: 40px;">Nenhuma rotina cadastrada ainda. Clique em "Nova Rotina" para começar!</p>';
            } else {
                listaRotinas.innerHTML = '';
                data.rotinas.forEach(rotina => {
                    const card = criarCardRotina(rotina);
                    listaRotinas.appendChild(card);
                });
            }
        }
    } catch (error) {
        console.error('Erro ao carregar rotinas:', error);
        listaRotinas.innerHTML = '<p style="color: red; text-align: center;">Erro ao carregar rotinas</p>';
    }
}

function criarCardRotina(rotina) {
    const card = document.createElement('div');
    card.className = 'rotina-card';
    
    const diasNomes = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const diasTexto = rotina.diasSemana.map(d => diasNomes[d]).join(', ');
    const nomeCompleto = rotina.criancaSobrenome ? `${rotina.criancaNome} ${rotina.criancaSobrenome}` : rotina.criancaNome;
    const generoEmoji = rotina.criancaGenero === 'menino' ? '👦' : '👧';
    const anoTexto = rotina.criancaAnoNascimento || 'N/A';
    
    card.innerHTML = `
        <h3>${generoEmoji} ${nomeCompleto}</h3>
        <p><strong>🎂 Ano:</strong> ${anoTexto}</p>
        <p><strong>📅 Dias:</strong> ${diasTexto}</p>
        <p><strong>✅ Atividades:</strong> ${rotina.atividades.length}</p>
        <div class="rotina-actions">
            <button onclick="visualizarRotina('${rotina.id}')" class="btn btn-primary">👁️ Ver</button>
            <button onclick="editarRotina('${rotina.id}')" class="btn btn-secondary">✏️ Editar</button>
            <button onclick="deletarRotina('${rotina.id}')" class="btn btn-danger">🗑️ Excluir</button>
        </div>
    `;
    
    return card;
}

function mostrarFormulario() {
    document.getElementById('formularioRotina').style.display = 'block';
    document.getElementById('tituloFormulario').textContent = '➕ Nova Rotina';
    document.getElementById('rotinaForm').reset();
    document.getElementById('rotinaId').value = '';
    document.getElementById('secoesContainer').innerHTML = '';
    document.getElementById('usarRecompensas').checked = false;
    document.getElementById('faixaEtaria').value = '';
    usandoRecompensas = false;
    contadorSecoes = 0;
    
    // Ocultar painel de replicação ao criar nova rotina
    const painelReplicar = document.getElementById('painelReplicarValor');
    if (painelReplicar) {
        painelReplicar.style.display = 'none';
    }
    
    // Adicionar uma seção inicial
    adicionarSecao();
    
    mudancasNaoSalvas = false;
    window.scrollTo({ top: document.getElementById('formularioRotina').offsetTop, behavior: 'smooth' });
}

// Função para carregar atividades por faixa etária
function carregarAtividadesPorIdade() {
    const faixaEtaria = document.getElementById('faixaEtaria').value;
    
    if (!faixaEtaria) {
        return;
    }
    
    const confirmar = confirm('⚠️ Carregar atividades sugeridas para esta faixa etária?\n\nIsso irá substituir as seções e atividades atuais.');
    
    if (!confirmar) {
        document.getElementById('faixaEtaria').value = '';
        return;
    }
    
    const dadosIdade = obterAtividadesPorIdade(faixaEtaria);
    
    if (!dadosIdade) {
        mostrarMensagem('Erro ao carregar atividades', 'error');
        return;
    }
    
    // Limpar seções existentes
    document.getElementById('secoesContainer').innerHTML = '';
    contadorSecoes = 0;
    
    // Carregar seções e atividades da faixa etária
    dadosIdade.secoes.forEach(secaoData => {
        const container = document.getElementById('secoesContainer');
        const secaoDiv = document.createElement('div');
        secaoDiv.className = 'secao-bloco';
        secaoDiv.dataset.secaoId = contadorSecoes;
        
        secaoDiv.innerHTML = `
            <div class="secao-header">
                <input type="text" class="secao-titulo" placeholder="Nome da seção" data-secao="${contadorSecoes}" value="${secaoData.titulo}">
                <button type="button" onclick="removerSecao(this)" class="btn-remover-secao">🗑️ Remover Seção</button>
            </div>
            <div class="secao-texto">
                <textarea class="secao-orientacao" rows="2" placeholder="Texto orientador (opcional)" data-secao="${contadorSecoes}"></textarea>
            </div>
            <div class="secao-atividades" data-secao="${contadorSecoes}">
                <!-- Atividades desta seção -->
            </div>
            <button type="button" onclick="adicionarAtividadeNaSecao(${contadorSecoes})" class="btn btn-secondary btn-add-atividade">➕ Adicionar Atividade</button>
        `;
        
        container.appendChild(secaoDiv);
        
        // Adicionar as atividades na seção
        const secaoContainer = secaoDiv.querySelector('.secao-atividades');
        secaoData.atividades.forEach(atividade => {
            const item = document.createElement('div');
            item.className = 'atividade-item';
            item.dataset.secao = contadorSecoes;
            
            let valorInput = '';
            if (usandoRecompensas) {
                valorInput = `
                    <div class="valor-input-group">
                        <span style="color: #f59e0b; font-weight: bold;">R$</span>
                        <input type="number" 
                               class="valor-atividade" 
                               placeholder="0.00" 
                               step="0.01" 
                               min="0" 
                               style="width: 80px; margin: 0 5px;">
                    </div>
                `;
            }
            
            item.innerHTML = `
                <span>${atividade.emoji}</span>
                <input type="text" value="${atividade.nome}" data-emoji="${atividade.emoji}" readonly style="flex: 1;">
                ${valorInput}
                <button type="button" onclick="removerAtividade(this)">❌</button>
            `;
            
            secaoContainer.appendChild(item);
        });
        
        contadorSecoes++;
    });
    
    mudancasNaoSalvas = true;
    mostrarMensagem(`✅ ${dadosIdade.nome} - ${dadosIdade.secoes.length} seções carregadas!`, 'success');
}

// Função principal de replicar valor para todas as atividades (via botão)
function replicarValorTodasAtividades() {
    const inputValor = document.getElementById('valorReplicar');
    const valor = parseFloat(inputValor.value);
    
    if (!valor || valor <= 0) {
        alert('⚠️ Por favor, digite um valor maior que zero!');
        inputValor.focus();
        return;
    }
    
    const todosInputsValor = document.querySelectorAll('.valor-atividade');
    
    if (todosInputsValor.length === 0) {
        alert('⚠️ Não há atividades para preencher!\n\nAdicione atividades primeiro.');
        return;
    }
    
    const confirmar = confirm(`💰 Confirma replicar o valor R$ ${valor.toFixed(2)} para TODAS as ${todosInputsValor.length} atividades?\n\n✅ Isso preencherá todos os campos de valor.`);
    
    if (confirmar) {
        todosInputsValor.forEach(inp => {
            inp.value = valor.toFixed(2);
        });
        mudancasNaoSalvas = true;
        inputValor.value = '';
        mostrarMensagem(`✅ Valor R$ ${valor.toFixed(2)} replicado para ${todosInputsValor.length} atividades!`, 'success');
    }
}

// Função para desmarcar todos os valores
function desmarcarTodosValores() {
    const todosInputsValor = document.querySelectorAll('.valor-atividade');
    
    if (todosInputsValor.length === 0) {
        alert('⚠️ Não há atividades com valores para desmarcar!');
        return;
    }
    
    // Contar quantos campos tem valores preenchidos
    const camposPreenchidos = Array.from(todosInputsValor).filter(inp => inp.value && parseFloat(inp.value) > 0);
    
    if (camposPreenchidos.length === 0) {
        alert('ℹ️ Todos os campos de valores já estão vazios!');
        return;
    }
    
    const confirmar = confirm(`❌ Confirma LIMPAR todos os valores?\n\n📊 Campos preenchidos: ${camposPreenchidos.length}\n\n⚠️ Esta ação irá limpar todos os valores de R$ das atividades!`);
    
    if (confirmar) {
        todosInputsValor.forEach(inp => {
            inp.value = '';
        });
        mudancasNaoSalvas = true;
        mostrarMensagem(`✅ Todos os valores foram limpos com sucesso!`, 'success');
    }
}

// Função para perguntar se deseja replicar valor para todas as atividades (via input individual)
function perguntarReplicarValor(input) {
    const valor = parseFloat(input.value);
    
    if (!valor || valor <= 0) {
        return;
    }
    
    const todosInputsValor = document.querySelectorAll('.valor-atividade');
    const vazios = Array.from(todosInputsValor).filter(inp => !inp.value || parseFloat(inp.value) === 0);
    
    if (vazios.length > 0) {
        const confirmar = confirm(`💰 Deseja replicar o valor R$ ${valor.toFixed(2)} para todas as outras atividades?

✅ Isso preencherá ${vazios.length} atividade(s) que estão sem valor.`);
        
        if (confirmar) {
            vazios.forEach(inp => {
                inp.value = valor.toFixed(2);
            });
            mudancasNaoSalvas = true;
            mostrarMensagem(`✅ Valor R$ ${valor.toFixed(2)} replicado para ${vazios.length} atividade(s)!`, 'success');
        }
    }
}

function toggleRecompensas(ativado) {
    usandoRecompensas = ativado;
    mudancasNaoSalvas = true;
    
    // Mostrar ou ocultar painel de replicação
    const painelReplicar = document.getElementById('painelReplicarValor');
    if (painelReplicar) {
        painelReplicar.style.display = ativado ? 'block' : 'none';
    }
    
    if (ativado) {
        // Adicionar inputs de valor nas atividades existentes
        document.querySelectorAll('.atividade-item').forEach(item => {
            if (!item.querySelector('.valor-atividade')) {
                const valorDiv = document.createElement('div');
                valorDiv.className = 'valor-input-group';
                valorDiv.innerHTML = `
                    <span style="color: #f59e0b; font-weight: bold;">R$</span>
                    <input type="number" 
                           class="valor-atividade" 
                           placeholder="0.00" 
                           step="0.01" 
                           min="0" 
                           onchange="perguntarReplicarValor(this)"
                           style="width: 80px; margin: 0 5px;">
                `;
                const botaoRemover = item.querySelector('button');
                item.insertBefore(valorDiv, botaoRemover);
            }
        });
    } else {
        // Remover inputs de valor
        document.querySelectorAll('.valor-input-group').forEach(group => {
            group.remove();
        });
    }
}

function cancelarFormulario() {
    if (mudancasNaoSalvas) {
        const confirmar = confirm('⚠️ Você tem mudanças não salvas!\n\nDeseja descartar as mudanças?');
        if (!confirmar) {
            return;
        }
    }
    document.getElementById('formularioRotina').style.display = 'none';
    document.getElementById('rotinaForm').reset();
    document.getElementById('secoesContainer').innerHTML = '';
    document.getElementById('usarRecompensas').checked = false;
    usandoRecompensas = false;
    contadorSecoes = 0;
    mudancasNaoSalvas = false;
}

function adicionarAtividade() {
    indiceAtividadeAtual = -1;
    mostrarModalAtividades();
}

let atividadesSelecionadas = [];

function mostrarModalAtividades() {
    const modal = document.getElementById('modalAtividades');
    const grid = document.getElementById('atividadesPreDefinidas');
    
    atividadesSelecionadas = [];
    grid.innerHTML = '';
    
    // Adicionar atividades gerais
    if (atividadesPreDefinidas && atividadesPreDefinidas.length > 0) {
        const tituloGeral = document.createElement('h3');
        tituloGeral.style.cssText = 'color: #667eea; margin: 15px 0 10px 0; font-size: 20px; grid-column: 1 / -1;';
        tituloGeral.textContent = '📋 Atividades Gerais';
        grid.appendChild(tituloGeral);
        
        atividadesPreDefinidas.forEach(atividade => {
            const opcao = document.createElement('div');
            opcao.className = 'atividade-opcao';
            opcao.textContent = `${atividade.emoji} ${atividade.nome}`;
            opcao.dataset.id = atividade.id;
            opcao.onclick = () => toggleSelecaoAtividade(opcao, atividade);
            grid.appendChild(opcao);
        });
    }
    
    // Adicionar atividades por faixa etária
    const faixas = obterFaixasEtarias();
    faixas.forEach(faixa => {
        const dadosFaixa = obterAtividadesPorIdade(faixa.valor);
        if (!dadosFaixa) return;
        
        const tituloFaixa = document.createElement('h3');
        tituloFaixa.style.cssText = 'color: #f59e0b; margin: 25px 0 10px 0; font-size: 20px; grid-column: 1 / -1;';
        tituloFaixa.textContent = `${faixa.emoji} ${faixa.nome}`;
        grid.appendChild(tituloFaixa);
        
        dadosFaixa.secoes.forEach(secao => {
            const tituloSecao = document.createElement('h4');
            tituloSecao.style.cssText = 'color: #64748b; margin: 15px 0 5px 10px; font-size: 16px; grid-column: 1 / -1; font-weight: 600;';
            tituloSecao.textContent = `${secao.emoji} ${secao.titulo}`;
            grid.appendChild(tituloSecao);
            
            secao.atividades.forEach((atividade, idx) => {
                const opcao = document.createElement('div');
                opcao.className = 'atividade-opcao';
                opcao.textContent = `${atividade.emoji} ${atividade.nome}`;
                opcao.dataset.id = `${faixa.valor}-${secao.titulo}-${idx}`;
                const atividadeObj = { id: opcao.dataset.id, emoji: atividade.emoji, nome: atividade.nome };
                opcao.onclick = () => toggleSelecaoAtividade(opcao, atividadeObj);
                grid.appendChild(opcao);
            });
        });
    });
    
    modal.style.display = 'block';
}

function toggleSelecaoAtividade(elemento, atividade) {
    const index = atividadesSelecionadas.findIndex(a => a.id === atividade.id);
    
    if (index > -1) {
        // Já está selecionada, remover
        atividadesSelecionadas.splice(index, 1);
        elemento.classList.remove('selecionada');
    } else {
        // Adicionar à seleção
        atividadesSelecionadas.push(atividade);
        elemento.classList.add('selecionada');
    }
}

function fecharModal() {
    document.getElementById('modalAtividades').style.display = 'none';
    document.getElementById('atividadeCustom').value = '';
    atividadesSelecionadas = [];
}

function adicionarAtividadesSelecionadas() {
    if (atividadesSelecionadas.length === 0) {
        alert('⚠️ Selecione pelo menos uma atividade!');
        return;
    }
    
    atividadesSelecionadas.forEach(atividade => {
        adicionarAtividadeNaLista(atividade.emoji, atividade.nome);
    });
    
    fecharModal();
}

function selecionarAtividade(atividade) {
    adicionarAtividadeNaLista(atividade.emoji, atividade.nome);
    fecharModal();
}

function adicionarAtividadeCustom() {
    const input = document.getElementById('atividadeCustom');
    const nome = input.value.trim();
    
    if (!nome) {
        alert('Digite o nome da atividade!');
        return;
    }
    
    adicionarAtividadeNaLista('📌', nome);
    fecharModal();
}

function removerAtividade(button) {
    button.parentElement.remove();
    mudancasNaoSalvas = true;
}

function adicionarSecao() {
    const container = document.getElementById('secoesContainer');
    const secaoDiv = document.createElement('div');
    secaoDiv.className = 'secao-bloco';
    secaoDiv.dataset.secaoId = contadorSecoes;
    
    secaoDiv.innerHTML = `
        <div class="secao-header">
            <input type="text" class="secao-titulo" placeholder="Nome da seção (ex: Manhã, Tarde...)" data-secao="${contadorSecoes}">
            <button type="button" onclick="removerSecao(this)" class="btn-remover-secao">🗑️ Remover Seção</button>
        </div>
        <div class="secao-texto">
            <textarea class="secao-orientacao" rows="2" placeholder="Texto orientador (opcional - ex: 'Atividades para fazer pela manhã')" data-secao="${contadorSecoes}"></textarea>
        </div>
        <div class="secao-atividades" data-secao="${contadorSecoes}">
            <!-- Atividades desta seção -->
        </div>
        <button type="button" onclick="adicionarAtividadeNaSecao(${contadorSecoes})" class="btn btn-secondary btn-add-atividade">➕ Adicionar Atividade</button>
    `;
    
    container.appendChild(secaoDiv);
    contadorSecoes++;
    mudancasNaoSalvas = true;
}

function removerSecao(button) {
    if (confirm('⚠️ Tem certeza que deseja remover esta seção e todas suas atividades?')) {
        button.closest('.secao-bloco').remove();
        mudancasNaoSalvas = true;
    }
}

function adicionarAtividadeNaSecao(secaoId) {
    indiceAtividadeAtual = secaoId;
    mostrarModalAtividades();
}

function adicionarAtividadeNaLista(emoji, nome) {
    // Se temos um ID de seção, adicionar na seção específica
    if (indiceAtividadeAtual !== -1 && indiceAtividadeAtual !== null) {
        const secaoContainer = document.querySelector(`.secao-atividades[data-secao="${indiceAtividadeAtual}"]`);
        if (secaoContainer) {
            // Verificar se a atividade já existe nesta seção
            const atividadesExistentes = secaoContainer.querySelectorAll('.atividade-item input[type="text"]');
            const atividadeDuplicada = Array.from(atividadesExistentes).some(input => {
                return input.value.toLowerCase().trim() === nome.toLowerCase().trim();
            });
            
            if (atividadeDuplicada) {
                alert('⚠️ Esta atividade já existe nesta seção!\n\nVocê pode adicionar a mesma atividade em seções diferentes, mas não pode repetir na mesma seção.');
                return;
            }
            
            const item = document.createElement('div');
            item.className = 'atividade-item';
            item.dataset.secao = indiceAtividadeAtual;
            
            let valorInput = '';
            if (usandoRecompensas) {
                valorInput = `
                    <div class="valor-input-group">
                        <span style="color: #f59e0b; font-weight: bold;">R$</span>
                        <input type="number" 
                               class="valor-atividade" 
                               placeholder="0.00" 
                               step="0.01" 
                               min="0" 
                               onchange="perguntarReplicarValor(this)"
                               style="width: 80px; margin: 0 5px;">
                    </div>
                `;
            }
            
            item.innerHTML = `
                <span>${emoji}</span>
                <input type="text" value="${nome}" data-emoji="${emoji}" readonly style="flex: 1;">
                ${valorInput}
                <button type="button" onclick="removerAtividade(this)">❌</button>
            `;
            
            secaoContainer.appendChild(item);
            mudancasNaoSalvas = true;
            return;
        }
    }
    
    // Fallback: adicionar no container antigo (se existir)
    const container = document.getElementById('atividadesContainer');
    if (container) {
        const item = document.createElement('div');
        item.className = 'atividade-item';
        
        let valorInput = '';
        if (usandoRecompensas) {
            valorInput = `
                <div class="valor-input-group">
                    <span style="color: #f59e0b; font-weight: bold;">R$</span>
                    <input type="number" 
                           class="valor-atividade" 
                           placeholder="0.00" 
                           step="0.01" 
                           min="0" 
                           style="width: 80px; margin: 0 5px;">
                </div>
            `;
        }
        
        item.innerHTML = `
            <span>${emoji}</span>
            <input type="text" value="${nome}" data-emoji="${emoji}" readonly style="flex: 1;">
            ${valorInput}
            <button type="button" onclick="removerAtividade(this)">❌</button>
        `;
        
        container.appendChild(item);
        mudancasNaoSalvas = true;
    }
}

document.getElementById('rotinaForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const rotinaId = document.getElementById('rotinaId').value;
    const criancaNome = document.getElementById('criancaNome').value;
    const criancaSobrenome = document.getElementById('criancaSobrenome').value;
    const criancaAnoNascimento = document.getElementById('criancaAnoNascimento').value;
    const criancaGenero = document.querySelector('input[name="genero"]:checked').value;
    const observacoes = document.getElementById('observacoes').value;
    
    // Coletar dias da semana
    const diasSemana = Array.from(document.querySelectorAll('input[name="dias"]:checked'))
        .map(cb => parseInt(cb.value));
    
    if (diasSemana.length === 0) {
        mostrarMensagem('Selecione pelo menos um dia da semana!', 'error');
        return;
    }
    
    // Coletar seções e atividades
    const secoes = [];
    const secoesDiv = document.querySelectorAll('.secao-bloco');
    
    console.log('📦 Coletando seções:', secoesDiv.length);
    
    if (secoesDiv.length > 0) {
        // Novo formato com seções
        secoesDiv.forEach((secaoDiv, idx) => {
            const secaoId = secaoDiv.dataset.secaoId;
            const tituloInput = secaoDiv.querySelector('.secao-titulo');
            const orientacaoTextarea = secaoDiv.querySelector('.secao-orientacao');
            const atividadesDiv = secaoDiv.querySelector('.secao-atividades');
            
            const atividadesDaSecao = [];
            const atividadesItems = atividadesDiv.querySelectorAll('.atividade-item');
            console.log(`  Seção ${idx}: ${atividadesItems.length} atividades`);
            
            atividadesItems.forEach(item => {
                const input = item.querySelector('input[type="text"]');
                if (!input) return;
                
                const atividadeData = {
                    emoji: input.dataset.emoji,
                    nome: input.value
                };
                
                // Se tem recompensas ativas, coletar o valor
                if (usandoRecompensas) {
                    const valorInput = item.querySelector('.valor-atividade');
                    atividadeData.valor = valorInput ? parseFloat(valorInput.value) || 0 : 0;
                }
                
                atividadesDaSecao.push(atividadeData);
            });
            
            if (atividadesDaSecao.length > 0 || orientacaoTextarea.value.trim()) {
                secoes.push({
                    titulo: tituloInput.value.trim() || `Seção ${secoes.length + 1}`,
                    orientacao: orientacaoTextarea.value.trim(),
                    atividades: atividadesDaSecao
                });
            }
        });
        
        console.log('✅ Seções coletadas:', secoes);
        
        if (secoes.length === 0) {
            mostrarMensagem('Adicione pelo menos uma seção com atividades ou texto orientador!', 'error');
            return;
        }
    } else {
        // Fallback: formato antigo (para compatibilidade)
        const atividadesInputs = document.querySelectorAll('#atividadesContainer input');
        const atividades = Array.from(atividadesInputs).map(input => ({
            emoji: input.dataset.emoji,
            nome: input.value
        }));
        
        if (atividades.length === 0) {
            mostrarMensagem('Adicione pelo menos uma atividade!', 'error');
            return;
        }
        
        // Converter para formato de seção única
        secoes.push({
            titulo: 'Atividades',
            orientacao: '',
            atividades: atividades
        });
    }
    
    // Extrair todas as atividades de todas as seções para compatibilidade
    const todasAtividades = [];
    secoes.forEach(secao => {
        if (secao.atividades) {
            todasAtividades.push(...secao.atividades);
        }
    });
    
    const dados = {
        criancaNome,
        criancaSobrenome: criancaSobrenome || '',
        criancaAnoNascimento: criancaAnoNascimento ? parseInt(criancaAnoNascimento) : null,
        criancaGenero,
        atividades: todasAtividades, // Para compatibilidade com visualização
        secoes,
        diasSemana,
        horarios: {},
        observacoes,
        usarRecompensas: usandoRecompensas
    };
    
    console.log('💾 Enviando dados:', dados);
    
    try {
        let response;
        if (rotinaId) {
            // Atualizar rotina existente
            response = await fetch(`/api/rotinas/${rotinaId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dados)
            });
        } else {
            // Criar nova rotina
            response = await fetch('/api/rotinas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dados)
            });
        }
        
        const data = await response.json();
        
        if (data.sucesso) {
            mostrarMensagem('✅ Rotina salva com sucesso!', 'success');
            mudancasNaoSalvas = false;
            cancelarFormulario();
            await carregarRotinas();
        } else {
            mostrarMensagem('❌ ' + data.erro, 'error');
        }
    } catch (error) {
        console.error('Erro ao salvar rotina:', error);
        mostrarMensagem('❌ Erro ao salvar rotina', 'error');
    }
});

async function editarRotina(id) {
    try {
        const response = await fetch(`/api/rotinas/${id}`);
        const data = await response.json();
        
        if (data.sucesso) {
            const rotina = data.rotina;
            
            document.getElementById('rotinaId').value = rotina.id;
            document.getElementById('criancaNome').value = rotina.criancaNome;
            document.getElementById('criancaSobrenome').value = rotina.criancaSobrenome || '';
            document.getElementById('criancaAnoNascimento').value = rotina.criancaAnoNascimento || '';
            document.querySelector(`input[name="genero"][value="${rotina.criancaGenero}"]`).checked = true;
            document.getElementById('observacoes').value = rotina.observacoes || '';
            
            // Configurar recompensas
            const checkboxRecompensas = document.getElementById('usarRecompensas');
            if (checkboxRecompensas) {
                checkboxRecompensas.checked = rotina.usarRecompensas || false;
                usandoRecompensas = rotina.usarRecompensas || false;
                
                // Mostrar painel de replicação se recompensas estiverem ativas
                const painelReplicar = document.getElementById('painelReplicarValor');
                if (painelReplicar) {
                    painelReplicar.style.display = usandoRecompensas ? 'block' : 'none';
                }
            }
            
            // Marcar dias da semana
            document.querySelectorAll('input[name="dias"]').forEach(cb => {
                cb.checked = rotina.diasSemana.includes(parseInt(cb.value));
            });
            
            // Limpar e carregar seções
            const secoesContainer = document.getElementById('secoesContainer');
            secoesContainer.innerHTML = '';
            contadorSecoes = 0;
            
            // Verificar se tem seções ou atividades no formato antigo
            if (rotina.secoes && rotina.secoes.length > 0) {
                // Novo formato com seções
                rotina.secoes.forEach(secao => {
                    const secaoId = contadorSecoes;
                    const secaoDiv = document.createElement('div');
                    secaoDiv.className = 'secao-bloco';
                    secaoDiv.dataset.secaoId = secaoId;
                    
                    secaoDiv.innerHTML = `
                        <div class="secao-header">
                            <input type="text" class="secao-titulo" placeholder="Nome da seção" data-secao="${secaoId}" value="${secao.titulo || ''}">
                            <button type="button" onclick="removerSecao(this)" class="btn-remover-secao">🗑️ Remover Seção</button>
                        </div>
                        <div class="secao-texto">
                            <textarea class="secao-orientacao" rows="2" placeholder="Texto orientador" data-secao="${secaoId}">${secao.orientacao || ''}</textarea>
                        </div>
                        <div class="secao-atividades" data-secao="${secaoId}">
                            <!-- Atividades serão adicionadas aqui -->
                        </div>
                        <button type="button" onclick="adicionarAtividadeNaSecao(${secaoId})" class="btn btn-secondary btn-add-atividade">➕ Adicionar Atividade</button>
                    `;
                    
                    secoesContainer.appendChild(secaoDiv);
                    
                    // Adicionar atividades da seção
                    if (secao.atividades && secao.atividades.length > 0) {
                        const atividadesDiv = secaoDiv.querySelector('.secao-atividades');
                        secao.atividades.forEach(ativ => {
                            const item = document.createElement('div');
                            item.className = 'atividade-item';
                            item.dataset.secao = secaoId;
                            
                            let valorInput = '';
                            if (usandoRecompensas && ativ.valor !== undefined) {
                                valorInput = `
                                    <div class="valor-input-group">
                                        <span style="color: #f59e0b; font-weight: bold;">R$</span>
                                        <input type="number" 
                                               class="valor-atividade" 
                                               value="${ativ.valor}" 
                                               placeholder="0.00" 
                                               step="0.01" 
                                               min="0" 
                                               style="width: 80px; margin: 0 5px;">
                                    </div>
                                `;
                            }
                            
                            item.innerHTML = `
                                <span>${ativ.emoji}</span>
                                <input type="text" value="${ativ.nome}" data-emoji="${ativ.emoji}" readonly style="flex: 1;">
                                ${valorInput}
                                <button type="button" onclick="removerAtividade(this)">❌</button>
                            `;
                            
                            atividadesDiv.appendChild(item);
                        });
                    }
                    
                    contadorSecoes++;
                });
            } else if (rotina.atividades && rotina.atividades.length > 0) {
                // Formato antigo: converter para seção única
                const secaoDiv = document.createElement('div');
                secaoDiv.className = 'secao-bloco';
                secaoDiv.dataset.secaoId = 0;
                
                secaoDiv.innerHTML = `
                    <div class="secao-header">
                        <input type="text" class="secao-titulo" placeholder="Nome da seção" data-secao="0" value="Atividades">
                        <button type="button" onclick="removerSecao(this)" class="btn-remover-secao">🗑️ Remover Seção</button>
                    </div>
                    <div class="secao-texto">
                        <textarea class="secao-orientacao" rows="2" placeholder="Texto orientador" data-secao="0"></textarea>
                    </div>
                    <div class="secao-atividades" data-secao="0">
                        <!-- Atividades serão adicionadas aqui -->
                    </div>
                    <button type="button" onclick="adicionarAtividadeNaSecao(0)" class="btn btn-secondary btn-add-atividade">➕ Adicionar Atividade</button>
                `;
                
                secoesContainer.appendChild(secaoDiv);
                
                // Adicionar atividades
                const atividadesDiv = secaoDiv.querySelector('.secao-atividades');
                rotina.atividades.forEach(ativ => {
                    const item = document.createElement('div');
                    item.className = 'atividade-item';
                    item.dataset.secao = 0;
                    
                    let valorInput = '';
                    if (usandoRecompensas && ativ.valor !== undefined) {
                        valorInput = `
                            <div class="valor-input-group">
                                <span style="color: #f59e0b; font-weight: bold;">R$</span>
                                <input type="number" 
                                       class="valor-atividade" 
                                       value="${ativ.valor}" 
                                       placeholder="0.00" 
                                       step="0.01" 
                                       min="0" 
                                       style="width: 80px; margin: 0 5px;">
                            </div>
                        `;
                    }
                    
                    item.innerHTML = `
                        <span>${ativ.emoji}</span>
                        <input type="text" value="${ativ.nome}" data-emoji="${ativ.emoji}" readonly style="flex: 1;">
                        ${valorInput}
                        <button type="button" onclick="removerAtividade(this)">❌</button>
                    `;
                    
                    atividadesDiv.appendChild(item);
                });
                
                contadorSecoes = 1;
            }
            
            document.getElementById('tituloFormulario').textContent = '✏️ Editar Rotina';
            document.getElementById('formularioRotina').style.display = 'block';
            window.scrollTo({ top: document.getElementById('formularioRotina').offsetTop, behavior: 'smooth' });
        }
    } catch (error) {
        console.error('Erro ao carregar rotina:', error);
        mostrarMensagem('❌ Erro ao carregar rotina', 'error');
    }
}

async function deletarRotina(id) {
    if (!confirm('⚠️ Tem certeza que deseja excluir esta rotina?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/rotinas/${id}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (data.sucesso) {
            mostrarMensagem('✅ Rotina excluída com sucesso!', 'success');
            await carregarRotinas();
        } else {
            mostrarMensagem('❌ ' + data.erro, 'error');
        }
    } catch (error) {
        console.error('Erro ao deletar rotina:', error);
        mostrarMensagem('❌ Erro ao deletar rotina', 'error');
    }
}

function visualizarRotina(id) {
    console.log('📋 Visualizando rotina ID:', id);
    console.log('🔗 URL:', `rotina.html?id=${id}`);
    window.open(`rotina.html?id=${id}`, '_blank');
}

function mostrarMensagem(texto, tipo) {
    const mensagemDiv = document.getElementById('mensagem');
    mensagemDiv.innerHTML = `<div class="alert alert-${tipo}">${texto}</div>`;
    
    setTimeout(() => {
        mensagemDiv.innerHTML = '';
    }, 5000);
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function abrirManual() {
    window.open('../MANUAL_DE_USUARIO.html', '_blank');
}

function abrirAlterarSenha() {
    document.getElementById('modalAlterarSenha').style.display = 'block';
    document.getElementById('formAlterarSenha').reset();
    document.getElementById('mensagemSenha').innerHTML = '';
}

function fecharModalSenha() {
    document.getElementById('modalAlterarSenha').style.display = 'none';
    document.getElementById('formAlterarSenha').reset();
    document.getElementById('mensagemSenha').innerHTML = '';
}

document.getElementById('formAlterarSenha').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const senhaAtual = document.getElementById('senhaAtual').value;
    const novaSenha = document.getElementById('novaSenha').value;
    const confirmarSenha = document.getElementById('confirmarSenha').value;
    const mensagemDiv = document.getElementById('mensagemSenha');
    
    if (novaSenha !== confirmarSenha) {
        mensagemDiv.innerHTML = '<div class="alert alert-error">❌ As senhas não coincidem!</div>';
        return;
    }
    
    if (novaSenha.length < 6) {
        mensagemDiv.innerHTML = '<div class="alert alert-error">❌ A senha deve ter no mínimo 6 caracteres!</div>';
        return;
    }
    
    try {
        const response = await fetch('/api/auth/alterar-senha', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ senhaAtual, novaSenha })
        });
        
        const data = await response.json();
        
        if (data.sucesso) {
            mensagemDiv.innerHTML = '<div class="alert alert-success">✅ Senha alterada com sucesso!</div>';
            setTimeout(() => {
                fecharModalSenha();
                mostrarMensagem('✅ Senha alterada com sucesso!', 'success');
            }, 2000);
        } else {
            mensagemDiv.innerHTML = `<div class="alert alert-error">❌ ${data.erro}</div>`;
        }
    } catch (error) {
        console.error('Erro ao alterar senha:', error);
        mensagemDiv.innerHTML = '<div class="alert alert-error">❌ Erro ao alterar senha!</div>';
    }
});

// Fechar modal ao clicar fora
window.onclick = function(event) {
    const modal = document.getElementById('modalAtividades');
    const modalSenha = document.getElementById('modalAlterarSenha');
    if (event.target === modal) {
        fecharModal();
    }
    if (event.target === modalSenha) {
        fecharModalSenha();    }
}