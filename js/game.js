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
            this.load.image('player1', 'assets/sprites/player1.png');
            this.load.image('platform', 'assets/sprites/platform.png');
            this.load.image('football', 'assets/sprites/ball.png');
            this.load.image('background', 'assets/sprites/background.png');

            this.load.image('btn_left', 'assets/sprites/btn_left.png');
            this.load.image('btn_right', 'assets/sprites/btn_right.png');
            this.load.image('btn_jump', 'assets/sprites/btn_jump.png');

            this.load.audio('bgm', 'assets/audio/bg2.mp3');
        }

        create() {
            const worldWidth = 5000;

            this.physics.world.setBounds(0, 0, worldWidth, 450);
            this.cameras.main.setBounds(0, 0, worldWidth, 450);

            /* ---------- Hintergrund ---------- */
            this.bg = this.add.tileSprite(
                worldWidth / 2,
                225,
                worldWidth,
                450,
                'background'
            );

            /* ---------- Plattformen ---------- */
            this.platforms = this.physics.add.staticGroup();
            const platforms = [
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

            platforms.forEach(p => {
                this.platforms.create(p.x, p.y, 'platform').refreshBody();
            });

            this.goalPlatform = this.platforms.create(4600, 220, 'platform')
                .setTint(0xffd700)
                .refreshBody();

            this.goalText = this.add.text(4600, 150, 'ZIEL', {
                font: '28px Arial',
                fill: '#ffd700',
                stroke: '#000',
                strokeThickness: 4
            }).setOrigin(0.5);

            /* ---------- Spieler (player1 + Auto-Scale) ---------- */
            this.player = this.physics.add.sprite(150, 250, 'player1');
            this.player.setGravityY(900);
            this.player.setBounce(0);

            // sinnvolle automatische Skalierung
            const platformHeight = this.textures.get('platform').getSourceImage().height;
            const playerHeight = this.textures.get('player1').getSourceImage().height;
            const scale = (platformHeight * 0.7) / playerHeight;

            this.player.setScale(scale);
            this.player.body.setSize(
                this.player.width * scale,
                this.player.height * scale,
                true
            );

            this.canDoubleJump = true;
            this.reachedGoal = false;

            this.physics.add.collider(this.player, this.platforms, (player, platform) => {
                this.canDoubleJump = true;

                if (!this.leftPressed && !this.rightPressed) {
                    this.player.setVelocityX(0);
                }

                if (platform === this.goalPlatform && !this.reachedGoal) {
                    if (this.footballCount === this.totalFootballs) {
                        this.reachedGoal = true;
                        this.bgm.stop();
                        this.scene.start('QuizScene', { playerName: this.playerName });
                    }
                }
            });

            this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
            this.cursors = this.input.keyboard.createCursorKeys();

            /* ---------- Footballs ---------- */
            this.footballs = this.physics.add.group();
            this.footballCount = 0;

            const footballData = [
                { x: 250, y: 180 }, { x: 800, y: 200 },
                { x: 1500, y: 160 }, { x: 2300, y: 180 },
                { x: 3200, y: 180 }, { x: 4400, y: 180 }
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

            /* ---------- Mobile Buttons ---------- */
            const isMobile = this.sys.game.device.os.android || this.sys.game.device.os.iOS || window.innerWidth <= 768;

            if (isMobile) {
                this.leftPressed = false;
                this.rightPressed = false;

                this.leftBtn = this.add.image(100, 370, 'btn_left').setInteractive().setScrollFactor(0).setScale(1.6);
                this.rightBtn = this.add.image(240, 370, 'btn_right').setInteractive().setScrollFactor(0).setScale(1.6);
                this.jumpBtn = this.add.image(680, 370, 'btn_jump').setInteractive().setScrollFactor(0).setScale(1.6);

                this.leftBtn.on('pointerdown', () => { this.leftPressed = true; });
                this.leftBtn.on('pointerup', () => { this.leftPressed = false; });

                this.rightBtn.on('pointerdown', () => { this.rightPressed = true; });
                this.rightBtn.on('pointerup', () => { this.rightPressed = false; });

                this.jumpBtn.on('pointerdown', () => {
                    if (this.player.body.blocked.down) {
                        this.player.setVelocityY(-550);
                        this.canDoubleJump = true;
                    } else if (this.canDoubleJump) {
                        this.player.setVelocityY(-800);
                        this.canDoubleJump = false;
                    }
                });
            }
        }

        update(time) {
            const isMobile = this.sys.game.device.os.android || this.sys.game.device.os.iOS || window.innerWidth <= 768;

            if (!isMobile) {
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
            } else {
                if (this.leftPressed) this.player.setVelocityX(-220);
                else if (this.rightPressed) this.player.setVelocityX(220);
                else if (this.player.body.blocked.down) this.player.setVelocityX(0);
            }

            if (this.player.y > 450) {
                this.scene.restart({ playerName: this.playerName });
            }

            this.footballs.children.iterate(ball => {
                ball.y = ball.baseY + Math.sin(time / 500 + ball.phase) * 12;
            });
        }
    }

    /* =====================
       QUIZ & END bleiben unverändert
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
