/**
 * db.js  Firebase (Auth + Firestore) para GitHub Pages
 * Intercepta todas as chamadas fetch('/api/...') e usa Firebase.
 *
 *   ANTES DE PUBLICAR: preencha o objeto firebaseConfig abaixo
 *     com os dados do seu projeto Firebase Console.
 */

// =============================================
//   CONFIGURAÇÃO  PREENCHA COM SEUS DADOS
// =============================================
const firebaseConfig = {
  apiKey: "AIzaSyA-3asr1lH5_VFSZ3sOtYouir_29oLmeL4",
  authDomain: "missao-dia-kids.firebaseapp.com",
  projectId: "missao-dia-kids",
  storageBucket: "missao-dia-kids.firebasestorage.app",
  messagingSenderId: "1040735602744",
  appId: "1:1040735602744:web:031122be95850200dfbecd"
};
// =============================================

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const dbF  = firebase.firestore();

// Persistência: mantém sessão mesmo fechando o navegador
auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL).catch(() => {});

// Email de recuperação de senha em português
auth.languageCode = 'pt-BR';

// =============================================
// HASH SHA-256 (usado apenas para PIN de 4 dígitos)
// =============================================
async function hashTexto(texto) {
    const data = new TextEncoder().encode(texto);
    const buf  = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(buf))
        .map(b => b.toString(16).padStart(2, '0')).join('');
}

// =============================================
// RESPOSTA SIMULADA (imita Response do fetch)
// =============================================
function mockResponse(dados, status = 200) {
    return {
        ok:   status >= 200 && status < 300,
        status,
        json: async () => dados,
    };
}

// =============================================
// AGUARDA AUTH ESTAR PRONTO
// =============================================
function aguardarAuthPronto() {
    return new Promise(resolve => {
        if (auth.currentUser !== null) { resolve(auth.currentUser); return; }
        const unsub = auth.onAuthStateChanged(user => { unsub(); resolve(user); });
    });
}

// =============================================
// POST /api/auth/register
// =============================================
async function handleRegister(body) {
    const { nome, email, senha } = body || {};
    if (!nome || !email || !senha)
        return mockResponse({ erro: 'Nome, email e senha são obrigatórios' }, 400);
    if (senha.length < 6)
        return mockResponse({ erro: 'A senha deve ter no mínimo 6 caracteres' }, 400);

    try {
        const cred = await auth.createUserWithEmailAndPassword(email, senha);
        await cred.user.updateProfile({ displayName: nome });
        await dbF.collection('usuarios').doc(cred.user.uid).set({
            nome, email: email.toLowerCase(), pinHash: null, criadoEm: new Date().toISOString(),
        });
        return mockResponse({ sucesso: true, usuario: { id: cred.user.uid, nome, email: email.toLowerCase() } });
    } catch (e) {
        if (e.code === 'auth/email-already-in-use')
            return mockResponse({ erro: 'Email já cadastrado' }, 400);
        return mockResponse({ erro: e.message }, 400);
    }
}

// =============================================
// POST /api/auth/login
// =============================================
async function handleLogin(body) {
    const { email, senha } = body || {};
    if (!email || !senha)
        return mockResponse({ erro: 'Email e senha são obrigatórios' }, 400);

    try {
        const cred = await auth.signInWithEmailAndPassword(email, senha);
        const doc  = await dbF.collection('usuarios').doc(cred.user.uid).get();
        const data = doc.exists ? doc.data() : {};
        const nome = data.nome || cred.user.displayName || '';
        return mockResponse({ sucesso: true, usuario: { id: cred.user.uid, nome, email: cred.user.email } });
    } catch {
        return mockResponse({ erro: 'Email ou senha incorretos' }, 401);
    }
}

// =============================================
// POST /api/auth/logout
// =============================================
async function handleLogout() {
    try { await auth.signOut(); } catch { /* noop */ }
    return mockResponse({ sucesso: true });
}

// =============================================
// GET /api/auth/verificar
// =============================================
async function handleVerificar() {
    const user = await aguardarAuthPronto();
    if (!user) return mockResponse({ autenticado: false });

    try {
        const doc  = await dbF.collection('usuarios').doc(user.uid).get();
        const data = doc.exists ? doc.data() : {};
        return mockResponse({
            autenticado: true,
            usuario: { id: user.uid, nome: data.nome || user.displayName || '', email: user.email },
            temPin: !!data.pinHash,
        });
    } catch {
        return mockResponse({ autenticado: true,
            usuario: { id: user.uid, nome: '', email: user.email }, temPin: false });
    }
}

// =============================================
// POST /api/auth/cadastrar-pin
// =============================================
async function handleCadastrarPin(body) {
    const user = auth.currentUser;
    if (!user) return mockResponse({ erro: 'Não autenticado' }, 401);

    const { pin } = body || {};
    if (!pin || !/^[0-9]{4}$/.test(pin))
        return mockResponse({ erro: 'PIN deve ter exatamente 4 números' }, 400);

    try {
        await dbF.collection('usuarios').doc(user.uid).update({ pinHash: await hashTexto(pin) });
        return mockResponse({ sucesso: true });
    } catch (e) { return mockResponse({ erro: e.message }, 500); }
}

// =============================================
// POST /api/auth/verificar-pin
// =============================================
async function handleVerificarPin(body) {
    const user = auth.currentUser;
    if (!user) return mockResponse({ erro: 'Não autenticado' }, 401);

    const { pin } = body || {};
    if (!pin) return mockResponse({ erro: 'PIN é obrigatório' }, 400);

    try {
        const doc  = await dbF.collection('usuarios').doc(user.uid).get();
        const data = doc.exists ? doc.data() : {};
        if (!data.pinHash) return mockResponse({ erro: 'PIN não configurado' }, 401);
        if ((await hashTexto(pin)) !== data.pinHash)
            return mockResponse({ erro: 'PIN incorreto' }, 401);
        return mockResponse({ sucesso: true });
    } catch (e) { return mockResponse({ erro: e.message }, 500); }
}

// =============================================
// POST /api/auth/recuperar-senha
// =============================================
async function handleRecuperarSenha(body) {
    const { email } = body || {};
    if (!email) return mockResponse({ erro: 'Email é obrigatório' }, 400);

    try {
        await auth.sendPasswordResetEmail(email);
        return mockResponse({ sucesso: true, mensagem: 'Email de recuperação enviado! Verifique sua caixa de entrada.' });
    } catch (e) {
        if (e.code === 'auth/user-not-found')
            return mockResponse({ erro: 'Nenhuma conta encontrada com este email.' }, 404);
        return mockResponse({ erro: e.message }, 400);
    }
}

// =============================================
// POST /api/auth/alterar-senha
// =============================================
async function handleAlterarSenha(body) {
    const user = auth.currentUser;
    if (!user) return mockResponse({ erro: 'Não autenticado' }, 401);

    const { senhaAtual, novaSenha } = body || {};
    if (!senhaAtual || !novaSenha)
        return mockResponse({ erro: 'Senha atual e nova senha são obrigatórias' }, 400);
    if (novaSenha.length < 6)
        return mockResponse({ erro: 'A nova senha deve ter no mínimo 6 caracteres' }, 400);

    try {
        const cred = firebase.auth.EmailAuthProvider.credential(user.email, senhaAtual);
        await user.reauthenticateWithCredential(cred);
        await user.updatePassword(novaSenha);
        return mockResponse({ sucesso: true, mensagem: 'Senha alterada com sucesso' });
    } catch (e) {
        if (e.code === 'auth/wrong-password' || e.code === 'auth/invalid-credential')
            return mockResponse({ erro: 'Senha atual incorreta' }, 401);
        return mockResponse({ erro: e.message }, 400);
    }
}

// =============================================
// GET /api/rotinas/atividades-pre-definidas
// =============================================
function handleAtividadesPreDefinidas() {
    return mockResponse({ sucesso: true, atividades: [
        { id: 1,  nome: 'Arrumar o quarto',         emoji: '', categoria: 'Manhã'        },
        { id: 2,  nome: 'Escovar os dentes',         emoji: '', categoria: 'Higiene'      },
        { id: 3,  nome: 'Lavar o rosto',             emoji: '', categoria: 'Higiene'      },
        { id: 4,  nome: 'Passar desodorante',        emoji: '', categoria: 'Higiene'      },
        { id: 5,  nome: 'Tomar café da manhã',       emoji: '', categoria: 'Alimentação'  },
        { id: 6,  nome: 'Arrumar a mochila',         emoji: '', categoria: 'Escola'       },
        { id: 7,  nome: 'Separar roupa',             emoji: '', categoria: 'Manhã'        },
        { id: 8,  nome: 'Pentear o cabelo',          emoji: '', categoria: 'Higiene'      },
        { id: 9,  nome: 'Passar perfume',            emoji: '', categoria: 'Higiene'      },
        { id: 10, nome: 'Se preparar para Almoçar',  emoji: '', categoria: 'Alimentação'  },
        { id: 11, nome: 'Entregar lancheira',        emoji: '', categoria: 'Escola'       },
        { id: 12, nome: 'Revisar mochila',           emoji: '', categoria: 'Escola'       },
        { id: 13, nome: 'Retirar bagunças',          emoji: '', categoria: 'Limpeza'      },
        { id: 14, nome: 'Fazer lição de casa',       emoji: '', categoria: 'Estudos'      },
        { id: 15, nome: 'Organizar brinquedos',      emoji: '', categoria: 'Limpeza'      },
        { id: 16, nome: 'Tomar banho',               emoji: '', categoria: 'Higiene'      },
        { id: 17, nome: 'Jantar',                    emoji: '', categoria: 'Alimentação'  },
        { id: 18, nome: 'Colocar pijama',            emoji: '', categoria: 'Noite'        },
        { id: 19, nome: 'Ler um livro',              emoji: '', categoria: 'Estudos'      },
    ]});
}

// =============================================
// GET /api/rotinas/listar-criancas
// Exige responsável logado — aguarda auth estar pronto (Firebase é assíncrono)
// =============================================
async function handleListarCriancas() {
    try {
        const user = await aguardarAuthPronto();
        if (!user) return mockResponse({ sucesso: true, criancas: [] });

        const snap = await dbF.collection('rotinas').where('usuarioId', '==', user.uid).get();
        const criancas = snap.docs.map(doc => {
            const r = doc.data();
            return {
                id: doc.id,
                nome: r.criancaNome,
                sobrenome: r.criancaSobrenome || '',
                nomeCompleto: r.criancaSobrenome ? `${r.criancaNome} ${r.criancaSobrenome}` : r.criancaNome,
                genero: r.criancaGenero,
                anoNascimento: r.criancaAnoNascimento,
            };
        });
        return mockResponse({ sucesso: true, criancas });
    } catch (e) { return mockResponse({ erro: e.message }, 500); }
}

// =============================================
// POST /api/rotinas/buscar-crianca  (tela das crianças, sem login)
// =============================================
async function handleBuscarCrianca(body) {
    const { primeiroNome, anoNascimento } = body || {};
    if (!primeiroNome) return mockResponse({ erro: 'Nome é obrigatório' }, 400);

    try {
        let query = dbF.collection('rotinas').where('criancaNome', '==', primeiroNome);
        if (anoNascimento) query = query.where('criancaAnoNascimento', '==', Number(anoNascimento));
        const snap = await query.get();
        if (snap.empty) return mockResponse({ erro: 'Criança não encontrada' }, 404);
        const doc = snap.docs[0];
        return mockResponse({ sucesso: true, rotina: { id: doc.id, criancaNome: doc.data().criancaNome } });
    } catch (e) { return mockResponse({ erro: e.message }, 500); }
}

// =============================================
// GET /api/rotinas
// =============================================
async function handleListarRotinas() {
    const user = auth.currentUser;
    if (!user) return mockResponse({ erro: 'Não autenticado' }, 401);

    try {
        const snap = await dbF.collection('rotinas').where('usuarioId', '==', user.uid).get();
        const rotinas = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return mockResponse({ sucesso: true, rotinas });
    } catch (e) { return mockResponse({ erro: e.message }, 500); }
}

// =============================================
// GET /api/rotinas/:id
// =============================================
async function handleBuscarRotina(id) {
    try {
        const doc = await dbF.collection('rotinas').doc(id).get();
        if (!doc.exists) return mockResponse({ erro: 'Rotina não encontrada' }, 404);
        return mockResponse({ sucesso: true, rotina: { id: doc.id, ...doc.data() } });
    } catch (e) { return mockResponse({ erro: e.message }, 500); }
}

// =============================================
// POST /api/rotinas  (criar)
// =============================================
async function handleCriarRotina(body) {
    const user = auth.currentUser;
    if (!user) return mockResponse({ erro: 'Não autenticado' }, 401);
    if (!body.criancaNome || !body.criancaGenero)
        return mockResponse({ erro: 'Dados incompletos' }, 400);

    const novaRotina = {
        usuarioId:            user.uid,
        criancaNome:          body.criancaNome,
        criancaSobrenome:     body.criancaSobrenome     || '',
        criancaAnoNascimento: body.criancaAnoNascimento || null,
        criancaGenero:        body.criancaGenero,
        atividades:           body.atividades           || [],
        secoes:               body.secoes               || [],
        diasSemana:           body.diasSemana           || [1, 2, 3, 4, 5],
        horarios:             body.horarios             || {},
        observacoes:          body.observacoes          || '',
        usarRecompensas:      body.usarRecompensas      || false,
        criadoEm:             new Date().toISOString(),
    };

    try {
        const ref = await dbF.collection('rotinas').add(novaRotina);
        return mockResponse({ sucesso: true, rotina: { id: ref.id, ...novaRotina } });
    } catch (e) { return mockResponse({ erro: e.message }, 500); }
}

// =============================================
// PUT /api/rotinas/:id  (atualizar)
// =============================================
async function handleAtualizarRotina(id, body) {
    const user = auth.currentUser;
    if (!user) return mockResponse({ erro: 'Não autenticado' }, 401);

    try {
        const ref = dbF.collection('rotinas').doc(id);
        const doc = await ref.get();
        if (!doc.exists || doc.data().usuarioId !== user.uid)
            return mockResponse({ erro: 'Rotina não encontrada' }, 404);
        const atualizado = { ...doc.data(), ...body, atualizadoEm: new Date().toISOString() };
        await ref.set(atualizado);
        return mockResponse({ sucesso: true, rotina: { id, ...atualizado } });
    } catch (e) { return mockResponse({ erro: e.message }, 500); }
}

// =============================================
// DELETE /api/rotinas/:id
// =============================================
async function handleDeletarRotina(id) {
    const user = auth.currentUser;
    if (!user) return mockResponse({ erro: 'Não autenticado' }, 401);

    try {
        const ref = dbF.collection('rotinas').doc(id);
        const doc = await ref.get();
        if (!doc.exists || doc.data().usuarioId !== user.uid)
            return mockResponse({ erro: 'Rotina não encontrada' }, 404);

        await ref.delete();

        const histSnap = await dbF.collection('historico').where('rotinaId', '==', id).get();
        const batch = dbF.batch();
        histSnap.docs.forEach(d => batch.delete(d.ref));
        await batch.commit();

        return mockResponse({ sucesso: true });
    } catch (e) { return mockResponse({ erro: e.message }, 500); }
}

// =============================================
// POST /api/historico/salvar
// =============================================
async function handleSalvarHistorico(body) {
    const { rotinaId, progresso } = body || {};
    if (!rotinaId || !progresso)
        return mockResponse({ erro: 'Dados incompletos' }, 400);

    const hoje    = new Date();
    const semanaId   = getIdentificadorSemana(hoje);
    const docId      = `${rotinaId}_${semanaId}`;
    const registro   = {
        rotinaId,
        semanaId,
        inicioSemana: formatarData(getInicioSemana(hoje)),
        fimSemana:    formatarData(getFimSemana(hoje)),
        progresso,
        salvoEm:      new Date().toISOString(),
    };

    try {
        await dbF.collection('historico').doc(docId).set(registro);
        return mockResponse({ sucesso: true, historico: { id: docId, ...registro } });
    } catch (e) { return mockResponse({ erro: e.message }, 500); }
}

// =============================================
// GET /api/historico/rotina/:rotinaId
// =============================================
async function handleBuscarHistoricoRotina(rotinaId) {
    try {
        const snap = await dbF.collection('historico')
            .where('rotinaId', '==', rotinaId)
            .orderBy('semanaId', 'desc').get();
        return mockResponse({ sucesso: true, historicos: snap.docs.map(d => ({ id: d.id, ...d.data() })) });
    } catch {
        try {
            const snap2 = await dbF.collection('historico').where('rotinaId', '==', rotinaId).get();
            const lista = snap2.docs.map(d => ({ id: d.id, ...d.data() }))
                .sort((a, b) => b.semanaId.localeCompare(a.semanaId));
            return mockResponse({ sucesso: true, historicos: lista });
        } catch (e2) { return mockResponse({ erro: e2.message }, 500); }
    }
}

// =============================================
// GET /api/historico/semana/:rotinaId/:semanaId
// =============================================
async function handleBuscarHistoricoSemana(rotinaId, semanaId) {
    const docId = `${rotinaId}_${semanaId}`;
    try {
        const doc = await dbF.collection('historico').doc(docId).get();
        if (!doc.exists) return mockResponse({ erro: 'Histórico não encontrado' }, 404);
        return mockResponse({ sucesso: true, historico: { id: doc.id, ...doc.data() } });
    } catch (e) { return mockResponse({ erro: e.message }, 500); }
}

// =============================================
// UTILITÁRIOS DE DATA
// =============================================
function getInicioSemana(data) {
    const d = new Date(data); const ini = new Date(d.setDate(d.getDate() - d.getDay()));
    ini.setHours(0, 0, 0, 0); return ini;
}
function getFimSemana(data) {
    const ini = getInicioSemana(data); const fim = new Date(ini);
    fim.setDate(ini.getDate() + 6); fim.setHours(23, 59, 59, 999); return fim;
}
function formatarData(data) {
    const d = new Date(data);
    return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
}
function getIdentificadorSemana(data) {
    const ini = getInicioSemana(data); const ano = ini.getFullYear();
    const prim = new Date(ano, 0, 1);
    const sem = Math.ceil((Math.floor((ini - prim) / 86400000) + prim.getDay() + 1) / 7);
    return `${ano}-${String(sem).padStart(2, '0')}`;
}

// =============================================
// INTERCEPTADOR DO fetch
// =============================================
const _fetchOriginal = window.fetch.bind(window);

window.fetch = async function(url, options = {}) {
    if (typeof url !== 'string' || !url.startsWith('/api/')) {
        return _fetchOriginal(url, options);
    }
    const method = (options.method || 'GET').toUpperCase();
    let body = null;
    if (options.body) { try { body = JSON.parse(options.body); } catch { body = {}; } }

    if (url === '/api/auth/register'         && method === 'POST') return handleRegister(body);
    if (url === '/api/auth/login'             && method === 'POST') return handleLogin(body);
    if (url === '/api/auth/logout'            && method === 'POST') return handleLogout();
    if (url === '/api/auth/verificar'         && method === 'GET')  return handleVerificar();
    if (url === '/api/auth/cadastrar-pin'     && method === 'POST') return handleCadastrarPin(body);
    if (url === '/api/auth/verificar-pin'     && method === 'POST') return handleVerificarPin(body);
    if (url === '/api/auth/alterar-senha'     && method === 'POST') return handleAlterarSenha(body);
    if (url === '/api/auth/recuperar-senha'   && method === 'POST') return handleRecuperarSenha(body);

    if (url === '/api/rotinas/atividades-pre-definidas' && method === 'GET')  return handleAtividadesPreDefinidas();
    if (url === '/api/rotinas/listar-criancas'          && method === 'GET')  return handleListarCriancas();
    if (url === '/api/rotinas/buscar-crianca'           && method === 'POST') return handleBuscarCrianca(body);
    if (url === '/api/rotinas'                          && method === 'GET')  return handleListarRotinas();
    if (url === '/api/rotinas'                          && method === 'POST') return handleCriarRotina(body);

    const rotinaMatch = url.match(/^\/api\/rotinas\/([^/]+)$/);
    if (rotinaMatch) {
        if (method === 'GET')    return handleBuscarRotina(rotinaMatch[1]);
        if (method === 'PUT')    return handleAtualizarRotina(rotinaMatch[1], body);
        if (method === 'DELETE') return handleDeletarRotina(rotinaMatch[1]);
    }

    if (url === '/api/historico/salvar' && method === 'POST') return handleSalvarHistorico(body);

    const hRot = url.match(/^\/api\/historico\/rotina\/([^/]+)$/);
    if (hRot) return handleBuscarHistoricoRotina(hRot[1]);

    const hSem = url.match(/^\/api\/historico\/semana\/([^/]+)\/(.+)$/);
    if (hSem) return handleBuscarHistoricoSemana(hSem[1], hSem[2]);

    console.warn(' Rota não mapeada:', method, url);
    return mockResponse({ erro: 'Rota não encontrada' }, 404);
};

console.log(' db.js carregado  Modo Firebase');
