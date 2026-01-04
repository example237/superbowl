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
            this.load.image('football', 'assets/sprites/ball.png');
            this.load.image('btn_left', 'assets/sprites/btn_left.png');
            this.load.image('btn_right', 'assets/sprites/btn_right.png');
            this.load.image('btn_jump', 'assets/sprites/btn_jump.png');
        }

        create() {
            const worldWidth = 5000;

            this.physics.world.setBounds(0, 0, worldWidth, 450);
            this.cameras.main.setBounds(0, 0, worldWidth, 450);
            this.add.rectangle(worldWidth / 2, 225, worldWidth, 450, 0x87CEEB);

            /* Plattformen */
            this.platforms = this.physics.add.staticGroup();
            const platformsData = [
                { x: 150, y: 300, scale: 1.5 }, { x: 350, y: 250, scale: 1.2 },
                { x: 550, y: 200, scale: 1.0 }, { x: 750, y: 250, scale: 1.2 },
                { x: 950, y: 200, scale: 1.0 }, { x: 1150, y: 250, scale: 1.2 },
                { x: 1350, y: 200, scale: 1.0 }, { x: 1550, y: 250, scale: 1.3 },
                { x: 1750, y: 200, scale: 1.0 }, { x: 1950, y: 250, scale: 1.3 },
                { x: 2150, y: 200, scale: 1.0 }, { x: 2350, y: 250, scale: 1.3 },
                { x: 2550, y: 200, scale: 1.0 }, { x: 2750, y: 250, scale: 1.3 },
                { x: 2950, y: 200, scale: 1.0 }, { x: 3200, y: 250, scale: 1.3 },
                { x: 3500, y: 220, scale: 1.0 }, { x: 3800, y: 250, scale: 1.2 },
                { x: 4100, y: 220, scale: 1.0 }, { x: 4400, y: 250, scale: 1.3 },
                { x: 4700, y: 220, scale: 1.0 }
            ];

            platformsData.forEach(p => {
                this.platforms.create(p.x, p.y, 'platform')
                    .setScale(p.scale, 1)
                    .refreshBody();
            });

            /* Spieler */
            const start = platformsData[0];
            this.player = this.physics.add.sprite(start.x, start.y - 50, 'player');
            this.player.setGravityY(900);
            this.canDoubleJump = true;

            this.physics.add.collider(this.player, this.platforms, () => {
                this.canDoubleJump = true;
            });

            this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
            this.cursors = this.input.keyboard.createCursorKeys();

            /* Footballs */
            this.footballs = this.physics.add.group();
            this.footballCount = 0;

            const footballsData = [
                { x: 250, y: 180 }, { x: 500, y: 160 }, { x: 800, y: 200 },
                { x: 1100, y: 180 }, { x: 1500, y: 160 }, { x: 1900, y: 200 },
                { x: 2300, y: 180 }, { x: 2700, y: 160 },
                { x: 3200, y: 180 }, { x: 3800, y: 200 }, { x: 4400, y: 180 }
            ];

            this.footballsData = footballsData.map(f => {
                const ball = this.footballs.create(f.x, f.y, 'football')
                    .setScale(0.25);
                ball.body.setAllowGravity(false);
                ball.baseY = f.y;
                ball.phase = Math.random() * Math.PI * 2;
                return ball;
            });

            this.physics.add.overlap(this.player, this.footballs, (_, ball) => {
                ball.destroy();
                this.footballCount++;
                this.footballText.setText('Football: ' + this.footballCount);
                if (navigator.vibrate) navigator.vibrate(40);
            });

            this.footballText = this.add.text(10, 10, 'Football: 0', {
                font: '24px Arial',
                fill: '#ffffff'
            }).setScrollFactor(0);

            /* =====================
               MOBILE BUTTONS (GROSS)
            ===================== */
            const isMobile = this.sys.game.device.os.android || this.sys.game.device.os.iOS;
            if (isMobile) {
                const w = this.scale.width;
                const h = this.scale.height;

                this.leftBtn = this.add.image(120, h - 90, 'btn_left')
                    .setScale(0.9).setScrollFactor(0).setInteractive();

                this.rightBtn = this.add.image(260, h - 90, 'btn_right')
                    .setScale(0.9).setScrollFactor(0).setInteractive();

                this.jumpBtn = this.add.image(w - 120, h - 90, 'btn_jump')
                    .setScale(1.0).setScrollFactor(0).setInteractive();

                this.leftBtn.on('pointerdown', () => this.player.setVelocityX(-220));
                this.rightBtn.on('pointerdown', () => this.player.setVelocityX(220));

                [this.leftBtn, this.rightBtn].forEach(b => {
                    b.on('pointerup', () => this.player.setVelocityX(0));
                    b.on('pointerout', () => this.player.setVelocityX(0));
                });

                this.jumpBtn.on('pointerdown', () => {
                    if (this.player.body.blocked.down) {
                        this.player.setVelocityY(-550);
                        this.canDoubleJump = true;
                    } else if (this.canDoubleJump) {
                        this.player.setVelocityY(-800);
                        this.canDoubleJump = false;
                    }
                    if (navigator.vibrate) navigator.vibrate(30);
                });
            }
        }

        update(time) {
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

            this.footballs.children.iterate(b => {
                b.y = b.baseY + Math.sin(time / 500 + b.phase) * 10;
            });

            if (this.player.y > 450) {
                this.scene.start('NameScene');
            }
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
        scale: {
            mode: Phaser.Scale.FIT,
            autoCenter: Phaser.Scale.CENTER_BOTH
        },
        scene: [NameScene, GameScene]
    });

});
