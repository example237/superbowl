window.addEventListener('load', function () {

    /* =====================
       NAME
    ===================== */
    class NameScene extends Phaser.Scene {
        constructor() { super('NameScene'); }

        create() {
            this.add.rectangle(400, 225, 800, 450, 0x1E3A8A);

            this.add.text(220, 80, 'Gib deinen Namen ein:', {
                font: '28px Arial',
                fill: '#ffffff'
            });

            const input = this.add.dom(400, 170, 'input',
                'width:300px;height:45px;font-size:20px;text-align:center;');

            const btn = this.add.dom(400, 240, 'button',
                'width:140px;height:50px;font-size:20px;', 'Start');

            btn.addListener('click');
            btn.on('click', () => {
                const name = input.node.value || 'Spieler';
                this.scene.start('GameScene', { playerName: name });
            });
        }
    }

    /* =====================
       GAME
    ===================== */
    class GameScene extends Phaser.Scene {
        constructor() { super('GameScene'); }

        init(data) {
            this.playerName = data.playerName;
        }

        preload() {
            this.load.image('player', 'assets/sprites/player.png');
            this.load.image('platform', 'assets/sprites/platform.png');
            this.load.image('football', 'assets/sprites/ball.png');
            this.load.image('btn_left', 'assets/sprites/btn_left.png');
            this.load.image('btn_right', 'assets/sprites/btn_right.png');
            this.load.image('btn_jump', 'assets/sprites/btn_jump.png');
        }

        create() {
            const worldWidth = 5200;

            this.physics.world.setBounds(0, 0, worldWidth, 450);
            this.cameras.main.setBounds(0, 0, worldWidth, 450);
            this.add.rectangle(worldWidth / 2, 225, worldWidth, 450, 0x87CEEB);

            /* PLATTFORMEN */
            this.platforms = this.physics.add.staticGroup();

            const platformData = [
                { x: 150, y: 300 }, { x: 350, y: 250 }, { x: 550, y: 200 },
                { x: 750, y: 250 }, { x: 950, y: 200 }, { x: 1150, y: 250 },
                { x: 1350, y: 200 }, { x: 1550, y: 250 }, { x: 1750, y: 200 },
                { x: 1950, y: 250 }, { x: 2150, y: 200 }, { x: 2350, y: 250 },
                { x: 2550, y: 200 }, { x: 2750, y: 250 }, { x: 2950, y: 200 },
                { x: 3200, y: 250 }, { x: 3500, y: 220 }, { x: 3800, y: 250 },
                { x: 4100, y: 220 }, { x: 4400, y: 250 },

                // ✅ ZIELPLATTFORM
                { x: 4800, y: 220 }
            ];

            platformData.forEach(p => {
                this.platforms.create(p.x, p.y, 'platform').refreshBody();
            });

            /* SPIELER */
            const start = platformData[0];
            this.player = this.physics.add.sprite(start.x, start.y - 50, 'player');
            this.player.setGravityY(900);
            this.player.setCollideWorldBounds(false);

            this.canDoubleJump = true;
            this.physics.add.collider(this.player, this.platforms, () => {
                this.canDoubleJump = true;
            });

            this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
            this.cursors = this.input.keyboard.createCursorKeys();

            /* FOOTBALLS */
            this.footballs = this.physics.add.group();
            this.footballCount = 0;

            const footballData = [
                { x: 250, y: 180 }, { x: 800, y: 200 },
                { x: 1500, y: 160 }, { x: 2300, y: 180 },
                { x: 3200, y: 180 }, { x: 4100, y: 180 }
            ];

            footballData.forEach(f => {
                const ball = this.footballs.create(f.x, f.y, 'football');
                ball.setScale(0.25);
                ball.body.setAllowGravity(false);
                ball.baseY = f.y;
                ball.offset = Math.random() * Math.PI * 2;
            });

            this.physics.add.overlap(this.player, this.footballs, this.collectFootball, null, this);

            this.footballText = this.add.text(10, 10, 'Football: 0', {
                font: '24px Arial',
                fill: '#ffffff'
            }).setScrollFactor(0);

            /* 🎯 QUIZ-TRIGGER (unsichtbar) */
            this.quizTrigger = this.physics.add.staticSprite(4800, 170, null)
                .setSize(80, 200)
                .setVisible(false);

            this.physics.add.overlap(this.player, this.quizTrigger, () => {
                if (this.footballCount === this.footballs.getLength()) {
                    this.scene.start('QuizScene', { playerName: this.playerName });
                }
            });

            /* MOBILE BUTTONS (größer) */
            const isMobile = this.sys.game.device.os.android || this.sys.game.device.os.iOS;

            if (isMobile) {
                this.leftBtn = this.add.image(160, 360, 'btn_left')
                    .setScale(1.5).setScrollFactor(0).setInteractive();
                this.rightBtn = this.add.image(360, 360, 'btn_right')
                    .setScale(1.5).setScrollFactor(0).setInteractive();
                this.jumpBtn = this.add.image(650, 360, 'btn_jump')
                    .setScale(1.6).setScrollFactor(0).setInteractive();

                this.leftBtn.on('pointerdown', () => this.player.setVelocityX(-220));
                this.leftBtn.on('pointerup', () => this.player.setVelocityX(0));
                this.rightBtn.on('pointerdown', () => this.player.setVelocityX(220));
                this.rightBtn.on('pointerup', () => this.player.setVelocityX(0));
                this.jumpBtn.on('pointerdown', () => this.jump());
            }
        }

        jump() {
            if (this.player.body.blocked.down) {
                this.player.setVelocityY(-550);
                this.canDoubleJump = true;
            } else if (this.canDoubleJump) {
                this.player.setVelocityY(-800);
                this.canDoubleJump = false;
            }
        }

        collectFootball(player, football) {
            football.destroy();
            this.footballCount++;
            this.footballText.setText('Football: ' + this.footballCount);
        }

        update(time) {
            if (this.cursors.left.isDown) this.player.setVelocityX(-220);
            else if (this.cursors.right.isDown) this.player.setVelocityX(220);
            else this.player.setVelocityX(0);

            if (Phaser.Input.Keyboard.JustDown(this.cursors.up)) this.jump();

            if (this.player.y > 450) {
                this.scene.restart({ playerName: this.playerName });
            }

            this.footballs.children.iterate(b => {
                b.y = b.baseY + Math.sin(time / 500 + b.offset) * 10;
            });
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
                { q: "Wie heißt das NFL-Finale?", a: ["Super Bowl", "World Cup", "Final"], c: 0 },
                { q: "Wie viele Punkte gibt ein Touchdown?", a: ["3", "6", "7"], c: 1 }
            ];

            this.showQuestion();
        }

        showQuestion() {
            this.children.removeAll();
            this.add.rectangle(400, 225, 800, 450, 0x1E3A8A);

            const q = this.questions[this.index];

            this.add.text(50, 50, q.q, {
                font: '26px Arial',
                fill: '#ffffff',
                wordWrap: { width: 700 }
            });

            q.a.forEach((opt, i) => {
                const btn = this.add.text(100, 150 + i * 70, opt, {
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
            this.add.text(
                120, 180,
                `Glückwunsch ${this.playerName}!\n\nSUPER BOWL PARTY\n08.02.2026`,
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
        scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
        scene: [NameScene, GameScene, QuizScene, EndScene]
    });

});
