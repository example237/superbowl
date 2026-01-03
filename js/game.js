window.addEventListener('load', function () {

    /* =====================
       NAME
    ===================== */
    class NameScene extends Phaser.Scene {
        constructor() { super('NameScene'); }

        create() {
            this.cameras.main.setScroll(0, 0);
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
        init(data) { this.playerName = data.playerName; }

        preload() {
            this.load.image('player', 'assets/sprites/player.png');
            this.load.image('platform', 'assets/sprites/platform.png');
            this.load.image('football', 'assets/sprites/ball.png'); // Footballs
        }

        create() {
            const worldWidth = 5000;

            this.physics.world.setBounds(0, 0, worldWidth, 450);
            this.cameras.main.setBounds(0, 0, worldWidth, 450);

            // Blauer Hintergrund
            this.add.rectangle(worldWidth / 2, 225, worldWidth, 450, 0x87CEEB);

            /* =====================
               PLATTFORMEN
            ===================== */
            this.platforms = this.physics.add.staticGroup();

            const platformsData = [
                { x: 150, y: 300, scale: 1.5 },
                { x: 350, y: 250, scale: 1.2 },
                { x: 550, y: 200, scale: 1.0 },
                { x: 750, y: 250, scale: 1.2 },
                { x: 950, y: 200, scale: 1.0 },
                { x: 1150, y: 250, scale: 1.2 },
                { x: 1350, y: 200, scale: 1.0 },
                { x: 1550, y: 250, scale: 1.3 },
                { x: 1750, y: 200, scale: 1.0 },
                { x: 1950, y: 250, scale: 1.3 },
                { x: 2150, y: 200, scale: 1.0 },
                { x: 2350, y: 250, scale: 1.3 },
                { x: 2550, y: 200, scale: 1.0 },
                { x: 2750, y: 250, scale: 1.3 },
                { x: 2950, y: 200, scale: 1.0 },
                { x: 3200, y: 250, scale: 1.3 },
                { x: 3500, y: 220, scale: 1.0 },
                { x: 3800, y: 250, scale: 1.2 },
                { x: 4100, y: 220, scale: 1.0 },
                { x: 4400, y: 250, scale: 1.3 },
                { x: 4700, y: 220, scale: 1.0 }
            ];

            platformsData.forEach(p => {
                const plat = this.platforms.create(p.x, p.y, 'platform');
                plat.setScale(p.scale, 1).refreshBody();
            });

            /* =====================
               SPIELER
            ===================== */
            const startPlatform = platformsData[0];
            this.player = this.physics.add.sprite(startPlatform.x, startPlatform.y - 50, 'player');
            this.player.setCollideWorldBounds(false);
            this.player.setGravityY(900);
            this.player.setBounce(0);
            this.player.body.setSize(this.player.width, this.player.height, true);

            this.physics.add.collider(this.player, this.platforms, () => {
                this.canDoubleJump = true;
            });

            this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

            this.cursors = this.input.keyboard.createCursorKeys();
            this.canDoubleJump = true;

            /* =====================
               FOOTBALLS
            ===================== */
            this.footballs = this.physics.add.group();
            this.footballCount = 0;

            // Footballs in der Luft zwischen Plattformen
            const footballsData = [
                { x: 250, y: 180 },
                { x: 500, y: 160 },
                { x: 800, y: 200 },
                { x: 1100, y: 180 },
                { x: 1500, y: 160 },
                { x: 1900, y: 200 },
                { x: 2300, y: 180 },
                { x: 2700, y: 160 },
                { x: 3200, y: 180 },
                { x: 3800, y: 200 },
                { x: 4400, y: 180 }
            ];

            footballsData.forEach(f => {
                const football = this.footballs.create(f.x, f.y, 'football');
                football.setScale(0.25);
                football.body.setAllowGravity(false);
            });

            this.physics.add.overlap(this.player, this.footballs, this.collectFootball, null, this);

            // Football-Zähler
            this.footballText = this.add.text(10, 10, 'Football: 0', {
                font: '24px Arial',
                fill: '#ffffff'
            }).setScrollFactor(0);
        }

        collectFootball(player, football) {
            football.destroy();
            this.footballCount++;
            this.footballText.setText('Football: ' + this.footballCount);
        }

        update() {
            // Links/Rechts
            if (this.cursors.left.isDown) this.player.setVelocityX(-220);
            else if (this.cursors.right.isDown) this.player.setVelocityX(220);
            else this.player.setVelocityX(0);

            // Sprung-Logik
            if (Phaser.Input.Keyboard.JustDown(this.cursors.up)) {
                if (this.player.body.blocked.down) {
                    this.player.setVelocityY(-550);
                    this.canDoubleJump = true;
                } else if (this.canDoubleJump) {
                    this.player.setVelocityY(-800);
                    this.canDoubleJump = false;
                }
            }

            // Tod, wenn Spieler unter Canvas fällt
            if (this.player.y > 450) {
                this.scene.start('NameScene');
            }

            // Quiz am Ende
            if (this.player.x > 4750) {
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
            this.cameras.main.setScroll(0, 0);

            this.questions = [
                { q: "Wie viele Spieler stehen pro Team auf dem Feld?", a: ["9", "10", "11"], correct: 2 },
                { q: "Wie heißt das NFL-Endspiel?", a: ["Super Bowl", "Final", "World Cup"], correct: 0 },
                { q: "Wie viele Punkte gibt ein Touchdown?", a: ["3", "6", "7"], correct: 1 },
                { q: "Welche Stadt ist bekannt für den Super Bowl?", a: ["Miami", "Berlin", "Paris"], correct: 0 },
                { q: "Wann ist die Party?", a: ["08.02.2026", "01.01.2026", "10.03.2026"], correct: 0 }
            ];

            this.index = 0;
            this.feedback = null;
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

                btn.on('pointerdown', () => this.check(i));
            });
        }

        check(choice) {
            if (this.feedback) this.feedback.destroy();

            const correct = choice === this.questions[this.index].correct;

            this.feedback = this.add.text(
                240, 350,
                correct ? 'RICHTIG!' : 'FALSCH – versuche es nochmal',
                { font: '28px Arial', fill: correct ? '#00ff00' : '#ff0000' }
            );

            if (correct) {
                this.time.delayedCall(1000, () => {
                    this.index++;
                    if (this.index >= this.questions.length) {
                        this.scene.start('EndScene', { playerName: this.playerName });
                    } else {
                        this.showQuestion();
                    }
                });
            }
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

    /* =====================
       CONFIG
    ===================== */
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
