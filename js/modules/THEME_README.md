# Theme Manager System

Система управления темами для Randomatched PWA с поддержкой Material Design 3.

## Возможности

- ✅ Автоматическое определение системной темы
- ✅ Переключение между светлой и темной темой
- ✅ Сохранение выбранной темы в localStorage
- ✅ Анимация иконки при переключении темы
- ✅ Подписка на изменения системной темы
- ✅ Material Design 3 цветовая схема
- ✅ Поддержка CSS переменных для кастомизации
- ✅ Глобальный доступ через window.themeManager

## Использование

### Базовое использование

```javascript
// Переключить тему
window.themeManager.toggleTheme();

// Получить текущую тему
const isDark = window.themeManager.getCurrentTheme();

// Установить конкретную тему
window.themeManager.setTheme(true); // true = темная, false = светлая

// Установить иконку темы
window.themeManager.setThemeIcon(iconElement);
```

### Инициализация

```javascript
// Модуль автоматически инициализируется при импорте
import './modules/theme.js';

// Или через глобальный экземпляр
const themeManager = window.themeManager;
```

## API

### ThemeManager.toggleTheme()

Переключает между светлой и темной темой.

**Возвращает:** `void`

### ThemeManager.getCurrentTheme()

Возвращает текущую тему.

**Возвращает:** `boolean` - `true` если темная тема, `false` если светлая

### ThemeManager.setTheme(isDark)

Устанавливает конкретную тему.

**Параметры:**
- `isDark` (boolean) - `true` для темной темы, `false` для светлой

**Возвращает:** `void`

### ThemeManager.setThemeIcon(iconElement)

Устанавливает ссылку на элемент иконки темы для автоматического обновления.

**Параметры:**
- `iconElement` (HTMLElement) - Элемент иконки темы

**Возвращает:** `void`

### ThemeManager.watchSystemTheme()

Подписывается на изменения системной темы и автоматически применяет их, если пользователь не выбрал свою тему.

**Возвращает:** `Function` - Функция для отписки от событий

### ThemeManager.destroy()

Очищает все обработчики событий и освобождает ресурсы.

**Возвращает:** `void`

## CSS Переменные

Модуль использует CSS переменные Material Design 3 для автоматического переключения тем:

### Светлая тема
```css
:root {
  --md-sys-color-primary: #6750a4;
  --md-sys-color-on-primary: #ffffff;
  --md-sys-color-background: #fffbfe;
  --md-sys-color-on-background: #1c1b1f;
  --md-sys-color-surface: #fffbfe;
  --md-sys-color-on-surface: #1c1b1f;
  /* ... и другие переменные */
}
```

### Темная тема
```css
[data-theme="dark"] {
  --md-sys-color-primary: #d0bcff;
  --md-sys-color-on-primary: #381e72;
  --md-sys-color-background: #1c1b1f;
  --md-sys-color-on-background: #e6e1e5;
  --md-sys-color-surface: #1c1b1f;
  --md-sys-color-on-surface: #e6e1e5;
  /* ... и другие переменные */
}
```

## HTML Структура

### Кнопка переключения темы
```html
<button id="theme-toggle" class="theme-toggle-btn" aria-label="Переключить тему">
    <span class="material-icons theme-icon">dark_mode</span>
</button>
```

### Обработчик события
```javascript
document.getElementById('theme-toggle').addEventListener('click', () => {
    window.themeManager.toggleTheme();
});
```

## Настройка

### Кастомизация цветов

Для добавления собственных цветов в тему:

```css
:root {
  --custom-color: #your-color;
}

[data-theme="dark"] {
  --custom-color: #your-dark-color;
}
```

### Кастомизация анимации иконки

```css
.theme-icon {
  transition: transform 0.3s ease;
}

.theme-icon.rotating {
  transform: rotate(180deg);
}
```

## Хранение данных

Модуль сохраняет выбранную тему в localStorage:

```javascript
// Ключ для хранения
const storageKey = 'randomatched-theme';

// Значения
// 'light' - светлая тема
// 'dark' - темная тема
// null - использовать системную тему
```

## Интеграция с другими модулями

### С Modal Manager
```javascript
// Модальные окна автоматически адаптируются к теме
window.modalManager.createFullscreen('Заголовок', 'Содержимое');
```

### С Toast Manager
```javascript
// Toast уведомления поддерживают темы
window.toastManager.show('Сообщение', 'success');
```

## События

Модуль автоматически обрабатывает:

- `prefers-color-scheme` изменения
- Клики по кнопке переключения темы
- Загрузку сохраненной темы из localStorage

## Поддержка браузеров

- ✅ Chrome 88+
- ✅ Firefox 85+
- ✅ Safari 14+
- ✅ Edge 88+

## Технические детали

- Использует `window.matchMedia('(prefers-color-scheme: dark)')` для определения системной темы
- Автоматически применяет `data-theme` атрибут к `document.documentElement`
- Поддерживает анимацию иконки через CSS transitions
- Оптимизирован для производительности с минимальными DOM операциями
- Полностью совместим с PWA и Service Worker

## Примеры использования

### Простое переключение темы
```javascript
// Переключить тему по клику
document.getElementById('theme-toggle').addEventListener('click', () => {
    window.themeManager.toggleTheme();
});
```

### Программное управление темой
```javascript
// Установить темную тему
window.themeManager.setTheme(true);

// Установить светлую тему
window.themeManager.setTheme(false);

// Проверить текущую тему
if (window.themeManager.getCurrentTheme()) {
    console.log('Темная тема активна');
} else {
    console.log('Светлая тема активна');
}
```

### Интеграция с иконкой
```javascript
// Получить элемент иконки
const themeIcon = document.querySelector('.theme-icon');

// Установить для автоматического обновления
window.themeManager.setThemeIcon(themeIcon);
```

### Подписка на системные изменения
```javascript
// Подписаться на изменения системной темы
const unsubscribe = window.themeManager.watchSystemTheme();

// Отписаться при необходимости
unsubscribe();
```
