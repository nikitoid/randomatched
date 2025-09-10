/**
 * ResultsDisplay - Модуль для отображения результатов генерации команд
 * Поддерживает полноэкранное модальное окно с результатами, управление командами и анимации
 */

export class ResultsDisplay {
    constructor() {
        this.currentModalId = null;
        this.generationData = null;
        this.players = [];
        this.teams = { team1: [], team2: [] };
        
        // Привязываем методы к контексту
        this.handleShuffleIndividual = this.handleShuffleIndividual.bind(this);
        this.handleExcludeIndividual = this.handleExcludeIndividual.bind(this);
        this.handleExcludeAll = this.handleExcludeAll.bind(this);
        this.handleShuffleTeams = this.handleShuffleTeams.bind(this);
        this.handleShuffleHeroes = this.handleShuffleHeroes.bind(this);
        this.handleShuffleAll = this.handleShuffleAll.bind(this);
        
        console.log('[ResultsDisplay] Модуль инициализирован');
    }

    /**
     * Показать результаты генерации в полноэкранном модальном окне
     * @param {Object} generationData - Данные генерации
     */
    showResults(generationData) {
        this.generationData = generationData;
        this.players = generationData.players || [];
        this.organizeTeams();
        
        const content = this.createResultsContent();
        
        this.currentModalId = window.modalManager.createFullscreen(
            'Результаты генерации',
            content,
            {
                animation: 'fade-in',
                onClose: () => {
                    this.currentModalId = null;
                    this.generationData = null;
                }
            }
        );
        
        // Анимация появления результатов по очереди
        this.animateResultsAppearance();
        
        console.log('[ResultsDisplay] Результаты показаны для', this.players.length, 'игроков');
    }

    /**
     * Организация игроков по командам
     */
    organizeTeams() {
        this.teams = { team1: [], team2: [] };
        
        this.players.forEach((player, index) => {
            if (player.team === 1) {
                this.teams.team1.push({ ...player, index });
            } else {
                this.teams.team2.push({ ...player, index });
            }
        });
    }

    /**
     * Создание HTML содержимого результатов
     */
    createResultsContent() {
        const generationTime = this.formatGenerationTime(this.generationData.timestamp);
        
        return `
            <div class="results-container">
                <div class="results-header">
                    <div class="generation-info">
                        <span class="material-icons">schedule</span>
                        <span>Время генерации: ${generationTime}</span>
                    </div>
                    <div class="generation-stats">
                        <span class="stat-item">
                            <span class="material-icons">group</span>
                            <span>${this.players.length} игроков</span>
                        </span>
                        <span class="stat-item">
                            <span class="material-icons">sports_esports</span>
                            <span>2 команды</span>
                        </span>
                    </div>
                </div>

                <div class="results-content">
                    ${this.createTeamSection(1, this.teams.team1)}
                    ${this.createTeamSection(2, this.teams.team2)}
                </div>

                <div class="results-actions">
                    <button class="btn btn-outline results-action-btn" data-action="exclude-all">
                        <span class="material-icons">block</span>
                        <span>Исключить этих героев</span>
                    </button>
                    <button class="btn btn-outline results-action-btn" data-action="shuffle-teams">
                        <span class="material-icons">swap_horiz</span>
                        <span>Перемешать команды</span>
                    </button>
                    <button class="btn btn-outline results-action-btn" data-action="shuffle-heroes">
                        <span class="material-icons">shuffle</span>
                        <span>Перемешать героев</span>
                    </button>
                    <button class="btn btn-primary results-action-btn" data-action="shuffle-all">
                        <span class="material-icons">refresh</span>
                        <span>Перемешать всё</span>
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Создание секции команды
     */
    createTeamSection(teamNumber, players) {
        const teamClass = `team-${teamNumber}`;
        const teamColor = teamNumber === 1 ? 'blue' : 'red';
        
        return `
            <div class="team-section ${teamClass}">
                <div class="team-header">
                    <div class="team-badge team-badge-${teamColor}">
                        <span class="material-icons">group</span>
                        <span>Команда ${teamNumber}</span>
                        <span class="team-count">${players.length}</span>
                    </div>
                </div>
                <div class="team-players">
                    ${players.map(player => this.createPlayerRow(player)).join('')}
                </div>
            </div>
        `;
    }

    /**
     * Создание строки игрока
     */
    createPlayerRow(player) {
        const teamClass = `team-${player.team}`;
        const teamColor = player.team === 1 ? 'blue' : 'red';
        
        return `
            <div class="result-row ${teamClass}" data-player-index="${player.index}">
                <div class="player-number">${player.index + 1}</div>
                <div class="hero-name">${player.heroName}</div>
                <div class="team-badge team-badge-${teamColor}">
                    Команда ${player.team}
                </div>
                <div class="player-actions">
                    <button class="btn-icon shuffle-individual" 
                            data-player-index="${player.index}"
                            title="Перемешать этого героя">
                        <span class="material-icons">shuffle</span>
                    </button>
                    <button class="btn-icon exclude-individual" 
                            data-player-index="${player.index}"
                            title="Исключить этого героя">
                        <span class="material-icons">close</span>
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Форматирование времени генерации
     */
    formatGenerationTime(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleString('ru-RU', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    }

    /**
     * Анимация появления результатов по очереди
     */
    animateResultsAppearance() {
        if (!this.currentModalId) return;
        
        const modal = document.querySelector(`[data-modal-id="${this.currentModalId}"]`);
        if (!modal) return;
        
        const resultRows = modal.querySelectorAll('.result-row');
        
        resultRows.forEach((row, index) => {
            row.style.opacity = '0';
            row.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                row.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
                row.style.opacity = '1';
                row.style.transform = 'translateY(0)';
            }, index * 100); // Задержка 100мс между появлением строк
        });
        
        // Настройка обработчиков событий после анимации
        setTimeout(() => {
            this.setupEventListeners();
        }, resultRows.length * 100 + 300);
    }

    /**
     * Настройка обработчиков событий
     */
    setupEventListeners() {
        if (!this.currentModalId) return;
        
        const modal = document.querySelector(`[data-modal-id="${this.currentModalId}"]`);
        if (!modal) return;
        
        // Обработчики для кнопок действий
        const actionButtons = modal.querySelectorAll('.results-action-btn');
        actionButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.currentTarget.dataset.action;
                this.handleAction(action);
            });
        });
        
        // Обработчики для индивидуальных действий
        const shuffleButtons = modal.querySelectorAll('.shuffle-individual');
        shuffleButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const playerIndex = parseInt(e.currentTarget.dataset.playerIndex);
                this.handleShuffleIndividual(playerIndex);
            });
        });
        
        const excludeButtons = modal.querySelectorAll('.exclude-individual');
        excludeButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const playerIndex = parseInt(e.currentTarget.dataset.playerIndex);
                this.handleExcludeIndividual(playerIndex);
            });
        });
    }

    /**
     * Обработка действий с результатами
     */
    async handleAction(action) {
        switch (action) {
            case 'exclude-all':
                await this.handleExcludeAll();
                break;
            case 'shuffle-teams':
                await this.handleShuffleTeams();
                break;
            case 'shuffle-heroes':
                await this.handleShuffleHeroes();
                break;
            case 'shuffle-all':
                await this.handleShuffleAll();
                break;
        }
    }

    /**
     * Исключить всех героев из текущей генерации
     */
    async handleExcludeAll() {
        const confirmed = await window.modalManager.createConfirmation(
            'Исключить героев',
            'Вы уверены, что хотите исключить всех героев из этой генерации? Они будут добавлены в список исключенных.',
            {
                confirmText: 'Исключить',
                cancelText: 'Отмена',
                confirmClass: 'btn-error'
            }
        );
        
        if (confirmed) {
            // Здесь будет логика исключения героев
            const excludedHeroes = this.players.map(p => p.heroName);
            
            // Показываем уведомление
            window.toastManager.show(
                `Исключено ${excludedHeroes.length} героев`,
                'success',
                3000
            );
            
            // Закрываем модальное окно
            window.modalManager.close(this.currentModalId);
        }
    }

    /**
     * Перемешать только номера команд
     */
    async handleShuffleTeams() {
        const confirmed = await window.modalManager.createConfirmation(
            'Перемешать команды',
            'Перемешать номера команд между игроками?',
            {
                confirmText: 'Перемешать',
                cancelText: 'Отмена'
            }
        );
        
        if (confirmed) {
            // Логика перемешивания команд
            this.players.forEach(player => {
                player.team = player.team === 1 ? 2 : 1;
            });
            
            this.organizeTeams();
            this.updateResultsDisplay();
            
            window.toastManager.show('Команды перемешаны', 'success', 2000);
        }
    }

    /**
     * Перемешать только героев
     */
    async handleShuffleHeroes() {
        const confirmed = await window.modalManager.createConfirmation(
            'Перемешать героев',
            'Перемешать героев между игроками?',
            {
                confirmText: 'Перемешать',
                cancelText: 'Отмена'
            }
        );
        
        if (confirmed) {
            // Логика перемешивания героев
            const heroNames = this.players.map(p => p.heroName);
            this.shuffleArray(heroNames);
            
            this.players.forEach((player, index) => {
                player.heroName = heroNames[index];
            });
            
            this.updateResultsDisplay();
            
            window.toastManager.show('Герои перемешаны', 'success', 2000);
        }
    }

    /**
     * Полная регенерация
     */
    async handleShuffleAll() {
        const confirmed = await window.modalManager.createConfirmation(
            'Перемешать всё',
            'Выполнить полную регенерацию команд и героев?',
            {
                confirmText: 'Перемешать',
                cancelText: 'Отмена'
            }
        );
        
        if (confirmed) {
            // Закрываем текущее модальное окно
            window.modalManager.close(this.currentModalId);
            
            // Запускаем новую генерацию
            if (window.randomatchedApp) {
                await window.randomatchedApp.generateTeams();
            }
        }
    }

    /**
     * Перемешать одного героя
     */
    async handleShuffleIndividual(playerIndex) {
        const player = this.players[playerIndex];
        if (!player) return;
        
        const confirmed = await window.modalManager.createConfirmation(
            'Перемешать героя',
            `Перемешать героя "${player.heroName}"?`,
            {
                confirmText: 'Перемешать',
                cancelText: 'Отмена'
            }
        );
        
        if (confirmed) {
            // Логика перемешивания одного героя
            const availableHeroes = this.getAvailableHeroes();
            if (availableHeroes.length > 0) {
                const randomHero = availableHeroes[Math.floor(Math.random() * availableHeroes.length)];
                const oldHero = player.heroName;
                
                player.heroName = randomHero;
                this.updatePlayerRow(playerIndex, player);
                
                window.toastManager.show(
                    `Герой изменен: ${oldHero} → ${randomHero}`,
                    'success',
                    2000
                );
            } else {
                window.toastManager.show('Нет доступных героев для замены', 'warning', 3000);
            }
        }
    }

    /**
     * Исключить одного героя
     */
    async handleExcludeIndividual(playerIndex) {
        const player = this.players[playerIndex];
        if (!player) return;
        
        const confirmed = await window.modalManager.createConfirmation(
            'Исключить героя',
            `Исключить героя "${player.heroName}" из генерации?`,
            {
                confirmText: 'Исключить',
                cancelText: 'Отмена',
                confirmClass: 'btn-error'
            }
        );
        
        if (confirmed) {
            // Логика исключения одного героя
            const excludedHero = player.heroName;
            
            // Удаляем игрока из списка
            this.players.splice(playerIndex, 1);
            
            // Обновляем индексы
            this.players.forEach((p, index) => {
                p.index = index;
            });
            
            this.organizeTeams();
            this.updateResultsDisplay();
            
            window.toastManager.show(
                `Герой "${excludedHero}" исключен`,
                'success',
                2000
            );
        }
    }

    /**
     * Обновление отображения результатов
     */
    updateResultsDisplay() {
        if (!this.currentModalId) return;
        
        const modal = document.querySelector(`[data-modal-id="${this.currentModalId}"]`);
        if (!modal) return;
        
        const resultsContent = modal.querySelector('.results-content');
        if (resultsContent) {
            resultsContent.innerHTML = `
                ${this.createTeamSection(1, this.teams.team1)}
                ${this.createTeamSection(2, this.teams.team2)}
            `;
            
            // Настраиваем обработчики для обновленного контента
            this.setupEventListeners();
        }
    }

    /**
     * Обновление конкретной строки игрока
     */
    updatePlayerRow(playerIndex, playerData) {
        if (!this.currentModalId) return;
        
        const modal = document.querySelector(`[data-modal-id="${this.currentModalId}"]`);
        if (!modal) return;
        
        const playerRow = modal.querySelector(`[data-player-index="${playerIndex}"]`);
        if (!playerRow) return;
        
        // Анимация изменения
        playerRow.style.transition = 'all 0.3s ease';
        playerRow.style.transform = 'scale(0.95)';
        playerRow.style.opacity = '0.7';
        
        setTimeout(() => {
            // Обновляем содержимое
            const heroNameElement = playerRow.querySelector('.hero-name');
            if (heroNameElement) {
                heroNameElement.textContent = playerData.heroName;
            }
            
            // Возвращаем к исходному состоянию
            playerRow.style.transform = 'scale(1)';
            playerRow.style.opacity = '1';
        }, 150);
    }

    /**
     * Получение доступных героев для замены
     */
    getAvailableHeroes() {
        // Здесь должна быть логика получения доступных героев
        // Пока возвращаем заглушку
        return ['Герой 1', 'Герой 2', 'Герой 3', 'Герой 4'];
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
     * Очистка ресурсов
     */
    destroy() {
        if (this.currentModalId) {
            window.modalManager.close(this.currentModalId);
        }
        this.currentModalId = null;
        this.generationData = null;
        this.players = [];
        this.teams = { team1: [], team2: [] };
    }
}

// Создаем глобальный экземпляр
window.resultsDisplay = new ResultsDisplay();

// Экспорт для модульных систем
export default window.resultsDisplay;
