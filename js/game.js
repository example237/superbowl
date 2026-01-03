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
        // ---- Weltgröße festlegen ----
        this.physics.world.setBounds(0, 0, 2000, 450);
        this.cameras.main.setBounds(0, 0, 2000, 450);

        // Hintergrund als TileSprite, scrollt nicht mit Kamera
        this.bg = this.add.tileSprite(400, 225, 800, 450, 'background');
        this.bg.setScrollFactor(0);

        // Spieler
        this.player = this.physics.add.sprite(100, 350, 'player').setCollideWorldBounds(true);
        this.player.body.setSize(32, 48);
        this.player.body.setBounce(0);

        // Kamera folgt Spieler
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

        // Musik
        this.bgMusic = this.sound.add('bg', { loop: true, volume: 0.5 });
        this.bgMusic.play();

        // Plattformen
        const platforms = this.physics.add.staticGroup();
        platforms.create(400, 400, 'platform').setScale(2).refreshBody();
        platforms.create(800, 350, 'platform').refreshBody();
        platforms.create(1200, 300, 'platform').refreshBody();
        platforms.create(1600, 250, 'platform').refreshBody();
        platforms.create(1900, 350, 'platform').refreshBody(); // Zielplattform

        this.physics.add.collider(this.player, platforms);

        // Cursor Steuerung Desktop
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
                    this.sound.play('jump'); 
                }
            });
        }
    }
    update() {
        // Links/Rechts
        if (this.cursors.left.isDown) this.player.setVelocityX(-200);
        else if (this.cursors.right.isDown) this.player.setVelocityX(200);
        else this.player.setVelocityX(0);

        // Sprung auf PC
        if (this.cursors.up.isDown && this.player.body.blocked.down) {
            this.player.setVelocityY(-400);
            this.sound.play('jump');
        }

        // Prüfen, ob Spieler das rechte Ende erreicht hat → Quiz starten
        if (this.player.x >= 1900) { 
            this.scene.start('QuizScene', { playerName: this.playerName });
        }
    }
}
