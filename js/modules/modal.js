/**
 * Универсальный модуль для работы с модальными окнами
 * Поддерживает Fullscreen Modal, Bottom Sheet и Confirmation Dialog
 */

class ModalManager {
    constructor() {
        this.modals = new Map();
        this.modalStack = [];
        this.baseZIndex = 1000;
        this.isBodyScrollLocked = false;
        
        // Привязываем методы к контексту
        this.handleEscape = this.handleEscape.bind(this);
        this.handleBackdropClick = this.handleBackdropClick.bind(this);
        this.handleSwipeStart = this.handleSwipeStart.bind(this);
        this.handleSwipeMove = this.handleSwipeMove.bind(this);
        this.handleSwipeEnd = this.handleSwipeEnd.bind(this);
        
        this.init();
    }

    init() {
        // Добавляем обработчики событий
        document.addEventListener('keydown', this.handleEscape);
        document.addEventListener('click', this.handleBackdropClick);
    }

    /**
     * Открытие модального окна
     * @param {string} type - Тип модального окна ('fullscreen', 'bottomsheet', 'confirmation')
     * @param {string|HTMLElement} content - Содержимое модального окна
     * @param {Object} options - Дополнительные опции
     * @returns {string} ID модального окна
     */
    open(type, content, options = {}) {
        const modalId = this.generateId();
        const modal = this.createModal(type, content, options, modalId);
        
        this.modals.set(modalId, modal);
        this.modalStack.push(modalId);
        
        document.body.appendChild(modal.element);
        this.lockBodyScroll();
        
        // Анимация появления
        requestAnimationFrame(() => {
            modal.element.classList.add('modal-show');
        });
        
        return modalId;
    }

    /**
     * Закрытие модального окна
     * @param {string} modalId - ID модального окна
     */
    close(modalId) {
        const modal = this.modals.get(modalId);
        if (!modal) return;

        modal.element.classList.remove('modal-show');
        
        setTimeout(() => {
            if (modal.element.parentNode) {
                modal.element.parentNode.removeChild(modal.element);
            }
            this.modals.delete(modalId);
            this.modalStack = this.modalStack.filter(id => id !== modalId);
            
            if (this.modals.size === 0) {
                this.unlockBodyScroll();
            }
            
            // Вызываем callback при закрытии
            if (modal.options.onClose) {
                modal.options.onClose();
            }
        }, 300); // Время анимации
    }

    /**
     * Закрытие всех модальных окон
     */
    closeAll() {
        this.modalStack.forEach(modalId => {
            this.close(modalId);
        });
    }

    /**
     * Создание полноэкранного модального окна
     * @param {string} title - Заголовок
     * @param {string|HTMLElement} content - Содержимое
     * @param {Object} options - Дополнительные опции
     * @returns {string} ID модального окна
     */
    createFullscreen(title, content, options = {}) {
        const fullscreenContent = this.createFullscreenContent(title, content);
        return this.open('fullscreen', fullscreenContent, {
            animation: 'fade-in',
            ...options
        });
    }

    /**
     * Создание Bottom Sheet
     * @param {string|HTMLElement} content - Содержимое
     * @param {Object} options - Дополнительные опции
     * @returns {string} ID модального окна
     */
    createBottomSheet(content, options = {}) {
        return this.open('bottomsheet', content, {
            animation: 'slide-up',
            ...options
        });
    }

    /**
     * Создание диалога подтверждения
     * @param {string} title - Заголовок
     * @param {string} message - Сообщение
     * @param {Object} options - Дополнительные опции
     * @returns {Promise<boolean>} Promise с результатом (true - подтверждено, false - отменено)
     */
    createConfirmation(title, message, options = {}) {
        return new Promise((resolve) => {
            const confirmationContent = this.createConfirmationContent(title, message, resolve, options);
            this.open('confirmation', confirmationContent, {
                animation: 'fade-in',
                preventClose: true,
                ...options
            });
        });
    }

    /**
     * Создание модального окна
     * @private
     */
    createModal(type, content, options, modalId) {
        const element = document.createElement('div');
        element.className = `modal modal-${type}`;
        element.setAttribute('data-modal-id', modalId);
        element.setAttribute('data-animation', options.animation || 'fade-in');
        element.style.zIndex = this.baseZIndex + this.modalStack.length;

        const backdrop = document.createElement('div');
        backdrop.className = 'modal-backdrop';
        
        const container = document.createElement('div');
        container.className = 'modal-container';
        
        // Предотвращение закрытия при клике внутри контейнера
        container.addEventListener('click', (e) => {
            e.stopPropagation();
        });

        // Обработка свайпа для Bottom Sheet
        if (type === 'bottomsheet') {
            this.addSwipeHandlers(container);
        }

        // Добавляем содержимое
        if (typeof content === 'string') {
            container.innerHTML = content;
        } else {
            container.appendChild(content);
        }

        element.appendChild(backdrop);
        element.appendChild(container);

        return {
            element,
            type,
            options,
            id: modalId
        };
    }

    /**
     * Создание содержимого для полноэкранного модального окна
     * @private
     */
    createFullscreenContent(title, content) {
        const wrapper = document.createElement('div');
        wrapper.className = 'modal-fullscreen-content';
        
        wrapper.innerHTML = `
            <div class="modal-header">
                <h2 class="modal-title">${title}</h2>
                <button class="modal-close-btn" aria-label="Закрыть">
                    <span class="material-icons">close</span>
                </button>
            </div>
            <div class="modal-body">
                ${typeof content === 'string' ? content : ''}
            </div>
        `;
        
        if (typeof content !== 'string') {
            const body = wrapper.querySelector('.modal-body');
            body.innerHTML = '';
            body.appendChild(content);
        }
        
        // Обработчик кнопки закрытия
        const closeBtn = wrapper.querySelector('.modal-close-btn');
        closeBtn.addEventListener('click', () => {
            this.close(this.getModalIdFromElement(closeBtn));
        });
        
        return wrapper;
    }

    /**
     * Создание содержимого для диалога подтверждения
     * @private
     */
    createConfirmationContent(title, message, resolve, options) {
        const wrapper = document.createElement('div');
        wrapper.className = 'modal-confirmation-content';
        
        const cancelText = options.cancelText || 'Отмена';
        const confirmText = options.confirmText || 'Подтвердить';
        const confirmClass = options.confirmClass || 'btn-primary';
        
        wrapper.innerHTML = `
            <div class="modal-confirmation-header">
                <h3 class="modal-confirmation-title">${title}</h3>
            </div>
            <div class="modal-confirmation-body">
                <p class="modal-confirmation-message">${message}</p>
            </div>
            <div class="modal-confirmation-actions">
                <button class="btn btn-outline modal-cancel-btn">${cancelText}</button>
                <button class="btn ${confirmClass} modal-confirm-btn">${confirmText}</button>
            </div>
        `;
        
        // Обработчики кнопок
        const cancelBtn = wrapper.querySelector('.modal-cancel-btn');
        const confirmBtn = wrapper.querySelector('.modal-confirm-btn');
        
        cancelBtn.addEventListener('click', () => {
            this.close(this.getModalIdFromElement(cancelBtn));
            resolve(false);
        });
        
        confirmBtn.addEventListener('click', () => {
            this.close(this.getModalIdFromElement(confirmBtn));
            resolve(true);
        });
        
        return wrapper;
    }

    /**
     * Добавление обработчиков свайпа для Bottom Sheet
     * @private
     */
    addSwipeHandlers(element) {
        let startY = 0;
        let currentY = 0;
        let isDragging = false;
        
        const handleSwipeStart = (e) => {
            startY = e.touches[0].clientY;
            isDragging = true;
            element.classList.add('modal-dragging');
        };
        
        const handleSwipeMove = (e) => {
            if (!isDragging) return;
            
            currentY = e.touches[0].clientY;
            const deltaY = currentY - startY;
            
            if (deltaY > 0) {
                element.style.transform = `translateY(${deltaY}px)`;
            }
        };
        
        const handleSwipeEnd = () => {
            if (!isDragging) return;
            
            isDragging = false;
            element.classList.remove('modal-dragging');
            
            const deltaY = currentY - startY;
            const threshold = 100; // Минимальное расстояние для закрытия
            
            if (deltaY > threshold) {
                this.close(this.getModalIdFromElement(element));
            } else {
                element.style.transform = '';
            }
        };
        
        element.addEventListener('touchstart', handleSwipeStart, { passive: true });
        element.addEventListener('touchmove', handleSwipeMove, { passive: true });
        element.addEventListener('touchend', handleSwipeEnd, { passive: true });
    }

    /**
     * Обработка нажатия Escape
     * @private
     */
    handleEscape(e) {
        if (e.key === 'Escape' && this.modalStack.length > 0) {
            const topModal = this.modalStack[this.modalStack.length - 1];
            const modal = this.modals.get(topModal);
            
            if (!modal.options.preventClose) {
                this.close(topModal);
            }
        }
    }

    /**
     * Обработка клика на backdrop
     * @private
     */
    handleBackdropClick(e) {
        if (e.target.classList.contains('modal-backdrop')) {
            const modalId = this.getModalIdFromElement(e.target);
            const modal = this.modals.get(modalId);
            
            if (!modal.options.preventClose) {
                this.close(modalId);
            }
        }
    }

    /**
     * Блокировка скролла body
     * @private
     */
    lockBodyScroll() {
        if (!this.isBodyScrollLocked) {
            document.body.style.overflow = 'hidden';
            this.isBodyScrollLocked = true;
        }
    }

    /**
     * Разблокировка скролла body
     * @private
     */
    unlockBodyScroll() {
        if (this.isBodyScrollLocked) {
            document.body.style.overflow = '';
            this.isBodyScrollLocked = false;
        }
    }

    /**
     * Получение ID модального окна из элемента
     * @private
     */
    getModalIdFromElement(element) {
        const modal = element.closest('.modal');
        return modal ? modal.getAttribute('data-modal-id') : null;
    }

    /**
     * Генерация уникального ID
     * @private
     */
    generateId() {
        return 'modal-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Очистка ресурсов
     */
    destroy() {
        document.removeEventListener('keydown', this.handleEscape);
        document.removeEventListener('click', this.handleBackdropClick);
        this.closeAll();
    }
}

// Создаем глобальный экземпляр
window.modalManager = new ModalManager();

// Экспорт для модульных систем
export default ModalManager;
