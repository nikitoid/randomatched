# Toast Notifications System

Система уведомлений для Randomatched PWA с поддержкой Material Design 3.

## Возможности

- ✅ 4 типа уведомлений: success, error, warning, info
- ✅ Анимация slide-in с Material Design easing
- ✅ Позиционирование: правый верхний угол (десктоп), верх (мобильные)
- ✅ Стек до 3 уведомлений одновременно
- ✅ Очередь при превышении лимита
- ✅ Автоскрытие через 3 секунды (настраивается)
- ✅ Прогресс-бар времени до исчезновения
- ✅ Закрытие свайпом влево/вправо на мобильных
- ✅ Закрытие по клику на крестик
- ✅ Поддержка темной темы
- ✅ Адаптивный дизайн

## Использование

### Базовое использование

```javascript
// Показать уведомление
window.toastManager.show('Сообщение', 'success');

// С указанием длительности
window.toastManager.show('Сообщение', 'error', 5000);

// Закрыть конкретное уведомление
window.toastManager.dismiss('toast-id');

// Очистить все уведомления
window.toastManager.clearAll();
```

### Типы уведомлений

```javascript
// Success (зеленый, check_circle)
window.toastManager.show('Операция выполнена!', 'success');

// Error (красный, error)
window.toastManager.show('Произошла ошибка', 'error');

// Warning (оранжевый, warning)
window.toastManager.show('Внимание!', 'warning');

// Info (сиреневый, info)
window.toastManager.show('Информация', 'info');
```

### Настройка

```javascript
// Обновить настройки
window.toastManager.updateSettings({
    maxToasts: 5,        // Максимум одновременных toast
    defaultDuration: 4000 // Длительность по умолчанию (мс)
});

// Получить статистику
const stats = window.toastManager.getStats();
console.log(stats); // { active: 2, queued: 1, maxToasts: 3 }
```

## API

### ToastManager.show(message, type, duration)

Показывает toast уведомление.

**Параметры:**
- `message` (string) - Текст сообщения
- `type` (string) - Тип уведомления: 'success', 'error', 'warning', 'info'
- `duration` (number) - Длительность показа в миллисекундах (по умолчанию 3000)

**Возвращает:** `string` - ID созданного toast или `null` при ошибке

### ToastManager.dismiss(toastId)

Закрывает конкретное уведомление.

**Параметры:**
- `toastId` (string) - ID toast для закрытия

### ToastManager.clearAll()

Очищает все активные уведомления и очередь.

### ToastManager.updateSettings(options)

Обновляет настройки менеджера.

**Параметры:**
- `options` (object) - Объект с настройками:
  - `maxToasts` (number) - Максимальное количество одновременных toast
  - `defaultDuration` (number) - Длительность по умолчанию в миллисекундах

### ToastManager.getStats()

Возвращает статистику активных уведомлений.

**Возвращает:** `object` - `{ active, queued, maxToasts }`

## Стили

Toast уведомления используют CSS переменные Material Design 3 и автоматически адаптируются к светлой/темной теме.

### Кастомизация

Для изменения стилей toast можно переопределить CSS переменные:

```css
:root {
  --toast-color: #your-color;
}
```

## Демонстрация

В приложении доступны демонстрационные кнопки для тестирования всех возможностей toast системы:

- Success Toast
- Error Toast  
- Warning Toast
- Info Toast
- Multiple Toasts (демонстрация очереди)
- Clear All

## Технические детали

- Использует `requestAnimationFrame` для плавных анимаций
- Поддерживает touch события для свайпа
- Автоматически экранирует HTML в сообщениях
- Оптимизирован для производительности с минимальным количеством DOM операций
- Полностью совместим с PWA и Service Worker
