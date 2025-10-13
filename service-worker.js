// service-worker.js

const CACHE_NAME = 'naiya-cache-v1';

// Archivos que se intentarán cachear
const urlsToCache = [
    './index.html', 
    'manifest.json',
    'assets/css/style.css',
    'assets/js/app.js',
    //'assets/icons/icon-192x192.png', 
    //'assets/icons/icon-512x512.png'
];

// 🧱 Evento INSTALL
self.addEventListener('install', event => {
    event.waitUntil(
        (async () => {
            const cache = await caches.open(CACHE_NAME);
            console.log('Service Worker: Iniciando cacheo...');

            // Intentamos agregar los archivos uno por uno para evitar que un error rompa todo
            for (const url of urlsToCache) {
                try {
                    await cache.add(url);
                    console.log(`✅ Cacheado: ${url}`);
                } catch (error) {
                    console.warn(`⚠️ No se pudo cachear: ${url}`, error);
                }
            }

            console.log('Service Worker: Cacheo completado.');
        })()
    );

    self.skipWaiting(); // activa inmediatamente
});

// 🧭 Evento FETCH: Manejo de peticiones
self.addEventListener('fetch', event => {
    if (event.request.method !== 'GET') return;

    event.respondWith(
        caches.match(event.request).then(response => {
            if (response) {
                return response; // devuelve del caché
            }

            // Si no está en caché, intenta obtenerlo de la red
            return fetch(event.request).then(networkResponse => {
                // Solo cacheamos si la respuesta es válida (status 200)
                if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                    return networkResponse;
                }

                const responseToCache = networkResponse.clone();
                caches.open(CACHE_NAME).then(cache => {
                    cache.put(event.request, responseToCache);
                });

                return networkResponse;
            }).catch(() => {
                // Aquí puedes agregar una página offline si quieres
                console.warn('⚠️ Falló la conexión de red para:', event.request.url);
            });
        })
    );
});

// 🧹 Evento ACTIVATE: Limpieza de cachés antiguos
self.addEventListener('activate', event => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (!cacheWhitelist.includes(cacheName)) {
                        console.log('🧽 Eliminando caché antiguo:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});
