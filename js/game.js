class TestScene extends Phaser.Scene {
    create() {
        this.add.text(100, 200, 'Phaser läuft!', {
            font: '32px Arial',
            fill: '#ffffff'
        });
    }
}

new Phaser.Game({
    type: Phaser.AUTO,
    width: 800,
    height: 450,
    scene: TestScene
});
