/**
 * StorageManager - Модуль для работы с localStorage
 * Управляет списками героев, активными списками, генерациями и настройками
 */

export class StorageManager {
    constructor() {
        this.storageKey = 'randomatched-data';
        this.defaultData = {
            lists: {},
            activeList: null,
            lastGeneration: null,
            theme: 'light',
            settings: {}
        };
        
        // Инициализируем данные
        this.init();
    }

    /**
     * Инициализация данных из localStorage
     */
    init() {
        try {
            const storedData = localStorage.getItem(this.storageKey);
            if (storedData) {
                const parsedData = JSON.parse(storedData);
                this.data = { ...this.defaultData, ...parsedData };
            } else {
                this.data = { ...this.defaultData };
                this.save();
            }
        } catch (error) {
            console.error('Ошибка инициализации StorageManager:', error);
            this.data = { ...this.defaultData };
            this.save();
        }
    }

    /**
     * Сохранение данных в localStorage
     */
    save() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.data));
        } catch (error) {
            console.error('Ошибка сохранения данных:', error);
        }
    }

    /**
     * Получить списки по типу
     * @param {string} type - Тип списка ('local', 'cloud', 'temp' или null для всех)
     * @returns {Object} Объект со списками
     */
    getLists(type = null) {
        if (!type) {
            return this.data.lists;
        }
        
        const filteredLists = {};
        Object.entries(this.data.lists).forEach(([id, list]) => {
            if (list.type === type) {
                filteredLists[id] = list;
            }
        });
        
        return filteredLists;
    }

    /**
     * Получить конкретный список по ID
     * @param {string} id - ID списка
     * @returns {Object|null} Объект списка или null
     */
    getList(id) {
        return this.data.lists[id] || null;
    }

    /**
     * Сохранить список
     * @param {Object} list - Объект списка
     * @returns {boolean} Успешность операции
     */
    saveList(list) {
        if (!this.validateList(list)) {
            console.error('Некорректная структура списка:', list);
            return false;
        }

        this.data.lists[list.id] = {
            ...list,
            updatedAt: Date.now()
        };
        
        this.save();
        return true;
    }

    /**
     * Удалить список
     * @param {string} id - ID списка
     * @returns {boolean} Успешность операции
     */
    deleteList(id) {
        if (!this.data.lists[id]) {
            return false;
        }

        delete this.data.lists[id];
        
        // Если удаляемый список был активным, сбрасываем активный список
        if (this.data.activeList === id) {
            this.data.activeList = null;
        }
        
        this.save();
        return true;
    }

    /**
     * Получить активный список
     * @returns {Object|null} Активный список или null
     */
    getActiveList() {
        if (!this.data.activeList) {
            return null;
        }
        
        return this.getList(this.data.activeList);
    }

    /**
     * Установить активный список
     * @param {string} id - ID списка
     * @returns {boolean} Успешность операции
     */
    setActiveList(id) {
        if (!this.data.lists[id]) {
            console.error('Список с ID не найден:', id);
            return false;
        }

        this.data.activeList = id;
        this.save();
        return true;
    }

    /**
     * Получить последнюю генерацию
     * @returns {Object|null} Данные последней генерации или null
     */
    getLastGeneration() {
        return this.data.lastGeneration;
    }

    /**
     * Сохранить последнюю генерацию
     * @param {Object} generationData - Данные генерации
     * @returns {boolean} Успешность операции
     */
    saveLastGeneration(generationData) {
        if (!generationData || !generationData.players || !Array.isArray(generationData.players)) {
            console.error('Некорректные данные генерации:', generationData);
            return false;
        }

        this.data.lastGeneration = {
            timestamp: Date.now(),
            players: generationData.players,
            activeListId: this.data.activeList,
            ...generationData
        };
        
        this.save();
        return true;
    }

    /**
     * Очистить сессию (удалить временные списки)
     * @returns {number} Количество удаленных списков
     */
    clearSession() {
        let deletedCount = 0;
        const tempLists = this.getLists('temp');
        
        Object.keys(tempLists).forEach(id => {
            if (this.deleteList(id)) {
                deletedCount++;
            }
        });
        
        return deletedCount;
    }

    /**
     * Генерация уникального UUID
     * @returns {string} Уникальный ID
     */
    generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    /**
     * Создать ID для списка по типу
     * @param {string} type - Тип списка
     * @returns {string} ID списка
     */
    createListId(type) {
        const uuid = this.generateUUID();
        return `${type}_${uuid}`;
    }

    /**
     * Валидация структуры списка
     * @param {Object} list - Объект списка для валидации
     * @returns {boolean} Валидность структуры
     */
    validateList(list) {
        if (!list || typeof list !== 'object') {
            return false;
        }

        // Обязательные поля
        const requiredFields = ['id', 'name', 'heroes', 'type'];
        for (const field of requiredFields) {
            if (!(field in list)) {
                return false;
            }
        }

        // Проверка типов
        if (typeof list.id !== 'string' || 
            typeof list.name !== 'string' || 
            !Array.isArray(list.heroes) ||
            typeof list.type !== 'string') {
            return false;
        }

        // Проверка типа списка
        const validTypes = ['local', 'cloud', 'temp'];
        if (!validTypes.includes(list.type)) {
            return false;
        }

        // Проверка героев (должны быть строками)
        if (!list.heroes.every(hero => typeof hero === 'string')) {
            return false;
        }

        // Дополнительные проверки для разных типов
        if (list.type === 'cloud' && typeof list.cached !== 'boolean') {
            return false;
        }

        if (list.type === 'temp' && !list.baseListId) {
            return false;
        }

        return true;
    }

    /**
     * Создать новый локальный список
     * @param {string} name - Название списка
     * @param {Array} heroes - Массив героев
     * @returns {Object|null} Созданный список или null
     */
    createLocalList(name, heroes) {
        const id = this.createListId('local');
        const list = {
            id,
            name,
            heroes: [...heroes],
            type: 'local',
            createdAt: Date.now()
        };

        if (this.saveList(list)) {
            return list;
        }
        
        return null;
    }

    /**
     * Создать новый облачный список
     * @param {string} name - Название списка
     * @param {Array} heroes - Массив героев
     * @param {boolean} cached - Кэширован ли список
     * @returns {Object|null} Созданный список или null
     */
    createCloudList(name, heroes, cached = true) {
        const id = this.createListId('cloud');
        const list = {
            id,
            name,
            heroes: [...heroes],
            type: 'cloud',
            cached,
            lastSync: Date.now()
        };

        if (this.saveList(list)) {
            return list;
        }
        
        return null;
    }

    /**
     * Создать временный список (исключения)
     * @param {string} name - Название списка
     * @param {Array} heroes - Массив героев
     * @param {string} baseListId - ID базового списка
     * @returns {Object|null} Созданный список или null
     */
    createTempList(name, heroes, baseListId) {
        const id = this.createListId('temp');
        const list = {
            id,
            name,
            heroes: [...heroes],
            type: 'temp',
            baseListId
        };

        if (this.saveList(list)) {
            return list;
        }
        
        return null;
    }

    /**
     * Экспорт всех данных
     * @returns {Object} Все данные приложения
     */
    exportData() {
        return {
            ...this.data,
            exportDate: new Date().toISOString(),
            version: '1.0.0'
        };
    }

    /**
     * Импорт данных
     * @param {Object} data - Данные для импорта
     * @returns {boolean} Успешность операции
     */
    importData(data) {
        if (!data || typeof data !== 'object') {
            console.error('Некорректные данные для импорта:', data);
            return false;
        }

        try {
            // Валидируем основные поля
            if (data.lists && typeof data.lists === 'object') {
                // Валидируем каждый список
                for (const [id, list] of Object.entries(data.lists)) {
                    if (!this.validateList(list)) {
                        console.error('Некорректный список при импорте:', id, list);
                        return false;
                    }
                }
            }

            // Импортируем данные
            this.data = {
                ...this.defaultData,
                ...data,
                // Сохраняем текущую тему и настройки, если они не импортированы
                theme: data.theme || this.data.theme,
                settings: data.settings || this.data.settings
            };

            this.save();
            return true;
        } catch (error) {
            console.error('Ошибка импорта данных:', error);
            return false;
        }
    }

    /**
     * Получить настройки
     * @returns {Object} Настройки приложения
     */
    getSettings() {
        return this.data.settings || {};
    }

    /**
     * Сохранить настройки
     * @param {Object} settings - Настройки для сохранения
     * @returns {boolean} Успешность операции
     */
    saveSettings(settings) {
        if (!settings || typeof settings !== 'object') {
            return false;
        }

        this.data.settings = { ...this.data.settings, ...settings };
        this.save();
        return true;
    }

    /**
     * Получить тему
     * @returns {string} Текущая тема
     */
    getTheme() {
        return this.data.theme || 'light';
    }

    /**
     * Установить тему
     * @param {string} theme - Название темы
     * @returns {boolean} Успешность операции
     */
    setTheme(theme) {
        const validThemes = ['light', 'dark', 'auto'];
        if (!validThemes.includes(theme)) {
            return false;
        }

        this.data.theme = theme;
        this.save();
        return true;
    }

    /**
     * Получить статистику
     * @returns {Object} Статистика использования
     */
    getStats() {
        const lists = this.data.lists;
        const stats = {
            totalLists: Object.keys(lists).length,
            localLists: 0,
            cloudLists: 0,
            tempLists: 0,
            totalHeroes: 0,
            lastGeneration: this.data.lastGeneration ? new Date(this.data.lastGeneration.timestamp) : null
        };

        Object.values(lists).forEach(list => {
            stats[`${list.type}Lists`]++;
            stats.totalHeroes += list.heroes.length;
        });

        return stats;
    }

    /**
     * Очистить все данные
     * @returns {boolean} Успешность операции
     */
    clearAll() {
        try {
            this.data = { ...this.defaultData };
            this.save();
            return true;
        } catch (error) {
            console.error('Ошибка очистки данных:', error);
            return false;
        }
    }
}

// Создаем глобальный экземпляр
window.storageManager = new StorageManager();
