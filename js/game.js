window.addEventListener('load', function () {

    /* =====================
       NAME
    ===================== */
    class NameScene extends Phaser.Scene {
        constructor() { super('NameScene'); }

        create(data) {
            this.playerName = data?.playerName || null;

            this.add.rectangle(400, 225, 800, 450, 0x1E3A8A);

            this.add.text(220, 80, 'Gib deinen Namen ein:', {
                font: '28px Arial',
                fill: '#ffffff'
            });

            const input = this.add.dom(400, 170, 'input',
                'width:300px;height:45px;font-size:20px;text-align:center;');

            if (this.playerName) input.node.value = this.playerName;

            const btn = this.add.dom(400, 240, 'button',
                'width:180px;height:60px;font-size:22px;', 'Start');

            btn.addListener('click');
            btn.on('click', () => {
                this.scene.start('GameScene', {
                    playerName: input.node.value || 'Spieler'
                });
            });
        }
    }

    /* =====================
       GAME
    ===================== */
    class GameScene extends Phaser.Scene {
        constructor() { super('GameScene'); }
        init(data) { this.playerName = data.playerName; }

        preload() {
            this.load.image('player', 'assets/sprites/player.png');
            this.load.image('platform', 'assets/sprites/platform.png');
            this.load.image('football', 'assets/sprites/ball.png');

            this.load.image('btn_left', 'assets/sprites/btn_left.png');
            this.load.image('btn_right', 'assets/sprites/btn_right.png');
            this.load.image('btn_jump', 'assets/sprites/btn_jump.png');

            this.load.audio('bgm', 'assets/audio/bg2.mp3');

            /* Quiz-Daten */
            this.load.json('questions', 'assets/data/questions.json');
        }

        create() {
            const worldWidth = 5000;

            this.physics.world.setBounds(0, 0, worldWidth, 450);
            this.cameras.main.setBounds(0, 0, worldWidth, 450);

            this.add.rectangle(worldWidth / 2, 225, worldWidth, 450, 0x87CEEB);

            /* ---------- Plattformen ---------- */
            this.platforms = this.physics.add.staticGroup();

            const platforms = [
                { x: 150, y: 300 }, { x: 320, y: 260 }, { x: 500, y: 230 },
                { x: 680, y: 250 }, { x: 860, y: 220 }, { x: 1040, y: 250 },
                { x: 1220, y: 220 }, { x: 1400, y: 250 }, { x: 1580, y: 220 },
                { x: 1760, y: 250 }, { x: 1940, y: 220 }, { x: 2120, y: 250 },
                { x: 2300, y: 220 }, { x: 2480, y: 250 }, { x: 2660, y: 220 },
                { x: 2840, y: 250 }, { x: 3020, y: 220 }, { x: 3200, y: 250 },
                { x: 3380, y: 220 }, { x: 3560, y: 250 }, { x: 3740, y: 220 },
                { x: 3920, y: 250 }, { x: 4100, y: 220 },
                /* letzte beiden – bewusst näher */
                { x: 4300, y: 240 },
                { x: 4480, y: 230 }
            ];

            platforms.forEach(p => {
                this.platforms.create(p.x, p.y, 'platform').refreshBody();
            });

            /* ---------- Zielplattform ---------- */
            this.goalPlatform = this.platforms.create(4700, 220, 'platform')
                .setTint(0xffd700)
                .refreshBody();

            this.add.text(4700, 150, 'ZIEL', {
                font: '26px Arial',
                fill: '#ffd700',
                stroke: '#000',
                strokeThickness: 4
            }).setOrigin(0.5);

            /* ---------- Spieler ---------- */
            this.player = this.physics.add.sprite(150, 250, 'player');
            this.player.setGravityY(900);

            this.canDoubleJump = true;

            this.physics.add.collider(this.player, this.platforms, () => {
                this.canDoubleJump = true;
                this.player.setVelocityX(0);
            });

            this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
            this.cursors = this.input.keyboard.createCursorKeys();

            /* ---------- Footballs ---------- */
            this.footballs = this.physics.add.group();
            this.footballCount = 0;

            const footballData = [
                { x: 260, y: 180 }, { x: 820, y: 190 },
                { x: 1500, y: 170 }, { x: 2300, y: 180 },
                { x: 3200, y: 180 }, { x: 4100, y: 180 }
            ];

            this.totalFootballs = footballData.length;

            footballData.forEach(f => {
                const ball = this.footballs.create(f.x, f.y, 'football');
                ball.setScale(0.25);
                ball.body.setAllowGravity(false);
                ball.baseY = f.y;
                ball.phase = Math.random() * Math.PI * 2;
            });

            this.physics.add.overlap(this.player, this.footballs, (p, f) => {
                f.destroy();
                this.footballCount++;
            });

            /* ---------- Musik ---------- */
            this.bgm = this.sound.add('bgm', { loop: true, volume: 0.4 });
            this.bgm.play();
        }

        update(time) {
            if (this.cursors.left.isDown) this.player.setVelocityX(-220);
            else if (this.cursors.right.isDown) this.player.setVelocityX(220);
            else this.player.setVelocityX(0);

            if (Phaser.Input.Keyboard.JustDown(this.cursors.up)) {
                if (this.player.body.blocked.down) {
                    this.player.setVelocityY(-550);
                    this.canDoubleJump = true;
                } else if (this.canDoubleJump) {
                    this.player.setVelocityY(-800);
                    this.canDoubleJump = false;
                }
            }

            if (this.player.y > 450) {
                this.scene.restart({ playerName: this.playerName });
            }

            /* Football-Schweben */
            this.footballs.children.iterate(ball => {
                ball.y = ball.baseY + Math.sin(time / 500 + ball.phase) * 12;
            });

            /* Ziel erreicht → Quiz */
            if (
                this.player.x > 4650 &&
                this.footballCount === this.totalFootballs
            ) {
                this.bgm.stop();
                this.scene.start('QuizScene', {
                    playerName: this.playerName,
                    questions: this.cache.json.get('questions')
                });
            }
        }
    }

    /* =====================
       QUIZ
    ===================== */
    class QuizScene extends Phaser.Scene {
        constructor() { super('QuizScene'); }
        init(data) {
            this.playerName = data.playerName;
            this.questions = data.questions;
        }

        create() {
            this.index = 0;
            this.showQuestion();
        }

        showQuestion() {
            this.children.removeAll();
            this.add.rectangle(400, 225, 800, 450, 0x1E3A8A);

            const q = this.questions[this.index];

            this.add.text(80, 60, q.q, {
                font: '26px Arial',
                fill: '#ffffff',
                wordWrap: { width: 640 }
            });

            q.a.forEach((opt, i) => {
                const btn = this.add.text(120, 150 + i * 70, opt, {
                    font: '24px Arial',
                    backgroundColor: '#ffffff',
                    color: '#000',
                    padding: { x: 10, y: 10 }
                }).setInteractive();

                btn.on('pointerdown', () => {
                    if (i === q.correct) {
                        this.index++;
                        if (this.index >= this.questions.length) {
                            this.scene.start('EndScene', { playerName: this.playerName });
                        } else {
                            this.showQuestion();
                        }
                    }
                });
            });
        }
    }

    /* =====================
       END
    ===================== */
    class EndScene extends Phaser.Scene {
        constructor() { super('EndScene'); }
        init(data) { this.playerName = data.playerName; }

        create() {
            this.add.rectangle(400, 225, 800, 450, 0x1E3A8A);
            this.add.text(120, 180,
                `Glückwunsch ${this.playerName}!\n\nSUPER BOWL PARTY\n08.02.2026\nElsbethen`,
                { font: '28px Arial', fill: '#ffffff', align: 'center' }
            );
        }
    }

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
