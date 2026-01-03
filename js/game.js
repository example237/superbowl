window.addEventListener('load', function () {

    console.log("game.js geladen");

    // ---- Szene 1: Nameeingabe ----
    class NameScene extends Phaser.Scene {
        constructor() { super('NameScene'); }

        create() {
            this.add.rectangle(400, 225, 800, 450, 0x1E90FF).setOrigin(0.5);
            this.add.text(250, 50, 'Gib deinen Namen ein:', { font: '28px Arial', fill: '#fff' });

            const input = this.add.dom(400, 150, 'input',
                'width:280px;height:40px;font-size:20px;padding:5px;border:2px solid #000;border-radius:5px;text-align:center;');
            input.node.placeholder = "Dein Name";

            const btn = this.add.dom(400, 220, 'button',
                'width:120px;height:50px;font-size:20px;border-radius:5px;background-color:#28a745;color:#fff;', 'Start');

            btn.addListener('click');
            btn.on('click', () => {
                const playerName = input.node.value || 'Spieler';
                this.scene.start('GameScene', { playerName });
            });

            if (this.sys.game.device.input.touch) {
                const scale = Math.min(window.innerWidth / 800, window.innerHeight / 450);
                this.cameras.main.setZoom(scale);
                this.cameras.main.centerOn(400, 225);
                input.setPosition(400, 180);
                btn.setPosition(400, 250);
            }
        }
    }

    // ---- Szene 2: Jump’n’Run Hauptspiel ----
    class GameScene extends Phaser.Scene {
        constructor() { super('GameScene'); }
        init(data) { this.playerName = data.playerName; }

        preload() {
            this.load.image('background', 'assets/sprites/background.png');
            this.load.image('player', 'assets/sprites/player.png');
            this.load.image('platform', 'assets/sprites/platform.png');
            this.load.audio('bg', 'assets/audio/bg.mp3');
            this.load.audio('jump', 'assets/audio/jump.wav');
        }

        create() {
            const worldWidth = 2000;
            const worldHeight = 450;

            this.physics.world.setBounds(0, 0, worldWidth, worldHeight);
            this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);

            // Hintergrund
            this.bg = this.add.tileSprite(400, 225, 800, 450, 'background');
            this.bg.setScrollFactor(0);

            // Spieler
            this.player = this.physics.add.sprite(100, 350, 'player').setCollideWorldBounds(true);
            this.player.body.setSize(32, 48);
            this.player.body.setBounce(0);

            this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

            // Musik
            this.bgMusic = this.sound.add('bg', { loop: true, volume: 0.5 });
            this.bgMusic.play();

            // Plattformen
            const platforms = this.physics.add.staticGroup();
            platforms.create(worldWidth / 2, 425, 'platform').setScale(worldWidth / 400, 1).refreshBody();

            const platformData = [
                { x: 400, y: 320 },
                { x: 650, y: 260 },
                { x: 900, y: 320 },
                { x: 1150, y: 240 },
                { x: 1400, y: 320 },
                { x: 1700, y: 260 },
                { x: 1900, y: 320 }
            ];
            platformData.forEach(p => {
                platforms.create(p.x, p.y, 'platform').refreshBody();
            });

            this.physics.add.collider(this.player, platforms);

            // Cursor Steuerung
            this.cursors = this.input.keyboard.createCursorKeys();

            // Double-tap Logik
            this.lastUpPress = 0;

            // Mobile Buttons
            if (this.sys.game.device.input.touch) {
                const left = this.add.rectangle(50, 400, 100, 50, 0x0000ff, 0.5).setScrollFactor(0).setInteractive();
                const right = this.add.rectangle(750, 400, 100, 50, 0x0000ff, 0.5).setScrollFactor(0).setInteractive();
                const jump = this.add.rectangle(400, 400, 100, 50, 0x00ff00, 0.5).setScrollFactor(0).setInteractive();

                left.on('pointerdown', () => { this.player.setVelocityX(-200); });
                left.on('pointerup', () => { this.player.setVelocityX(0); });

                right.on('pointerdown', () => { this.player.setVelocityX(200); });
                right.on('pointerup', () => { this.player.setVelocityX(0); });

                jump.on('pointerdown', () => {
                    if (this.player.body.blocked.down) {
                        const now = this.time.now;
                        const delta = now - (this.lastUpPress || 0);
                        if (delta < 300) { // doppelter Sprung
                            this.player.setVelocityY(-1100);
                        } else { // normaler Sprung
                            this.player.setVelocityY(-550);
                        }
                        this.lastUpPress = now;
                        this.sound.play('jump');
                    }
                });
            }
        }

        update() {
            // Bewegung PC
            if (this.cursors.left.isDown) this.player.setVelocityX(-200);
            else if (this.cursors.right.isDown) this.player.setVelocityX(200);
            else this.player.setVelocityX(0);

            // Sprung PC mit Double-Tap
            if (this.cursors.up.isDown && this.player.body.blocked.down) {
                const now = this.time.now;
                const delta = now - (this.lastUpPress || 0);
                if (delta < 300) {
                    this.player.setVelocityY(-1100); // doppelter Sprung
                } else {
                    this.player.setVelocityY(-550); // normaler Sprung
                }
                this.lastUpPress = now;
                this.sound.play('jump');
            }

            // Wechsel zum Quiz
            if (this.player.x >= 1900) {
                this.scene.start('QuizScene', { playerName: this.playerName });
            }
        }
    }

    // ---- Szene 3: Quiz ----
    class QuizScene extends Phaser.Scene {
        constructor() { super('QuizScene'); }
        preload() { this.load.json('questions', 'data/questions.json'); }
        init(data) { this.playerName = data.playerName; }
        create() {
            const questions = this.cache.json.get('questions');
            let idx = 0;

            const showQuestion = () => {
                if (idx >= questions.length) {
                    this.scene.start('EndScene', { playerName: this.playerName }); return;
                }
                this.children.removeAll();
                const q = questions[idx];
                this.add.text(50, 50, q.question, { font: '28px Arial', fill: '#fff' });

                q.options.forEach((opt, i) => {
                    const btn = this.add.text(50, 150 + i * 60, opt, { font: '24px Arial', fill: '#0f0' }).setInteractive();
                    btn.on('pointerdown', () => {
                        if (i === q.answer) this.add.text(400, 400, 'Richtig!', { font: '28px Arial', fill: '#ff0' });
                        idx++; this.time.delayedCall(500, showQuestion);
                    });
                });
            };

            showQuestion();
        }
    }

    // ---- Szene 4: Ende ----
    class EndScene extends Phaser.Scene {
        constructor() { super('EndScene'); }
        init(data) { this.playerName = data.playerName; }
        create() {
            this.add.text(100, 200, `Herzlichen Glückwunsch ${this.playerName}!\nDu bist eingeladen zur Super Bowl Party!\n08.02.2026`,
                { font: '28px Arial', fill: '#fff', align: 'center' });
        }
    }

    // ---- Phaser Config ----
    const config = {
        type: Phaser.AUTO,
        width: 800,
        height: 450,
        parent: 'game-container',
        backgroundColor: '#87CEEB',
        physics: { default: 'arcade', arcade: { gravity: { y: 900 } } },
        dom: { createContainer: true },
        scene: [NameScene, GameScene, QuizScene, EndScene]
    };

    new Phaser.Game(config);

});
