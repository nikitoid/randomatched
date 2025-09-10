/**
 * Модуль для генерации команд и распределения героев
 * Использует алгоритм Fisher-Yates для перемешивания
 */

class TeamGenerator {
    constructor() {
        this.playerCount = 4;
    }

    /**
     * Генерация команд и распределение героев
     * @param {Array} heroList - массив героев (минимум 4)
     * @returns {Object} результат генерации команд
     */
    generateTeams(heroList) {
        // Валидация входных данных
        if (!this.validateHeroList(heroList)) {
            throw new Error('Необходимо минимум 4 героя для генерации команд');
        }

        // Перемешать числа [1,2,3,4] методом Fisher-Yates
        const playerNumbers = this.shuffleArray([1, 2, 3, 4]);
        
        // Перемешать список героев методом Fisher-Yates
        const shuffledHeroes = this.shuffleArray([...heroList]);
        
        // Создать результат
        const result = {
            timestamp: Date.now(),
            players: []
        };

        // Назначить героев игрокам по порядку их чисел
        playerNumbers.forEach((playerNumber, index) => {
            const team = playerNumber % 2 === 0 ? 1 : 2; // четные = команда 1, нечетные = команда 2
            result.players.push({
                number: playerNumber,
                hero: shuffledHeroes[index],
                team: team,
                originalIndex: index
            });
        });

        return result;
    }

    /**
     * Перемешать только номера игроков
     * @param {Object} currentResult - текущий результат
     * @returns {Object} новый результат с перемешанными номерами
     */
    reshuffleTeams(currentResult) {
        const newResult = {
            timestamp: Date.now(),
            players: []
        };

        // Получить текущие номера игроков и перемешать их
        const currentNumbers = currentResult.players.map(p => p.number);
        const shuffledNumbers = this.shuffleArray([...currentNumbers]);

        // Пересчитать команды и сохранить героев
        currentResult.players.forEach((player, index) => {
            const newNumber = shuffledNumbers[index];
            const newTeam = newNumber % 2 === 0 ? 1 : 2;
            
            newResult.players.push({
                number: newNumber,
                hero: player.hero,
                team: newTeam,
                originalIndex: player.originalIndex
            });
        });

        return newResult;
    }

    /**
     * Перемешать только героев
     * @param {Object} currentResult - текущий результат
     * @param {Array} heroList - полный список героев
     * @returns {Object} новый результат с перемешанными героями
     */
    reshuffleHeroes(currentResult, heroList) {
        const newResult = {
            timestamp: Date.now(),
            players: []
        };

        // Сохранить номера и команды
        const currentNumbers = currentResult.players.map(p => p.number);
        const currentTeams = currentResult.players.map(p => p.team);

        // Перемешать и переназначить героев
        const shuffledHeroes = this.shuffleArray([...heroList]);

        currentResult.players.forEach((player, index) => {
            newResult.players.push({
                number: currentNumbers[index],
                hero: shuffledHeroes[index],
                team: currentTeams[index],
                originalIndex: index
            });
        });

        return newResult;
    }

    /**
     * Полная генерация заново
     * @param {Array} heroList - массив героев
     * @returns {Object} новый результат полной генерации
     */
    reshuffleAll(heroList) {
        return this.generateTeams(heroList);
    }

    /**
     * Перемешать героя только для одного игрока
     * @param {number} playerIndex - индекс игрока (0-3)
     * @param {Object} currentResult - текущий результат
     * @param {Array} heroList - полный список героев
     * @returns {Object} новый результат с измененным героем для игрока
     */
    reshuffleIndividual(playerIndex, currentResult, heroList) {
        if (playerIndex < 0 || playerIndex >= this.playerCount) {
            throw new Error('Неверный индекс игрока');
        }

        const newResult = {
            timestamp: Date.now(),
            players: [...currentResult.players]
        };

        // Получить уже использованных героев
        const usedHeroes = currentResult.players.map(p => p.hero);
        
        // Получить доступных героев
        const availableHeroes = this.getAvailableHeroes(heroList, usedHeroes);
        
        if (availableHeroes.length === 0) {
            throw new Error('Нет доступных героев для замены');
        }

        // Выбрать случайного героя из доступных
        const randomIndex = Math.floor(Math.random() * availableHeroes.length);
        const newHero = availableHeroes[randomIndex];

        // Заменить героя для указанного игрока
        newResult.players[playerIndex].hero = newHero;

        return newResult;
    }

    /**
     * Исключить героев из списка
     * @param {Array} heroList - исходный список героев
     * @param {Array} heroesToExclude - герои для исключения
     * @returns {Array} отфильтрованный массив героев
     */
    excludeHeroes(heroList, heroesToExclude) {
        return heroList.filter(hero => !heroesToExclude.includes(hero));
    }

    /**
     * Перемешивание массива методом Fisher-Yates
     * @param {Array} array - массив для перемешивания
     * @returns {Array} перемешанный массив
     */
    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    /**
     * Получить доступных героев (исключая уже использованных)
     * @param {Array} heroList - полный список героев
     * @param {Array} usedHeroes - уже использованные герои
     * @returns {Array} доступные герои
     */
    getAvailableHeroes(heroList, usedHeroes) {
        return this.excludeHeroes(heroList, usedHeroes);
    }

    /**
     * Валидация списка героев
     * @param {Array} heroList - список героев для проверки
     * @returns {boolean} true если список валиден
     */
    validateHeroList(heroList) {
        return Array.isArray(heroList) && heroList.length >= this.playerCount;
    }

    /**
     * Получить статистику команд
     * @param {Object} result - результат генерации
     * @returns {Object} статистика по командам
     */
    getTeamStats(result) {
        const team1 = result.players.filter(p => p.team === 1);
        const team2 = result.players.filter(p => p.team === 2);
        
        return {
            team1: {
                players: team1.length,
                heroes: team1.map(p => p.hero)
            },
            team2: {
                players: team2.length,
                heroes: team2.map(p => p.hero)
            }
        };
    }

    /**
     * Проверить баланс команд
     * @param {Object} result - результат генерации
     * @returns {boolean} true если команды сбалансированы
     */
    isBalanced(result) {
        const team1Count = result.players.filter(p => p.team === 1).length;
        const team2Count = result.players.filter(p => p.team === 2).length;
        return team1Count === team2Count;
    }
}

// Экспорт класса
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TeamGenerator;
} else if (typeof window !== 'undefined') {
    window.TeamGenerator = TeamGenerator;
}
