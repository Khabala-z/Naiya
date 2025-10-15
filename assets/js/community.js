// community.js - Sistema de comunidad con videos de señas

// Base de datos simulada de posts (aquí puedes poner tus videos reales)
let communityPosts = [
    {
        id: 1,
        username: "Carlos Mendoza",
        avatar: "assets/img/avatars/carlos.jpg", // Ruta a la foto de tu amigo
        videoUrl: "assets/videos/tlazohcamati.mp4", // Ruta a tu video 1
        word: "Cómo estás?",
        meaning: "Saludo en Lengua de Señas Mexicana",
        likes: 42,
        likedByUser: false,
        comments: [
            { username: "María García", text: "¡Excelente explicación!", date: "Hace 2 horas" },
            { username: "Pedro López", text: "Me ayudó mucho, gracias", date: "Hace 5 horas" }
        ],
        date: "07/10/2025"
    },
    {
        id: 2,
        username: "Luis Ramírez",
        avatar: "assets/img/avatars/luis.jpg", // Ruta a la foto de tu amigo
        videoUrl: "assets/videos/hola.mp4", // Ruta a tu video 2
        word: "Hola",
        meaning: "Saludo en Lengua de Señas Mexicana",
        likes: 38,
        likedByUser: false,
        comments: [
            { username: "Ana Torres", text: "Muy claro el movimiento", date: "Hace 3 horas" }
        ],
        date: "06/10/2025"
    }
];

// Variables globales
let currentPostId = null;

// Inicializar la comunidad
function initCommunity() {
    renderPosts();
    setupEventListeners();
}

// Renderizar todos los posts
function renderPosts() {
    const container = document.getElementById('video-posts-container');
    container.innerHTML = '';
    
    communityPosts.forEach(post => {
        const postElement = createPostElement(post);
        container.appendChild(postElement);
    });
}

// Crear elemento de post
function createPostElement(post) {
    const article = document.createElement('article');
    article.className = 'video-post glass-effect';
    article.dataset.postId = post.id;
    
    article.innerHTML = `
        <div class="post-header">
            <img src="${post.avatar}" alt="${post.username}" class="avatar" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2250%22 height=%2250%22><circle cx=%2225%22 cy=%2225%22 r=%2225%22 fill=%22%2300d4ff%22/><text x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22white%22 font-size=%2220%22>${post.username.charAt(0)}</text></svg>'">
            <div class="user-info">
                <p class="username">${post.username}</p>
                <p class="post-date">${post.date}</p>
            </div>
        </div>
        
        <div class="video-container" onclick="openVideoModal(${post.id})">
            <video class="video-preview" preload="metadata">
                <source src="${post.videoUrl}" type="video/mp4">
                Tu navegador no soporta videos.
            </video>
            <div class="play-overlay">
                <span class="play-icon">▶️</span>
            </div>
        </div>
        
        <div class="post-details">
            <p class="word">${post.word}</p>
            <p class="meaning">${post.meaning}</p>
        </div>
        
        <div class="post-actions">
            <button class="action-btn like-btn ${post.likedByUser ? 'liked' : ''}" onclick="toggleLike(${post.id})">
                <span class="icon">${post.likedByUser ? '❤️' : '🤍'}</span>
                <span class="count">${post.likes}</span>
            </button>
            <button class="action-btn comment-btn" onclick="openCommentsModal(${post.id})">
                <span class="icon">💬</span>
                <span class="count">${post.comments.length}</span>
            </button>
            <button class="action-btn share-btn" onclick="sharePost(${post.id})">
                <span class="icon">🔗</span>
                <span>Compartir</span>
            </button>
        </div>
    `;
    
    return article;
}

// Toggle like
function toggleLike(postId) {
    const post = communityPosts.find(p => p.id === postId);
    if (!post) return;
    
    post.likedByUser = !post.likedByUser;
    post.likes += post.likedByUser ? 1 : -1;
    
    // Actualizar UI
    const postElement = document.querySelector(`[data-post-id="${postId}"]`);
    const likeBtn = postElement.querySelector('.like-btn');
    const icon = likeBtn.querySelector('.icon');
    const count = likeBtn.querySelector('.count');
    
    if (post.likedByUser) {
        likeBtn.classList.add('liked');
        icon.textContent = '❤️';
    } else {
        likeBtn.classList.remove('liked');
        icon.textContent = '🤍';
    }
    count.textContent = post.likes;
    
    // Animación
    likeBtn.classList.add('pulse');
    setTimeout(() => likeBtn.classList.remove('pulse'), 300);
}

// Abrir modal de video
function openVideoModal(postId) {
    const post = communityPosts.find(p => p.id === postId);
    if (!post) return;
    
    const modal = document.getElementById('video-modal');
    const container = document.getElementById('modal-video-container');
    
    container.innerHTML = `
        <video controls autoplay class="modal-video">
            <source src="${post.videoUrl}" type="video/mp4">
        </video>
    `;
    
    document.getElementById('modal-word').textContent = post.word;
    document.getElementById('modal-meaning').textContent = post.meaning;
    document.getElementById('modal-username').textContent = `Por ${post.username}`;
    
    modal.style.display = 'flex';
}

// Abrir modal de comentarios
function openCommentsModal(postId) {
    currentPostId = postId;
    const post = communityPosts.find(p => p.id === postId);
    if (!post) return;
    
    const modal = document.getElementById('comments-modal');
    const commentsList = document.getElementById('comments-list');
    
    // Renderizar comentarios
    commentsList.innerHTML = post.comments.map(comment => `
        <div class="comment-item">
            <div class="comment-header">
                <span class="comment-username">${comment.username}</span>
                <span class="comment-date">${comment.date}</span>
            </div>
            <p class="comment-text">${comment.text}</p>
        </div>
    `).join('');
    
    if (post.comments.length === 0) {
        commentsList.innerHTML = '<p class="no-comments">No hay comentarios aún. ¡Sé el primero!</p>';
    }
    
    modal.style.display = 'flex';
    document.getElementById('comment-input').value = '';
}

// Publicar comentario
function postComment() {
    const input = document.getElementById('comment-input');
    const text = input.value.trim();
    
    if (!text || !currentPostId) return;
    
    const post = communityPosts.find(p => p.id === currentPostId);
    if (!post) return;
    
    const newComment = {
        username: "Tú", // Aquí podrías usar el nombre del usuario actual
        text: text,
        date: "Ahora"
    };
    
    post.comments.unshift(newComment);
    
    // Actualizar modal
    openCommentsModal(currentPostId);
    
    // Actualizar contador en el post
    const postElement = document.querySelector(`[data-post-id="${currentPostId}"]`);
    const commentCount = postElement.querySelector('.comment-btn .count');
    commentCount.textContent = post.comments.length;
    
    // Animación de éxito
    input.value = '';
    input.placeholder = '¡Comentario publicado! ✓';
    setTimeout(() => {
        input.placeholder = 'Escribe tu comentario...';
    }, 2000);
}

// Compartir post
function sharePost(postId) {
    const post = communityPosts.find(p => p.id === postId);
    if (!post) return;
    
    // Simular compartir
    if (navigator.share) {
        navigator.share({
            title: `${post.word} - Naiya`,
            text: `Aprende "${post.word}" (${post.meaning}) en Naiya`,
            url: window.location.href
        }).catch(() => {});
    } else {
        // Copiar al portapapeles
        const url = `${window.location.href}#post-${postId}`;
        navigator.clipboard.writeText(url).then(() => {
            alert('¡Enlace copiado al portapapeles!');
        });
    }
}

// Configurar event listeners
function setupEventListeners() {
    // Cerrar modales
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.onclick = function() {
            const modal = this.closest('.modal');
            modal.style.display = 'none';
            
            // Detener video si está reproduciéndose
            const video = modal.querySelector('video');
            if (video) video.pause();
        };
    });
    
    // Cerrar modal al hacer click fuera
    window.onclick = function(event) {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = 'none';
            const video = event.target.querySelector('video');
            if (video) video.pause();
        }
    };
    
    // Botón de publicar comentario
    const btnPostComment = document.getElementById('btn-post-comment');
    if (btnPostComment) {
        btnPostComment.onclick = postComment;
    }
    
    // Enter en textarea para comentar
    const commentInput = document.getElementById('comment-input');
    if (commentInput) {
        commentInput.onkeydown = function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                postComment();
            }
        };
    }
    
    // Botón de subir video
    const btnUpload = document.getElementById('btn-upload-video');
    if (btnUpload) {
        btnUpload.onclick = function() {
            alert('Función de subir video en desarrollo. Aquí podrás grabar o subir tus propios videos de señas.');
        };
    }
}

// Hacer funciones globales
window.toggleLike = toggleLike;
window.openVideoModal = openVideoModal;
window.openCommentsModal = openCommentsModal;
window.sharePost = sharePost;

// Inicializar cuando la página cargue
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCommunity);
} else {
    initCommunity();
}