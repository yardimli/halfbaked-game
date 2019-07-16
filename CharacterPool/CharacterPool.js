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
            {name: 'leftStand', totalFrame: 3},
            {name: 'leftWalk', totalFrame: 2},
            {name: 'rightStand', totalFrame: 3},
            {name: 'rightWalk', totalFrame: 2}
        ];

		this.gender = config.hasOwnProperty('gender') ? config.gender : 1 // 0 is girl, 1 is boy .
        this.animation = config.hasOwnProperty('animation') ? config.animation : 'frontStand';
        this.character = this.buildCharacter();

		this.animationTimer = null;
        this.isAllImageLoaded = false;
        this.checkImgLoadedTimer = null;
        this.curtFrame = 0;

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
                        img.characterObj = {
                            part: part,
                            isLoad: img.complete,
                            imageKey: images.length,
                            anime: anime,
                            frameKey: f
                        }

                        img.onload = function (e) {
                            var characterObj = e.path[0].characterObj;
                            var anime = characterObj.anime;
                            var frameKey = characterObj.frameKey;
                            var imageKey = characterObj.imageKey;
                            e.path[0].characterPool.video[anime][frameKey][imageKey].characterObj.isLoad = true;
                        }

                        images.push(img);

                    }

                }, this);
                images.sort(function(a, b){return a.characterObj.part.zIndex-b.characterObj.part.zIndex});
                animationFrame.push(images);
            }

            this.video[anime] = animationFrame;
        }

		this.checkImgLoadedTimer = window.setInterval(function(characterPool){
			var isAllLoaded = true;

			for (var anime in characterPool.video){
                for(var f=0; i<characterPool.video[anime].length; f++){
                    for(var i=0; i<characterPool.video[anime][f].length; i++){
                        if(!characterPool.video[anime][f][i].characterObj.isLoad) {
                            isAllLoaded = false;
                            break;
                        }
                    }
                }

            }

			if(isAllLoaded){
				console.log('All images loaded: ' + isAllLoaded);
                console.log(characterPool.video);
                characterPool.isAllImageLoaded = true;
                window.clearInterval(characterPool.checkImgLoadedTimer);
				characterPool.drawCharacter();
			}
		}, 1, this);

		return this;
	}

	setAnimation(value) {
	    this.animation = value;
	    this.curtFrame = 0;
    }

	drawCharacter() {
	    console.log('Draw Characters');
		this.animationTimer = window.setInterval(function(characterPool){

		    characterPool.ctx.clearRect(0, 0, characterPool.character.width, characterPool.character.height);

            var curtFrame = characterPool.curtFrame;
            var animationFrames = characterPool.video[characterPool.animation];

            animationFrames[curtFrame].forEach(function (img) {

                var part = img.characterObj.part;
                var characterW = characterPool.character.width;
                var characterH = characterPool.character.height;

                if (part.name === 'head') {
                    if(part.style !== 0){
                        characterPool.ctx.drawImage(img, 0, 0, characterW, characterH*0.525);
                    }
                }

                if (part.name === 'body') {
                    if(part.style !== 0){
                        characterPool.ctx.drawImage(img, characterW*0.1, characterH*0.495, characterW*0.8, characterH*0.5);
                    }
                }

            }, characterPool);

            if(characterPool.curtFrame === animationFrames.length-1){
                characterPool.curtFrame = 0 ;
            }else {
                characterPool.curtFrame ++ ;
            }

        }, 200, this);

	}

    buildCharacter() {

        var Character = {
            gender: this.gender,
            width: this.canvas.width,
            height: this.canvas.height,
            animation: this.animation,
            parts: [
                {
                    name: 'head',
                    style: 1,
                    zIndex: 1
                },
                {
                    name: 'body',
                    style: 1,
                    zIndex: 0
                }
            ]
        };

        return Character;
    }

    stopAnimation () {
	    window.clearInterval(this.animationTimer);
    }

};
