// Service Worker для Randomatched PWA
// Версия кэша для обновления при изменении файлов
const CACHE_VERSION = 'v1.0.18';
const CACHE_NAME = `randomatched-cache-${CACHE_VERSION}`;

// Файлы для кэширования при установке
const STATIC_CACHE_URLS = [
  '/',
  '/index.html',
  '/js/app.js',
  '/style.css',
  '/manifest.json',
  '/favicon.ico',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/apple-touch-icon.png'
];

// Файлы для кэширования при запросе (динамическое кэширование)
const DYNAMIC_CACHE_URLS = [
  // API endpoints (если будут добавлены)
  '/api/',
  // Другие страницы
  '/about',
  '/settings'
];

// Установка Service Worker
self.addEventListener('install', (event) => {
  console.log(`[SW] Установка Service Worker версии ${CACHE_VERSION}`);
  console.log('[SW] Время установки:', new Date().toISOString());
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Кэширование статических файлов');
        console.log('[SW] Список файлов для кэширования:', STATIC_CACHE_URLS);
        // Кэшируем файлы по одному для лучшей обработки ошибок
        return Promise.allSettled(
          STATIC_CACHE_URLS.map(url => 
            cache.add(url).catch(error => {
              console.warn(`[SW] Не удалось кэшировать ${url}:`, error);
              return null;
            })
          )
        );
      })
      .then((results) => {
        const successful = results.filter(r => r.status === 'fulfilled').length;
        const failed = results.filter(r => r.status === 'rejected').length;
        console.log(`[SW] Кэширование завершено: ${successful} успешно, ${failed} с ошибками`);
        console.log('[SW] Принудительная активация нового Service Worker...');
        // Принудительная активация нового SW
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Критическая ошибка при установке:', error);
        // Все равно активируем SW для работы в офлайн режиме
        return self.skipWaiting();
      })
  );
});

// Активация Service Worker
self.addEventListener('activate', (event) => {
  console.log(`[SW] Активация Service Worker версии ${CACHE_VERSION}`);
  console.log('[SW] Время активации:', new Date().toISOString());
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        console.log('[SW] Найденные кэши:', cacheNames);
        return Promise.all(
          cacheNames.map((cacheName) => {
            // Удаляем старые кэши
            if (cacheName !== CACHE_NAME) {
              console.log('[SW] Удаление старого кэша:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW] Service Worker активирован');
        console.log('[SW] Принудительное управление всеми клиентами...');
        // Принудительное управление всеми клиентами
        return self.clients.claim();
      })
      .then(() => {
        console.log('[SW] Service Worker готов к работе');
      })
  );
});

// Обработка запросов (Cache First стратегия)
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Пропускаем запросы к внешним доменам (кроме разрешенных CDN)
  if (url.origin !== location.origin && !isAllowedCDNRequest(url)) {
    return;
  }
  
  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        // Если есть в кэше, возвращаем кэшированную версию
        if (cachedResponse) {
          console.log('[SW] Запрос из кэша:', request.url);
          return cachedResponse;
        }
        
        // Если нет в кэше, делаем запрос к сети
        console.log('[SW] Запрос к сети:', request.url);
        return fetch(request)
          .then((networkResponse) => {
            // Проверяем валидность ответа
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }
            
            // Клонируем ответ для кэширования
            const responseToCache = networkResponse.clone();
            
            // Кэшируем только GET запросы и только локальные ресурсы
            if (request.method === 'GET' && url.origin === location.origin) {
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(request, responseToCache);
                  console.log('[SW] Добавлено в кэш:', request.url);
                })
                .catch((error) => {
                  console.error('[SW] Ошибка кэширования:', error);
                });
            }
            
            return networkResponse;
          })
          .catch((error) => {
            console.error('[SW] Ошибка сети:', error);
            
            // Возвращаем офлайн страницу для HTML запросов
            if (request.headers.get('accept') && request.headers.get('accept').includes('text/html')) {
              return caches.match('/index.html');
            }
            
            // Для других типов файлов возвращаем базовую ошибку
            return new Response('Офлайн режим', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: new Headers({
                'Content-Type': 'text/plain; charset=utf-8'
              })
            });
          });
      })
  );
});

// Обработка push уведомлений (для будущего использования)
self.addEventListener('push', (event) => {
  console.log('[SW] Получено push уведомление');
  
  const options = {
    body: event.data ? event.data.text() : 'Новое уведомление от Randomatched',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Открыть приложение',
        icon: '/icons/icon-192.png'
      },
      {
        action: 'close',
        title: 'Закрыть',
        icon: '/icons/icon-192.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('Randomatched', options)
  );
});

// Обработка кликов по уведомлениям
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Клик по уведомлению:', event.action);
  
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Обработка синхронизации в фоне (для будущего использования)
self.addEventListener('sync', (event) => {
  console.log('[SW] Фоновая синхронизация:', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Здесь можно добавить логику синхронизации данных
      Promise.resolve()
    );
  }
});

// Вспомогательная функция для определения разрешенных CDN запросов
function isAllowedCDNRequest(url) {
  const allowedCDNDomains = [
    'fonts.googleapis.com',
    'fonts.gstatic.com'
  ];
  
  return allowedCDNDomains.some(domain => url.hostname.includes(domain));
}

// Обработка сообщений от клиента
self.addEventListener('message', (event) => {
  console.log('[SW] Получено сообщение:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[SW] Получена команда на принудительную активацию обновления');
    
    // Уведомляем клиентов о начале процесса обновления
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        console.log('[SW] Уведомляем клиента о начале обновления');
        client.postMessage({
          type: 'UPDATE_STARTING',
          version: CACHE_VERSION,
          timestamp: new Date().toISOString()
        });
      });
    });
    
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_VERSION });
  }
});

// Обработка события контролируемого клиента
self.addEventListener('controllerchange', (event) => {
  console.log('[SW] Service Worker получил контроль над клиентом');
  
  // Отправляем сообщение всем клиентам о том, что обновление готово
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      console.log('[SW] Уведомляем клиента об готовности обновления');
      client.postMessage({
        type: 'UPDATE_READY',
        version: CACHE_VERSION,
        timestamp: new Date().toISOString()
      });
    });
  });
});

console.log('[SW] Service Worker загружен');
