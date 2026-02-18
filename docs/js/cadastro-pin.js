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
        
        // Se já tem PIN cadastrado, redirecionar para menu
        if (data.temPin) {
            window.location.href = 'menu-principal.html';
        }
    } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
        window.location.href = 'login.html';
    }
}

// Auto-focus e navegação entre campos
const pinInputs = document.querySelectorAll('.pin-digit');

pinInputs.forEach((input, index) => {
    // Permitir apenas números
    input.addEventListener('input', (e) => {
        e.target.value = e.target.value.replace(/[^0-9]/g, '');
        
        // Avançar para próximo campo
        if (e.target.value.length === 1 && index < pinInputs.length - 1) {
            pinInputs[index + 1].focus();
        }
    });
    
    // Voltar ao deletar
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && e.target.value === '' && index > 0) {
            pinInputs[index - 1].focus();
        }
    });
    
    // Colar PIN completo
    input.addEventListener('paste', (e) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').replace(/[^0-9]/g, '');
        
        if (pastedData.length === 4) {
            document.getElementById('pin1').value = pastedData[0];
            document.getElementById('pin2').value = pastedData[1];
            document.getElementById('pin3').value = pastedData[2];
            document.getElementById('pin4').value = pastedData[3];
            document.getElementById('pinConfirm1').focus();
        }
    });
});

// Submeter formulário
document.getElementById('pinForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const pin1 = document.getElementById('pin1').value;
    const pin2 = document.getElementById('pin2').value;
    const pin3 = document.getElementById('pin3').value;
    const pin4 = document.getElementById('pin4').value;
    
    const pinConfirm1 = document.getElementById('pinConfirm1').value;
    const pinConfirm2 = document.getElementById('pinConfirm2').value;
    const pinConfirm3 = document.getElementById('pinConfirm3').value;
    const pinConfirm4 = document.getElementById('pinConfirm4').value;
    
    const pin = pin1 + pin2 + pin3 + pin4;
    const pinConfirm = pinConfirm1 + pinConfirm2 + pinConfirm3 + pinConfirm4;
    
    const mensagemDiv = document.getElementById('mensagem');
    
    // Validações
    if (pin.length !== 4 || !/^[0-9]{4}$/.test(pin)) {
        mensagemDiv.innerHTML = '<div class="alert alert-error">❌ O PIN deve ter exatamente 4 números!</div>';
        return;
    }
    
    if (pin !== pinConfirm) {
        mensagemDiv.innerHTML = '<div class="alert alert-error">❌ Os PINs não coincidem!</div>';
        document.getElementById('pinConfirm1').focus();
        return;
    }
    
    // Enviar para servidor
    const form = document.getElementById('pinForm');
    const loading = document.getElementById('loading');
    
    form.style.display = 'none';
    loading.style.display = 'block';
    mensagemDiv.innerHTML = '';
    
    console.log('Enviando PIN para o servidor...');
    
    try {
        const response = await fetch('/api/auth/cadastrar-pin', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ pin })
        });
        
        console.log('Resposta recebida:', response.status);
        
        const data = await response.json();
        console.log('Dados:', data);
        
        loading.style.display = 'none';
        
        if (response.ok && data.sucesso) {
            mensagemDiv.innerHTML = '<div class="alert alert-success">✅ PIN cadastrado com sucesso! Redirecionando...</div>';
            setTimeout(() => {
                window.location.href = 'menu-principal.html';
            }, 1500);
        } else {
            form.style.display = 'block';
            mensagemDiv.innerHTML = `<div class="alert alert-error">❌ ${data.erro || 'Erro ao cadastrar PIN'}</div>`;
        }
    } catch (error) {
        console.error('Erro detalhado:', error);
        loading.style.display = 'none';
        form.style.display = 'block';
        mensagemDiv.innerHTML = '<div class="alert alert-error">❌ Erro de conexão com o servidor. Verifique se o servidor está rodando.</div>';
        console.error('Erro:', error);
    }
});

// Auto-focus no primeiro campo ao carregar
document.getElementById('pin1').focus();
