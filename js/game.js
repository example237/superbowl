window.addEventListener('load', function () {

class NameScene extends Phaser.Scene {
    constructor() { super('NameScene'); }

    create(data) {
        this.playerName = data?.playerName || null;

        this.add.rectangle(400, 225, 800, 450, 0x1E3A8A);
        this.add.text(220, 80, 'Gib deinen Namen ein:', { font: '28px Arial', fill: '#fff' });

        const input = this.add.dom(400, 170, 'input',
            'width:300px;height:45px;font-size:20px;text-align:center;');

        if (this.playerName) input.node.value = this.playerName;

        const btn = this.add.dom(400, 240, 'button',
            'width:180px;height:60px;font-size:22px;', 'Start');

        btn.addListener('click');
        btn.on('click', () => {
            this.scene.start('GameScene', { playerName: input.node.value || 'Spieler' });
        });
    }
}

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
    }

    create() {
        const worldWidth = 5000;

        this.physics.world.setBounds(0, 0, worldWidth, 450);
        this.cameras.main.setBounds(0, 0, worldWidth, 450);
        this.add.rectangle(worldWidth / 2, 225, worldWidth, 450, 0x87CEEB);

        /* Plattformen */
        this.platforms = this.physics.add.staticGroup();
        const platformsData = [
            { x: 150, y: 300 }, { x: 320, y: 260 }, { x: 490, y: 220 },
            { x: 660, y: 250 }, { x: 830, y: 210 }, { x: 1000, y: 250 },
            { x: 1170, y: 220 }, { x: 1340, y: 250 }, { x: 1510, y: 220 },
            { x: 1680, y: 250 }, { x: 1850, y: 220 }, { x: 2020, y: 250 },
            { x: 2190, y: 220 }, { x: 2360, y: 250 }, { x: 2530, y: 220 },
            { x: 2700, y: 250 }, { x: 2870, y: 220 }, { x: 3040, y: 250 },
            { x: 3210, y: 220 }, { x: 3380, y: 250 }, { x: 3550, y: 220 },
            { x: 3720, y: 250 }, { x: 3890, y: 220 }, { x: 4060, y: 250 }
        ];

        platformsData.forEach(p => this.platforms.create(p.x, p.y, 'platform'));

        this.goalPlatform = this.platforms.create(4700, 220, 'platform')
            .setScale(1.8, 1.2).refreshBody().setTint(0xffd700);

        this.add.text(4700, 150, 'ZIEL', {
            font: '24px Arial', fill: '#ffd700', stroke: '#000', strokeThickness: 4
        }).setOrigin(0.5);

        /* Spieler */
        const start = platformsData[0];
        this.player = this.physics.add.sprite(start.x, start.y - 50, 'player');
        this.player.setGravityY(900);

        this.physics.add.collider(this.player, this.platforms, () => {
            this.canDoubleJump = true;
        });

        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
        this.cursors = this.input.keyboard.createCursorKeys();

        /* Flags für Mobile */
        this.moveLeft = false;
        this.moveRight = false;
        this.canDoubleJump = true;

        /* Footballs */
        this.footballs = this.physics.add.group();
        this.footballCount = 0;

        const footballsData = [
            { x: 250, y: 180 }, { x: 500, y: 160 }, { x: 800, y: 200 },
            { x: 1100, y: 180 }, { x: 1500, y: 160 }, { x: 1900, y: 200 },
            { x: 2300, y: 180 }, { x: 2700, y: 160 }, { x: 3200, y: 180 },
            { x: 3800, y: 200 }, { x: 4400, y: 180 }
        ];

        this.footballTotal = footballsData.length;

        footballsData.forEach(f => {
            const ball = this.footballs.create(f.x, f.y, 'football')
                .setScale(0.25);
            ball.body.setAllowGravity(false);
            ball.baseY = f.y;
            ball.offset = Math.random() * Math.PI * 2;
        });

        this.physics.add.overlap(this.player, this.footballs, (p, b) => {
            b.destroy();
            this.footballCount++;
            this.footballText.setText('Football: ' + this.footballCount);
        });

        this.footballText = this.add.text(10, 10, 'Football: 0',
            { font: '24px Arial', fill: '#fff' }).setScrollFactor(0);

        /* Musik */
        this.bgm = this.sound.add('bgm', { loop: true, volume: 0.4 });
        this.bgm.play();

        /* Mobile Buttons */
        const isMobile = this.sys.game.device.os.android || this.sys.game.device.os.iOS;
        if (isMobile) {
            this.leftBtn = this.add.image(120, 360, 'btn_left')
                .setInteractive().setScrollFactor(0).setScale(1.8);
            this.rightBtn = this.add.image(260, 360, 'btn_right')
                .setInteractive().setScrollFactor(0).setScale(1.8);
            this.jumpBtn = this.add.image(680, 360, 'btn_jump')
                .setInteractive().setScrollFactor(0).setScale(1.8);

            this.leftBtn.on('pointerdown', () => this.moveLeft = true);
            this.leftBtn.on('pointerup', () => this.moveLeft = false);
            this.leftBtn.on('pointerout', () => this.moveLeft = false);

            this.rightBtn.on('pointerdown', () => this.moveRight = true);
            this.rightBtn.on('pointerup', () => this.moveRight = false);
            this.rightBtn.on('pointerout', () => this.moveRight = false);

            this.jumpBtn.on('pointerdown', () => this.doJump());
        }
    }

    doJump() {
        if (this.player.body.blocked.down) {
            this.player.setVelocityY(-550);
            this.canDoubleJump = true;
        } else if (this.canDoubleJump) {
            this.player.setVelocityY(-800);
            this.canDoubleJump = false;
        }
        if (navigator.vibrate) navigator.vibrate(40);
    }

    update(time) {
        /* Einheitliche Steuerung */
        let vx = 0;
        if (this.cursors.left.isDown || this.moveLeft) vx = -220;
        if (this.cursors.right.isDown || this.moveRight) vx = 220;
        this.player.setVelocityX(vx);

        if (Phaser.Input.Keyboard.JustDown(this.cursors.up)) {
            this.doJump();
        }

        if (this.player.y > 450) {
            this.scene.restart({ playerName: this.playerName });
        }

        this.footballs.children.iterate(b => {
            b.y = b.baseY + Math.sin(time / 500 + b.offset) * 10;
        });

        if (this.player.x > 4600 && this.footballCount === this.footballTotal) {
            this.bgm.stop();
            this.scene.start('QuizScene', { playerName: this.playerName });
        }
    }
}

/* QUIZ + END bleiben unverändert */

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
