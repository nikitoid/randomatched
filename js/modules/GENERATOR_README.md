# Модуль Generator.js

Модуль для генерации команд и распределения героев в игре Unmatched. Использует алгоритм Fisher-Yates для честного перемешивания и обеспечивает сбалансированное распределение игроков по командам.

## Описание

Класс `TeamGenerator` предоставляет функциональность для:
- Генерации случайных команд из списка героев
- Различных типов перемешивания (команды, герои, индивидуально)
- Исключения определенных героев из генерации
- Валидации входных данных

## Установка и подключение

### В браузере
```html
<script src="js/modules/generator.js"></script>
<script>
    const generator = new TeamGenerator();
</script>
```

### В Node.js
```javascript
const TeamGenerator = require('./js/modules/generator.js');
const generator = new TeamGenerator();
```

## Основные методы

### 1. generateTeams(heroList)
Генерирует команды и распределяет героев между игроками.

**Параметры:**
- `heroList` (Array) - массив героев (минимум 4)

**Возвращает:**
```javascript
{
  timestamp: 1757529434142,
  players: [
    {number: 3, hero: "King Arthur", team: 2, originalIndex: 0},
    {number: 1, hero: "Medusa", team: 2, originalIndex: 1},
    {number: 2, hero: "Sinbad", team: 1, originalIndex: 2},
    {number: 4, hero: "Alice", team: 1, originalIndex: 3}
  ]
}
```

**Пример:**
```javascript
const heroes = ["King Arthur", "Medusa", "Sinbad", "Alice", "Robin Hood"];
const result = generator.generateTeams(heroes);
console.log(result);
```

### 2. reshuffleTeams(currentResult)
Перемешивает только номера игроков, сохраняя героев.

**Параметры:**
- `currentResult` (Object) - текущий результат генерации

**Возвращает:** Новый объект с перемешанными номерами

**Пример:**
```javascript
const newResult = generator.reshuffleTeams(result);
```

### 3. reshuffleHeroes(currentResult, heroList)
Перемешивает только героев, сохраняя номера и команды.

**Параметры:**
- `currentResult` (Object) - текущий результат генерации
- `heroList` (Array) - полный список героев

**Возвращает:** Новый объект с перемешанными героями

**Пример:**
```javascript
const newResult = generator.reshuffleHeroes(result, heroes);
```

### 4. reshuffleAll(heroList)
Полная генерация заново.

**Параметры:**
- `heroList` (Array) - массив героев

**Возвращает:** Новый результат полной генерации

**Пример:**
```javascript
const newResult = generator.reshuffleAll(heroes);
```

### 5. reshuffleIndividual(playerIndex, currentResult, heroList)
Перемешивает героя только для одного игрока.

**Параметры:**
- `playerIndex` (number) - индекс игрока (0-3)
- `currentResult` (Object) - текущий результат генерации
- `heroList` (Array) - полный список героев

**Возвращает:** Новый объект с измененным героем для указанного игрока

**Пример:**
```javascript
const newResult = generator.reshuffleIndividual(0, result, heroes);
```

### 6. excludeHeroes(heroList, heroesToExclude)
Исключает определенных героев из списка.

**Параметры:**
- `heroList` (Array) - исходный список героев
- `heroesToExclude` (Array) - герои для исключения

**Возвращает:** Отфильтрованный массив героев

**Пример:**
```javascript
const filteredHeroes = generator.excludeHeroes(heroes, ["King Arthur", "Medusa"]);
```

## Вспомогательные методы

### shuffleArray(array)
Перемешивает массив методом Fisher-Yates.

**Параметры:**
- `array` (Array) - массив для перемешивания

**Возвращает:** Перемешанный массив

### getAvailableHeroes(heroList, usedHeroes)
Получает доступных героев, исключая уже использованных.

**Параметры:**
- `heroList` (Array) - полный список героев
- `usedHeroes` (Array) - уже использованные герои

**Возвращает:** Массив доступных героев

### validateHeroList(heroList)
Проверяет валидность списка героев.

**Параметры:**
- `heroList` (Array) - список героев для проверки

**Возвращает:** `true` если список валиден (минимум 4 героя)

## Дополнительные методы

### getTeamStats(result)
Получает статистику по командам.

**Параметры:**
- `result` (Object) - результат генерации

**Возвращает:**
```javascript
{
  team1: {
    players: 2,
    heroes: ["Robin Hood", "Bigfoot"]
  },
  team2: {
    players: 2,
    heroes: ["Invisible Man", "Sinbad"]
  }
}
```

### isBalanced(result)
Проверяет баланс команд.

**Параметры:**
- `result` (Object) - результат генерации

**Возвращает:** `true` если команды сбалансированы (по 2 игрока)

## Алгоритм работы

1. **Генерация команд:**
   - Перемешивание чисел [1,2,3,4] методом Fisher-Yates
   - Определение команд: четные = команда 1, нечетные = команда 2
   - Перемешивание списка героев методом Fisher-Yates
   - Назначение героев игрокам по порядку их чисел

2. **Перемешивание:**
   - Все перемешивания используют алгоритм Fisher-Yates
   - Обеспечивает равномерное распределение вероятностей
   - Гарантирует честность генерации

## Формат данных

### Структура игрока
```javascript
{
  number: 3,           // Номер игрока (1-4)
  hero: "King Arthur", // Имя героя
  team: 2,             // Номер команды (1 или 2)
  originalIndex: 0     // Исходный индекс в списке героев
}
```

### Структура результата
```javascript
{
  timestamp: 1757529434142,  // Время генерации
  players: [...]             // Массив из 4 игроков
}
```

## Обработка ошибок

Модуль выбрасывает исключения в следующих случаях:
- Недостаточно героев для генерации (менее 4)
- Неверный индекс игрока в `reshuffleIndividual`
- Нет доступных героев для замены

**Пример обработки ошибок:**
```javascript
try {
  const result = generator.generateTeams(heroes);
} catch (error) {
  console.error('Ошибка генерации:', error.message);
}
```

## Примеры использования

### Базовое использование
```javascript
const generator = new TeamGenerator();
const heroes = ["King Arthur", "Medusa", "Sinbad", "Alice", "Robin Hood", "Bigfoot"];

// Генерация команд
const result = generator.generateTeams(heroes);
console.log('Команды сгенерированы:', result);

// Проверка баланса
if (generator.isBalanced(result)) {
  console.log('Команды сбалансированы');
}

// Получение статистики
const stats = generator.getTeamStats(result);
console.log('Статистика команд:', stats);
```

### Продвинутое использование
```javascript
// Исключение определенных героев
const excludedHeroes = ["King Arthur", "Medusa"];
const availableHeroes = generator.excludeHeroes(heroes, excludedHeroes);

// Генерация с ограниченным списком
const result = generator.generateTeams(availableHeroes);

// Перемешивание только команд
const reshuffledTeams = generator.reshuffleTeams(result);

// Перемешивание только героев
const reshuffledHeroes = generator.reshuffleHeroes(result, availableHeroes);

// Изменение героя для конкретного игрока
const newResult = generator.reshuffleIndividual(0, result, availableHeroes);
```

## Требования

- Минимум 4 героя для генерации команд
- Поддержка браузеров с ES6+ или Node.js 6+
- Массив героев должен содержать строки с именами

## Лицензия

Модуль является частью проекта Randomatched и следует тем же условиям лицензирования.
