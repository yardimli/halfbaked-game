class characterPool {
	constructor(canvas, config = {}) {
	    this.canvas = canvas;
		this.ctx = canvas.getContext('2d');
		this.video = {};
		this.supportAnime = [
            {name: 'frontStand', totalFrame: 4},
            {name: 'frontWalk', totalFrame: 2},
            {name: 'backStand', totalFrame: 4},
            {name: 'backWalk', totalFrame: 2},
            {name: 'leftStand', totalFrame: 2},
            {name: 'leftWalk', totalFrame: 2},
            {name: 'rightStand', totalFrame: 2},
            {name: 'rightWalk', totalFrame: 2},

            {name: 'frontStand_Watermelon', totalFrame: 4},
            {name: 'frontWalk_Watermelon', totalFrame: 2},
            {name: 'backStand_Watermelon', totalFrame: 4},
            {name: 'backWalk_Watermelon', totalFrame: 2},
            {name: 'leftStand_Watermelon', totalFrame: 2},
            {name: 'leftWalk_Watermelon', totalFrame: 2},
            {name: 'rightStand_Watermelon', totalFrame: 2},
            {name: 'rightWalk_Watermelon', totalFrame: 2},

            {name: 'frontStand_GreenApple', totalFrame: 4},
            {name: 'frontWalk_GreenApple', totalFrame: 2},
            {name: 'backStand_GreenApple', totalFrame: 4},
            {name: 'backWalk_GreenApple', totalFrame: 2},
            {name: 'leftStand_GreenApple', totalFrame: 2},
            {name: 'leftWalk_GreenApple', totalFrame: 2},
            {name: 'rightStand_GreenApple', totalFrame: 2},
            {name: 'rightWalk_GreenApple', totalFrame: 2},

            {name: 'frontStand_EmptyCup', totalFrame: 4},
            {name: 'frontWalk_EmptyCup', totalFrame: 2},
            {name: 'backStand_EmptyCup', totalFrame: 4},
            {name: 'backWalk_EmptyCup', totalFrame: 2},
            {name: 'leftStand_EmptyCup', totalFrame: 2},
            {name: 'leftWalk_EmptyCup', totalFrame: 2},
            {name: 'rightStand_EmptyCup', totalFrame: 2},
            {name: 'rightWalk_EmptyCup', totalFrame: 2}
        ];

		this.characterId = config.hasOwnProperty('characterId') ? config.characterId : 0 ;
        this.animation = config.hasOwnProperty('animation') ? config.animation : 'frontStand';
        this.character = this.buildCharacter();

        this.curtFrame = 0;
        this.animationTimer = null;

        this.loadedImages = [];
        this.totalNeedImages = 0;
        this.isAnimeReady = false;

        this.initiate();

		return this;
	}

	initiate(){

	    this.video = {};
	    this.loadedImages = [];
        this.curtFrame = 0;
	    this.totalNeedImages = 0;
        this.isAnimeReady = false;

	    // Calculate Total Images Needed -------------------------
        for(var a=0; a<this.supportAnime.length; a++){
            var totalFrame = this.supportAnime[a].totalFrame;
            for(var f=0; f<totalFrame; f++){
                var parts = this.character.parts;
                for(var p=0; p<parts.length; p++){
                    this.totalNeedImages ++ ;
                }
            }
        }

        // Start Loading Images -----------------------------------
        for(var a=0; a<this.supportAnime.length; a++){

            var anime = this.supportAnime[a].name;
            var totalFrame = this.supportAnime[a].totalFrame;
            var animationFrame = [];

            for(var f=0; f<totalFrame; f++){
                var images = [];
                this.character.parts.forEach(function(part) {

                    if(part.style > 0){

                        var img = new Image();

                        img.src = 'CharacterPool/images/' + part.name + 'Set' + part.style + '/' + part.name + part.style + '_' + anime + '_' + (f+1) + '.png';
                        img.characterPool = this;
                        img.characterPart = part;

                        // Check if all images are loaded ------------------------
                        img.onload = function (e) {

                            var characterPool = e.path[0].characterPool;
                            characterPool.loadedImages.push(e.path[0].src);

                            if(characterPool.loadedImages.length === characterPool.totalNeedImages){

                                console.log('All images loaded');

                                // All images are loaded, draw the character -------------------
                                characterPool.isAnimeReady = true;
                                characterPool.drawCharacter();
                            }

                        }

                        images.push(img);

                    }

                }, this);
                images.sort(function(a, b){return a.characterObj.part.zIndex-b.characterObj.part.zIndex});
                animationFrame.push(images);
            }

            this.video[anime] = animationFrame;
        }

    }

	setAnimation(value) {
	    this.animation = value;
	    this.curtFrame = 0;
    }

	drawCharacter() {

        console.log('Draw Character Animation Frame');

        this.animationTimer = window.setInterval(function(characterPool){

            if(characterPool.isAnimeReady){

                characterPool.ctx.clearRect(0, 0, characterPool.character.width, characterPool.character.height);

                var curtFrame = characterPool.curtFrame;
                var animationFrames = characterPool.video[characterPool.animation];

                animationFrames[curtFrame].forEach(function (img) {

                    var part = img.characterPart;
                    var characterW = characterPool.character.width;
                    var characterH = characterPool.character.height;

                    if(this.characterId >= 1 && this.characterId <= 6){
                        if (part.name === 'body') {
                            if(part.style !== 0){
                                characterPool.ctx.drawImage(img, 0, 0, characterW, characterH);
                            }
                        }
                    }

                }, characterPool);

                main_player_Texture.needsUpdate = true;

                if(characterPool.curtFrame === animationFrames.length-1){
                    characterPool.curtFrame = 0 ;
                }else {
                    characterPool.curtFrame ++ ;
                }

            }

        }, 200, this);

	}

    buildCharacter() {

        var Character = {
            characterId: this.characterId,
            width: this.canvas.width,
            height: this.canvas.height,
            animation: this.animation,
            parts: [
                {
                    name: 'body',
                    style: this.characterId,
                    zIndex: 0
                }
            ]
        };

        return Character;
    }

    changeCharacter(characterId){

	    this.characterId = characterId;
	    this.stopAnimation();
        this.character = this.buildCharacter();
        this.initiate();

    }

    stopAnimation () {
	    window.clearInterval(this.animationTimer);
    }

};
