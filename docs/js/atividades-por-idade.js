// atividades-por-idade.js - Lista de atividades organizadas por faixa etária

const atividadesPorIdade = {
    "4-7": {
        nome: "Crianças pequenas (4 a 7 anos)",
        emoji: "👶",
        secoes: [
            {
                titulo: "Organização pessoal",
                emoji: "🛏️",
                atividades: [
                    { nome: "Arrumar a cama (com ajuda)", emoji: "🛏️" },
                    { nome: "Guardar brinquedos após brincar", emoji: "🧸" },
                    { nome: "Guardar o pijama", emoji: "👔" },
                    { nome: "Colocar o sapato no lugar", emoji: "👟" },
                    { nome: "Organizar livros e materiais", emoji: "📚" }
                ]
            },
            {
                titulo: "Higiene",
                emoji: "🧼",
                atividades: [
                    { nome: "Escovar os dentes", emoji: "🪥" },
                    { nome: "Lavar as mãos", emoji: "🧼" },
                    { nome: "Tomar banho com supervisão", emoji: "🚿" },
                    { nome: "Pentear o cabelo", emoji: "💇" },
                    { nome: "Trocar de roupa", emoji: "👕" }
                ]
            },
            {
                titulo: "Alimentação",
                emoji: "🍽️",
                atividades: [
                    { nome: "Comer tudo do prato", emoji: "🍽️" },
                    { nome: "Ajudar a colocar a mesa", emoji: "🍴" },
                    { nome: "Ajudar a tirar a mesa", emoji: "🧹" },
                    { nome: "Guardar o prato na pia", emoji: "🍽️" }
                ]
            },
            {
                titulo: "Aprendizado",
                emoji: "📚",
                atividades: [
                    { nome: "Fazer atividades escolares simples", emoji: "✏️" },
                    { nome: "Desenhar ou colorir", emoji: "🎨" },
                    { nome: "Treinar letras e números", emoji: "🔤" },
                    { nome: "Ler com um adulto", emoji: "📖" },
                    { nome: "Ouvir histórias", emoji: "📕" }
                ]
            },
            {
                titulo: "Comportamento",
                emoji: "❤️",
                atividades: [
                    { nome: "Obedecer aos pais", emoji: "👨‍👩‍👧" },
                    { nome: "Falar 'por favor' e 'obrigado'", emoji: "🙏" },
                    { nome: "Compartilhar brinquedos", emoji: "🤝" },
                    { nome: "Não gritar", emoji: "🤫" },
                    { nome: "Respeitar horários", emoji: "⏰" }
                ]
            }
        ]
    },
    "8-12": {
        nome: "Pré-adolescentes (8 a 12 anos)",
        emoji: "🧒",
        secoes: [
            {
                titulo: "Organização e casa",
                emoji: "🛏️",
                atividades: [
                    { nome: "Arrumar a cama sozinho", emoji: "🛏️" },
                    { nome: "Organizar o quarto", emoji: "🧹" },
                    { nome: "Guardar roupas limpas", emoji: "👕" },
                    { nome: "Separar roupas sujas", emoji: "🧺" },
                    { nome: "Varrer o quarto ou a casa", emoji: "🧹" },
                    { nome: "Tirar o lixo", emoji: "🗑️" },
                    { nome: "Ajudar a guardar compras", emoji: "🛒" }
                ]
            },
            {
                titulo: "Estudos",
                emoji: "📚",
                atividades: [
                    { nome: "Fazer lição de casa", emoji: "📝" },
                    { nome: "Estudar para provas", emoji: "📖" },
                    { nome: "Ler diariamente", emoji: "📚" },
                    { nome: "Organizar mochila e material", emoji: "🎒" },
                    { nome: "Fazer trabalhos escolares", emoji: "📄" },
                    { nome: "Revisar o conteúdo do dia", emoji: "📖" }
                ]
            },
            {
                titulo: "Higiene pessoal",
                emoji: "🧼",
                atividades: [
                    { nome: "Tomar banho sozinho", emoji: "🚿" },
                    { nome: "Escovar os dentes corretamente", emoji: "🪥" },
                    { nome: "Usar desodorante", emoji: "🧴" },
                    { nome: "Pentear o cabelo", emoji: "💇" },
                    { nome: "Manter unhas limpas", emoji: "💅" }
                ]
            },
            {
                titulo: "Alimentação",
                emoji: "🍽️",
                atividades: [
                    { nome: "Comer nos horários certos", emoji: "⏰" },
                    { nome: "Preparar lanche simples", emoji: "🥪" },
                    { nome: "Ajudar a lavar louça", emoji: "🧽" },
                    { nome: "Secar e guardar louça", emoji: "🍽️" },
                    { nome: "Limpar a mesa após refeições", emoji: "🧹" }
                ]
            },
            {
                titulo: "Responsabilidade",
                emoji: "🧠",
                atividades: [
                    { nome: "Cumprir combinados", emoji: "🤝" },
                    { nome: "Cuidar dos próprios objetos", emoji: "🎒" },
                    { nome: "Ajudar irmãos menores", emoji: "👶" },
                    { nome: "Respeitar regras da casa", emoji: "🏠" },
                    { nome: "Controlar o tempo de tela", emoji: "📱" }
                ]
            }
        ]
    },
    "13-17": {
        nome: "Adolescentes (13 a 17 anos)",
        emoji: "🧑‍🎓",
        secoes: [
            {
                titulo: "Tarefas domésticas",
                emoji: "🏠",
                atividades: [
                    { nome: "Arrumar quarto e cama", emoji: "🛏️" },
                    { nome: "Limpar banheiro (quando combinado)", emoji: "🚽" },
                    { nome: "Lavar louça", emoji: "🧽" },
                    { nome: "Cozinhar refeições simples", emoji: "🍳" },
                    { nome: "Varrer e passar pano", emoji: "🧹" },
                    { nome: "Cuidar de animais de estimação", emoji: "🐾" },
                    { nome: "Ajudar nas tarefas da casa regularmente", emoji: "🏡" }
                ]
            },
            {
                titulo: "Estudos e futuro",
                emoji: "📖",
                atividades: [
                    { nome: "Fazer tarefas sem cobrança", emoji: "✅" },
                    { nome: "Estudar para provas e trabalhos", emoji: "📚" },
                    { nome: "Ler livros ou conteúdos educativos", emoji: "📖" },
                    { nome: "Organizar agenda e horários", emoji: "📅" },
                    { nome: "Cumprir prazos escolares", emoji: "⏰" },
                    { nome: "Ajudar em decisões responsáveis", emoji: "🤔" }
                ]
            },
            {
                titulo: "Autocuidado",
                emoji: "🧼",
                atividades: [
                    { nome: "Manter higiene diária", emoji: "🚿" },
                    { nome: "Cuidar da aparência", emoji: "💇" },
                    { nome: "Lavar as próprias roupas (quando possível)", emoji: "🧺" },
                    { nome: "Organizar itens pessoais", emoji: "👔" }
                ]
            },
            {
                titulo: "Responsabilidade e convivência",
                emoji: "🧠",
                atividades: [
                    { nome: "Respeitar horários", emoji: "⏰" },
                    { nome: "Comunicar onde vai estar", emoji: "📱" },
                    { nome: "Cumprir regras da casa", emoji: "🏠" },
                    { nome: "Dar exemplo aos mais novos", emoji: "👶" },
                    { nome: "Usar celular e videogame com equilíbrio", emoji: "🎮" }
                ]
            },
            {
                titulo: "Saúde e rotina",
                emoji: "💪",
                atividades: [
                    { nome: "Praticar atividade física", emoji: "🏃" },
                    { nome: "Dormir em horário adequado", emoji: "😴" },
                    { nome: "Evitar uso excessivo de telas", emoji: "📵" },
                    { nome: "Manter hábitos saudáveis", emoji: "🥗" }
                ]
            }
        ]
    }
};

// Função para obter atividades por faixa etária
function obterAtividadesPorIdade(faixaEtaria) {
    return atividadesPorIdade[faixaEtaria] || null;
}

// Função para obter todas as faixas etárias disponíveis
function obterFaixasEtarias() {
    return Object.keys(atividadesPorIdade).map(key => ({
        valor: key,
        nome: atividadesPorIdade[key].nome,
        emoji: atividadesPorIdade[key].emoji
    }));
}

// Função para verificar se atividade já existe
function atividadeJaExiste(nomeAtividade, listaAtividades) {
    const nomeNormalizado = nomeAtividade.toLowerCase().trim();
    return listaAtividades.some(ativ => 
        ativ.nome.toLowerCase().trim() === nomeNormalizado
    );
}
