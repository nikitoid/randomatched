/**
 * Randomatched PWA - Основной файл приложения
 * Содержит инициализацию, загрузку модулей и обработчики событий
 */

import './modules/theme.js';
import './modules/modal.js';
import './modules/toast.js';
import './modules/storage.js';
import './modules/results.js';

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
        
        // Используем глобальные экземпляры менеджеров
        this.themeManager = window.themeManager;
        this.storageManager = window.storageManager;
        
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
            updateSuccess: document.getElementById('update-success')
        };
    }

    /**
     * Настройка динамической высоты viewport для предотвращения сдвига элементов
     */
    setupViewportHeight() {
        // Простая функция для обновления CSS переменных высоты viewport
        const updateViewportHeight = () => {
            const vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--vh', `${vh}px`);
        };

        // Функция для стабилизации viewport после обновления
        const stabilizeViewport = () => {
            console.log('[VIEWPORT] Стабилизируем viewport после обновления');
            
            // Добавляем класс стабилизации для предотвращения смещения
            document.body.classList.add('viewport-stabilizing');
            
            // Обновляем высоту
            updateViewportHeight();
            
            // Убираем класс стабилизации через короткое время
            setTimeout(() => {
                document.body.classList.remove('viewport-stabilizing');
                document.body.classList.add('viewport-stabilized');
                
                // Убираем класс завершения через короткое время
                setTimeout(() => {
                    document.body.classList.remove('viewport-stabilized');
                }, 300);
            }, 100);
        };

        // Устанавливаем начальное значение
        updateViewportHeight();

        // Обновляем при изменении размера окна
        window.addEventListener('resize', updateViewportHeight);
        
        // Обновляем при изменении ориентации устройства
        window.addEventListener('orientationchange', () => {
            setTimeout(() => updateViewportHeight(), 100);
        });

        // Стабилизация при загрузке страницы (особенно важно после обновления PWA)
        window.addEventListener('load', () => {
            console.log('[VIEWPORT] Страница загружена, стабилизируем viewport');
            setTimeout(stabilizeViewport, 100);
        });

        // Стабилизация при DOMContentLoaded
        document.addEventListener('DOMContentLoaded', () => {
            console.log('[VIEWPORT] DOM загружен, стабилизируем viewport');
            setTimeout(stabilizeViewport, 50);
        });

        // Экспортируем функцию стабилизации для использования при обновлении
        this.stabilizeViewport = stabilizeViewport;

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
        
        // Добавляем класс для стабилизации viewport во время обновления
        document.body.classList.add('pwa-updating');
        
        // Убеждаемся, что спиннер продолжает вращаться
        this.ensureSpinnerRunning();
        
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
        
        // Устанавливаем активный список в storage
        if (selectedValue) {
            this.storageManager.setActiveList(selectedValue);
            this.loadHeroList(selectedValue);
        }
    }

    /**
     * Загрузка списка героев
     */
    async loadHeroList(listId) {
        try {
            const list = this.storageManager.getList(listId);
            if (list) {
                console.log('Загружен список героев:', list.name, 'с', list.heroes.length, 'героями');
                // Здесь можно добавить логику обновления UI с героями
            } else {
                console.warn('Список героев не найден:', listId);
            }
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
            
            // Генерируем команды
            const generationData = await this.generateTeamsData();
            
            // Сохраняем результат
            this.lastGeneration = {
                timestamp: new Date().toISOString(),
                heroList: this.currentHeroList,
                players: generationData.players
            };
            
            // Сохраняем в storage
            this.storageManager.saveLastGeneration(this.lastGeneration);
            
            // Обновляем кнопку последней генерации
            this.updateLastGenerationButton();
            
            // Показываем результаты
            window.resultsDisplay.showResults(this.lastGeneration);
            
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
     * Генерация данных команд
     */
    async generateTeamsData() {
        // Получаем список героев
        const heroList = this.storageManager.getList(this.currentHeroList);
        if (!heroList || !heroList.heroes) {
            throw new Error('Список героев не найден');
        }
        
        // Создаем копию списка героев для перемешивания
        const availableHeroes = [...heroList.heroes];
        
        // Перемешиваем героев
        this.shuffleArray(availableHeroes);
        
        // Создаем игроков (по умолчанию 4 игрока)
        const playerCount = 4;
        const players = [];
        
        for (let i = 0; i < playerCount && i < availableHeroes.length; i++) {
            players.push({
                index: i,
                heroName: availableHeroes[i],
                team: (i % 2) + 1 // Чередуем команды: 1, 2, 1, 2
            });
        }
        
        // Небольшая задержка для имитации генерации
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        return { players };
    }

    /**
     * Перемешивание массива (алгоритм Fisher-Yates)
     */
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
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
        
        // Показываем результаты через модуль ResultsDisplay
        window.resultsDisplay.showResults(this.lastGeneration);
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
            // Очищаем сессию через storage manager
            const deletedCount = this.storageManager.clearSession();
            
            this.currentHeroList = null;
            this.lastGeneration = null;
            
            // Сброс UI
            if (this.elements.heroListSelect) {
                this.elements.heroListSelect.value = '';
            }
            
            this.updateLastGenerationButton();
            
            console.log('Сессия сброшена, удалено временных списков:', deletedCount);
            
            // Показываем уведомление об успешном сбросе
            window.toastManager.show(`Сессия сброшена (удалено ${deletedCount} временных списков)`, 'success', 3000);
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
        // Загрузка активного списка героев
        const activeList = this.storageManager.getActiveList();
        if (activeList && this.elements.heroListSelect) {
            this.elements.heroListSelect.value = activeList.id;
            this.currentHeroList = activeList.id;
        }
        
        // Загрузка последней генерации
        const lastGeneration = this.storageManager.getLastGeneration();
        if (lastGeneration) {
            this.lastGeneration = lastGeneration;
            this.updateLastGenerationButton();
        }

        // Загрузка темы
        const theme = this.storageManager.getTheme();
        if (theme && this.themeManager) {
            this.themeManager.setTheme(theme);
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
        // Данные теперь сохраняются автоматически через StorageManager
        // Этот метод оставлен для совместимости
        console.log('Данные сохраняются автоматически через StorageManager');
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
            
            // Принудительно запускаем анимацию
            this.ensureSpinnerRunning();
            
            console.log('[APP] Показан спиннер обновления');
        }
    }

    /**
     * Убедиться, что спиннер продолжает вращаться
     */
    ensureSpinnerRunning() {
        if (this.elements.updateSpinner) {
            // Добавляем класс для принудительного вращения
            this.elements.updateSpinner.classList.add('force-spin');
            
            // Принудительно перезапускаем анимацию
            this.elements.updateSpinner.style.animation = 'none';
            // Небольшая задержка для сброса анимации
            setTimeout(() => {
                this.elements.updateSpinner.style.animation = 'spin 1s linear infinite';
            }, 10);
            
            console.log('[APP] Спиннер принудительно перезапущен');
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
            
            // Убираем класс принудительного вращения
            if (this.elements.updateSpinner) {
                this.elements.updateSpinner.classList.remove('force-spin');
            }
            
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
            console.log('[APP] Обнаружено успешное обновление, показываем спиннер');
            
            // Сначала показываем спиннер, чтобы он продолжал вращаться
            this.showUpdateSpinner();
            
            // Убираем класс pwa-updating, если он был установлен
            document.body.classList.remove('pwa-updating');
            
            // Запускаем стабилизацию viewport
            if (this.stabilizeViewport) {
                setTimeout(() => {
                    this.stabilizeViewport();
                }, 200);
            }
            
            // Небольшая задержка для полной загрузки приложения, затем показываем успех
            setTimeout(() => {
                this.showUpdateSuccess();
            }, 1000);
            
            // Удаляем флаг после показа
            sessionStorage.removeItem('randomatched-update-success');
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
