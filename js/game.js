// ---------------------------
// Super-Bowl Jump'n'Run Game
// ---------------------------

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 450,
    physics: {
        default: 'arcade',
        arcade: { gravity: { y: 900 }, debug: false }
    },
    pixelArt: true,
    roundPixels: true,
    scene: [NameScene, CharacterScene, LevelScene, QuizScene, MiniCatchScene, EndScene]
};

let playerName = '';
let selectedCharacter = '';
let player;
let cursors;
let moveLeft = false;
let moveRight = false;
let currentQuestion = 0;
let questionsData = [];

const game = new Phaser.Game(config);

// ---------------------------
// Scene 1: Namenseingabe
// ---------------------------
class NameScene extends Phaser.Scene {
    constructor() { super({ key: 'NameScene' }); }
    preload() {}
    create() {
        const self = this;
        this.add.text(200, 150, 'Gib deinen Namen ein:', { font: '24px Arial', fill: '#fff' });
        let input = this.add.dom(400, 220, 'input', 'font-size:24px; width:200px; text-align:center');
        let btn = this.add.dom(400, 280, 'button', 'font-size:24px;', 'Start');
        btn.addListener('click');
        btn.on('click', function() {
            let value = input.node.value;
            if(value.length>0){ playerName = value; self.scene.start('CharacterScene'); }
        });
    }
}

// ---------------------------
// Scene 2: Charakterauswahl
// ---------------------------
class CharacterScene extends Phaser.Scene {
    constructor() { super({ key: 'CharacterScene' }); }
    preload() {
        this.load.image('char1', 'assets/sprites/player.png'); // Beispielcharakter
        this.load.image('char2', 'assets/sprites/player.png'); // Zweiter Farbton möglich
    }
    create() {
        const self = this;
        this.add.text(250, 50, 'Wähle deinen Charakter', { font: '24px Arial', fill: '#fff' });
        let c1 = this.add.image(250, 250, 'char1').setInteractive();
        let c2 = this.add.image(550, 250, 'char2').setInteractive();
        c1.on('pointerdown', ()=>{ selectedCharacter='char1'; self.scene.start('LevelScene'); });
        c2.on('pointerdown', ()=>{ selectedCharacter='char2'; self.scene.start('LevelScene'); });
    }
}

// ---------------------------
// Scene 3: Jump'n'Run Level
// ---------------------------
class LevelScene extends Phaser.Scene {
    constructor() { super({ key: 'LevelScene' }); }
    preload() {
        this.load.image('background','assets/sprites/background.png');
        this.load.image('tileset','assets/sprites/tileset.png');
        this.load.spritesheet('player','assets/sprites/player.png',{frameWidth:32, frameHeight:48});
        this.load.audio('bg','assets/audio/bg.mp3');
        this.load.audio('jump','assets/audio/jump.wav');
    }
    create() {
        this.add.image(400,225,'background');
        player = this.physics.add.sprite(100,300,'player');
        player.setCollideWorldBounds(true);

        cursors = this.input.keyboard.createCursorKeys();

        // Mobile Buttons
        let left = this.add.image(80,380,'btn_left').setScrollFactor(0).setInteractive().setAlpha(0.6);
        let right = this.add.image(160,380,'btn_right').setScrollFactor(0).setInteractive().setAlpha(0.6);
        let jumpBtn = this.add.image(720,380,'btn_jump').setScrollFactor(0).setInteractive().setAlpha(0.6);
        left.on('pointerdown',()=>moveLeft=true);
        left.on('pointerup',()=>moveLeft=false);
        right.on('pointerdown',()=>moveRight=true);
        right.on('pointerup',()=>moveRight=false);
        jumpBtn.on('pointerdown',()=>{
            if(player.body.touching.down){ player.setVelocityY(-500); this.sound.play('jump'); }
        });

        // Animation
        this.anims.create({ key:'run', frames:this.anims.generateFrameNumbers('player',{start:1,end:4}), frameRate:10, repeat:-1 });

        // Hintergrundmusik
        this.sound.add('bg',{loop:true, volume:0.4}).play();

        // Dummy Plattform (kann mit tileset erweitert werden)
        let ground = this.physics.add.staticGroup();
        ground.create(400,440,'tileset').setScale(8,1).refreshBody();
        this.physics.add.collider(player, ground);

        // Nach Levelende Quiz starten
        this.time.delayedCall(5000, ()=>{ this.scene.start('QuizScene'); },[],this);
    }
    update() {
        if(cursors.left.isDown || moveLeft){ player.setVelocityX(-200); player.anims.play('run',true); }
        else if(cursors.right.isDown || moveRight){ player.setVelocityX(200); player.anims.play('run',true); }
        else{ player.setVelocityX(0); player.anims.stop(); }

        if(cursors.up.isDown && player.body.touching.down){ player.setVelocityY(-500); this.sound.play('jump'); }
    }
}

// ---------------------------
// Scene 4: Quiz
// ---------------------------
class QuizScene extends Phaser.Scene {
    constructor(){ super({ key:'QuizScene' }); }
    preload(){ 
        this.load.json('questions','data/questions.json'); 
        this.load.audio('correct','assets/audio/correct.wav'); 
        this.load.audio('wrong','assets/audio/wrong.wav'); 
    }
    create(){
        questionsData = this.cache.json.get('questions');
        this.showQuestion();
    }
    showQuestion(){
        this.children.removeAll();
        if(currentQuestion >= questionsData.length){ this.scene.start('MiniCatchScene'); return; }
        let q = questionsData[currentQuestion];
        this.add.text(100,50,q.q,{font:'24px Arial',fill:'#fff'});
        for(let i=0;i<q.a.length;i++){
            let btn = this.add.text(100,120+i*50,q.a[i],{font:'20px Arial',fill:'#0f0'}).setInteractive();
            btn.on('pointerdown', ()=>{
                if(i===q.c){ this.sound.play('correct'); } else { this.sound.play('wrong'); }
                currentQuestion++; this.showQuestion();
            });
        }
    }
}

// ---------------------------
// Scene 5: Mini-Catch Game
// ---------------------------
class MiniCatchScene extends Phaser.Scene {
    constructor(){ super({ key:'MiniCatchScene' }); }
    preload(){
        this.load.image('football','assets/sprites/football.png');
    }
    create(){
        this.add.text(200,50,'Fange den Football!',{font:'24px Arial',fill:'#fff'});
        player.setPosition(400,380);
        this.physics.add.collider(player, this.physics.add.staticGroup()); // Dummy Collider

        let ball = this.physics.add.sprite(400,0,'football');
        ball.setVelocityY(100);
        this.physics.add.collider(ball, player, ()=>{ this.scene.start('EndScene'); });
    }
}

// ---------------------------
// Scene 6: Endscreen / Einladung
// ---------------------------
class EndScene extends Phaser.Scene {
    constructor(){ super({ key:'EndScene' }); }
    create(){
        this.add.text(150,200,'Glückwunsch '+playerName+'!\nDu bist fertig!',{font:'28px Arial',fill:'#fff'});
        this.add.text(120,300,'Einladung zur Super Bowl Party:\n8. Februar 2026',{font:'24px Arial',fill:'#ff0'});
    }
}
