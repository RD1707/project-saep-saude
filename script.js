/* =========================================
   1. Configurações e Estado Global
   ========================================= */
const API_BASE_URL = 'http://localhost:3000'; // Vazio pois estamos na mesma origem (ex: localhost:3000)
// Se a API rodar em porta diferente, use: 'http://localhost:3000'

const STATE = {
    token: localStorage.getItem('token') || null,
    user: JSON.parse(localStorage.getItem('user')) || null,
    currentPage: 1,
    itemsPerPage: 4,
    currentFilter: '', // '' (todas), 'corrida', 'caminhada', 'trilha'
    companyMetrics: {
        totalAtividades: 0,
        totalCalorias: 0,
        companyName: 'SAEPSaúde', // Default
        companyLogo: 'assets/logo_saepsaude/SAEPSaude.png' // Default
    }
};

/* =========================================
   2. Seleção de Elementos do DOM
   ========================================= */
// Containers e Views
const viewFeed = document.getElementById('view-feed');
const viewCreate = document.getElementById('view-create');
const activitiesList = document.getElementById('activities-list');

// Sidebar / Perfil
const profileImg = document.getElementById('profile-img');
const profileName = document.getElementById('profile-name');
const metricActivities = document.getElementById('metric-activities-count');
const metricCalories = document.getElementById('metric-calories-count');
const btnSidebarAtividades = document.getElementById('btn-sidebar-atividades');

// Header e Auth
const btnLogin = document.getElementById('btn-login');
const btnLogout = document.getElementById('btn-logout');
const modalOverlay = document.getElementById('modal-overlay');
const btnCloseModal = document.getElementById('btn-close-modal');
const btnCancelLogin = document.getElementById('btn-cancel-login');
const formLogin = document.getElementById('form-login');
const loginErrorMsg = document.getElementById('login-error-msg');

// Filtros e Paginação
const filterButtons = document.querySelectorAll('.filter-btn');
const btnPagePrev = document.getElementById('page-prev');
const btnPageNext = document.getElementById('page-next');
const pageNumbersContainer = document.getElementById('page-numbers');
const selectItemsPerPage = document.getElementById('items-per-page');

// Criar Atividade
const formCreateActivity = document.getElementById('form-create-activity');

/* =========================================
   3. Inicialização
   ========================================= */
async function init() {
    // Carrega métricas da empresa (simulado ou via endpoint se existir)
    // O enunciado pede para carregar da API. Vamos tentar buscar de um endpoint '/empresa'
    // Caso não exista, o catch lida com isso.
    await fetchCompanyMetrics(); // Await this to ensure metrics are loaded before UI update
    
    // Configura estado inicial da UI baseada na autenticação
    updateAuthUI();

    // Carrega atividades iniciais
    await fetchActivities();
}

// Executa ao carregar
document.addEventListener('DOMContentLoaded', init);

/* =========================================
   4. Funções de Autenticação
   ========================================= */
function updateAuthUI() {
    if (STATE.token && STATE.user) {
        // Usuário Logado
        btnLogin.classList.add('hidden');
        btnLogout.classList.remove('hidden');

        // Atualiza Sidebar com dados do usuário
        // Caminho da imagem: assets/imagens_perfil/ + nome do arquivo
        const userImgPath = STATE.user.foto ? `assets/imagens_perfil/${STATE.user.foto}` : 'assets/logo_saepsaude/SAEPSaude.png';
        profileImg.src = userImgPath;
        profileName.textContent = STATE.user.nome || 'Usuário';
        
        metricActivities.textContent = STATE.user.totalAtividades || 0;
        metricCalories.textContent = STATE.user.totalCalorias || 0;

        // Habilita botão de criar atividade
        btnSidebarAtividades.disabled = false;
        btnSidebarAtividades.setAttribute('aria-disabled', 'false');

    } else {
        // Usuário Não Logado (Estado Empresa)
        btnLogin.classList.remove('hidden');
        btnLogout.classList.add('hidden');

        // Reseta Sidebar para dados da Empresa (padrão)
        profileImg.src = STATE.companyMetrics.companyLogo;
        profileName.textContent = STATE.companyMetrics.companyName;
        
        // Mostra métricas da empresa
        metricActivities.textContent = STATE.companyMetrics.totalAtividades;
        metricCalories.textContent = STATE.companyMetrics.totalCalorias;

        // Desabilita botão de criar atividade
        btnSidebarAtividades.disabled = true;
        btnSidebarAtividades.setAttribute('aria-disabled', 'true');
        
        // Garante que volta pra view de feed se estiver no create
        showView('feed');
    }
}

async function handleLogin(e) {
    e.preventDefault();
    const email = formLogin.email.value;
    const senha = formLogin.senha.value;
    const emailInput = formLogin.email;
    const senhaInput = formLogin.senha;

    // Limpa erros anteriores
    loginErrorMsg.classList.add('hidden');
    loginErrorMsg.textContent = '';
    emailInput.classList.remove('input-error');
    senhaInput.classList.remove('input-error');

    // Validação Frontend
    if (!email || !senha) {
        if (!email) emailInput.classList.add('input-error');
        if (!senha) senhaInput.classList.add('input-error');
        loginErrorMsg.textContent = 'email ou senha obrigatório';
        loginErrorMsg.classList.remove('hidden');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, senha })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Erro no login');
        }

        // Login Sucesso
        STATE.token = data.token;
        STATE.user = data.usuario;
        
        // Salva no localStorage
        localStorage.setItem('token', STATE.token);
        localStorage.setItem('user', JSON.stringify(STATE.user));

        closeModal();
        updateAuthUI();
        
        // Recarrega atividades para atualizar estado dos likes
        fetchActivities();

    } catch (error) {
        // Erro de credenciais
        emailInput.classList.add('input-error');
        senhaInput.classList.add('input-error');
        loginErrorMsg.textContent = 'email ou senha incorreta';
        loginErrorMsg.classList.remove('hidden');
    }
}

function handleLogout() {
    STATE.token = null;
    STATE.user = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    updateAuthUI();
    fetchActivities(); // Recarrega para remover likes "meus"
}

/* =========================================
   5. Métricas e Dados da Empresa
   ========================================= */
async function fetchCompanyMetrics() {
    try {
        const response = await fetch(`${API_BASE_URL}/general/company-metrics`);
        if (response.ok) {
            const data = await response.json();
            STATE.companyMetrics.totalAtividades = data.totalAtividades;
            STATE.companyMetrics.totalCalorias = data.totalCalorias;
            STATE.companyMetrics.companyName = data.nome;
            STATE.companyMetrics.companyLogo = data.logo ? `assets/logo_saepsaude/${data.logo}` : 'assets/logo_saepsaude/SAEPSaude.png';
            
            // updateAuthUI() is called after fetchCompanyMetrics in init()
            // so, no need to call it here.
        }
    } catch (error) {
        console.error('Não foi possível buscar métricas da empresa.', error);
    }
}

/* =========================================
   6. Atividades (Listagem e Renderização)
   ========================================= */
async function fetchActivities(page = STATE.currentPage) {
    const limit = STATE.itemsPerPage;
    const tipo = STATE.currentFilter;
    
    // Monta URL
    let url = `${API_BASE_URL}/activities?page=${page}&limit=${limit}`;
    if (tipo) url += `&tipo=${tipo}`;

    const headers = {};
    if (STATE.token) {
        headers['Authorization'] = `Bearer ${STATE.token}`;
    }

    try {
        const response = await fetch(url, { headers });
        const data = await response.json();

        if (response.ok) {
            STATE.currentPage = data.currentPage;
            renderActivities(data.atividades);
            renderPagination(data.totalPages, data.currentPage);
        } else {
            console.error('Erro ao buscar atividades');
        }
    } catch (error) {
        console.error('Erro de rede', error);
    }
}

function renderActivities(activities) {
    activitiesList.innerHTML = '';

    if (activities.length === 0) {
        activitiesList.innerHTML = '<p style="text-align:center; padding:20px;">Nenhuma atividade encontrada.</p>';
        return;
    }

    activities.forEach(act => {
        const card = document.createElement('div');
        card.className = 'activity-card';
        card.innerHTML = buildCardHTML(act);
        
        // Adiciona event listeners para botões do card
        const btnLike = card.querySelector('.btn-like');
        const btnComment = card.querySelector('.btn-comment');
        const formComment = card.querySelector('.form-comment'); // Formulário de comentário dinâmico

        btnLike.addEventListener('click', () => toggleLike(act.id, btnLike));
        btnComment.addEventListener('click', () => toggleCommentSection(card, act.id));
        
        if (formComment) {
            const input = formComment.querySelector('input');
            const btnSend = formComment.querySelector('.btn-send-comment');
            
            btnSend.addEventListener('click', (e) => {
                e.preventDefault();
                postComment(act.id, input.value, card);
            });
        }

        activitiesList.appendChild(card);
    });
}

function buildCardHTML(activity) {
    // Formatação de Dados
    const dataObj = new Date(activity.dataCriacao);
    const timeStr = dataObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const dateStr = dataObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
    const formattedDate = `${timeStr} - ${dateStr}`; // HH:MM - DD/MM/YY

    // Conversão de Unidades (apenas visual)
    const distKm = activity.distanciaMetros / 1000;
    // O requisito pede conversão para horas, mas a imagem mostra 'min'. 
    // Vamos exibir em 'min' se < 60, ou 'h' se preferir, mas vou seguir a imagem fielmente '50 min'.
    // Caso precise estritamente de horas: (activity.duracaoMinutos / 60).toFixed(2) + ' h'
    const duracaoDisplay = `${activity.duracaoMinutos} min`; 

    // Imagem do usuário (caminho relativo assets)
    const userFoto = activity.Usuario.foto ? `assets/imagens_perfil/${activity.Usuario.foto}` : 'assets/logo_saepsaude/SAEPSaude.png';

    // Estado do Like
    const likeSrc = activity.hasLiked ? 'assets/icones/CoracaoVermelho.svg' : 'assets/icones/coracao.svg';
    // Se não tiver o arquivo CoracaoVermelho.svg, usamos filtro CSS na classe .liked-icon
    // No código abaixo, uso a lógica da imagem src, mas também adiciono classe para facilitar.

    return `
        <div class="card-header">
            <div class="user-info">
                <img src="${userFoto}" alt="${activity.Usuario.nome}">
                <span class="user-name">${activity.Usuario.nome}</span>
            </div>
            <span class="activity-title">${activity.tipo}</span>
            <span class="activity-date">${formattedDate}</span>
        </div>
        
        <div class="card-stats">
            <div class="stat-item">
                <span class="stat-value">${distKm} km</span>
                <span class="stat-label">Distância</span>
            </div>
            <div class="stat-item">
                <span class="stat-value">${duracaoDisplay}</span>
                <span class="stat-label">Duração</span>
            </div>
            <div class="stat-item">
                <span class="stat-value">${activity.calorias}</span>
                <span class="stat-label">Calorias</span>
            </div>
        </div>

        <div class="card-actions">
            <button class="action-btn btn-like" aria-label="Curtir">
                <img src="${likeSrc}" class="icon-svg ${activity.hasLiked ? 'liked-icon' : ''}" alt="Like">
                <span class="like-count">${activity.contadorLikes}</span>
            </button>
            
            <button class="action-btn btn-comment" aria-label="Comentar">
                <img src="assets/icones/comentario.svg" class="icon-svg" alt="Comentário">
                <span class="comment-count">${activity.contadorComentarios}</span>
            </button>
        </div>

        <div class="comments-section hidden">
            <div class="comment-input-wrapper">
                <form class="form-comment" style="display:flex; width:100%; gap:10px;">
                    <input type="text" class="comment-input" placeholder="Escrever um comentário...">
                    <button type="submit" class="btn-send-comment">
                        <img src="assets/icones/send.svg" alt="Enviar">
                    </button>
                </form>
            </div>
            <div class="comments-list">
                <p style="padding:10px; font-size:0.8rem; color:#666;">Carregando...</p>
            </div>
        </div>
    `;
}

/* =========================================
   7. Paginação e Filtros
   ========================================= */
function renderPagination(totalPages, currentPage) {
    pageNumbersContainer.innerHTML = '';

    // Botão Anterior
    btnPagePrev.disabled = currentPage === 1;
    btnPagePrev.onclick = () => {
        if (currentPage > 1) fetchActivities(currentPage - 1);
    };

    // Números
    // Simplificação: mostra todas ou range simples. 
    // Para 4 itens por pagina e poucos dados, renderizar todas é ok.
    for (let i = 1; i <= totalPages; i++) {
        const btn = document.createElement('button');
        btn.className = `page-num ${i === currentPage ? 'active' : ''}`;
        btn.textContent = i;
        btn.onclick = () => fetchActivities(i);
        pageNumbersContainer.appendChild(btn);
    }

    // Botão Próximo
    btnPageNext.disabled = currentPage === totalPages || totalPages === 0;
    btnPageNext.onclick = () => {
        if (currentPage < totalPages) fetchActivities(currentPage + 1);
    };
}

// Event Listener Filtros
filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        // Se não logado, abre modal (Requisito: "interação com filtros... abre modal de login")
        if (!STATE.token) {
            openModal();
            return;
        }

        // UI Update
        filterButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Logic Update
        STATE.currentFilter = btn.dataset.type;
        STATE.currentPage = 1; // Reset pra primeira página
        fetchActivities();
    });
});

// Event Listener Items Per Page
selectItemsPerPage.addEventListener('change', (e) => {
    if (!STATE.token) {
        openModal();
        // Reverte seleção visualmente se quiser, mas o modal bloqueia o fluxo
        return;
    }
    STATE.itemsPerPage = parseInt(e.target.value);
    STATE.currentPage = 1;
    fetchActivities();
});

/* =========================================
   8. Ações: Likes e Comentários
   ========================================= */
async function toggleLike(activityId, btnElement) {
    if (!STATE.token) {
        openModal();
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/activities/${activityId}/toggle-like`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${STATE.token}` }
        });

        if (response.ok) {
            const data = await response.json();
            
            // Atualiza UI Localmente
            const img = btnElement.querySelector('img');
            const span = btnElement.querySelector('.like-count');
            
            span.textContent = data.totalLikes;
            
            if (data.liked) {
                // Troca para ícone vermelho ou adiciona classe
                img.src = 'assets/icones/CoracaoVermelho.svg';
                img.classList.add('liked-icon');
            } else {
                img.src = 'assets/icones/coracao.svg';
                img.classList.remove('liked-icon');
            }
        }
    } catch (error) {
        console.error('Erro ao dar like', error);
    }
}

async function toggleCommentSection(card, activityId) {
    if (!STATE.token) {
        openModal();
        return;
    }

    const section = card.querySelector('.comments-section');
    const listContainer = section.querySelector('.comments-list');
    
    // Toggle visibilidade
    section.classList.toggle('hidden');

    // Se abriu, carrega comentários
    if (!section.classList.contains('hidden')) {
        listContainer.innerHTML = '<p style="padding:10px; font-size:0.8rem;">Carregando...</p>';
        
        try {
            const response = await fetch(`${API_BASE_URL}/activities/${activityId}/comments`, {
                headers: { 'Authorization': `Bearer ${STATE.token}` }
            });
            const comments = await response.json();
            
            renderCommentsList(comments, listContainer);

        } catch (error) {
            listContainer.innerHTML = '<p style="color:red;">Erro ao carregar.</p>';
        }
    }
}

function renderCommentsList(comments, container) {
    container.innerHTML = '';
    if (comments.length === 0) {
        container.innerHTML = '<p style="padding:10px; color:#888;">Seja o primeiro a comentar.</p>';
        return;
    }

    comments.forEach(c => {
        const item = document.createElement('div');
        item.className = 'comment-item';
        item.innerHTML = `
            <span class="comment-user">${c.Usuario.nome}:</span>
            <span>${c.texto}</span>
        `;
        container.appendChild(item);
    });
}

async function postComment(activityId, text, card) {
    // Validação
    if (!text || text.trim().length <= 2) {
        alert('não é possível enviar um comentário vazio'); // Mensagem exata do requisito
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/activities/${activityId}/comments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${STATE.token}`
            },
            body: JSON.stringify({ texto: text })
        });

        if (response.ok) {
            // Limpa input
            const input = card.querySelector('.comment-input');
            input.value = '';

            // Atualiza contador (+1)
            const countSpan = card.querySelector('.comment-count');
            countSpan.textContent = parseInt(countSpan.textContent) + 1;

            // Recarrega lista de comentários
            toggleCommentSection(card, activityId); // Fecha e abre (simples) ou chama fetch direto
            // Melhor: recarregar lista sem fechar
            const listContainer = card.querySelector('.comments-list');
            const listRes = await fetch(`${API_BASE_URL}/activities/${activityId}/comments`, {
                headers: { 'Authorization': `Bearer ${STATE.token}` }
            });
            const comments = await listRes.json();
            renderCommentsList(comments, listContainer);
        }

    } catch (error) {
        console.error('Erro ao comentar', error);
    }
}

/* =========================================
   9. Criar Atividade
   ========================================= */
// Navegação Sidebar (Botão Atividade)
btnSidebarAtividades.addEventListener('click', () => {
    if (!STATE.token) return; // Deveria estar disabled, mas garante segurança
    
    // Muda estilo do botão
    btnSidebarAtividades.classList.add('active');
    
    // Troca View
    showView('create');
});

function showView(viewName) {
    if (viewName === 'create') {
        viewFeed.classList.add('hidden');
        viewCreate.classList.remove('hidden');
        document.querySelector('.filters-bar').classList.add('hidden'); // Oculta filtros na criação? Requisito visual não especifica, mas é boa prática.
        // Na imagem de referencia, parece que a lista está oculta ou abaixo. O código HTML tem sections separadas.
    } else {
        viewFeed.classList.remove('hidden');
        viewCreate.classList.add('hidden');
        document.querySelector('.filters-bar').classList.remove('hidden');
        btnSidebarAtividades.classList.remove('active');
    }
}

formCreateActivity.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const tipo = formCreateActivity.tipo.value;
    const distancia = formCreateActivity.distanciaMetros.value;
    const duracao = formCreateActivity.duracaoMinutos.value;
    const calorias = formCreateActivity.calorias.value;

    // Reseta erros visuais
    Array.from(formCreateActivity.elements).forEach(el => el.classList.remove('input-error'));

    // Validação
    let hasError = false;
    if (!tipo) { formCreateActivity.tipo.classList.add('input-error'); hasError = true; }
    if (!distancia) { formCreateActivity.distanciaMetros.classList.add('input-error'); hasError = true; }
    if (!duracao) { formCreateActivity.duracaoMinutos.classList.add('input-error'); hasError = true; }
    if (!calorias) { formCreateActivity.calorias.classList.add('input-error'); hasError = true; }

    if (hasError) {
        // Não há um lugar especifico pra msg global de erro no form de criação no enunciado, 
        // diz apenas "exibir o texto Campo obrigatório".
        // Podemos criar um alert ou injetar texto. Como o enunciado pede bordas vermelhas E texto,
        // vamos assumir um alert simples ou inserir no DOM se houver espaço. 
        // Vou usar um alert customizado no DOM para ser "clean" ou apenas a borda conforme a imagem?
        // O requisito diz: "exibir o texto Campo obrigatório".
        // Vou adicionar um span dinâmico se ele não existir.
        let errorSpan = document.getElementById('create-error');
        if (!errorSpan) {
            errorSpan = document.createElement('div');
            errorSpan.id = 'create-error';
            errorSpan.style.color = 'red';
            errorSpan.style.textAlign = 'center';
            errorSpan.style.marginTop = '10px';
            formCreateActivity.appendChild(errorSpan);
        }
        errorSpan.textContent = 'Campo obrigatório';
        return;
    }

    // Submit
    try {
        const response = await fetch(`${API_BASE_URL}/activities`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${STATE.token}`
            },
            body: JSON.stringify({
                tipo,
                titulo: tipo, // O titulo é o tipo segundo o design (Corrida, Caminhada...)
                distanciaMetros: parseFloat(distancia),
                duracaoMinutos: parseFloat(duracao),
                calorias: parseFloat(calorias)
            })
        });

        if (response.ok) {
            // Sucesso
            formCreateActivity.reset();
            if(document.getElementById('create-error')) document.getElementById('create-error').remove();
            
            // Atualiza métricas do usuário localmente (opcional, ou faz fetch /me)
            STATE.user.totalAtividades++;
            STATE.user.totalCalorias += parseFloat(calorias);
            updateAuthUI();

            // Volta para o feed e recarrega
            showView('feed');
            fetchActivities(1); // Volta pra página 1 pra ver a nova atividade
        } else {
            console.error('Erro ao criar');
        }

    } catch (error) {
        console.error('Erro de rede', error);
    }
});

/* =========================================
   10. Lógica do Modal (Login)
   ========================================= */
function openModal() {
    modalOverlay.classList.remove('hidden');
    loginErrorMsg.classList.add('hidden'); // Reseta msg
    formLogin.reset();
    // Reseta bordas
    formLogin.email.classList.remove('input-error');
    formLogin.senha.classList.remove('input-error');
}

function closeModal() {
    modalOverlay.classList.add('hidden');
}

// Event Listeners do Modal
btnLogin.addEventListener('click', openModal);
btnLogout.addEventListener('click', handleLogout);
btnCloseModal.addEventListener('click', closeModal);
btnCancelLogin.addEventListener('click', closeModal);
formLogin.addEventListener('submit', handleLogin);

// Fecha ao clicar fora
modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal();
});