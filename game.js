
let game;
var score;
var scoreText;

// global game options
let gameOptions = {

    // platform speed range, in pixels per second
    platformSpeedRange: [300, 300],

    // spawn range, how far should be the rightmost platform from the right edge
    // before next platform spawns, in pixels
    spawnRange: [80, 200],

    // platform width range, in pixels
    platformSizeRange: [250, 460],

    // a height range between rightmost platform and next platform to be spawned
    platformHeightRange: [-5, 5],

    // a scale to be multiplied by platformHeightRange
    platformHeighScale: 20,

    // platform max and min height, as screen height ratio
    platformVerticalLimit: [0.3, 0.8],

    // player gravity
    playerGravity: 900,

    // player jump force
    jumpForce: 400,

    // player starting X position
    playerStartPosition: 200,

    // consecutive jumps allowed
    jumps: 2,

    // % of probability a chicken appears on the platform
    chickenPercent: 40
}

window.onload = function() {

    // object containing configuration options
    let gameConfig = {
        type: Phaser.AUTO,
        width: 1334,
        height: 750,
        scene: [preloadGame, playGame, endGame],
        backgroundColor: 0x0c88c7,

        // physics settings
        physics: {
            default: "arcade",
            arcade : {
                debug : false
            }
        }
    }
    game = new Phaser.Game(gameConfig);
    window.focus();
    resize();
    window.addEventListener("resize", resize, false);
}

// preloadGame scene
class preloadGame extends Phaser.Scene{
    constructor(){
        super("PreloadGame");
    }
    preload(){
        this.load.audio("shoot", "asset/shoot.mp3");
        this.load.audio("reload", "asset/reload.mp3");
        this.load.audio("chicken", "asset/chicken.mp3");
        this.load.image("start", "asset/start.png");    //852x480
        this.load.image("gameOver", "asset/gameover.png");
        this.load.image("platform", "asset/platform.png");
        this.load.image("background", "asset/background.png");

        // player is a sprite sheet made by 117x26 pixels
        this.load.spritesheet("player", "asset/player.png", {
            frameWidth: 117,
            frameHeight: 26
        });

        // the chicken is a sprite sheet made by 32x32 pixels
        this.load.spritesheet("wChicken", "asset/wChicken.png", {
            frameWidth: 32,
            frameHeight: 32
        });

        // Grey chicken
        this.load.spritesheet("gChicken", "asset/gChicken.png", {
            frameWidth: 32,
            frameHeight: 32
        });

        // Brown chicken
        this.load.spritesheet("bChicken", "asset/bChicken.png", {
            frameWidth: 32,
            frameHeight: 32
        });

        this.load.spritesheet("shoot", "asset/shoot.png", {
            frameWidth: 117,
            frameHeight: 26
        });

        this.load.spritesheet("bullet", "asset/bullet.png", {
            frameWidth: 117,
            frameHeight: 26
        });

        this.load.spritesheet("jump", "asset/wake.png", {
            frameWidth: 117,
            frameHeight: 26
        });
    }
    create(){

        // setting player animation
        this.anims.create({
            key: "run",
            frames: this.anims.generateFrameNumbers("player", {
                start: 0,
                end: 7
            }),
            frameRate: 8,
            repeat: -1
        });

        // setting shooting animation
        this.anims.create({
            key: "shoot",
            frames: this.anims.generateFrameNumbers("shoot", {
                start: 0,
                end: 3
            }),
            frameRate: 8,
            repeat: 0
        });

        // setting the bullet animation when shooting
        this.anims.create({
            key: "bullet",
            frames: this.anims.generateFrameNumbers("bullet", {
                start: 0,
                end: 3
            }),
            frameRate: 8,
            repeat: 0
        });

        // setting white chicken animation
        this.anims.create({
            key: "wChicken",
            frames: this.anims.generateFrameNumbers("wChicken", {
                start: 4,
                end: 7
            }),
            frameRate: 10,
            yoyo: true,
            repeat: -1
        });

        // setting grey chicken animation
        this.anims.create({
            key: "gChicken",
            frames: this.anims.generateFrameNumbers("gChicken", {
                start: 12,
                end: 15
            }),
            frameRate: 10,
            yoyo: true,
            repeat: -1
        });

        // setting brown chicken animation
        this.anims.create({
            key: "bChicken",
            frames: this.anims.generateFrameNumbers("bChicken", {
                start: 8,
                end: 11
            }),
            frameRate: 10,
            yoyo: true,
            repeat: -1
        });

        // setting jump animation
        this.anims.create({
            key: "jump",
            frames: this.anims.generateFrameNumbers("jump", {
                start: 0,
                end: 4
            }),
            frameRate: 6,
            yoyo: true,
            repeat: 0
        });

        this.add.image(650, 360, 'start').setScale(2, 2);
        //Instruction to jump
        this.rect1 = this.add.rectangle(40, 40, 50, 50, 0x640096);
        this.instruction = this.add.text(95, 28, 'Press to jump', { fontSize: '30px', fill: '#f0f' });

        //Instruction to shoot
        this.rect2 = this.add.rectangle(40, 100, 50, 50, 0x00c200);
        this.instruction = this.add.text(95, 78, 'Press to shoot', { fontSize: '30px', fill: '#0f0' });
    }

    update(){
        if(btn1 || btn2){
            this.scene.start("PlayGame");
        }
    }
}

// playGame scene
// noinspection DuplicatedCode
class playGame extends Phaser.Scene{
    constructor(){
        super("PlayGame");
    }
    create(){
        this.add.image(650, 350, "background").setScale(3, 3);
        /*====================================
        ===============Platform===============
        ====================================*/
        // keeping track of added platforms
        this.addedPlatforms = 0;

        // group with all active platforms.
        this.platformGroup = this.add.group({

            // once a platform is removed, it's added to the pool
            removeCallback: function(platform){
                platform.scene.platformPool.add(platform)
            }
        });

        // platform pool
        this.platformPool = this.add.group({

            // once a platform is removed from the pool, it's added to the active platforms group
            removeCallback: function(platform){
                platform.scene.platformGroup.add(platform)
            }
        });

        // adding a platform to the game, the arguments are platform width, x position and y position
        this.addPlatform(game.config.width, game.config.width / 2, game.config.height * gameOptions.platformVerticalLimit[1]);

        /*====================================
        ===============Chickens===============
        ====================================*/
        this.changeColChicken = 0;  //to alternate between white-brown-grey chickens
        this.chickenShooted = 0;    //to detect collision with bullet just one time
        // group with all active chickens.
        this.chickenGroup = this.add.group({

            // once a chicken is removed, it's added to the pool
            removeCallback: function(chicken){
                chicken.scene.chickenPool.add(chicken)
            }
        });

        // chicken pool
        this.chickenPool = this.add.group({

            // once a chicken is removed from the pool, it's added to the active chicken group
            removeCallback: function(chicken){
                chicken.scene.chickenGroup.add(chicken)
            }
        });

        /*====================================
        ================Player================
        ====================================*/
        // number of consecutive jumps made by the player so far
        this.playerJumps = 0;

        // adding the player;
        this.player = this.physics.add.sprite(gameOptions.playerStartPosition, game.config.height * 0.7, "player");
        this.player.setGravityY(gameOptions.playerGravity);
        this.player.setDisplaySize(234,52);
        this.player.setSize(32 , 26, false); //set hitbox size


        this.bullet = this.physics.add.sprite(gameOptions.playerStartPosition+100, game.config.height * 0.7, "bullet");
        this.bullet.setGravityY(gameOptions.playerGravity);
        this.bullet.setDisplaySize(234,52);
        this.bullet.setSize(53 , 26, false); //set hitbox size
        this.bullet.setActive(false).setVisible(false);

        //  The score
        score = 0;
        scoreText = this.add.text(16, 16, 'score: 0', { fontSize: '32px', fill: '#000' });

        /*====================================
        ==============Collision===============
        ====================================*/
        // setting collisions between the player and the platform group
        this.physics.add.collider(this.player, this.platformGroup, function(){

            // play "run" animation if the player is on a platform
            if(!this.player.anims.isPlaying){
                this.player.anims.play("run");
            }
        }, null, this);

        //setting collisions between the bullet and the platform group
        this.physics.add.collider(this.bullet, this.platformGroup);

        // setting collisions between the player and the chicken group
        this.physics.add.overlap(this.bullet, this.chickenGroup, function(player, chicken){
            if(this.bullet.active) {
                if (this.chickenShooted != chicken) {
                    this.chickenShooted = chicken;
                    this.soundChicken.play();
                    //  Add and update the score
                    score += 10;
                    scoreText.setText('Score: ' + score);
                    this.tweens.add({
                        targets: chicken,
                        y: chicken.y - 100,
                        alpha: 0,
                        duration: 800,
                        ease: "Cubic.easeOut",
                        callbackScope: this,
                        onComplete: function () {
                            this.chickenGroup.killAndHide(chicken);
                            this.chickenGroup.remove(chicken);
                        }
                    });
                }
            }
        }, null, this);

        /*====================================
        ================Input=================
        ====================================*/
        // checking for input
        this.input.on("pointerdown", this.jump, this);

        /*====================================
        ================Audio=================
        ====================================*/
        this.soundShoot = this.sound.add('shoot');
        this.soundReload = this.sound.add('reload');
        this.soundChicken = this.sound.add('chicken');
    }

    // the core of the script: platform are added from the pool or created on the fly
    addPlatform(platformWidth, posX, posY){
        this.addedPlatforms ++;
        let platform;
        if(this.platformPool.getLength()){
            platform = this.platformPool.getFirst();
            platform.x = posX;
            platform.y = posY;
            platform.active = true;
            platform.visible = true;
            this.platformPool.remove(platform);
            let newRatio =  platformWidth / platform.displayWidth;
            platform.displayWidth = platformWidth;
            platform.tileScaleX = 1 / platform.scaleX;
        }
        else{
            platform = this.add.tileSprite(posX, posY, platformWidth, 32, "platform");
            this.physics.add.existing(platform);
            platform.body.setImmovable(true);
            platform.body.setVelocityX(Phaser.Math.Between(gameOptions.platformSpeedRange[0], gameOptions.platformSpeedRange[1]) * -1);
            this.platformGroup.add(platform);
        }
        this.nextPlatformDistance = Phaser.Math.Between(gameOptions.spawnRange[0], gameOptions.spawnRange[1]);

        // is there a chicken over the platform?
        if(this.addedPlatforms > 1){
            if(Phaser.Math.Between(1, 100) <= gameOptions.chickenPercent){
                if(this.chickenPool.getLength()){
                    let chicken = this.chickenPool.getFirst();
                    chicken.x = posX;
                    chicken.y = posY - 32;
                    chicken.alpha = 1;
                    chicken.active = true;
                    chicken.visible = true;
                    this.chickenPool.remove(chicken);
                }
                else{
                    let chicken;
                    if(this.changeColChicken%3 == 0) {
                        chicken = this.physics.add.sprite(posX, posY - 32, "wChicken");
                        chicken.anims.play("wChicken");
                    }
                    else if(this.changeColChicken%3 == 1) {
                        chicken = this.physics.add.sprite(posX, posY - 32, "gChicken");
                        chicken.anims.play("gChicken");
                    }
                    else {
                        chicken = this.physics.add.sprite(posX, posY - 32, "bChicken");
                        chicken.anims.play("bChicken");
                    }
                    this.changeColChicken++;
                    chicken.setImmovable(true);
                    chicken.setVelocityX(platform.body.velocity.x);
                    this.chickenGroup.add(chicken);
                }
            }
        }
    }

    // the player jumps when on the ground, or once in the air as long as there are jumps left and the first jump was on the ground
    jump(){
        if(this.player.body.touching.down || (this.playerJumps > 0 && this.playerJumps < gameOptions.jumps)){
            if(this.player.body.touching.down){
                this.playerJumps = 0;
            }
            this.player.setVelocityY(gameOptions.jumpForce * -1);
            this.bullet.setVelocityY(gameOptions.jumpForce * -1); //the bullet follow the player
            this.playerJumps ++;

            this.player.anims.play("jump");
            // stops animation
            //this.player.anims.stop();
        }
    }

    attack(){
        this.bullet.setActive(true).setVisible(true);
        this.soundShoot.play();
        this.player.anims.play("shoot");
        this.bullet.anims.play("bullet");
        this.player.once('animationcomplete', function(){ //this refers to an arcade sprite.
            this.player.anims.play("run");
            this.bullet.setActive(false).setVisible(false);
            this.soundReload.play();
        }, this);
    }

    update(){
        // game over
        if(this.player.y > game.config.height){
            this.scene.start("EndGame");
        }

        //Be sure that the player is at his position so is the bullet
        this.player.x = gameOptions.playerStartPosition;
        this.bullet.x = this.player.x;
        this.bullet.y = this.player.y;

        // recycling platforms
        let minDistance = game.config.width;
        let rightmostPlatformHeight = 0;
        this.platformGroup.getChildren().forEach(function(platform){
            let platformDistance = game.config.width - platform.x - platform.displayWidth / 2;
            if(platformDistance < minDistance){
                minDistance = platformDistance;
                rightmostPlatformHeight = platform.y;
            }
            if(platform.x < - platform.displayWidth / 2){
                this.platformGroup.killAndHide(platform);
                this.platformGroup.remove(platform);
            }
        }, this);

        // recycling coins
        this.chickenGroup.getChildren().forEach(function(chicken){
            if(chicken.x < - chicken.displayWidth / 2){
                this.chickenGroup.killAndHide(chicken);
                this.chickenGroup.remove(chicken);
            }
        }, this);

        // adding new platforms
        if(minDistance > this.nextPlatformDistance){
            let nextPlatformWidth = Phaser.Math.Between(gameOptions.platformSizeRange[0], gameOptions.platformSizeRange[1]);
            let platformRandomHeight = gameOptions.platformHeighScale * Phaser.Math.Between(gameOptions.platformHeightRange[0], gameOptions.platformHeightRange[1]);
            let nextPlatformGap = rightmostPlatformHeight + platformRandomHeight;
            let minPlatformHeight = game.config.height * gameOptions.platformVerticalLimit[0];
            let maxPlatformHeight = game.config.height * gameOptions.platformVerticalLimit[1];
            let nextPlatformHeight = Phaser.Math.Clamp(nextPlatformGap, minPlatformHeight, maxPlatformHeight);
            this.addPlatform(nextPlatformWidth, game.config.width + nextPlatformWidth / 2, nextPlatformHeight);
        }

        if(btn1){
            if(!this.waitRelease) {
                this.waitRelease = true;
                this.jump();
            }
        }
        else {
            this.waitRelease = false;
        }

        if(btn2){
            if(!this.reloading) {
                this.reloading = true;
                this.attack();
            }
        }
        else {
            this.reloading = false;
        }
    }
}

class endGame extends Phaser.Scene{
    constructor(){
        super("EndGame");
    }

    create() {
        this.cameras.main.setBackgroundColor('#dddddd');
        this.add.image(620, 280, 'gameOver');
        scoreText = this.add.text(400, 550, 'Your score: '+score, { fontSize: '64px', fill: '#000' });
        //scoreText.setText('Score: ' + score);
    }

    update() {
        if(btn1 || btn2){
            this.scene.start("PlayGame");
        }
    }
}

function resize(){
    let canvas = document.querySelector("canvas");
    let windowWidth = window.innerWidth;
    let windowHeight = window.innerHeight;
    let windowRatio = windowWidth / windowHeight;
    let gameRatio = game.config.width / game.config.height;
    if(windowRatio < gameRatio){
        canvas.style.width = windowWidth + "px";
        canvas.style.height = (windowWidth / gameRatio) + "px";
    }
    else{
        canvas.style.width = (windowHeight * gameRatio) + "px";
        canvas.style.height = windowHeight + "px";
    }
}
