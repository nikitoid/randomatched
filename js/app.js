/**
 * Randomatched PWA - Основной файл приложения
 * Содержит инициализацию, загрузку модулей и обработчики событий
 */

import './modules/theme.js';
import './modules/modal.js';
import './modules/toast.js';

class RandomatchedApp {
    constructor() {
        this.currentHeroList = null;
        this.lastGeneration = null;
        this.modules = {};
        
        // DOM элементы
        this.elements = {};
        
        // Состояние обновления
        this.updateState = {
            isUpdating: false,
            hasUpdated: false
        };
        
        // Используем глобальный экземпляр менеджера тем
        this.themeManager = window.themeManager;
        
        this.init();
    }

    /**
     * Инициализация приложения
     */
    async init() {
        try {
            // Получение DOM элементов
            this.getElements();
            
            // Настройка динамической высоты viewport
            this.setupViewportHeight();
            
            // Настройка менеджера тем
            this.setupThemeManager();
            
            // Загрузка модулей
            await this.loadModules();
            
            // Установка обработчиков событий
            this.setupEventListeners();
            
            // Настройка Service Worker и обновлений
            this.setupServiceWorker();
            
            // Инициализация данных
            this.initData();
            
            // Проверка на успешное обновление после перезагрузки
            this.checkForSuccessfulUpdate();
            
            console.log('Randomatched приложение успешно инициализировано');
        } catch (error) {
            console.error('Ошибка инициализации приложения:', error);
        }
    }

    /**
     * Получение DOM элементов
     */
    getElements() {
        this.elements = {
            themeToggle: document.getElementById('theme-toggle'),
            themeIcon: document.querySelector('.theme-icon'),
            heroListSelect: document.getElementById('hero-list-select'),
            settingsBtn: document.getElementById('settings-btn'),
            generateBtn: document.getElementById('generate-btn'),
            lastGenerationBtn: document.getElementById('last-generation-btn'),
            resetSessionBtn: document.getElementById('reset-session-btn'),
            updateIndicator: document.getElementById('update-indicator'),
            updateSpinner: document.getElementById('update-spinner'),
            updateSuccess: document.getElementById('update-success'),
            // Демонстрационные кнопки модальных окон
            demoFullscreenBtn: document.getElementById('demo-fullscreen-btn'),
            demoBottomsheetBtn: document.getElementById('demo-bottomsheet-btn'),
            demoConfirmationBtn: document.getElementById('demo-confirmation-btn'),
            // Демонстрационные кнопки toast
            demoToastSuccessBtn: document.getElementById('demo-toast-success-btn'),
            demoToastErrorBtn: document.getElementById('demo-toast-error-btn'),
            demoToastWarningBtn: document.getElementById('demo-toast-warning-btn'),
            demoToastInfoBtn: document.getElementById('demo-toast-info-btn'),
            demoToastMultipleBtn: document.getElementById('demo-toast-multiple-btn'),
            demoToastClearBtn: document.getElementById('demo-toast-clear-btn')
        };
    }

    /**
     * Настройка динамической высоты viewport для предотвращения сдвига элементов
     */
    setupViewportHeight() {
        let lastHeight = window.innerHeight;
        let isUpdating = false;

        // Функция для обновления CSS переменных высоты viewport
        const updateViewportHeight = () => {
            if (isUpdating) return;
            
            const currentHeight = window.innerHeight;
            
            // Обновляем только если высота действительно изменилась
            if (Math.abs(currentHeight - lastHeight) > 1) {
                isUpdating = true;
                
                const vh = currentHeight * 0.01;
                document.documentElement.style.setProperty('--vh', `${vh}px`);
                document.documentElement.style.setProperty('--vh-100', `${currentHeight}px`);
                document.documentElement.style.setProperty('--vh-100-dynamic', `${currentHeight}px`);
                
                lastHeight = currentHeight;
                
                console.log('[VIEWPORT] Высота viewport обновлена:', currentHeight);
                
                // Сбрасываем флаг через небольшую задержку
                setTimeout(() => {
                    isUpdating = false;
                }, 50);
            }
        };

        // Устанавливаем начальное значение
        updateViewportHeight();

        // Обновляем при изменении размера окна
        window.addEventListener('resize', updateViewportHeight);
        
        // Обновляем при изменении ориентации устройства
        window.addEventListener('orientationchange', () => {
            // Задержка для корректного получения размеров после поворота
            setTimeout(updateViewportHeight, 100);
            setTimeout(updateViewportHeight, 300); // Дополнительная проверка
        });

        // Обновляем при скролле (для браузеров, которые скрывают/показывают адресную строку)
        let ticking = false;
        const handleScroll = () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    updateViewportHeight();
                    ticking = false;
                });
                ticking = true;
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });

        // Дополнительная проверка при фокусе/разфокусе окна
        window.addEventListener('focus', updateViewportHeight);
        window.addEventListener('blur', updateViewportHeight);

        // Периодическая проверка для дополнительной стабильности
        setInterval(updateViewportHeight, 1000);

        console.log('[VIEWPORT] Динамическая высота viewport настроена');
    }

    /**
     * Настройка менеджера тем
     */
    setupThemeManager() {
        // Передаем иконку темы в менеджер
        if (this.elements.themeIcon) {
            this.themeManager.setThemeIcon(this.elements.themeIcon);
        }
        
        // Подписываемся на изменения системной темы
        this.themeManager.watchSystemTheme();
    }

    /**
     * Настройка Service Worker и обработка обновлений
     */
    setupServiceWorker() {
        if ('serviceWorker' in navigator) {
            // Проверяем наличие обновлений при загрузке
            navigator.serviceWorker.ready.then(registration => {
                console.log('[APP] Service Worker готов, проверяем обновления...');
                this.checkForUpdates(registration);
            });

            // Слушаем сообщения от Service Worker
            navigator.serviceWorker.addEventListener('message', (event) => {
                this.handleServiceWorkerMessage(event);
            });

            // Слушаем изменения Service Worker
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                console.log('[APP] Service Worker изменился, перезагружаем страницу...');
                this.handleServiceWorkerUpdate();
            });
        }
    }

    /**
     * Проверка обновлений Service Worker
     */
    checkForUpdates(registration) {
        if (registration.waiting) {
            console.log('[APP] Обнаружено ожидающее обновление Service Worker');
            this.handleUpdateAvailable(registration);
        }

        // Проверяем обновления в фоне
        registration.addEventListener('updatefound', () => {
            console.log('[APP] Обнаружено новое обновление Service Worker');
            const newWorker = registration.installing;
            
            newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    console.log('[APP] Новый Service Worker установлен и готов к активации');
                    this.handleUpdateAvailable(registration);
                }
            });
        });
    }

    /**
     * Обработка доступного обновления
     */
    handleUpdateAvailable(registration) {
        console.log('[APP] Обновление доступно, активируем...');
        
        // Показываем спиннер обновления
        this.showUpdateSpinner();
        
        if (registration.waiting) {
            // Отправляем команду на активацию обновления
            registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
    }

    /**
     * Обработка сообщений от Service Worker
     */
    handleServiceWorkerMessage(event) {
        const { data } = event;
        
        if (data.type === 'UPDATE_READY') {
            console.log('[APP] Получено уведомление о готовности обновления:', data);
            console.log('[APP] Версия обновления:', data.version);
            console.log('[APP] Время обновления:', data.timestamp);
        }
        
        if (data.type === 'UPDATE_STARTING') {
            console.log('[APP] Получено уведомление о начале обновления:', data);
            console.log('[APP] Версия обновления:', data.version);
            console.log('[APP] Время начала обновления:', data.timestamp);
            
            // Показываем спиннер, если он еще не показан
            if (!this.updateState.isUpdating) {
                this.showUpdateSpinner();
            }
        }
    }

    /**
     * Обработка обновления Service Worker
     */
    handleServiceWorkerUpdate() {
        console.log('[APP] Начинаем процесс перезагрузки приложения...');
        console.log('[APP] Сохраняем текущее состояние приложения...');
        
        // Сохраняем данные перед перезагрузкой
        this.saveData();
        
        // Устанавливаем флаг успешного обновления для показа после перезагрузки
        sessionStorage.setItem('randomatched-update-success', 'true');
        
        console.log('[APP] Перезагружаем страницу для применения обновления...');
        
        // Небольшая задержка для завершения логирования
        setTimeout(() => {
            window.location.reload();
        }, 100);
    }

    /**
     * Загрузка модулей приложения
     */
    async loadModules() {
        try {
            // Здесь будут загружаться модули по мере их создания
            // Пример: this.modules.generator = await import('./modules/generator.js');
            // Пример: this.modules.storage = await import('./modules/storage.js');
            
            console.log('Модули загружены');
        } catch (error) {
            console.error('Ошибка загрузки модулей:', error);
        }
    }

    /**
     * Установка обработчиков событий
     */
    setupEventListeners() {
        // Переключение темы
        if (this.elements.themeToggle) {
            this.elements.themeToggle.addEventListener('click', () => this.themeManager.toggleTheme());
        }

        // Выбор списка героев
        if (this.elements.heroListSelect) {
            this.elements.heroListSelect.addEventListener('change', (e) => this.onHeroListChange(e));
        }

        // Кнопка настроек
        if (this.elements.settingsBtn) {
            this.elements.settingsBtn.addEventListener('click', () => this.openSettings());
        }

        // Основные кнопки действий
        if (this.elements.generateBtn) {
            this.elements.generateBtn.addEventListener('click', () => this.generateTeams());
        }

        if (this.elements.lastGenerationBtn) {
            this.elements.lastGenerationBtn.addEventListener('click', () => this.showLastGeneration());
        }

        if (this.elements.resetSessionBtn) {
            this.elements.resetSessionBtn.addEventListener('click', () => this.resetSession());
        }

        // Демонстрационные кнопки модальных окон
        if (this.elements.demoFullscreenBtn) {
            this.elements.demoFullscreenBtn.addEventListener('click', () => this.demoFullscreenModal());
        }

        if (this.elements.demoBottomsheetBtn) {
            this.elements.demoBottomsheetBtn.addEventListener('click', () => this.demoBottomSheet());
        }

        if (this.elements.demoConfirmationBtn) {
            this.elements.demoConfirmationBtn.addEventListener('click', () => this.demoConfirmationDialog());
        }

        // Демонстрационные кнопки toast уведомлений
        if (this.elements.demoToastSuccessBtn) {
            this.elements.demoToastSuccessBtn.addEventListener('click', () => this.demoToastSuccess());
        }

        if (this.elements.demoToastErrorBtn) {
            this.elements.demoToastErrorBtn.addEventListener('click', () => this.demoToastError());
        }

        if (this.elements.demoToastWarningBtn) {
            this.elements.demoToastWarningBtn.addEventListener('click', () => this.demoToastWarning());
        }

        if (this.elements.demoToastInfoBtn) {
            this.elements.demoToastInfoBtn.addEventListener('click', () => this.demoToastInfo());
        }

        if (this.elements.demoToastMultipleBtn) {
            this.elements.demoToastMultipleBtn.addEventListener('click', () => this.demoToastMultiple());
        }

        if (this.elements.demoToastClearBtn) {
            this.elements.demoToastClearBtn.addEventListener('click', () => this.demoToastClear());
        }

        // Обработка изменений размера окна
        window.addEventListener('resize', () => this.handleResize());
        
        // Обработка онлайн/офлайн статуса
        window.addEventListener('online', () => this.handleOnlineStatus(true));
        window.addEventListener('offline', () => this.handleOnlineStatus(false));
    }


    /**
     * Обработка изменения списка героев
     */
    onHeroListChange(event) {
        const selectedValue = event.target.value;
        this.currentHeroList = selectedValue;
        
        console.log('Выбран список героев:', selectedValue);
        
        // Здесь будет логика загрузки списка героев
        if (selectedValue) {
            this.loadHeroList(selectedValue);
        }
    }

    /**
     * Загрузка списка героев
     */
    async loadHeroList(listType) {
        try {
            // Заглушка для будущей функциональности
            console.log('Загрузка списка героев:', listType);
            
            // Здесь будет загрузка данных из модуля storage или API
        } catch (error) {
            console.error('Ошибка загрузки списка героев:', error);
        }
    }

    /**
     * Открытие настроек
     */
    openSettings() {
        console.log('Открытие настроек');
        
        const settingsContent = `
            <div class="settings-content">
                <h3>Настройки приложения</h3>
                <p>Функция настроек будет добавлена в следующих версиях!</p>
                <div class="settings-options">
                    <div class="setting-item">
                        <label>Тема приложения</label>
                        <p>Автоматическое переключение темы</p>
                    </div>
                    <div class="setting-item">
                        <label>Уведомления</label>
                        <p>Включены</p>
                    </div>
                </div>
            </div>
        `;
        
        window.modalManager.createFullscreen('Настройки', settingsContent, {
            animation: 'slide-up'
        });
    }

    /**
     * Генерация команд
     */
    async generateTeams() {
        try {
            if (!this.currentHeroList) {
                window.modalManager.createBottomSheet(`
                    <div class="error-message">
                        <span class="material-icons">warning</span>
                        <p>Пожалуйста, выберите список героев</p>
                    </div>
                `, {
                    animation: 'slide-up'
                });
                return;
            }

            console.log('Генерация команд...');
            
            // Показываем индикатор загрузки
            this.setButtonLoading(this.elements.generateBtn, true);
            
            // Здесь будет логика генерации команд
            await this.simulateGeneration();
            
            // Сохраняем результат
            this.lastGeneration = {
                timestamp: new Date().toISOString(),
                heroList: this.currentHeroList,
                teams: [] // Здесь будут сгенерированные команды
            };
            
            // Обновляем кнопку последней генерации
            this.updateLastGenerationButton();
            
        } catch (error) {
            console.error('Ошибка генерации команд:', error);
            window.modalManager.createBottomSheet(`
                <div class="error-message">
                    <span class="material-icons">error</span>
                    <p>Произошла ошибка при генерации команд</p>
                </div>
            `, {
                animation: 'slide-up'
            });
        } finally {
            this.setButtonLoading(this.elements.generateBtn, false);
        }
    }

    /**
     * Симуляция генерации (заглушка)
     */
    async simulateGeneration() {
        return new Promise(resolve => {
            setTimeout(() => {
                console.log('Генерация завершена');
                resolve();
            }, 2000);
        });
    }

    /**
     * Показать последнюю генерацию
     */
    showLastGeneration() {
        if (!this.lastGeneration) {
            window.modalManager.createBottomSheet(`
                <div class="info-message">
                    <span class="material-icons">info</span>
                    <p>Нет сохраненных генераций</p>
                </div>
            `, {
                animation: 'slide-up'
            });
            return;
        }
        
        console.log('Показ последней генерации:', this.lastGeneration);
        
        const generationContent = `
            <div class="generation-content">
                <h3>Последняя генерация</h3>
                <p>Функция просмотра последней генерации будет добавлена в следующих версиях!</p>
                <div class="generation-info">
                    <p><strong>Время:</strong> ${new Date(this.lastGeneration.timestamp).toLocaleString()}</p>
                    <p><strong>Список героев:</strong> ${this.lastGeneration.heroList}</p>
                </div>
            </div>
        `;
        
        window.modalManager.createFullscreen('Последняя генерация', generationContent, {
            animation: 'fade-in'
        });
    }

    /**
     * Сброс сессии
     */
    async resetSession() {
        const confirmed = await window.modalManager.createConfirmation(
            'Сброс сессии',
            'Вы уверены, что хотите сбросить текущую сессию? Все несохраненные данные будут потеряны.',
            {
                confirmText: 'Сбросить',
                cancelText: 'Отмена',
                confirmClass: 'btn-error'
            }
        );
        
        if (confirmed) {
            this.currentHeroList = null;
            this.lastGeneration = null;
            
            // Сброс UI
            if (this.elements.heroListSelect) {
                this.elements.heroListSelect.value = '';
            }
            
            this.updateLastGenerationButton();
            
            console.log('Сессия сброшена');
            
            // Показываем уведомление об успешном сбросе
            window.toastManager.show('Сессия успешно сброшена', 'success', 3000);
        }
    }

    /**
     * Обновление кнопки последней генерации
     */
    updateLastGenerationButton() {
        if (this.elements.lastGenerationBtn) {
            if (this.lastGeneration) {
                this.elements.lastGenerationBtn.disabled = false;
                this.elements.lastGenerationBtn.style.opacity = '1';
            } else {
                this.elements.lastGenerationBtn.disabled = true;
                this.elements.lastGenerationBtn.style.opacity = '0.5';
            }
        }
    }

    /**
     * Установка состояния загрузки для кнопки
     */
    setButtonLoading(button, isLoading) {
        if (!button) return;
        
        if (isLoading) {
            button.disabled = true;
            button.style.opacity = '0.7';
            button.querySelector('.material-icons').textContent = 'hourglass_empty';
        } else {
            button.disabled = false;
            button.style.opacity = '1';
            button.querySelector('.material-icons').textContent = 'shuffle';
        }
    }

    /**
     * Инициализация данных
     */
    initData() {
        // Загрузка сохраненных данных из localStorage
        const savedHeroList = localStorage.getItem('randomatched-hero-list');
        if (savedHeroList && this.elements.heroListSelect) {
            this.elements.heroListSelect.value = savedHeroList;
            this.currentHeroList = savedHeroList;
        }
        
        const savedGeneration = localStorage.getItem('randomatched-last-generation');
        if (savedGeneration) {
            try {
                this.lastGeneration = JSON.parse(savedGeneration);
                this.updateLastGenerationButton();
            } catch (error) {
                console.error('Ошибка загрузки последней генерации:', error);
            }
        }
    }

    /**
     * Обработка изменения размера окна
     */
    handleResize() {
        // Здесь может быть логика для адаптивного дизайна
        console.log('Размер окна изменен:', window.innerWidth, 'x', window.innerHeight);
    }

    /**
     * Обработка онлайн/офлайн статуса
     */
    handleOnlineStatus(isOnline) {
        console.log('Статус подключения:', isOnline ? 'онлайн' : 'офлайн');
        
        // Здесь может быть логика для показа индикатора офлайн режима
        if (!isOnline) {
            this.showOfflineIndicator();
        } else {
            this.hideOfflineIndicator();
        }
    }

    /**
     * Показать индикатор офлайн режима
     */
    showOfflineIndicator() {
        // Создаем индикатор, если его нет
        let indicator = document.querySelector('.offline-indicator');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.className = 'offline-indicator';
            indicator.textContent = 'Офлайн режим';
            document.body.appendChild(indicator);
        }
        indicator.style.display = 'block';
    }

    /**
     * Скрыть индикатор офлайн режима
     */
    hideOfflineIndicator() {
        const indicator = document.querySelector('.offline-indicator');
        if (indicator) {
            indicator.style.display = 'none';
        }
    }

    /**
     * Сохранение данных в localStorage
     */
    saveData() {
        if (this.currentHeroList) {
            localStorage.setItem('randomatched-hero-list', this.currentHeroList);
        }
        
        if (this.lastGeneration) {
            localStorage.setItem('randomatched-last-generation', JSON.stringify(this.lastGeneration));
        }
    }

    /**
     * Показать спиннер обновления
     */
    showUpdateSpinner() {
        if (this.elements.updateIndicator && this.elements.updateSpinner) {
            this.updateState.isUpdating = true;
            this.elements.updateIndicator.style.display = 'flex';
            this.elements.updateSpinner.style.display = 'inline-block';
            this.elements.updateSuccess.style.display = 'none';
            console.log('[APP] Показан спиннер обновления');
        }
    }

    /**
     * Скрыть индикатор обновления
     */
    hideUpdateIndicator() {
        if (this.elements.updateIndicator) {
            this.elements.updateIndicator.style.display = 'none';
            this.updateState.isUpdating = false;
            console.log('[APP] Скрыт индикатор обновления');
        }
    }

    /**
     * Показать уведомление об успешном обновлении
     */
    showUpdateSuccess() {
        if (this.elements.updateIndicator && this.elements.updateSuccess) {
            this.elements.updateIndicator.style.display = 'flex';
            this.elements.updateSpinner.style.display = 'none';
            this.elements.updateSuccess.style.display = 'inline-block';
            this.updateState.hasUpdated = true;
            
            console.log('[APP] Показано уведомление об успешном обновлении');
            
            // Скрываем уведомление через 2 секунды
            setTimeout(() => {
                this.hideUpdateIndicator();
            }, 2000);
        }
    }

    /**
     * Проверка на успешное обновление после перезагрузки
     */
    checkForSuccessfulUpdate() {
        // Проверяем, было ли обновление в этой сессии
        const updateFlag = sessionStorage.getItem('randomatched-update-success');
        
        if (updateFlag === 'true') {
            console.log('[APP] Обнаружено успешное обновление, показываем уведомление');
            // Небольшая задержка для полной загрузки приложения
            setTimeout(() => {
                this.showUpdateSuccess();
            }, 500);
            
            // Удаляем флаг после показа
            sessionStorage.removeItem('randomatched-update-success');
        }
    }


    /**
     * Демонстрация полноэкранного модального окна
     */
    demoFullscreenModal() {
        const content = `
            <div class="demo-content">
                <h2>Полноэкранное модальное окно</h2>
                <p>Это пример полноэкранного модального окна с анимацией slide-up.</p>
                
                <div class="demo-features">
                    <h3>Возможности:</h3>
                    <ul>
                        <li>Полноэкранное отображение</li>
                        <li>Анимация появления</li>
                        <li>Кнопка закрытия в заголовке</li>
                        <li>Блокировка скролла body</li>
                        <li>Закрытие по Escape</li>
                        <li>Закрытие по клику на backdrop</li>
                    </ul>
                </div>
                
                <div class="demo-actions">
                    <button class="btn btn-primary" onclick="window.modalManager.closeAll()">
                        <span class="material-icons">close</span>
                        <span>Закрыть все модальные окна</span>
                    </button>
                </div>
            </div>
        `;
        
        window.modalManager.createFullscreen('Демо: Fullscreen Modal', content, {
            animation: 'slide-up'
        });
    }

    /**
     * Демонстрация Bottom Sheet
     */
    demoBottomSheet() {
        const content = `
            <div class="demo-content">
                <h3>Bottom Sheet</h3>
                <p>Это пример Bottom Sheet с анимацией slide-up и поддержкой свайпа.</p>
                
                <div class="demo-features">
                    <h4>Возможности:</h4>
                    <ul>
                        <li>Выезжает снизу экрана</li>
                        <li>Максимальная высота 90vh</li>
                        <li>Swipe down для закрытия</li>
                        <li>Backdrop с затемнением</li>
                        <li>Адаптивный дизайн</li>
                    </ul>
                </div>
                
                <div class="demo-tip">
                    <span class="material-icons">touch_app</span>
                    <p>Попробуйте свайпнуть вниз для закрытия</p>
                </div>
            </div>
        `;
        
        window.modalManager.createBottomSheet(content, {
            animation: 'slide-up'
        });
    }

    /**
     * Демонстрация диалога подтверждения
     */
    async demoConfirmationDialog() {
        const result = await window.modalManager.createConfirmation(
            'Демо: Confirmation Dialog',
            'Это пример диалога подтверждения с Promise для async/await. Выберите действие:',
            {
                confirmText: 'Подтвердить',
                cancelText: 'Отмена',
                confirmClass: 'btn-primary'
            }
        );
        
        if (result) {
            window.modalManager.createBottomSheet(`
                <div class="success-message">
                    <span class="material-icons">check_circle</span>
                    <p>Вы нажали "Подтвердить"!</p>
                </div>
            `, {
                animation: 'slide-up'
            });
        } else {
            window.modalManager.createBottomSheet(`
                <div class="info-message">
                    <span class="material-icons">info</span>
                    <p>Вы нажали "Отмена"</p>
                </div>
            `, {
                animation: 'slide-up'
            });
        }
    }

    /**
     * Демонстрация Success Toast
     */
    demoToastSuccess() {
        window.toastManager.show('Операция выполнена успешно!', 'success', 3000);
    }

    /**
     * Демонстрация Error Toast
     */
    demoToastError() {
        window.toastManager.show('Произошла ошибка при выполнении операции', 'error', 4000);
    }

    /**
     * Демонстрация Warning Toast
     */
    demoToastWarning() {
        window.toastManager.show('Внимание! Проверьте введенные данные', 'warning', 3500);
    }

    /**
     * Демонстрация Info Toast
     */
    demoToastInfo() {
        window.toastManager.show('Полезная информация для пользователя', 'info', 3000);
    }

    /**
     * Демонстрация множественных Toast
     */
    demoToastMultiple() {
        // Показываем несколько toast подряд для демонстрации очереди
        const messages = [
            { message: 'Первое уведомление', type: 'info' },
            { message: 'Второе уведомление', type: 'success' },
            { message: 'Третье уведомление', type: 'warning' },
            { message: 'Четвертое уведомление (в очереди)', type: 'error' },
            { message: 'Пятое уведомление (в очереди)', type: 'info' }
        ];

        messages.forEach((item, index) => {
            setTimeout(() => {
                window.toastManager.show(item.message, item.type, 2000);
            }, index * 500);
        });
    }

    /**
     * Очистка всех Toast
     */
    demoToastClear() {
        window.toastManager.clearAll();
    }
}

// Инициализация приложения после загрузки DOM
document.addEventListener('DOMContentLoaded', () => {
    window.randomatchedApp = new RandomatchedApp();
});

// Сохранение данных при закрытии страницы
window.addEventListener('beforeunload', () => {
    if (window.randomatchedApp) {
        window.randomatchedApp.saveData();
    }
});
