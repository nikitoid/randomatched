/**
 * Randomatched PWA - Основной файл приложения
 * Содержит инициализацию, загрузку модулей и обработчики событий
 */

class RandomatchedApp {
    constructor() {
        this.isDark = false;
        this.currentHeroList = null;
        this.lastGeneration = null;
        this.modules = {};
        
        // DOM элементы
        this.elements = {};
        
        this.init();
    }

    /**
     * Инициализация приложения
     */
    async init() {
        try {
            // Инициализация темы
            this.initTheme();
            
            // Получение DOM элементов
            this.getElements();
            
            // Загрузка модулей
            await this.loadModules();
            
            // Установка обработчиков событий
            this.setupEventListeners();
            
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
            this.elements.themeToggle.addEventListener('click', () => this.toggleTheme());
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
     * Инициализация темы из localStorage
     */
    initTheme() {
        const savedTheme = localStorage.getItem('randomatched-theme');
        if (savedTheme) {
            this.isDark = savedTheme === 'dark';
        } else {
            // Автоопределение темы системы
            this.isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        }
        this.applyTheme();
    }

    /**
     * Переключение темы
     */
    toggleTheme() {
        this.isDark = !this.isDark;
        this.applyTheme();
        localStorage.setItem('randomatched-theme', this.isDark ? 'dark' : 'light');
        
        // Анимация иконки
        if (this.elements.themeIcon) {
            this.elements.themeIcon.style.transform = 'rotate(180deg)';
            setTimeout(() => {
                this.elements.themeIcon.style.transform = 'rotate(0deg)';
            }, 300);
        }
    }

    /**
     * Применение темы
     */
    applyTheme() {
        document.documentElement.setAttribute('data-theme', this.isDark ? 'dark' : 'light');
        
        if (this.elements.themeIcon) {
            this.elements.themeIcon.textContent = this.isDark ? 'light_mode' : 'dark_mode';
        }
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
