// Carregar lista de crianças ao iniciar
window.addEventListener('DOMContentLoaded', async () => {
    await carregarListaCriancas();
});

async function carregarListaCriancas() {
    const loading = document.getElementById('loadingLista');
    const lista = document.getElementById('listaCriancas');
    
    try {
        console.log('🔄 Carregando lista de crianças...');
        const response = await fetch('/api/rotinas/listar-criancas');
        const data = await response.json();
        
        console.log('📦 Resposta:', data);
        
        loading.style.display = 'none';
        
        if (data.sucesso && data.criancas.length > 0) {
            lista.style.display = 'grid';
            
            data.criancas.forEach(crianca => {
                const card = criarCardCrianca(crianca);
                lista.appendChild(card);
            });
        } else {
            lista.style.display = 'block';
            lista.innerHTML = `
                <div class="nenhuma-crianca">
                    <h2>� Acesso não autorizado</h2>
                    <p>Os pais ou responsáveis precisam fazer login primeiro para liberar o acesso às crianças.</p>
                    <a href="login.html" class="btn btn-primary">Login dos Responsáveis</a>
                </div>
            `;
        }
    } catch (error) {
        console.error('❌ Erro ao carregar crianças:', error);
        loading.style.display = 'none';
        lista.style.display = 'block';
        lista.innerHTML = `
            <div class="nenhuma-crianca">
                <h2>❌ Erro ao Carregar</h2>
                <p>Não foi possível carregar a lista de crianças.</p>
                <button onclick="location.reload()" class="btn btn-primary">Tentar Novamente</button>
            </div>
        `;
    }
}

function criarCardCrianca(crianca) {
    const card = document.createElement('div');
    card.className = `card-crianca ${crianca.genero}`;
    
    const emoji = crianca.genero === 'menino' ? '👦' : '👧';
    const anoTexto = crianca.anoNascimento ? `🎂 ${crianca.anoNascimento}` : '';
    
    card.innerHTML = `
        <div class="emoji-crianca">${emoji}</div>
        <div class="nome-crianca">${crianca.nomeCompleto}</div>
        <div class="info-crianca">${anoTexto}</div>
    `;
    
    card.onclick = () => abrirRotina(crianca.id);
    
    return card;
}

function abrirRotina(rotinaId) {
    console.log('🚀 Abrindo rotina ID:', rotinaId);
    console.log('📍 URL que será acessada:', `rotina.html?id=${rotinaId}`);
    
    if (!rotinaId) {
        console.error('❌ ERRO: ID da rotina está vazio!');
        alert('Erro: ID da rotina não encontrado!');
        return;
    }
    
    // Redirecionar para a mesma aba (para o botão VOLTAR funcionar corretamente)
    window.location.href = `rotina.html?id=${rotinaId}`;
}
