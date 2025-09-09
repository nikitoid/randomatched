# Модуль модальных окон (Modal.js)

Универсальный модуль для работы с модальными окнами в PWA приложении Randomatched.

## Возможности

### Типы модальных окон

1. **Fullscreen Modal** - Полноэкранное модальное окно
2. **Bottom Sheet** - Выезжающее снизу окно
3. **Confirmation Dialog** - Диалог подтверждения

### Основные функции

- ✅ Управление стеком модальных окон
- ✅ Автоматическое управление z-index
- ✅ Блокировка скролла body
- ✅ Закрытие по Escape и клику на backdrop
- ✅ Предотвращение закрытия при клике внутри окна
- ✅ Поддержка свайпа для Bottom Sheet
- ✅ Анимации (fade-in, slide-up, scale-in)
- ✅ Promise для async/await в диалогах подтверждения
- ✅ Адаптивный дизайн
- ✅ Поддержка темной темы

## Использование

### Базовое использование

```javascript
// Полноэкранное модальное окно
const modalId = window.modalManager.createFullscreen(
    'Заголовок',
    '<p>Содержимое модального окна</p>',
    {
        animation: 'slide-up' // или 'fade-in'
    }
);

// Bottom Sheet
const modalId = window.modalManager.createBottomSheet(
    '<p>Содержимое Bottom Sheet</p>',
    {
        animation: 'slide-up'
    }
);

// Диалог подтверждения с Promise
const result = await window.modalManager.createConfirmation(
    'Подтверждение',
    'Вы уверены?',
    {
        confirmText: 'Да',
        cancelText: 'Нет',
        confirmClass: 'btn-primary'
    }
);

if (result) {
    console.log('Пользователь подтвердил');
} else {
    console.log('Пользователь отменил');
}
```

### Продвинутое использование

```javascript
// Создание кастомного модального окна
const modalId = window.modalManager.open('fullscreen', content, {
    animation: 'fade-in',
    preventClose: true, // Запретить закрытие по Escape и backdrop
    onClose: () => {
        console.log('Модальное окно закрыто');
    }
});

// Закрытие конкретного модального окна
window.modalManager.close(modalId);

// Закрытие всех модальных окон
window.modalManager.closeAll();
```

## API

### ModalManager

#### Методы

- `open(type, content, options)` - Открытие модального окна
- `close(modalId)` - Закрытие модального окна
- `closeAll()` - Закрытие всех модальных окон
- `createFullscreen(title, content, options)` - Создание полноэкранного окна
- `createBottomSheet(content, options)` - Создание Bottom Sheet
- `createConfirmation(title, message, options)` - Создание диалога подтверждения

#### Параметры

**type** (string):
- `'fullscreen'` - Полноэкранное окно
- `'bottomsheet'` - Bottom Sheet
- `'confirmation'` - Диалог подтверждения

**content** (string|HTMLElement):
- HTML строка или DOM элемент

**options** (object):
- `animation` - Тип анимации ('fade-in', 'slide-up', 'scale-in')
- `preventClose` - Запретить закрытие по Escape и backdrop
- `onClose` - Callback при закрытии
- `confirmText` - Текст кнопки подтверждения
- `cancelText` - Текст кнопки отмены
- `confirmClass` - CSS класс кнопки подтверждения

## CSS классы

### Базовые классы

- `.modal` - Основной контейнер модального окна
- `.modal-backdrop` - Затемненный фон
- `.modal-container` - Контейнер содержимого
- `.modal-show` - Класс для показа модального окна

### Типы модальных окон

- `.modal-fullscreen` - Полноэкранное окно
- `.modal-bottomsheet` - Bottom Sheet
- `.modal-confirmation` - Диалог подтверждения

### Анимации

- `[data-animation="fade-in"]` - Анимация появления
- `[data-animation="slide-up"]` - Анимация выезжания снизу
- `[data-animation="scale-in"]` - Анимация масштабирования

## Примеры

### Демонстрация

В приложении добавлены демонстрационные кнопки для тестирования всех типов модальных окон:

1. **Fullscreen Modal** - Показывает полноэкранное окно с информацией
2. **Bottom Sheet** - Демонстрирует Bottom Sheet с поддержкой свайпа
3. **Confirmation Dialog** - Тестирует диалог подтверждения с Promise

### Интеграция в приложение

Модуль уже интегрирован в основное приложение и используется для:

- Отображения настроек
- Показа ошибок и уведомлений
- Диалогов подтверждения
- Информационных сообщений

## Технические детали

### Управление стеком

Модальные окна автоматически управляются в стеке с правильным z-index. Каждое новое окно появляется поверх предыдущего.

### Блокировка скролла

При открытии модального окна автоматически блокируется скролл body для предотвращения прокрутки фонового контента.

### Обработка событий

- **Escape** - Закрытие модального окна (если не запрещено)
- **Клик на backdrop** - Закрытие модального окна (если не запрещено)
- **Клик внутри контейнера** - Предотвращение закрытия
- **Touch события** - Поддержка свайпа для Bottom Sheet

### Адаптивность

Все модальные окна адаптивны и корректно отображаются на мобильных устройствах с учетом различных размеров экрана.

## Совместимость

- ✅ Современные браузеры (Chrome, Firefox, Safari, Edge)
- ✅ Мобильные браузеры
- ✅ PWA приложения
- ✅ Поддержка touch событий
- ✅ Поддержка клавиатуры
