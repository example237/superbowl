window.addEventListener('load', function () {

    // =========================
    // Szene 1: Name
    // =========================
    class NameScene extends Phaser.Scene {
        constructor() { super('NameScene'); }

        create() {
            this.add.rectangle(400, 225, 800, 450, 0x1E90FF);

            this.add.text(220, 60, 'Gib deinen Namen ein:', {
                font: '28px Arial',
                fill: '#ffffff'
            });

            const input = this.add.dom(400, 160, 'input',
                'width:300px;height:45px;font-size:20px;text-align:center;');
            input.node.placeholder = "Name";

            const btn = this.add.dom(400, 230, 'button',
                'width:140px;height:50px;font-size:20px;', 'Start');

            btn.addListener('click');
            btn.on('click', () => {
                const playerName = input.node.value || 'Spieler';
                this.scene.start('GameScene', { playerName });
            });
        }
    }

    // =========================
    // Szene 2: Spiel
    // =========================
    class GameScene extends Phaser.Scene {
        constructor() { super('GameScene'); }

        init(data) {
            this.playerName = data.playerName;
        }

        preload() {
            this.load.image('background', 'assets/sprites/background.png');
            this.load.image('player', 'assets/sprites/player.png');
            this.load.image('platform', 'assets/sprites/platform.png');
            this.load.audio('bg', 'assets/audio/bg.mp3');
            this.load.audio('jump', 'assets/audio/jump.wav');
        }

        create() {
            const worldWidth = 2200;

            this.physics.world.setBounds(0, 0, worldWidth, 450);
            this.cameras.main.setBounds(0, 0, worldWidth, 450);

            // Hintergrund
            this.bg = this.add.tileSprite(400, 225, 800, 450, 'background');
            this.bg.setScrollFactor(0);

            // Spieler
            this.player = this.physics.add.sprite(100, 350, 'player');
            this.player.setCollideWorldBounds(true);

            this.cameras.main.startFollow(this.player, true, 0.08, 0.08);

            // Musik
            this.sound.add('bg', { loop: true, volume: 0.4 }).play();

            // Plattformen
            const platforms = this.physics.add.staticGroup();

            // Boden
            platforms.create(worldWidth / 2, 430, 'platform')
                .setScale(worldWidth / 400, 1)
                .refreshBody();

            // Hindernisse (gut springbar)
            const platformData = [
                { x: 450, y: 320 },
                { x: 700, y: 260 },
                { x: 950, y: 320 },
                { x: 1200, y: 250 },
                { x: 1500, y: 320 },
                { x: 1800, y: 260 }
            ];

            platformData.forEach(p => {
                platforms.create(p.x, p.y, 'platform').refreshBody();
            });

            this.physics.add.collider(this.player, platforms);

            // Steuerung
            this.cursors = this.input.keyboard.createCursorKeys();
            this.lastJumpTime = 0;
        }

        update() {
            // Bewegung
            if (this.cursors.left.isDown) {
                this.player.setVelocityX(-220);
            } else if (this.cursors.right.isDown) {
                this.player.setVelocityX(220);
            } else {
                this.player.setVelocityX(0);
            }

            // Sprung / Doppelsprung
            if (this.cursors.up.isDown && this.player.body.blocked.down) {
                const now = this.time.now;
                const delta = now - this.lastJumpTime;

                if (delta < 300) {
                    this.player.setVelocityY(-1100); // Doppelsprung
                } else {
                    this.player.setVelocityY(-550); // normaler Sprung
                }

                this.sound.play('jump');
                this.lastJumpTime = now;
            }

            // Quiz starten am Ende
            if (this.player.x > 2000) {
                this.scene.start('QuizScene', { playerName: this.playerName });
            }
        }
    }

    // =========================
    // Szene 3: Quiz
    // =========================
    class QuizScene extends Phaser.Scene {
        constructor() { super('QuizScene'); }

        preload() {
            this.load.json('questions', 'data/questions.json');
        }

        init(data) {
            this.playerName = data.playerName;
        }

        create() {
            this.add.rectangle(400, 225, 800, 450, 0x1E90FF);

            let questions = this.cache.json.get('questions');

            if (!questions || questions.length === 0) {
                questions = [
                    {
                        question: "Wie viele Spieler stehen pro Team auf dem Feld?",
                        options: ["9", "10", "11"],
                        answer: 2
                    },
                    {
                        question: "Wie heißt das NFL-Endspiel?",
                        options: ["Super Bowl", "World Cup", "Final"],
                        answer: 0
                    },
                    {
                        question: "Wie viele Punkte gibt ein Touchdown?",
                        options: ["3", "6", "7"],
                        answer: 1
                    },
                    {
                        question: "Welche Stadt ist für den Super Bowl bekannt?",
                        options: ["Miami", "Berlin", "Paris"],
                        answer: 0
                    },
                    {
                        question: "Wann ist die Party?",
                        options: ["08.02.2026", "01.01.2026", "10.03.2026"],
                        answer: 0
                    }
                ];
            }

            let idx = 0;

            const showQuestion = () => {
                this.children.removeAll();
                this.add.rectangle(400, 225, 800, 450, 0x1E90FF);

                if (idx >= questions.length) {
                    this.scene.start('EndScene', { playerName: this.playerName });
                    return;
                }

                const q = questions[idx];

                this.add.text(50, 40, q.question, {
                    font: '26px Arial',
                    fill: '#ffffff',
                    wordWrap: { width: 700 }
                });

                q.options.forEach((opt, i) => {
                    const btn = this.add.text(100, 150 + i * 70, opt, {
                        font: '24px Arial',
                        backgroundColor: '#ffffff',
                        color: '#000',
                        padding: { x: 10, y: 10 }
                    }).setInteractive();

                    btn.on('pointerdown', () => {
                        idx++;
                        this.time.delayedCall(300, showQuestion);
                    });
                });
            };

            showQuestion();
        }
    }

    // =========================
    // Szene 4: Ende
    // =========================
    class EndScene extends Phaser.Scene {
        constructor() { super('EndScene'); }

        init(data) {
            this.playerName = data.playerName;
        }

        create() {
            this.add.rectangle(400, 225, 800, 450, 0x1E90FF);

            this.add.text(120, 170,
                `Herzlichen Glückwunsch ${this.playerName}!\n\n` +
                `Du bist eingeladen zur\nSUPER BOWL PARTY\n\n08.02.2026`,
                {
                    font: '28px Arial',
                    fill: '#ffffff',
                    align: 'center'
                }
            );
        }
    }

    // =========================
    // Phaser Config
    // =========================
    const config = {
        type: Phaser.AUTO,
        width: 800,
        height: 450,
        parent: 'game-container',
        backgroundColor: '#000000',
        physics: {
            default: 'arcade',
            arcade: {
                gravity: { y: 900 },
                debug: false
            }
        },
        dom: { createContainer: true },
        scene: [NameScene, GameScene, QuizScene, EndScene]
    };

    new Phaser.Game(config);
});
