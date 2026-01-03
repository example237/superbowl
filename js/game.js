window.addEventListener('load', function () {

    console.log("game.js geladen"); // Test, dass JS geladen wird

    class GameScene extends Phaser.Scene {
        constructor() { super('GameScene'); }
        preload() {
            // Assets
            this.load.image('background', 'assets/sprites/background.png');
            this.load.image('player', 'assets/sprites/player.png');
            this.load.image('platform', 'assets/sprites/platform.png');
        }
        create() {
            const worldWidth = 2000;
            const worldHeight = 450;

            // Welt & Kamera
            this.physics.world.setBounds(0, 0, worldWidth, worldHeight);
            this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);

            // Hintergrund
            this.bg = this.add.tileSprite(400, 225, 800, 450, 'background');
            this.bg.setScrollFactor(0);

            // Spieler
            this.player = this.physics.add.sprite(100, 350, 'player').setCollideWorldBounds(true);
            this.player.body.setSize(32, 48);
            this.player.body.setBounce(0);

            // Kamera folgt Spieler
            this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

            // Plattformen
            const platforms = this.physics.add.staticGroup();
            // Durchgehender Boden
            platforms.create(worldWidth/2, 425, 'platform').setScale(worldWidth / 400, 1).refreshBody();

            this.physics.add.collider(this.player, platforms);

            // Cursor Steuerung
            this.cursors = this.input.keyboard.createCursorKeys();

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
                        this.player.setVelocityY(-400); 
                    }
                });
            }
        }
        update() {
            // Links/Rechts
            if (this.cursors.left.isDown) this.player.setVelocityX(-200);
            else if (this.cursors.right.isDown) this.player.setVelocityX(200);
            else this.player.setVelocityX(0);

            // Sprung
            if (this.cursors.up.isDown && this.player.body.blocked.down) {
                this.player.setVelocityY(-400);
            }
        }
    }

    const config = {
        type: Phaser.AUTO,
        width: 800,
        height: 450,
        parent: 'game-container',
        backgroundColor: '#87CEEB',
        physics: { default: 'arcade', arcade: { gravity: { y: 900 } } },
        scene: [GameScene]
    };

    new Phaser.Game(config);

});
