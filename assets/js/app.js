// assets/js/app.js - Lógica Principal para Naiya PWA

// ===========================================
// 1. CONFIGURACIÓN DE GEMINI Y VARIABLES GLOBALES
// ===========================================
// CLAVE API: Reemplaza con tu clave real.
const GEMINI_API_KEY = 'AIzaSyAJ_s0uxcvQmh5iTiLMiqMtNodbR4gqPqI'; 
const GEMINI_MODEL = 'gemini-2.5-flash'; 
const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/' + GEMINI_MODEL + ':generateContent?key=' + GEMINI_API_KEY;

// Elementos del DOM para interacción
const navButtons = document.querySelectorAll('.app-navbar .nav-item');
const views = document.querySelectorAll('.app-content .view');
const btnEscribir = document.getElementById('btn-escribir');
const textInput = document.getElementById('text-input');
const btnHablar = document.getElementById('btn-hablar');
const btnCamara = document.getElementById('btn-camara');
const translationCard = document.querySelector('.translation-card .example');


// ===========================================
// 2. INICIALIZACIÓN Y NAVEGACIÓN
// ===========================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('Naiya App: Lógica JavaScript cargada.');
    
    // Iniciar en la vista 'inicio'
    setActiveView('inicio');

    // Manejo de la navegación (Menú inferior)
    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetViewId = button.getAttribute('data-view');
            setActiveView(targetViewId);

            navButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
        });
    });

    /**
     * Muestra la vista objetivo y oculta las demás.
     * @param {string} viewId - El ID de la sección (ej: 'inicio', 'comunidad').
     */
    function setActiveView(viewId) {
        views.forEach(view => {
            view.classList.remove('active');
            view.classList.add('hidden');
            if (view.id === viewId) {
                view.classList.remove('hidden');
                view.classList.add('active');
            }
        });
         // Asegurarse de que el input esté oculto al cambiar de vista
        if (viewId !== 'inicio') {
            textInput.style.display = 'none';
        }
    }

    // ===========================================
    // 3. LÓGICA DE INTERACCIÓN Y TRADUCCIÓN (IA)
    // ===========================================

    // Manejar el botón 'Escribir'
    btnEscribir.addEventListener('click', () => {
        const isHidden = textInput.style.display === 'none' || textInput.style.display === '';
        
        if (isHidden) {
            textInput.style.display = 'block';
            textInput.focus();
            btnEscribir.textContent = '✅ Enviar Texto'; 
        } else {
            handleTranslation(textInput.value, 'texto'); // Llamada a traducción
            textInput.value = ''; 
            textInput.style.display = 'none';
            btnEscribir.textContent = '📝 Escribir'; 
        }
    });

    // Manejar el botón 'Hablar' (Simulación de Voz)
    btnHablar.addEventListener('click', () => {
        // SIMULACIÓN: La IA transcribe la voz a texto
        const recognizedSpeech = prompt('🎤 SIMULACIÓN VOZ: Introduce la frase que la persona dijo (Ej: I need help).');
        if (recognizedSpeech) {
            handleTranslation(recognizedSpeech, 'voz');
        } else {
            alert('Grabación de voz cancelada.');
        }
    });

    // Manejar el botón 'Cámara' (Simulación de Señas)
    btnCamara.addEventListener('click', () => {
        // SIMULACIÓN: La IA detecta la seña y la describe
        const detectedSign = prompt('📸 SIMULACIÓN SEÑAS: Escribe la seña detectada (Ej: "manos forman un corazón" o "seña de ayuda").');
        if (detectedSign) {
            handleTranslation(detectedSign, 'señas');
        } else {
            alert('Detección de señas cancelada.');
        }
    });

    /**
     * Función unificada de traducción que maneja Texto, Voz y Señas mediante Gemini.
     * @param {string} input - Texto, la frase reconocida (voz) o la descripción de la seña.
     * @param {string} type - Tipo de entrada: 'texto', 'voz' o 'señas'.
     */
    async function handleTranslation(input, type) {
        if (input.trim() === '') {
            return;
        }

        const sourceLabel = type === 'texto' ? 'Tú escribes' : type === 'voz' ? 'Tú hablas' : 'Seña detectada';
        
        const loadingMessage = document.createElement('p');
        loadingMessage.className = 'loading-ia';
        loadingMessage.innerHTML = `${sourceLabel}: **${input}** → Naiya IA: ⏳ Traduciendo...`;
        translationCard.prepend(loadingMessage);

        // Ajustamos el prompt para ser más descriptivo, especialmente con señas.
        const prompt = type === 'señas'
            ? `Soy un modelo de IA que detecta el lenguaje de señas. Traduce al español lo que la seña "${input}" significa y responde únicamente con la traducción.`
            : `Traduce y responde únicamente con la traducción al español, de forma concisa y natural: "${input}"`;

        try {
            const response = await fetch(GEMINI_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ role: "user", parts: [{ text: prompt }] }]
                })
            });

            const data = await response.json();
            
            // Verificación básica de la respuesta
            if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
                 throw new Error('Respuesta de la API incompleta o clave incorrecta.');
            }

            let translatedText = data.candidates[0].content.parts[0].text.trim();

            loadingMessage.remove(); 
            
            const newTranslation = document.createElement('p');
            newTranslation.innerHTML = `${sourceLabel}: "${input}" → Naiya: <strong>${translatedText}</strong>`;
            
            if (translationCard.children.length >= 4) {
                translationCard.removeChild(translationCard.lastChild);
            }
            translationCard.prepend(newTranslation);

        } catch (error) {
            loadingMessage.innerHTML = `Naiya IA: ❌ Error de traducción. Revisa tu clave API o la conexión. Mensaje: ${error.message}`;
            console.error('Error al llamar a la API de Gemini:', error);
        }
    }


    // ===========================================
    // 4. LÓGICA DE PWA (Service Worker)
    // ===========================================
    
    // Este código se mantiene en index.html, solo se imprime el estado en app.js
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistration().then(registration => {
            if (registration) {
                console.log('PWA: Service Worker ya registrado.');
            }
        });
    }

});