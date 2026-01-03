window.addEventListener('load', function () {

    /* ======================================================
       NAME
    ====================================================== */
    class NameScene extends Phaser.Scene {
        constructor() { super('NameScene'); }

        create() {
            this.cameras.main.setScroll(0, 0);
            this.add.rectangle(400, 225, 800, 450, 0x1E3A8A);

            this.add.text(220, 80, 'Gib deinen Namen ein:', {
                font: '28px Arial', fill: '#fff'
            });

            const input = this.add.dom(400, 170, 'input',
                'width:300px;height:45px;font-size:20px;text-align:center;');
            input.node.placeholder = 'Name';

            const btn = this.add.dom(400, 240, 'button',
                'width:140px;height:50px;font-size:20px;', 'Start');

            btn.addListener('click');
            btn.on('click', () => {
                this.scene.start('GameScene', {
                    playerName: input.node.value || 'Spieler'
                });
            });
        }
    }

    /* ======================================================
       GAME
    ====================================================== */
    class GameScene extends Phaser.Scene {
        constructor() { super('GameScene'); }
        init(data) { this.playerName = data.playerName; }

        preload() {
            this.load.image('player', 'assets/sprites/player.png');
            this.load.image('platform', 'assets/sprites/platform.png');
        }

        create() {
            const worldWidth = 2000;
            this.physics.world.setBounds(0, 0, worldWidth, 450);
            this.cameras.main.setBounds(0, 0, worldWidth, 450);

            this.add.rectangle(worldWidth / 2, 225, worldWidth, 450, 0x87CEEB);

            this.player = this.physics.add.sprite(100, 350, 'player');
            this.player.setCollideWorldBounds(true);
            this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

            const platforms = this.physics.add.staticGroup();
            platforms.create(worldWidth / 2, 430, 'platform')
                .setScale(worldWidth / 400, 1).refreshBody();

            [
                { x: 400, y: 320 },
                { x: 700, y: 260 },
                { x: 1000, y: 320 },
                { x: 1300, y: 250 },
                { x: 1600, y: 320 }
            ].forEach(p => platforms.create(p.x, p.y, 'platform'));

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

            if (this.player.x > 1850) {
                this.scene.start('QuizScene', { playerName: this.playerName });
            }
        }
    }

    /* ======================================================
       QUIZ + FEEDBACK
    ====================================================== */
    class QuizScene extends Phaser.Scene {
        constructor() { super('QuizScene'); }
        init(data) { this.playerName = data.playerName; }

        create() {
            this.cameras.main.stopFollow();
            this.cameras.main.setScroll(0, 0);
            this.add.rectangle(400, 225, 800, 450, 0x1E3A8A);

            this.questions = [
                { q: "Wie viele Spieler pro Team?", a: ["9", "10", "11"], c: 2 },
                { q: "NFL Endspiel?", a: ["Super Bowl", "Final"], c: 0 },
                { q: "Touchdown Punkte?", a: ["3", "6"], c: 1 }
            ];

            this.index = 0;
            this.showQuestion();
        }

        showQuestion() {
            this.children.removeAll();
            this.add.rectangle(400, 225, 800, 450, 0x1E3A8A);

            if (this.index >= this.questions.length) {
                this.scene.start('MiniGame1', { playerName: this.playerName });
                return;
            }

            const q = this.questions[this.index];
            this.add.text(50, 40, q.q, { font: '26px Arial', fill: '#fff' });

            q.a.forEach((opt, i) => {
                const btn = this.add.text(100, 150 + i * 70, opt, {
                    font: '24px Arial',
                    backgroundColor: '#fff',
                    color: '#000',
                    padding: { x: 10, y: 10 }
                }).setInteractive();

                btn.on('pointerdown', () => {
                    const correct = (i === q.c);
                    this.showFeedback(correct);
                });
            });
        }

        showFeedback(correct) {
            const txt = correct ? 'RICHTIG!' : 'FALSCH!';
            const col = correct ? '#00ff00' : '#ff0000';

            this.add.text(300, 350, txt, {
                font: '32px Arial',
                fill: col
            });

            this.time.delayedCall(1000, () => {
                this.index++;
                this.showQuestion();
            });
        }
    }

    /* ======================================================
       MINIGAME 1 – REAKTION
    ====================================================== */
    class MiniGame1 extends Phaser.Scene {
        constructor() { super('MiniGame1'); }
        init(data) { this.playerName = data.playerName; }

        create() {
            this.add.rectangle(400, 225, 800, 450, 0x222222);
            const text = this.add.text(200, 200, 'Warte...', { font: '32px Arial', fill: '#fff' });

            this.time.delayedCall(Phaser.Math.Between(1000, 3000), () => {
                text.setText('JETZT KLICKEN!');
                this.input.once('pointerdown', () => {
                    this.scene.start('MiniGame2', { playerName: this.playerName });
                });
            });
        }
    }

    /* ======================================================
       MINIGAME 2 – SAMMELN
    ====================================================== */
    class MiniGame2 extends Phaser.Scene {
        constructor() { super('MiniGame2'); }
        init(data) { this.playerName = data.playerName; }

        preload() {
            this.load.image('ball', 'assets/sprites/ball.png');
        }

        create() {
            this.add.rectangle(400, 225, 800, 450, 0x004400);
            this.score = 0;

            this.text = this.add.text(20, 20, 'Bälle: 0', { font: '24px Arial', fill: '#fff' });

            this.ball = this.physics.add.sprite(400, 225, 'ball').setInteractive();
            this.ball.on('pointerdown', () => {
                this.score++;
                this.text.setText('Bälle: ' + this.score);
                this.ball.setPosition(
                    Phaser.Math.Between(50, 750),
                    Phaser.Math.Between(80, 400)
                );
                if (this.score >= 3) {
                    this.scene.start('EndScene', { playerName: this.playerName });
                }
            });
        }
    }

    /* ======================================================
       END
    ====================================================== */
    class EndScene extends Phaser.Scene {
        constructor() { super('EndScene'); }
        init(data) { this.playerName = data.playerName; }

        create() {
            this.add.rectangle(400, 225, 800, 450, 0x1E3A8A);
            this.add.text(120, 170,
                `Glückwunsch ${this.playerName}!\n\nSUPER BOWL PARTY\n08.02.2026`,
                { font: '28px Arial', fill: '#fff', align: 'center' }
            );
        }
    }

    /* ======================================================
       CONFIG
    ====================================================== */
    new Phaser.Game({
        type: Phaser.AUTO,
        width: 800,
        height: 450,
        parent: 'game-container',
        physics: { default: 'arcade', arcade: { gravity: { y: 900 } } },
        dom: { createContainer: true },
        scene: [
            NameScene,
            GameScene,
            QuizScene,
            MiniGame1,
            MiniGame2,
            EndScene
        ]
    });

});
