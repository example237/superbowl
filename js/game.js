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
            this.load.audio('bgm', 'assets/audio/bg2.mp3');
        }

        create() {
            const worldWidth = 5000;

            this.physics.world.setBounds(0, 0, worldWidth, 450);
            this.cameras.main.setBounds(0, 0, worldWidth, 450);

            this.add.rectangle(worldWidth / 2, 225, worldWidth, 450, 0x87CEEB);

            this.platforms = this.physics.add.staticGroup();
            const data = [
                { x: 150, y: 300 }, { x: 320, y: 260 }, { x: 490, y: 220 },
                { x: 660, y: 250 }, { x: 830, y: 210 }, { x: 1000, y: 250 },
                { x: 1170, y: 220 }, { x: 1340, y: 250 }, { x: 1510, y: 220 },
                { x: 1680, y: 250 }, { x: 1850, y: 220 }, { x: 2020, y: 250 },
                { x: 2190, y: 220 }, { x: 2360, y: 250 }, { x: 2530, y: 220 },
                { x: 2700, y: 250 }, { x: 2870, y: 220 }, { x: 3040, y: 250 },
                { x: 3210, y: 220 }, { x: 3380, y: 250 }, { x: 3550, y: 220 },
                { x: 3720, y: 250 }, { x: 3890, y: 220 }, { x: 4060, y: 250 },
                { x: 4250, y: 230 }, { x: 4450, y: 210 }
            ];

            data.forEach(p => {
                this.platforms.create(p.x, p.y, 'platform').refreshBody();
            });

            this.goalPlatform = this.platforms.create(4700, 220, 'platform')
                .setTint(0xffd700)
                .refreshBody();

            this.player = this.physics.add.sprite(150, 250, 'player');
            this.player.setGravityY(900);

            this.canDoubleJump = true;

            this.physics.add.collider(this.player, this.platforms, () => {
                this.canDoubleJump = true;
                this.player.setVelocityX(0);
            });

            this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
            this.cursors = this.input.keyboard.createCursorKeys();

            this.footballs = this.physics.add.group();
            this.footballCount = 0;

            const balls = [
                { x: 250, y: 180 }, { x: 800, y: 200 }, { x: 1500, y: 160 },
                { x: 2300, y: 180 }, { x: 3200, y: 180 }, { x: 4400, y: 180 }
            ];

            this.totalFootballs = balls.length;

            balls.forEach(b => {
                const f = this.footballs.create(b.x, b.y, 'football');
                f.setScale(0.25);
                f.body.setAllowGravity(false);
            });

            this.physics.add.overlap(this.player, this.footballs, (p, f) => {
                f.destroy();
                this.footballCount++;
            });

            this.bgm = this.sound.add('bgm', { loop: true, volume: 0.4 });
            this.bgm.play();
        }

        update() {
            if (this.cursors.left.isDown) this.player.setVelocityX(-220);
            else if (this.cursors.right.isDown) this.player.setVelocityX(220);

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

            if (this.player.x > 4650 && this.footballCount === this.totalFootballs) {
                this.bgm.stop();
                this.scene.start('QuizScene', { playerName: this.playerName });
            }
        }
    }

    /* =====================
       QUIZ
    ===================== */
    class QuizScene extends Phaser.Scene {
        constructor() { super('QuizScene'); }
        init(data) { this.playerName = data.playerName; }

        create() {
            this.index = 0;
            this.questions = [
                { q: "Wie viele Spieler stehen pro Team auf dem Feld?", a: ["9", "10", "11"], c: 2 },
                { q: "Wie viele Punkte gibt ein Touchdown?", a: ["3", "6", "7"], c: 1 },
                { q: "Wo findet die Party statt?", a: ["Salzburg", "Elsbethen", "Wien"], c: 1 }
            ];
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
                    if (i === q.c) {
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
