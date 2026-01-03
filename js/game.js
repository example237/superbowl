window.addEventListener('load', function () {

    // ---- Szene 1: Nameeingabe ----
    class NameScene extends Phaser.Scene {
        constructor() { super('NameScene'); }
        create() {
            this.add.text(250, 50, 'Gib deinen Namen ein:', { font: '28px Arial', fill: '#fff' });
            
            // HTML Input
            const input = this.add.dom(400, 150, 'input', 'width: 200px; height: 30px; font-size:20px');
            const btn = this.add.dom(400, 200, 'button', 'width:100px;height:40px;font-size:20px;', 'Weiter');
            
            btn.addListener('click');
            btn.on('click', () => {
                const playerName = input.node.value || 'Spieler';
                this.scene.start('PlayerSelectScene', { playerName });
            });
        }
    }

    // ---- Szene 2: Spieler-Auswahl ----
    class PlayerSelectScene extends Phaser.Scene {
        constructor() { super('PlayerSelectScene'); }
        init(data) { this.playerName = data.playerName; }
        preload() { this.load.image('player', 'assets/sprites/player.png'); }
        create() {
            this.add.text(200, 50, `Hallo ${this.playerName}, wähle deinen Spieler:`, { font: '28px Arial', fill: '#fff' });
            const p = this.add.sprite(400, 250, 'player').setInteractive();

            p.on('pointerdown', () => {
                this.scene.start('GameScene', { playerName: this.playerName });
            });
        }
    }

    // ---- Szene 3: Jump’n’Run Hauptspiel ----
    class GameScene extends Phaser.Scene {
        constructor() { super('GameScene'); }
        init(data) { this.playerName = data.playerName; }
        preload() {
            this.load.image('background', 'assets/sprites/background.png');
            this.load.image('player', 'assets/sprites/player.png');
            this.load.audio('bg', 'assets/audio/bg.mp3');
            this.load.audio('jump', 'assets/audio/jump.wav');
        }
        create() {
            this.add.image(400, 225, 'background');
            this.player = this.physics.add.sprite(100, 350, 'player').setCollideWorldBounds(true);

            this.add.text(10, 10, `Spieler: ${this.playerName}`, { font: '24px Arial', fill: '#fff' });

            // Musik starten
            this.bgMusic = this.sound.add('bg', { loop: true, volume: 0.5 });
            this.bgMusic.play();

            // Plattformen
            const platforms = this.physics.add.staticGroup();
            platforms.create(400, 400, 'player').setScale(2).refreshBody();
            platforms.create(600, 300, 'player').setScale(1).refreshBody();
            platforms.create(200, 250, 'player').setScale(1).refreshBody();

            this.physics.add.collider(this.player, platforms);

            // Cursor Steuerung Desktop
            this.cursors = this.input.keyboard.createCursorKeys();

            // Mobile Buttons
            if (this.sys.game.device.input.touch) {
                const left = this.add.rectangle(50, 400, 100, 50, 0x0000ff, 0.5).setInteractive();
                const right = this.add.rectangle(750, 400, 100, 50, 0x0000ff, 0.5).setInteractive();
                const jump = this.add.rectangle(400, 400, 100, 50, 0x00ff00, 0.5).setInteractive();

                left.on('pointerdown', () => { this.player.setVelocityX(-200); });
                left.on('pointerup', () => { this.player.setVelocityX(0); });

                right.on('pointerdown', () => { this.player.setVelocityX(200); });
                right.on('pointerup', () => { this.player.setVelocityX(0); });

                jump.on('pointerdown', () => { this.player.setVelocityY(-400); this.sound.play('jump'); });
            }

            // Nach 10 Sekunden zum Quiz
            this.time.delayedCall(10000, () => this.scene.start('QuizScene', { playerName: this.playerName }));
        }
        update() {
            if (this.cursors.left.isDown) this.player.setVelocityX(-200);
            else if (this.cursors.right.isDown) this.player.setVelocityX(200);
            else this.player.setVelocityX(0);

            if (this.cursors.up.isDown && this.player.body.touching.down) {
                this.player.setVelocityY(-400);
                this.sound.play('jump');
            }
        }
    }

    // ---- Szene 4: Quiz ----
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

    // ---- Szene 5: Ende / Einladung ----
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
        scene: [NameScene, PlayerSelectScene, GameScene, QuizScene, EndScene]
    };

    new Phaser.Game(config);

});
