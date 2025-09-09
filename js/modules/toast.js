/**
 * ToastManager - Система уведомлений для Randomatched PWA
 * Поддерживает различные типы уведомлений с анимациями и Material Design
 */

export class ToastManager {
    constructor() {
        this.toasts = new Map(); // Map для хранения активных toast
        this.queue = []; // Очередь для toast при превышении лимита
        this.maxToasts = 3; // Максимальное количество одновременных toast
        this.defaultDuration = 3000; // 3 секунды по умолчанию
        this.container = null; // Контейнер для toast
        
        // Типы уведомлений с иконками и цветами (приглушенные Material Design 3)
        this.toastTypes = {
            success: {
                icon: 'check_circle',
                color: '#2e7d32', // Приглушенный зеленый
                bgColor: 'rgba(46, 125, 50, 0.8)',
                borderColor: 'rgba(46, 125, 50, 0.2)'
            },
            error: {
                icon: 'error',
                color: '#c62828', // Приглушенный красный
                bgColor: 'rgba(198, 40, 40, 0.8)',
                borderColor: 'rgba(198, 40, 40, 0.2)'
            },
            warning: {
                icon: 'warning',
                color: '#ef6c00', // Приглушенный оранжевый
                bgColor: 'rgba(239, 108, 0, 0.8)',
                borderColor: 'rgba(239, 108, 0, 0.2)'
            },
            info: {
                icon: 'info',
                color: '#5e35b1', // Приглушенный фиолетовый
                bgColor: 'rgba(94, 53, 177, 0.8)',
                borderColor: 'rgba(94, 53, 177, 0.2)'
            }
        };
        
        this.init();
    }

    /**
     * Инициализация ToastManager
     */
    init() {
        this.createContainer();
        this.setupStyles();
        console.log('[ToastManager] Инициализирован');
    }

    /**
     * Создание контейнера для toast
     */
    createContainer() {
        // Удаляем существующий контейнер, если есть
        const existingContainer = document.getElementById('toast-container');
        if (existingContainer) {
            existingContainer.remove();
        }

        // Создаем новый контейнер
        this.container = document.createElement('div');
        this.container.id = 'toast-container';
        this.container.className = 'toast-container';
        document.body.appendChild(this.container);
    }

    /**
     * Настройка CSS стилей для toast
     */
    setupStyles() {
        // Проверяем, не добавлены ли стили уже
        if (document.getElementById('toast-styles')) {
            return;
        }

        const style = document.createElement('style');
        style.id = 'toast-styles';
        style.textContent = `
            /* Toast Container */
            .toast-container {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                display: flex;
                flex-direction: column;
                gap: 12px;
                max-width: 400px;
                pointer-events: none;
            }

            /* Mobile positioning */
            @media (max-width: 768px) {
                .toast-container {
                    top: 10px;
                    left: 10px;
                    right: 10px;
                    max-width: none;
                }
            }

            /* Toast Item */
            .toast {
                position: relative;
                background: var(--md-sys-color-surface-container-high, #ece6f0);
                border: none;
                border-radius: 12px;
                padding: 16px;
                box-shadow: 0 8px 16px rgba(0, 0, 0, 0.12), 0 4px 8px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.04);
                display: flex;
                align-items: flex-start;
                gap: 12px;
                min-width: 280px;
                max-width: 100%;
                opacity: 0;
                transform: translateX(100%);
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                pointer-events: auto;
                overflow: hidden;
            }

            /* Toast Animation States */
            .toast.show {
                opacity: 1;
                transform: translateX(0);
            }

            .toast.hide {
                opacity: 0;
                transform: translateX(100%);
            }

            /* Mobile slide animation */
            @media (max-width: 768px) {
                .toast {
                    transform: translateY(-100%);
                }
                
                .toast.show {
                    transform: translateY(0);
                }
                
                .toast.hide {
                    transform: translateY(-100%);
                }
            }

            /* Toast Content */
            .toast-content {
                flex: 1;
                display: flex;
                flex-direction: column;
                gap: 8px;
            }

            .toast-header {
                display: flex;
                align-items: center;
                gap: 12px;
            }

            .toast-icon {
                font-size: 20px;
                line-height: 1;
                flex-shrink: 0;
            }

            .toast-message {
                font-size: 14px;
                line-height: 1.4;
                color: var(--md-sys-color-on-surface, #1c1b1f);
                margin: 0;
                word-wrap: break-word;
            }

            .toast-close {
                background: none;
                border: none;
                padding: 4px;
                cursor: pointer;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                color: var(--md-sys-color-on-surface-variant, #49454f);
                transition: background-color 0.2s ease;
                flex-shrink: 0;
            }

            .toast-close:hover {
                background-color: var(--md-sys-color-surface-container-highest, #e6e0e9);
            }

            .toast-close:active {
                background-color: var(--md-sys-color-surface-container-high, #ece6f0);
            }

            .toast-close .material-icons {
                font-size: 18px;
            }

            /* Progress Bar */
            .toast-progress {
                position: absolute;
                bottom: 0;
                left: 0;
                height: 3px;
                background: linear-gradient(90deg, var(--toast-color, #6750a4), var(--toast-color, #6750a4));
                border-radius: 0 0 12px 12px;
                transition: width linear;
                opacity: 0.6;
            }

            /* Toast Type Styles */
            .toast.toast-success {
                background: rgba(46, 125, 50, 0.08);
                border-left: 3px solid rgba(46, 125, 50, 0.3);
            }

            .toast.toast-success .toast-icon {
                color: #2e7d32;
            }

            .toast.toast-success .toast-progress {
                background: linear-gradient(90deg, #2e7d32, #2e7d32);
            }

            .toast.toast-error {
                background: rgba(198, 40, 40, 0.08);
                border-left: 3px solid rgba(198, 40, 40, 0.3);
            }

            .toast.toast-error .toast-icon {
                color: #c62828;
            }

            .toast.toast-error .toast-progress {
                background: linear-gradient(90deg, #c62828, #c62828);
            }

            .toast.toast-warning {
                background: rgba(239, 108, 0, 0.08);
                border-left: 3px solid rgba(239, 108, 0, 0.3);
            }

            .toast.toast-warning .toast-icon {
                color: #ef6c00;
            }

            .toast.toast-warning .toast-progress {
                background: linear-gradient(90deg, #ef6c00, #ef6c00);
            }

            .toast.toast-info {
                background: rgba(94, 53, 177, 0.08);
                border-left: 3px solid rgba(94, 53, 177, 0.3);
            }

            .toast.toast-info .toast-icon {
                color: #5e35b1;
            }

            .toast.toast-info .toast-progress {
                background: linear-gradient(90deg, #5e35b1, #5e35b1);
            }

            /* Dark Theme Support */
            @media (prefers-color-scheme: dark) {
                .toast {
                    background: var(--md-sys-color-surface-container-high, #2c2c2c);
                    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.24), 0 4px 8px rgba(0, 0, 0, 0.16), 0 2px 4px rgba(0, 0, 0, 0.08);
                }

                .toast.toast-success {
                    background: rgba(76, 175, 80, 0.12);
                    border-left-color: rgba(76, 175, 80, 0.4);
                }

                .toast.toast-success .toast-icon {
                    color: #4caf50;
                }

                .toast.toast-error {
                    background: rgba(244, 67, 54, 0.12);
                    border-left-color: rgba(244, 67, 54, 0.4);
                }

                .toast.toast-error .toast-icon {
                    color: #f44336;
                }

                .toast.toast-warning {
                    background: rgba(255, 152, 0, 0.12);
                    border-left-color: rgba(255, 152, 0, 0.4);
                }

                .toast.toast-warning .toast-icon {
                    color: #ff9800;
                }

                .toast.toast-info {
                    background: rgba(156, 39, 176, 0.12);
                    border-left-color: rgba(156, 39, 176, 0.4);
                }

                .toast.toast-info .toast-icon {
                    color: #9c27b0;
                }
            }

            /* Touch Support */
            .toast {
                touch-action: pan-x;
                user-select: none;
            }

            /* Swipe Animation */
            .toast.swiping {
                transition: transform 0.1s ease;
            }

            .toast.swipe-left {
                transform: translateX(-100%);
            }

            .toast.swipe-right {
                transform: translateX(100%);
            }

            @media (max-width: 768px) {
                .toast.swipe-left,
                .toast.swipe-right {
                    transform: translateY(-100%);
                }
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Показать toast уведомление
     * @param {string} message - Текст сообщения
     * @param {string} type - Тип уведомления (success, error, warning, info)
     * @param {number} duration - Длительность показа в миллисекундах
     * @returns {string} ID созданного toast
     */
    show(message, type = 'info', duration = this.defaultDuration) {
        // Валидация параметров
        if (!message || typeof message !== 'string') {
            console.warn('[ToastManager] Некорректное сообщение:', message);
            return null;
        }

        if (!this.toastTypes[type]) {
            console.warn('[ToastManager] Неизвестный тип toast:', type);
            type = 'info';
        }

        // Генерируем уникальный ID
        const toastId = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        // Если достигнут лимит, добавляем в очередь
        if (this.toasts.size >= this.maxToasts) {
            this.queue.push({ message, type, duration, toastId });
            console.log('[ToastManager] Toast добавлен в очередь:', toastId);
            return toastId;
        }

        // Создаем и показываем toast
        this.createToast(toastId, message, type, duration);
        return toastId;
    }

    /**
     * Создание DOM элемента toast
     * @param {string} toastId - ID toast
     * @param {string} message - Текст сообщения
     * @param {string} type - Тип уведомления
     * @param {number} duration - Длительность показа
     */
    createToast(toastId, message, type, duration) {
        const toastElement = document.createElement('div');
        toastElement.id = toastId;
        toastElement.className = `toast toast-${type}`;
        
        const typeConfig = this.toastTypes[type];
        
        toastElement.innerHTML = `
            <div class="toast-content">
                <div class="toast-header">
                    <span class="material-icons toast-icon">${typeConfig.icon}</span>
                    <p class="toast-message">${this.escapeHtml(message)}</p>
                </div>
            </div>
            <button class="toast-close" aria-label="Закрыть уведомление">
                <span class="material-icons">close</span>
            </button>
            <div class="toast-progress" style="--toast-color: ${typeConfig.color}"></div>
        `;

        // Добавляем в контейнер
        this.container.appendChild(toastElement);

        // Сохраняем в Map
        this.toasts.set(toastId, {
            element: toastElement,
            type,
            duration,
            timeoutId: null,
            progressInterval: null,
            startTime: Date.now()
        });

        // Настраиваем анимацию появления
        requestAnimationFrame(() => {
            toastElement.classList.add('show');
        });

        // Настраиваем автоскрытие
        this.setupAutoHide(toastId, duration);

        // Настраиваем обработчики событий
        this.setupEventListeners(toastId);

        console.log('[ToastManager] Toast создан:', toastId, type);
    }

    /**
     * Настройка автоскрытия toast
     * @param {string} toastId - ID toast
     * @param {number} duration - Длительность показа
     */
    setupAutoHide(toastId, duration) {
        const toast = this.toasts.get(toastId);
        if (!toast) return;

        // Устанавливаем таймер автоскрытия
        toast.timeoutId = setTimeout(() => {
            this.dismiss(toastId);
        }, duration);

        // Настраиваем прогресс-бар
        this.setupProgressBar(toastId, duration);
    }

    /**
     * Настройка прогресс-бара
     * @param {string} toastId - ID toast
     * @param {number} duration - Длительность показа
     */
    setupProgressBar(toastId, duration) {
        const toast = this.toasts.get(toastId);
        if (!toast) return;

        const progressBar = toast.element.querySelector('.toast-progress');
        if (!progressBar) return;

        const startTime = Date.now();
        const updateInterval = 50; // Обновляем каждые 50мс для плавности

        toast.progressInterval = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const width = (1 - progress) * 100;
            
            progressBar.style.width = `${width}%`;
            
            if (progress >= 1) {
                clearInterval(toast.progressInterval);
            }
        }, updateInterval);
    }

    /**
     * Настройка обработчиков событий для toast
     * @param {string} toastId - ID toast
     */
    setupEventListeners(toastId) {
        const toast = this.toasts.get(toastId);
        if (!toast) return;

        const { element } = toast;

        // Обработчик кнопки закрытия
        const closeBtn = element.querySelector('.toast-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.dismiss(toastId);
            });
        }

        // Обработчики свайпа для мобильных устройств
        this.setupSwipeListeners(toastId);
    }

    /**
     * Настройка обработчиков свайпа
     * @param {string} toastId - ID toast
     */
    setupSwipeListeners(toastId) {
        const toast = this.toasts.get(toastId);
        if (!toast) return;

        const { element } = toast;
        let startX = 0;
        let startY = 0;
        let currentX = 0;
        let isDragging = false;
        let swipeThreshold = 50;

        const handleStart = (e) => {
            startX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
            startY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;
            isDragging = true;
            element.classList.add('swiping');
        };

        const handleMove = (e) => {
            if (!isDragging) return;

            currentX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
            const deltaX = currentX - startX;
            const deltaY = Math.abs((e.type === 'touchmove' ? e.touches[0].clientY : e.clientY) - startY);

            // Проверяем, что это горизонтальный свайп
            if (Math.abs(deltaX) > deltaY && Math.abs(deltaX) > 10) {
                e.preventDefault();
                element.style.transform = `translateX(${deltaX}px)`;
            }
        };

        const handleEnd = () => {
            if (!isDragging) return;

            isDragging = false;
            element.classList.remove('swiping');

            const deltaX = currentX - startX;

            if (Math.abs(deltaX) > swipeThreshold) {
                // Свайп влево или вправо - закрываем toast
                if (deltaX > 0) {
                    element.classList.add('swipe-right');
                } else {
                    element.classList.add('swipe-left');
                }

                setTimeout(() => {
                    this.dismiss(toastId);
                }, 150);
            } else {
                // Возвращаем в исходное положение
                element.style.transform = '';
            }
        };

        // Добавляем обработчики для touch и mouse событий
        element.addEventListener('touchstart', handleStart, { passive: false });
        element.addEventListener('touchmove', handleMove, { passive: false });
        element.addEventListener('touchend', handleEnd);

        element.addEventListener('mousedown', handleStart);
        element.addEventListener('mousemove', handleMove);
        element.addEventListener('mouseup', handleEnd);
        element.addEventListener('mouseleave', handleEnd);
    }

    /**
     * Закрытие конкретного toast
     * @param {string} toastId - ID toast для закрытия
     */
    dismiss(toastId) {
        const toast = this.toasts.get(toastId);
        if (!toast) return;

        const { element, timeoutId, progressInterval } = toast;

        // Очищаем таймеры
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
        if (progressInterval) {
            clearInterval(progressInterval);
        }

        // Анимация скрытия
        element.classList.remove('show');
        element.classList.add('hide');

        // Удаляем элемент после анимации
        setTimeout(() => {
            if (element.parentNode) {
                element.parentNode.removeChild(element);
            }
            this.toasts.delete(toastId);
            
            // Показываем следующий toast из очереди
            this.processQueue();
            
            console.log('[ToastManager] Toast закрыт:', toastId);
        }, 300);
    }

    /**
     * Очистка всех toast
     */
    clearAll() {
        console.log('[ToastManager] Очистка всех toast...');
        
        // Закрываем все активные toast
        for (const toastId of this.toasts.keys()) {
            this.dismiss(toastId);
        }

        // Очищаем очередь
        this.queue = [];
        
        console.log('[ToastManager] Все toast очищены');
    }

    /**
     * Обработка очереди toast
     */
    processQueue() {
        if (this.queue.length === 0 || this.toasts.size >= this.maxToasts) {
            return;
        }

        const nextToast = this.queue.shift();
        if (nextToast) {
            this.createToast(nextToast.toastId, nextToast.message, nextToast.type, nextToast.duration);
            console.log('[ToastManager] Toast из очереди:', nextToast.toastId);
        }
    }

    /**
     * Экранирование HTML для безопасности
     * @param {string} text - Текст для экранирования
     * @returns {string} Экранированный текст
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Получение статистики toast
     * @returns {Object} Статистика
     */
    getStats() {
        return {
            active: this.toasts.size,
            queued: this.queue.length,
            maxToasts: this.maxToasts
        };
    }

    /**
     * Обновление настроек
     * @param {Object} options - Новые настройки
     */
    updateSettings(options) {
        if (options.maxToasts && options.maxToasts > 0) {
            this.maxToasts = options.maxToasts;
        }
        
        if (options.defaultDuration && options.defaultDuration > 0) {
            this.defaultDuration = options.defaultDuration;
        }
        
        console.log('[ToastManager] Настройки обновлены:', options);
    }
}

// Создаем глобальный экземпляр
window.toastManager = new ToastManager();

// Экспортируем для использования в модулях
export default window.toastManager;
