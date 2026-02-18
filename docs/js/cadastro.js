document.getElementById('cadastroForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const nome = document.getElementById('nome').value;
    const email = document.getElementById('email').value;
    const senha = document.getElementById('senha').value;
    const confirmarSenha = document.getElementById('confirmarSenha').value;
    const mensagemDiv = document.getElementById('mensagem');
    const loadingDiv = document.getElementById('loading');
    const form = document.getElementById('cadastroForm');
    
    // Limpar mensagens anteriores
    mensagemDiv.innerHTML = '';
    
    // Validar senhas
    if (senha !== confirmarSenha) {
        mensagemDiv.innerHTML = '<div class="alert alert-error">❌ As senhas não coincidem!</div>';
        return;
    }
    
    if (senha.length < 6) {
        mensagemDiv.innerHTML = '<div class="alert alert-error">❌ A senha deve ter no mínimo 6 caracteres!</div>';
        return;
    }
    
    form.style.display = 'none';
    loadingDiv.style.display = 'block';
    
    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ nome, email, senha })
        });
        
        const data = await response.json();
        
        loadingDiv.style.display = 'none';
        
        if (response.ok && data.sucesso) {
            mensagemDiv.innerHTML = '<div class="alert alert-success">✅ Cadastro realizado! Redirecionando...</div>';
            setTimeout(() => {
                window.location.href = 'menu-principal.html';
            }, 1000);
        } else {
            form.style.display = 'block';
            mensagemDiv.innerHTML = `<div class="alert alert-error">❌ ${data.erro || 'Erro ao cadastrar'}</div>`;
        }
    } catch (error) {
        loadingDiv.style.display = 'none';
        form.style.display = 'block';
        mensagemDiv.innerHTML = '<div class="alert alert-error">❌ Erro de conexão com o servidor</div>';
        console.error('Erro:', error);
    }
});
