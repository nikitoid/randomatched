/**
 * ThemeManager - Модуль управления темами для Randomatched PWA
 * Содержит функционал переключения между светлой и темной темой с Material Design
 */

export class ThemeManager {
    constructor() {
        this.isDark = false;
        this.themeIcon = null;
        this.storageKey = 'randomatched-theme';
        
        this.init();
    }

    /**
     * Инициализация менеджера тем
     */
    init() {
        this.loadThemeFromStorage();
        this.applyTheme();
        console.log('[ThemeManager] Инициализирован');
    }

    /**
     * Загрузка темы из localStorage
     */
    loadThemeFromStorage() {
        const savedTheme = localStorage.getItem(this.storageKey);
        if (savedTheme) {
            this.isDark = savedTheme === 'dark';
        } else {
            // Автоопределение темы системы
            this.isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        }
    }

    /**
     * Переключение темы
     */
    toggleTheme() {
        this.isDark = !this.isDark;
        this.applyTheme();
        this.saveThemeToStorage();
        this.animateThemeIcon();
    }

    /**
     * Применение темы к документу
     */
    applyTheme() {
        document.documentElement.setAttribute('data-theme', this.isDark ? 'dark' : 'light');
        this.updateThemeIcon();
    }

    /**
     * Обновление иконки темы
     */
    updateThemeIcon() {
        if (this.themeIcon) {
            this.themeIcon.textContent = this.isDark ? 'light_mode' : 'dark_mode';
        }
    }

    /**
     * Анимация иконки при переключении темы
     */
    animateThemeIcon() {
        if (this.themeIcon) {
            this.themeIcon.style.transform = 'rotate(180deg)';
            setTimeout(() => {
                this.themeIcon.style.transform = 'rotate(0deg)';
            }, 300);
        }
    }

    /**
     * Сохранение темы в localStorage
     */
    saveThemeToStorage() {
        localStorage.setItem(this.storageKey, this.isDark ? 'dark' : 'light');
    }

    /**
     * Установка ссылки на иконку темы
     * @param {HTMLElement} iconElement - Элемент иконки темы
     */
    setThemeIcon(iconElement) {
        this.themeIcon = iconElement;
        this.updateThemeIcon();
    }

    /**
     * Получение текущей темы
     * @returns {boolean} true если темная тема, false если светлая
     */
    getCurrentTheme() {
        return this.isDark;
    }

    /**
     * Установка темы
     * @param {boolean} isDark - true для темной темы, false для светлой
     */
    setTheme(isDark) {
        this.isDark = isDark;
        this.applyTheme();
        this.saveThemeToStorage();
    }

    /**
     * Подписка на изменения системной темы
     */
    watchSystemTheme() {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        
        const handleChange = (e) => {
            // Применяем системную тему только если пользователь не выбрал свою
            const savedTheme = localStorage.getItem(this.storageKey);
            if (!savedTheme) {
                this.isDark = e.matches;
                this.applyTheme();
            }
        };

        mediaQuery.addEventListener('change', handleChange);
        
        // Возвращаем функцию для отписки
        return () => mediaQuery.removeEventListener('change', handleChange);
    }

    /**
     * Уничтожение менеджера тем
     */
    destroy() {
        // Очищаем обработчики событий
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        // Очищаем все обработчики изменения системной темы
        mediaQuery.removeEventListener('change', () => {});
    }
}

// Создаем глобальный экземпляр
window.themeManager = new ThemeManager();

// Экспортируем для использования в модулях
export default window.themeManager;
