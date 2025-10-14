// ======================================================
// assets/js/app.js - Lógica Principal Unificada para Naiya PWA
// ======================================================

// ===========================================
// 1. CONFIGURACIÓN DE GEMINI Y VARIABLES GLOBALES
// ===========================================
// NOTA: La clave se ha establecido a null para hacer explícita la simulación.
const GEMINI_API_KEY = null; 
const GEMINI_MODEL = 'gemini-2.5-flash';
const GEMINI_ENDPOINT =
  'https://generativelanguage.googleapis.com/v1beta/models/' +
  GEMINI_MODEL +
  ':generateContent?key=';

// Variables globales
let currentMode = null; // 'escribir', 'hablar', 'camara'
let conversationHistory = [];
let recognition = null; // Para reconocimiento de voz
let currentVoiceLang = 'es-MX'; // Idioma por defecto para reconocimiento de voz

// Elementos del DOM
const navButtons = document.querySelectorAll('.app-navbar .nav-item');
const views = document.querySelectorAll('.app-content .view');
const btnEscribir = document.getElementById('btn-escribir');
const btnHablar = document.getElementById('btn-hablar');
const btnCamara = document.getElementById('btn-camara');
const conversationBox = document.querySelector('.conversation-box');
const darkModeToggle = document.getElementById('dark-mode-toggle');
const appContainer = document.body;

// ===========================================
// 2. INICIALIZACIÓN Y NAVEGACIÓN ENTRE VISTAS
// ===========================================
document.addEventListener('DOMContentLoaded', () => {
  console.log('Naiya App Iniciada ✨');

  navButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const targetViewId = button.getAttribute('data-view');
      setActiveView(targetViewId);

      navButtons.forEach((btn) => btn.classList.remove('active'));
      button.classList.add('active');

      if (targetViewId !== 'inicio') {
        currentMode = null;
      }
    });
  });

  // ===========================================
  // 3. MODO OSCURO
  // ===========================================
  const savedTheme = localStorage.getItem('naiya-theme');
  if (savedTheme === 'dark') {
    appContainer.classList.add('dark-mode');
    if (darkModeToggle) darkModeToggle.checked = true;
  }

  if (darkModeToggle) {
    darkModeToggle.addEventListener('change', (e) => {
      if (e.target.checked) {
        appContainer.classList.add('dark-mode');
        localStorage.setItem('naiya-theme', 'dark');
      } else {
        appContainer.classList.remove('dark-mode');
        localStorage.setItem('naiya-theme', 'light');
      }
    });
  }

  // ===========================================
  // 4. BOTONES DE INTERACCIÓN (Escribir, Hablar, Cámara)
  // ===========================================
  if (btnEscribir) {
    btnEscribir.addEventListener('click', () => {
      activateMode('escribir', '✏️');
    });
  }

  if (btnHablar) {
    btnHablar.addEventListener('click', () => {
      activateMode('hablar', '🎤');
    });
  }

  if (btnCamara) {
    btnCamara.addEventListener('click', () => {
      activateMode('camara', '📸');
      simulateCameraInput();
    });
  }

  // Inicializar reconocimiento de voz al cargar
  initSpeechRecognition();
});

// Función de navegación
function setActiveView(viewId) {
  views.forEach((view) => {
    view.classList.remove('active');
    view.classList.add('hidden');
    if (view.id === viewId) {
      view.classList.remove('hidden');
      view.classList.add('active');
    }
  });
}

// ===========================================
// 5. ACTIVAR MODO DE ENTRADA
// ===========================================
function activateMode(mode, icon) {
  currentMode = mode;
  
  if (!conversationBox) return;

  if (mode === 'escribir') {
    conversationBox.innerHTML = `
        <div class="input-method">
            <span class="method-icon">${icon}</span>
            <span class="method-text">Escribir</span>
        </div>
        <textarea class="text-area-input" placeholder="Escribe tu mensaje aquí y presiona Enter..." rows="3"></textarea>
        <p class="input-hint">Presiona Enter para enviar</p>
    `;

    const textarea = conversationBox.querySelector('.text-area-input');
    if (textarea) { 
      textarea.focus();
    
      textarea.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          const text = textarea.value.trim();
          if (text) {
            handleTranslation(text, 'texto');
            textarea.value = ''; 
          }
        }
      });
    }
  } else if (mode === 'hablar') {
    // Mostrar selector de idioma y botón de grabar
    conversationBox.innerHTML = `
        <div class="input-method">
            <span class="method-icon">${icon}</span>
            <span class="method-text">Hablar</span>
        </div>
        <div class="voice-controls">
            <p class="voice-instruction">Selecciona el idioma que vas a hablar:</p>
            <div class="language-selector">
                <button class="lang-btn ${currentVoiceLang === 'es-MX' ? 'active' : ''}" data-lang="es-MX">
                    <span class="flag">🇲🇽</span>
                    <span class="lang-name">Español</span>
                </button>
                <button class="lang-btn ${currentVoiceLang === 'en-US' ? 'active' : ''}" data-lang="en-US">
                    <span class="flag">🇺🇸</span>
                    <span class="lang-name">English</span>
                </button>
            </div>
            <button class="record-btn" id="start-recording">
                <span class="record-icon">🎤</span>
                <span class="record-text">Mantén presionado para hablar</span>
            </button>
            <p class="voice-hint">Suelta para dejar de grabar</p>
        </div>
    `;

    // Event listeners para selector de idioma
    const langButtons = conversationBox.querySelectorAll('.lang-btn');
    langButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const selectedLang = btn.getAttribute('data-lang');
        currentVoiceLang = selectedLang;
        
        // Actualizar UI
        langButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        console.log('🌐 Idioma seleccionado:', selectedLang);
      });
    });

    // Event listener para el botón de grabar
    const recordBtn = conversationBox.querySelector('#start-recording');
    if (recordBtn) {
      // Para móvil: usar touch events
      recordBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        startVoiceRecognition();
      });
      
      recordBtn.addEventListener('touchend', (e) => {
        e.preventDefault();
        stopVoiceRecognition();
      });

      // Para escritorio: usar mouse events
      recordBtn.addEventListener('mousedown', () => {
        startVoiceRecognition();
      });
      
      recordBtn.addEventListener('mouseup', () => {
        stopVoiceRecognition();
      });

      // Por si se sale del botón mientras graba
      recordBtn.addEventListener('mouseleave', () => {
        if (recognition && recognition.started) {
          stopVoiceRecognition();
        }
      });
    }
  } else {
    conversationBox.innerHTML = `
        <div class="input-method">
            <span class="method-icon">${icon}</span>
            <span class="method-text">Cámara</span>
        </div>
        <div class="processing-indicator">
            <div class="spinner"></div>
            <p class="processing-text">Procesando...</p>
        </div>
    `;
  }
}

// ===========================================
// 6. RECONOCIMIENTO DE VOZ REAL
// ===========================================
function initSpeechRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  
  if (!SpeechRecognition) {
    console.warn('❌ Este navegador no soporta reconocimiento de voz');
    return null;
  }
  
  recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;
  
  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    const confidence = event.results[0][0].confidence;
    
    console.log('✅ Escuchado:', transcript);
    console.log('📊 Confianza:', (confidence * 100).toFixed(2) + '%');
    
    // Mostrar lo que se captó antes de traducir
    conversationBox.innerHTML = `
        <div class="input-method">
            <span class="method-icon">🎤</span>
            <span class="method-text">Hablar</span>
        </div>
        <div class="voice-result">
            <p class="voice-result-label">Captado:</p>
            <p class="voice-result-text">"${transcript}"</p>
            <div class="processing-indicator">
                <div class="spinner"></div>
                <p class="processing-text">Traduciendo...</p>
            </div>
        </div>
    `;
    
    // Enviar a traducir
    setTimeout(() => {
      handleTranslation(transcript, 'voz');
    }, 500);
  };
  
  recognition.onerror = (event) => {
    console.error('❌ Error en reconocimiento:', event.error);
    
    let errorMessage = 'Error al captar voz';
    let errorDetails = '';
    
    switch(event.error) {
      case 'no-speech':
        errorMessage = 'No se detectó voz';
        errorDetails = 'Intenta hablar más cerca del micrófono';
        break;
      case 'audio-capture':
        errorMessage = 'No se pudo acceder al micrófono';
        errorDetails = 'Verifica los permisos de tu navegador';
        break;
      case 'not-allowed':
        errorMessage = 'Permiso de micrófono denegado';
        errorDetails = 'Ve a la configuración de tu navegador y permite el acceso al micrófono';
        break;
      case 'network':
        errorMessage = 'Error de red';
        errorDetails = 'Verifica tu conexión a internet';
        break;
      case 'aborted':
        return; // Usuario canceló, no mostrar error
    }
    
    conversationBox.innerHTML = `
        <div class="error-message">
            <span class="error-icon">⚠️</span>
            <p class="error-title">${errorMessage}</p>
            <p class="error-details">${errorDetails}</p>
            <button class="retry-btn" onclick="document.getElementById('btn-hablar').click()">
                🔄 Intentar de nuevo
            </button>
        </div>
    `;
  };
  
  recognition.onend = () => {
    console.log('🎤 Reconocimiento terminado');
    if (recognition) {
      recognition.started = false;
    }
  };
  
  console.log('✅ Reconocimiento de voz inicializado');
  return recognition;
}

function startVoiceRecognition() {
  if (!recognition) {
    alert('⚠️ Tu navegador no soporta reconocimiento de voz');
    return;
  }
  
  recognition.lang = currentVoiceLang;
  
  // Actualizar UI para mostrar que está grabando
  const recordBtn = document.querySelector('#start-recording');
  const recordText = document.querySelector('.record-text');
  const recordIcon = document.querySelector('.record-icon');
  
  if (recordBtn) {
    recordBtn.classList.add('recording');
    if (recordText) recordText.textContent = '🔴 Grabando... Suelta para terminar';
    if (recordIcon) recordIcon.textContent = '🔴';
  }
  
  try {
    recognition.start();
    recognition.started = true;
    console.log('🎤 Iniciando grabación en:', currentVoiceLang);
  } catch (error) {
    console.error('Error al iniciar reconocimiento:', error);
  }
}

function stopVoiceRecognition() {
  if (recognition && recognition.started) {
    recognition.stop();
    recognition.started = false;
    console.log('⏹️ Deteniendo grabación');
  }
}

// ===========================================
// 7. TRADUCCIÓN CON GEMINI (O SIMULACIÓN)
// ===========================================
async function handleTranslation(input, type) {
  if (input.trim() === '') {
    return;
  }
  
  const isSimulation = (GEMINI_API_KEY === null || GEMINI_API_KEY === '');

  if (isSimulation) {
    const simulatedResult = simulateAITranslation(input, type); 
    const simulatedTranslation = simulatedResult.translation;
    const simulatedSuggestions = simulatedResult.suggestions;
    const originalLang = simulatedResult.originalLang;
      
    setTimeout(() => {
      // Naiya siempre habla la traducción en español al usuario.
      speakText(simulatedTranslation, 'es-ES'); 
          
      processInput(input, getIcon(type), getLabel(type), simulatedTranslation, simulatedSuggestions, originalLang);
    }, 800);
      
    return;
  }
  
  // --- CÓDIGO REAL DE LA API (Ignorado por ahora) ---
  // ... (código de la API) ...
  // --- FIN CÓDIGO REAL DE LA API ---
}

// ===========================================
// 8. PROCESAR Y MOSTRAR RESULTADO
// ===========================================
function processInput(userInput, icon, method, translation, suggestions, originalLang = 'en') { 
  conversationHistory.push({
    method,
    icon,
    user: userInput,
    translation,
    suggestions,
    originalLang
  });

  displayConversation(icon, method, userInput, translation, suggestions, originalLang); 
}

// CORRECCIÓN PRINCIPAL: displayConversation con event listeners
function displayConversation(icon, method, userText, translation, finalSuggestions, originalLang) { 
  const currentIcon = icon;
  const currentMethod = method;

  // Determinar el label de la sugerencia (Inglés o Náhuatl)
  const langLabel = originalLang === 'nlt' ? 'Náhuatl' : 'Original';

  conversationBox.innerHTML = `
      <div class="input-method">
          <span class="method-icon">${currentIcon}</span>
          <span class="method-text">${currentMethod}</span>
      </div>
      <div class="user-message">
          <p class="message-label">Persona dice:</p>
          <p class="message-text">"${userText}"</p>
      </div>
      <div class="naiya-translation">
          <p class="translation-label">→ Naiya traduce:</p>
          <p class="translation-text translation-text-white">"${translation}"</p>
      </div>
      <div class="divider"></div>
      <div class="suggestions">
          <p class="suggestions-label">Sugerencias de respuesta:</p>
          ${finalSuggestions
            .map((s, index) => `
              <button class="suggestion-btn" data-suggestion-index="${index}">
                  <p class="suggestion-es">"${s.es}"</p>
                  <p class="suggestion-original">→ (${langLabel}) "${s.original}"</p>
              </button>`)
            .join('')}
      </div>
  `;

  // CORRECCIÓN: Agregar event listeners después de crear los botones
  const suggestionButtons = conversationBox.querySelectorAll('.suggestion-btn');
  suggestionButtons.forEach((btn, index) => {
    btn.addEventListener('click', () => {
      const suggestion = finalSuggestions[index];
      useSuggestion(suggestion.es, suggestion.original, currentIcon, currentMethod, originalLang);
    });
  });
}

// ===========================================
// 9. FUNCIONES AUXILIARES Y SIMULACIÓN MEJORADA
// ===========================================
function getIcon(type) {
  return type === 'voz' ? '🎤' : type === 'señas' ? '📸' : '✏️';
}

function getLabel(type) {
  return type === 'voz' ? 'Hablar' : type === 'señas' ? 'Cámara' : 'Escribir';
}

/**
 * Simulación de traducción de IA mejorada con frases predefinidas.
 */
function simulateAITranslation(input, type) {
  const inputLower = input.toLowerCase().trim();
  let translation = "";
  let originalLang = "en";
    
  // --- NÁHUATL → ESPAÑOL ---
  if (inputLower === 'niltzé' || inputLower === 'niltze') {
    translation = "Hola / Saludo";
    originalLang = "nlt";
  } else if (inputLower === 'tlazohcamati') {
    translation = "Gracias";
    originalLang = "nlt";
  } else if (inputLower.includes('quéntza-timoquetza') || inputLower.includes('quentza')) { 
    translation = "¿Cómo estás?";
    originalLang = "nlt";
  } else if (inputLower.includes('cualli tonalli')) { 
    translation = "Buenos días";
    originalLang = "nlt";
  } else if (inputLower.includes('camo tiahui') || inputLower.includes('campa tiahui')) { 
    translation = "¿A dónde vamos?";
    originalLang = "nlt";
  } else if (inputLower.includes('zan ca')) { 
    translation = "Solo aquí";
    originalLang = "nlt";
  }
  // --- INGLÉS → ESPAÑOL ---
  else if (inputLower === 'hi' || inputLower === 'hello') {
    translation = "Hola";
    originalLang = "en";
  } else if (inputLower === 'thanks' || inputLower.includes('thank you')) {
    translation = "Gracias";
    originalLang = "en";
  } else if (inputLower.includes('how are you')) {
    translation = "¿Cómo estás?";
    originalLang = "en";
  } else if (inputLower.includes('where is the exit')) {
    translation = "¿Dónde está la salida?";
    originalLang = "en";
  } else if (inputLower.includes('i need water')) {
    translation = "Necesito agua";
    originalLang = "en";
  } else if (inputLower.includes('i will go with you')) {
    translation = "Te acompaño";
    originalLang = "en";
  } else if (inputLower.includes('wait a moment')) {
    translation = "Espera un momento";
    originalLang = "en";
  } else if (inputLower.includes('near here') || inputLower.includes('it is near here')) {
    translation = "Está cerca de aquí";
    originalLang = "en";
  } else if (inputLower.includes("i'm fine") || inputLower.includes('fine, and you')) {
    translation = "Estoy bien, ¿y tú?";
    originalLang = "en";
  } else if (inputLower.includes('what do you need')) {
    translation = "¿Qué necesitas?";
    originalLang = "en";
  } else if (inputLower.includes('tell me more')) {
    translation = "Cuéntame más";
    originalLang = "en";
  } else if (inputLower.includes('you are welcome') || inputLower.includes('welcome')) {
    translation = "De nada";
    originalLang = "en";
  } else if (inputLower.includes('with pleasure')) {
    translation = "Con gusto";
    originalLang = "en";
  } else if (inputLower.includes('see you soon')) {
    translation = "Nos vemos pronto";
    originalLang = "en";
  }
  // --- SEÑAS ---
  else if (type === 'señas') {
    // Detectar tipo de seña por el texto
    if (inputLower.includes('mano abierta') || inputLower.includes('👋')) {
      translation = "Hola";
      originalLang = "en";
    } else if (inputLower.includes('pulgar arriba') || inputLower.includes('👍')) {
      translation = "¿Cómo estás?";
      originalLang = "en";
    } else if (inputLower.includes('victoria') || inputLower.includes('✌️')) {
      translation = "Gracias";
      originalLang = "en";
    } else if (inputLower.includes('ok') || inputLower.includes('👌')) {
      translation = "De nada";
      originalLang = "en";
    } else {
      translation = "Gesto interpretado: '¿Cómo puedo ayudarte?'";
      originalLang = "en";
    }
  }
  // --- FALLBACK ---
  else {
    translation = "Entiendo lo que dices. Por favor, continúa";
    originalLang = "en";
  }
    
  const suggestions = generateDynamicSuggestions(translation, originalLang);
    
  return { translation, suggestions, originalLang };
}

/**
 * Genera sugerencias de respuesta.
 */
function generateDynamicSuggestions(translation, originalLang) {
  // --- Sugerencias para INGLÉS ---
  if (originalLang === 'en') {
    if (translation.includes('Hola') || translation.includes('¿Cómo estás?')) {
      return [
        { es: 'Estoy bien, ¿y tú?', original: "I'm fine, and you?" },
        { es: '¿Qué necesitas?', original: 'What do you need?' },
        { es: 'Cuéntame más', original: 'Tell me more' }
      ];
    } else if (translation.includes('Gracias') || translation.includes('Te acompaño')) {
      return [
        { es: 'De nada', original: 'You are welcome' },
        { es: 'Con gusto', original: 'With pleasure' },
        { es: 'Nos vemos pronto', original: 'See you soon' }
      ];
    } else if (translation.includes('salida') || translation.includes('agua') || translation.includes('Necesito')) {
      return [
        { es: 'Espera un momento', original: 'Wait a moment' },
        { es: 'Te acompaño', original: 'I will go with you' }, 
        { es: 'Está cerca de aquí', original: 'It is near here' }
      ];
    }
  } 
  // --- Sugerencias para NÁHUATL ---
  else if (originalLang === 'nlt') {
    if (translation.includes('Hola') || translation.includes('¿Cómo estás?')) {
      return [
        { es: 'Estoy bien, ¿y tú?', original: 'cualli, ¿hueliz?' },
        { es: '¿Qué necesitas?', original: 'tlein timonequi?' },
        { es: 'Cuéntame más', original: 'xicneltocan' }
      ];
    } else if (translation.includes('Gracias') || translation.includes('Buenos días')) {
      return [
        { es: 'De nada', original: 'ahtle' },
        { es: 'Con gusto', original: 'pampa nech paquia' },
        { es: 'Que te vaya bien', original: 'ma cualli mochihua' }
      ];
    } else if (translation.includes('dónde vamos') || translation.includes('Solo aquí')) {
      return [
        { es: 'Espera un momento', original: 'xinechchia' },
        { es: 'Vamos juntos', original: 'tiyazque noihuan' },
        { es: 'Está cerca', original: 'techpan' }
      ];
    }
  }

  // Sugerencias genéricas
  return [
    { es: 'Gracias por tu mensaje', original: originalLang === 'nlt' ? 'tlazohcamati' : 'Thank you' },
    { es: '¿Puedes repetir?', original: originalLang === 'nlt' ? 'xicilhui oc ceppa' : 'Can you repeat?' },
    { es: 'Necesito un momento', original: originalLang === 'nlt' ? 'nicnequi ce ratitlan' : 'I need a moment' }
  ];
}

// CORRECCIÓN PRINCIPAL: useSuggestion completamente reescrita
function useSuggestion(esText, originalText, previousIcon, previousMethod, originalLang) {
  console.log('🔵 Sugerencia seleccionada:', { esText, originalText, originalLang });
  
  // 1. Naiya lee la sugerencia en el IDIOMA ORIGINAL para que la otra persona entienda
  const langCode = originalLang === 'nlt' ? 'es-MX' : 'en-US';
  speakText(originalText, langCode); 

  // 2. Añadir a la conversación lo que TÚ dijiste (la sugerencia)
  conversationHistory.push({
    method: 'Respuesta',
    icon: '💬',
    user: esText,
    translation: originalText,
    suggestions: [],
    originalLang: 'es'
  });

  // 3. Mostrar TODO el historial de conversación
  displayFullConversation();
}

// ===========================================
// 10. SIMULACIÓN DE ENTRADA DE CÁMARA
// ===========================================

// Variables globales para la cámara
let videoStream = null;
let detectionTimeout = null;

function simulateCameraInput() {
  if (!conversationBox) return;
  
  conversationBox.innerHTML = `
    <div class="camera-container">
      <div class="camera-header">
        <span class="camera-title">📸 Detección de Señas</span>
        <button class="btn-close-camera" onclick="stopCamera()">✕</button>
      </div>
      
      <div class="camera-view">
        <video id="camera-video" autoplay playsinline></video>
        <div class="camera-overlay">
          <div class="detection-status">
            <div class="status-icon">👋</div>
            <p class="status-text">Haz una seña con tu mano...</p>
            <div class="countdown-bar">
              <div class="countdown-fill"></div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="gesture-guide">
        <p class="guide-title">Señas disponibles:</p>
        <div class="guide-list">
          <div class="guide-item">👋 Mano abierta = Hola</div>
          <div class="guide-item">👍 Pulgar arriba = ¿Cómo estás?</div>
        </div>
      </div>
    </div>
  `;
  
  startCamera();
}

async function startCamera() {
  try {
    // Solicitar acceso a la cámara
    videoStream = await navigator.mediaDevices.getUserMedia({ 
      video: { 
        facingMode: 'user',
        width: { ideal: 640 },
        height: { ideal: 480 }
      } 
    });
    
    const video = document.getElementById('camera-video');
    
    if (!video) {
      console.error('No se encontró el elemento de video');
      return;
    }
    
    video.srcObject = videoStream;
    
    console.log('✅ Cámara iniciada');
    
    // Después de 2 segundos, "detectar" un gesto
    const statusText = document.querySelector('.status-text');
    const countdownFill = document.querySelector('.countdown-fill');
    
    if (statusText) {
      statusText.textContent = 'Detectando... 2 segundos';
    }
    
    // Animar barra de countdown
    if (countdownFill) {
      countdownFill.style.animation = 'countdown 2s linear forwards';
    }
    
    detectionTimeout = setTimeout(() => {
      detectRandomGesture();
    }, 2000);
    
  } catch (error) {
    console.error('❌ Error al acceder a la cámara:', error);
    
    let errorMessage = 'No se pudo acceder a la cámara';
    let errorDetails = '';
    
    if (error.name === 'NotAllowedError') {
      errorMessage = 'Permiso de cámara denegado';
      errorDetails = 'Ve a la configuración de tu navegador y permite el acceso a la cámara';
    } else if (error.name === 'NotFoundError') {
      errorMessage = 'No se encontró cámara';
      errorDetails = 'Verifica que tu dispositivo tenga una cámara disponible';
    } else {
      errorDetails = 'Intenta recargar la página';
    }
    
    conversationBox.innerHTML = `
      <div class="error-message">
        <span class="error-icon">⚠️</span>
        <p class="error-title">${errorMessage}</p>
        <p class="error-details">${errorDetails}</p>
        <button class="retry-btn" onclick="document.getElementById('btn-camara').click()">
          🔄 Intentar de nuevo
        </button>
      </div>
    `;
  }
}

function detectRandomGesture() {
  // Simular detección aleatoria de gestos con traducciones específicas
  const gestures = [
    { 
      text: 'Seña: Mano abierta 👋', 
      gesture: 'hello'
    },
    { 
      text: 'Seña: Pulgar arriba 👍', 
      gesture: 'how_are_you'
    }
  ];
  
  const randomGesture = gestures[Math.floor(Math.random() * gestures.length)];
  
  // Mostrar resultado antes de cerrar
  const statusIcon = document.querySelector('.status-icon');
  const statusText = document.querySelector('.status-text');
  
  if (statusIcon && statusText) {
    statusIcon.textContent = '✅';
    statusText.textContent = 'Seña detectada!';
    statusText.style.color = '#10b981';
  }
  
  // Detener cámara y procesar con traducción específica
  setTimeout(() => {
    stopCamera();
    handleSignLanguageTranslation(randomGesture.text, randomGesture.gesture);
  }, 800);
}

// Nueva función específica para traducción de señas
function handleSignLanguageTranslation(signText, gestureType) {
  let translation = '';
  let suggestions = [];
  
  // Traducción y sugerencias específicas según el gesto
  switch(gestureType) {
    case 'hello':
      translation = 'Hola';
      suggestions = [
        { es: 'Hola, ¿cómo estás?', original: 'Hello, how are you?' },
        { es: 'Mucho gusto', original: 'Nice to meet you' },
        { es: '¿En qué puedo ayudarte?', original: 'How can I help you?' }
      ];
      break;
      
    case 'how_are_you':
      translation = '¿Cómo estás?';
      suggestions = [
        { es: 'Estoy bien, gracias', original: "I'm fine, thank you" },
        { es: 'Muy bien, ¿y tú?', original: 'Very well, and you?' },
        { es: 'Todo tranquilo', original: 'All good' }
      ];
      break;
      
    default:
      translation = 'Seña no reconocida';
      suggestions = [
        { es: '¿Puedes repetir?', original: 'Can you repeat?' },
        { es: 'No entendí', original: "I didn't understand" },
        { es: 'Intenta de nuevo', original: 'Try again' }
      ];
  }
  
  // Procesar como entrada de señas
  setTimeout(() => {
    speakText(translation, 'es-ES');
    processInput(signText, '📸', 'Cámara', translation, suggestions, 'en');
  }, 300);
}

function stopCamera() {
  if (detectionTimeout) {
    clearTimeout(detectionTimeout);
    detectionTimeout = null;
  }
  
  if (videoStream) {
    videoStream.getTracks().forEach(track => track.stop());
    videoStream = null;
  }
  
  console.log('📷 Cámara detenida');
}

// ===========================================
// 11. MOSTRAR HISTORIAL COMPLETO DE CONVERSACIÓN
// ===========================================
function displayFullConversation() {
  let conversationHTML = `
    <div class="conversation-header">
      <button class="btn-clear-conversation" onclick="clearConversation()" title="Borrar conversación">
        🗑️
      </button>
    </div>
    <div class="conversation-history">`;
  
  conversationHistory.forEach((item, index) => {
    const langLabel = item.originalLang === 'nlt' ? 'Náhuatl' : 
                      item.originalLang === 'es' ? 'Español' : 'Inglés';
    
    conversationHTML += `
      <div class="conversation-item ${index === conversationHistory.length - 1 ? 'latest' : ''}">
        <div class="input-method">
          <span class="method-icon">${item.icon}</span>
          <span class="method-text">${item.method}</span>
        </div>
        <div class="user-message">
          <p class="message-label">${item.originalLang === 'es' ? 'Tú dices:' : 'Persona dice:'}</p>
          <p class="message-text">"${item.user}"</p>
        </div>
        <div class="naiya-translation">
          <p class="translation-label">→ Naiya traduce a ${item.originalLang === 'es' ? langLabel : 'Español'}:</p>
          <p class="translation-text translation-text-white">"${item.translation}"</p>
        </div>
    `;
    
    // Solo mostrar sugerencias en el último mensaje que las tenga
    if (item.suggestions && item.suggestions.length > 0 && index === conversationHistory.length - 1) {
      conversationHTML += `
        <div class="divider"></div>
        <div class="suggestions">
          <p class="suggestions-label">Sugerencias de respuesta:</p>
          ${item.suggestions
            .map((s, idx) => `
              <button class="suggestion-btn" data-suggestion-index="${idx}">
                <p class="suggestion-es">"${s.es}"</p>
                <p class="suggestion-original">→ (${langLabel === 'Español' ? 'Original' : langLabel}) "${s.original}"</p>
              </button>`)
            .join('')}
        </div>
      `;
    }
    
    conversationHTML += `</div>`;
    
    // Agregar separador entre conversaciones (excepto en la última)
    if (index < conversationHistory.length - 1) {
      conversationHTML += '<div class="conversation-separator"></div>';
    }
  });
  
  conversationHTML += '</div>';
  
  conversationBox.innerHTML = conversationHTML;
  
  // Agregar event listeners a las sugerencias
  const lastItem = conversationHistory[conversationHistory.length - 1];
  if (lastItem.suggestions && lastItem.suggestions.length > 0) {
    const suggestionButtons = conversationBox.querySelectorAll('.suggestion-btn');
    suggestionButtons.forEach((btn, index) => {
      btn.addEventListener('click', () => {
        const suggestion = lastItem.suggestions[index];
        useSuggestion(suggestion.es, suggestion.original, lastItem.icon, lastItem.method, lastItem.originalLang);
      });
    });
  }
  
  // Scroll al final de la conversación
  conversationBox.scrollTop = conversationBox.scrollHeight;
}

// ===========================================
// 12. LIMPIAR CONVERSACIÓN
// ===========================================
function clearConversation() {
  // Limpiar el historial sin preguntar
  conversationHistory = [];
  currentMode = null;
  
  // Volver a mostrar los botones de inicio
  if (btnEscribir) btnEscribir.click();
  
  console.log('✨ Conversación limpiada');
}

// ===========================================
// 13. FUNCIONES DE VOZ (TEXT-TO-SPEECH)
// ===========================================
function speakText(textToSpeak, langCode = 'es-ES') {
  if ('speechSynthesis' in window) {
    const speakAfterLoad = () => {
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.lang = langCode;
      utterance.volume = 1;
      utterance.rate = 1; 
      utterance.pitch = 1; 
            
      if (langCode.startsWith('es')) {
        const voices = window.speechSynthesis.getVoices();
        const spanishVoice = voices.find(voice => voice.lang.startsWith('es'));
        if (spanishVoice) {
          utterance.voice = spanishVoice;
        }
      } else if (langCode.startsWith('en')) {
        const voices = window.speechSynthesis.getVoices();
        const englishVoice = voices.find(voice => voice.lang.startsWith('en'));
        if (englishVoice) {
          utterance.voice = englishVoice;
        }
      }
            
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    };
        
    if (window.speechSynthesis.getVoices().length === 0) {
      window.speechSynthesis.onvoiceschanged = speakAfterLoad;
    } else {
      speakAfterLoad();
    }
  } else {
    console.warn('El navegador no soporta la API de Síntesis de Voz.');
  }
}
