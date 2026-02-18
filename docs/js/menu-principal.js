// Verificar autenticação ao carregar
window.addEventListener('DOMContentLoaded', async () => {
    await verificarAutenticacao();
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

function abrirRotinas() {
    // Redirecionar para a página de seleção de rotinas (já autenticado)
    window.location.href = 'login-crianca.html';
}

function abrirAreaAdmin() {
    // Mostrar modal de PIN para admin
    document.getElementById('modalPin').style.display = 'block';
    document.getElementById('inputPin').focus();
}

function fecharModalPin() {
    document.getElementById('modalPin').style.display = 'none';
    document.getElementById('inputPin').value = '';
    document.getElementById('mensagemPin').innerHTML = '';
}

document.getElementById('formPin').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const pin = document.getElementById('inputPin').value;
    const mensagemDiv = document.getElementById('mensagemPin');
    
    if (pin.length !== 4 || !/^[0-9]{4}$/.test(pin)) {
        mensagemDiv.innerHTML = '<div class="alert alert-error">❌ Digite 4 números</div>';
        return;
    }
    
    try {
        const response = await fetch('/api/auth/verificar-pin', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ pin })
        });
        
        const data = await response.json();
        
        if (response.ok && data.sucesso) {
            // PIN correto, redirecionar para painel admin
            window.location.href = 'painel-admin.html';
        } else {
            mensagemDiv.innerHTML = '<div class="alert alert-error">❌ PIN incorreto!</div>';
            document.getElementById('inputPin').value = '';
            document.getElementById('inputPin').focus();
        }
    } catch (error) {
        console.error('Erro ao verificar PIN:', error);
        mensagemDiv.innerHTML = '<div class="alert alert-error">❌ Erro ao verificar PIN</div>';
    }
});

// Permitir apenas números no campo PIN
document.getElementById('inputPin').addEventListener('input', (e) => {
    e.target.value = e.target.value.replace(/[^0-9]/g, '');
});

// Fechar modal ao clicar fora
window.onclick = function(event) {
    const modal = document.getElementById('modalPin');
    if (event.target === modal) {
        fecharModalPin();
    }
}

// Fechar modal com ESC
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        fecharModalPin();
    }
});
