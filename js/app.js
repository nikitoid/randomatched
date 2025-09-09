/**
 * Randomatched PWA - Основной файл приложения
 * Содержит инициализацию, загрузку модулей и обработчики событий
 */

import { ThemeManager } from './modules/theme.js';

class RandomatchedApp {
    constructor() {
        this.currentHeroList = null;
        this.lastGeneration = null;
        this.modules = {};
        
        // DOM элементы
        this.elements = {};
        
        // Инициализация менеджера тем
        this.themeManager = new ThemeManager();
        
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
            resetSessionBtn: document.getElementById('reset-session-btn')
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
    }

    /**
     * Обработка обновления Service Worker
     */
    handleServiceWorkerUpdate() {
        console.log('[APP] Начинаем процесс перезагрузки приложения...');
        console.log('[APP] Сохраняем текущее состояние приложения...');
        
        // Сохраняем данные перед перезагрузкой
        this.saveData();
        
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
        // Здесь будет открытие модального окна настроек
        alert('Функция настроек будет добавлена в следующих версиях!');
    }

    /**
     * Генерация команд
     */
    async generateTeams() {
        try {
            if (!this.currentHeroList) {
                alert('Пожалуйста, выберите список героев');
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
            alert('Произошла ошибка при генерации команд');
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
            alert('Нет сохраненных генераций');
            return;
        }
        
        console.log('Показ последней генерации:', this.lastGeneration);
        alert('Функция просмотра последней генерации будет добавлена в следующих версиях!');
    }

    /**
     * Сброс сессии
     */
    resetSession() {
        if (confirm('Вы уверены, что хотите сбросить текущую сессию?')) {
            this.currentHeroList = null;
            this.lastGeneration = null;
            
            // Сброс UI
            if (this.elements.heroListSelect) {
                this.elements.heroListSelect.value = '';
            }
            
            this.updateLastGenerationButton();
            
            console.log('Сессия сброшена');
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
