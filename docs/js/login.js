// === ESQUECI A SENHA ===
document.getElementById('linkEsqueciSenha').addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('mensagemRecuperacao').innerHTML = '';
    document.getElementById('emailRecuperacao').value = document.getElementById('email').value || '';
    const modal = document.getElementById('modalEsqueciSenha');
    modal.style.display = 'flex';
});

function fecharModalSenha() {
    document.getElementById('modalEsqueciSenha').style.display = 'none';
}

// Fechar clicando fora do modal
document.getElementById('modalEsqueciSenha').addEventListener('click', (e) => {
    if (e.target === document.getElementById('modalEsqueciSenha')) fecharModalSenha();
});

document.getElementById('formRecuperacao').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('emailRecuperacao').value.trim();
    const msgDiv = document.getElementById('mensagemRecuperacao');
    const btn = e.target.querySelector('button[type=submit]');

    btn.disabled = true;
    btn.textContent = '⏳ Enviando...';
    msgDiv.innerHTML = '';

    try {
        const res  = await fetch('/api/auth/recuperar-senha', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
        });
        const data = await res.json();

        if (data.sucesso) {
            msgDiv.innerHTML = '<div class="alert alert-success" style="margin-bottom:12px;">✅ ' + data.mensagem + '</div>';
            document.getElementById('formRecuperacao').style.display = 'none';
        } else {
            msgDiv.innerHTML = '<div class="alert alert-error" style="margin-bottom:12px;">❌ ' + data.erro + '</div>';
            btn.disabled = false;
            btn.textContent = '📨 Enviar Link';
        }
    } catch {
        msgDiv.innerHTML = '<div class="alert alert-error" style="margin-bottom:12px;">❌ Erro de conexão</div>';
        btn.disabled = false;
        btn.textContent = '📨 Enviar Link';
    }
});

// === LOGIN ===
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const senha = document.getElementById('senha').value;
    const mensagemDiv = document.getElementById('mensagem');
    const loadingDiv = document.getElementById('loading');
    const form = document.getElementById('loginForm');
    
    // Limpar mensagens anteriores
    mensagemDiv.innerHTML = '';
    form.style.display = 'none';
    loadingDiv.style.display = 'block';
    
    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, senha })
        });
        
        const data = await response.json();
        
        loadingDiv.style.display = 'none';
        
        if (response.ok && data.sucesso) {
            mensagemDiv.innerHTML = '<div class="alert alert-success">✅ Login realizado! Redirecionando...</div>';
            setTimeout(() => {
                window.location.href = 'menu-principal.html';
            }, 1000);
        } else {
            form.style.display = 'block';
            mensagemDiv.innerHTML = `<div class="alert alert-error">❌ ${data.erro || 'Erro ao fazer login'}</div>`;
        }
    } catch (error) {
        loadingDiv.style.display = 'none';
        form.style.display = 'block';
        mensagemDiv.innerHTML = '<div class="alert alert-error">❌ Erro de conexão com o servidor</div>';
        console.error('Erro:', error);
    }
});
