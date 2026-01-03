window.addEventListener('load', function () {

    // =====================
    // NAME
    // =====================
    class NameScene extends Phaser.Scene {
        constructor() { super('NameScene'); }

        create() {
            this.cameras.main.setScroll(0, 0);

            this.add.rectangle(400, 225, 800, 450, 0x1E3A8A);

            this.add.text(220, 80, 'Gib deinen Namen ein:', {
                font: '28px Arial',
                fill: '#ffffff'
            }).setScrollFactor(0);

            const input = this.add.dom(400, 170, 'input',
                'width:300px;height:45px;font-size:20px;text-align:center;');
            input.setScrollFactor(0);

            const btn = this.add.dom(400, 240, 'button',
                'width:140px;height:50px;font-size:20px;', 'Start');
            btn.setScrollFactor(0);

            btn.addListener('click');
            btn.on('click', () => {
                const name = input.node.value || 'Spieler';
                this.scene.start('GameScene', { playerName: name });
            });
        }
    }

    // =====================
    // GAME
    // =====================
    class GameScene extends Phaser.Scene {
        constructor() { super('GameScene'); }

        init(data) { this.playerName = data.playerName; }

        preload() {
            this.load.image('player', 'assets/sprites/player.png');
            this.load.image('platform', 'assets/sprites/platform.png');
        }

        create() {
            const worldWidth = 2200;

            this.physics.world.setBounds(0, 0, worldWidth, 450);
            this.cameras.main.setBounds(0, 0, worldWidth, 450);

            this.add.rectangle(worldWidth / 2, 225, worldWidth, 450, 0x87CEEB);

            this.player = this.physics.add.sprite(100, 350, 'player');
            this.player.setCollideWorldBounds(true);

            this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

            const platforms = this.physics.add.staticGroup();
            platforms.create(worldWidth / 2, 430, 'platform')
                .setScale(worldWidth / 400, 1)
                .refreshBody();

            const data = [
                { x: 400, y: 320 },
                { x: 650, y: 260 },
                { x: 900, y: 320 },
                { x: 1200, y: 250 },
                { x: 1500, y: 320 },
                { x: 1800, y: 260 }
            ];

            data.forEach(p => platforms.create(p.x, p.y, 'platform'));

            this.physics.add.collider(this.player, platforms);

            this.cursors = this.input.keyboard.createCursorKeys();
            this.lastJump = 0;
        }

        update() {
            if (this.cursors.left.isDown) this.player.setVelocityX(-220);
            else if (this.cursors.right.isDown) this.player.setVelocityX(220);
            else this.player.setVelocityX(0);

            if (this.cursors.up.isDown && this.player.body.blocked.down) {
                const now = this.time.now;
                this.player.setVelocityY((now - this.lastJump < 300) ? -1100 : -550);
                this.lastJump = now;
            }

            if (this.player.x > 2000) {
                this.scene.start('QuizScene', { playerName: this.playerName });
            }
        }
    }

    // =====================
    // QUIZ (FIXED)
    // =====================
    class QuizScene extends Phaser.Scene {
        constructor() { super('QuizScene'); }

        init(data) { this.playerName = data.playerName; }

        create() {
            // 🔑 KAMERA RESET
            this.cameras.main.stopFollow();
            this.cameras.main.setScroll(0, 0);

            this.add.rectangle(400, 225, 800, 450, 0x1E3A8A).setScrollFactor(0);

            this.questions = [
                { q: "Wie viele Spieler stehen pro Team auf dem Feld?", a: ["9", "10", "11"] },
                { q: "Wie heißt das NFL-Endspiel?", a: ["Super Bowl", "Final", "World Cup"] },
                { q: "Wie viele Punkte gibt ein Touchdown?", a: ["3", "6", "7"] },
                { q: "Welche Stadt ist bekannt für den Super Bowl?", a: ["Miami", "Berlin", "Paris"] },
                { q: "Wann ist die Party?", a: ["08.02.2026", "01.01.2026", "10.03.2026"] }
            ];

            this.index = 0;
            this.ui = this.add.container(0, 0);

            this.showQuestion();
        }

        showQuestion() {
            this.ui.removeAll(true);

            if (this.index >= this.questions.length) {
                this.scene.start('EndScene', { playerName: this.playerName });
                return;
            }

            const q = this.questions[this.index];

            const title = this.add.text(50, 50, q.q, {
                font: '26px Arial',
                fill: '#ffffff',
                wordWrap: { width: 700 }
            }).setScrollFactor(0);

            this.ui.add(title);

            q.a.forEach((opt, i) => {
                const btn = this.add.text(100, 150 + i * 70, opt, {
                    font: '24px Arial',
                    backgroundColor: '#ffffff',
                    color: '#000',
                    padding: { x: 10, y: 10 }
                }).setInteractive().setScrollFactor(0);

                btn.on('pointerdown', () => {
                    this.index++;
                    this.showQuestion();
                });

                this.ui.add(btn);
            });
        }
    }

    // =====================
    // END
    // =====================
    class EndScene extends Phaser.Scene {
        constructor() { super('EndScene'); }

        init(data) { this.playerName = data.playerName; }

        create() {
            this.cameras.main.stopFollow();
            this.cameras.main.setScroll(0, 0);

            this.add.rectangle(400, 225, 800, 450, 0x1E3A8A);

            this.add.text(120, 180,
                `Glückwunsch ${this.playerName}!\n\nSUPER BOWL PARTY\n08.02.2026`,
                { font: '28px Arial', fill: '#ffffff', align: 'center' }
            );
        }
    }

    // =====================
    // CONFIG
    // =====================
    new Phaser.Game({
        type: Phaser.AUTO,
        width: 800,
        height: 450,
        parent: 'game-container',
        physics: { default: 'arcade', arcade: { gravity: { y: 900 } } },
        dom: { createContainer: true },
        scene: [NameScene, GameScene, QuizScene, EndScene]
    });

});
