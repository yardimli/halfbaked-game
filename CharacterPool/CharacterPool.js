class characterPool {
	constructor(canvas, character, config = {}) {
	    this.canvas = canvas;
		this.ctx = canvas.getContext('2d');
		this.animationFrame = [];
		this.character = character;
		this.animationTimer = null;
        this.isAllImageLoaded = false;
        this.checkImgLoadedTimer = null;
        this.curtFrame = 0;

		for(var f=0; f<character.animationTotalFrame; f++){
            var images = [];
            this.character.parts.forEach(function(part) {

                part.components.forEach(function(component, i){
                    if(part.style > 0){

                        var img = new Image();

                        if(part.name === 'body'){
                            img.src = 'CharacterPool/images/' + part.name + part.style + '-' + part.components[i].numberOfPieces + '-' + character.animation + '-' + (f+1) + '.png';
                        } else {
                            img.src = 'CharacterPool/images/' + part.name + part.style + '-' + part.components[i].numberOfPieces + '.png';
                        }

                        img.characterPool = this;
                        img.componentObj = {
                            part: part,
                            component: part.components[i],
                            isLoad: img.complete,
                            imagesArrayKey: images.length,
                            frameKey: f
                        }

                        img.onload = function (e) {
                            var componentObj = e.path[0].componentObj;
                            e.path[0].characterPool.animationFrame[componentObj.frameKey][componentObj.imagesArrayKey].componentObj.isLoad = true;
                        }

                       images.push(img);
                    }
                }, this)
            }, this);
            images.sort(function(a, b){return a.componentObj.component.zIndex-b.componentObj.component.zIndex});
            this.animationFrame.push(images);
        }

		this.checkImgLoadedTimer = window.setInterval(function(characterPool){
			var isAllLoaded = true;

			for(var f=0; i<characterPool.animationFrame.length; f++){
                for(var i=0; i<characterPool.animationFrame[f].length; i++){
                    if(!characterPool.animationFrame[f][i].componentObj.isLoad) {
                        isAllLoaded = false;
                        break;
                    }
                }
			}

			if(isAllLoaded){
				console.log('All images loaded: ' + isAllLoaded);
				characterPool.isAllImageLoaded = true;
				window.clearInterval(characterPool.checkImgLoadedTimer);
				console.log(characterPool.animationFrame);
				characterPool.drawCharacter();
			}
		}, 1, this);

		return this;
	}

	drawCharacter() {
	    console.log('Draw Characters');
		this.animationTimer = window.setInterval(function(characterPool){

		    characterPool.ctx.clearRect(0, 0, characterPool.character.width, characterPool.character.height);

            characterPool.animationFrame[characterPool.curtFrame].forEach(function (img) {

                var part = img.componentObj.part;
                var component = img.componentObj.component;
                var characterX = characterPool.character.x;
                var characterY = characterPool.character.y;
                var characterW = characterPool.character.width;
                var characterH = characterPool.character.height;
                var canvasW = characterPool.canvas.width;
                var canvasH = characterPool.canvas.height;


                if (part.name === 'hat') {
                    if(part.style !== 0){
                        if(part.style === 1){
                            characterPool.ctx.drawImage(img, 0, 0, characterW*0.9, characterH*0.35);
                        }
                        if(part.style === 2){
                            characterPool.ctx.drawImage(img, characterW*0.1, 0, characterW*0.9, characterH*0.3);
                        }
                        if(part.style === 3){
                            characterPool.ctx.drawImage(img, characterW*0.04, 0, characterW*0.9, characterH*0.3);
                        }
                    }
                }


                if(part.name === 'hair'){
                    if(part.style !== 0){
                        if(part.style === 1){
                            if(component.name === 'back-hair'){
                                characterPool.ctx.drawImage(img, 0, 0, characterW, characterH*0.6);
                            }
                            if(component.name === 'front-hair') {
                                characterPool.ctx.drawImage(img, 0, 0, characterW, characterH*0.3);
                            }
                        }
                        if(part.style === 2){
                            if(component.name === 'back-hair'){
                                characterPool.ctx.drawImage(img, 0, 0, characterW, characterH*0.8);
                            }
                            if(component.name === 'front-hair') {
                                characterPool.ctx.drawImage(img, characterW*0.05, 0, characterW*0.9, characterH*0.3);
                            }
                        }
                        if(part.style === 3){
                            if(component.name === 'back-hair'){
                                characterPool.ctx.drawImage(img, 0, 0, characterW, characterH*0.6);
                            }
                            if(component.name === 'front-hair') {
                                characterPool.ctx.drawImage(img, characterW*0.1, characterH*0.05, characterW*0.5, characterH*0.3);
                            }
                        }
                        if(part.style === 4){
                            if(component.name === 'back-hair'){
                                characterPool.ctx.drawImage(img, characterX-canvasW/2, 20, canvasW, canvasH);
                            }
                        }
                        if(part.style === 5){
                            if(component.name === 'back-hair'){
                                characterPool.ctx.drawImage(img, 0, 0, characterW, characterH*0.6);
                            }
                            if(component.name === 'front-hair') {
                                characterPool.ctx.drawImage(img, characterW*0.325, 0, characterW*0.35, characterH*0.15);
                            }
                        }
                        if(part.style === 6){
                            if(component.name === 'front-hair') {
                                characterPool.ctx.drawImage(img, characterX-canvasW/2, 0, canvasW, canvasH);
                            }
                        }
                        if(part.style === 7){
                            if(component.name === 'front-hair') {
                                characterPool.ctx.drawImage(img, characterW*0.125, characterH*0.1, characterW*0.75, characterH*0.2);
                            }
                            if(component.name === 'top-pony') {
                                characterPool.ctx.drawImage(img, characterW*0.4+10, characterH*0.005+3, characterW*0.2, characterH*0.1);
                            }
                        }
                        if(part.style === 8){
                            if(component.name === 'back-hair'){
                                characterPool.ctx.drawImage(img, characterX-canvasW/2, -20, canvasW, canvasH);
                            }
                        }
                        if(part.style === 9){
                            if(component.name === 'back-hair'){
                                characterPool.ctx.drawImage(img, characterX-228, -20, canvasW, canvasH);
                            }
                        }
                        if(part.style === 10){
                            if(component.name === 'back-hair'){
                                characterPool.ctx.drawImage(img, characterX-230, -45, canvasW, canvasH);
                            }
                        }
                        if(part.style === 11){
                            if(component.name === 'back-hair'){
                                characterPool.ctx.drawImage(img, characterX-canvasW/2, 60, canvasW, canvasH);
                            }
                        }
                        if(part.style === 12){
                            if(component.name === 'back-hair'){
                                characterPool.ctx.drawImage(img, characterX-canvasW/2, 60, canvasW, canvasH);
                            }
                        }
                    }
                }



                if (part.name === 'face') {
                    if(part.style !== 0){
                        characterPool.ctx.drawImage(img, characterW*0.1, characterH*0.1, characterW*0.8, characterH*0.5);
                    }
                }


                if (part.name === 'eyes') {
                    if(part.style !== 0){
                        characterPool.ctx.drawImage(img, characterW*0.2, characterH*0.20, characterW*0.6, characterH*0.2);
                    }
                }
/*
                if (part.name === 'glasses') {
                    if(part.style !== 0){
                        characterPool.ctx.drawImage(img, characterX-canvasW/2, 220, canvasW, canvasH);
                    }
                }
*/
                if (part.name === 'mouth') {
                    if(part.style !== 0){
                        characterPool.ctx.drawImage(img, characterW*0.35, characterH*0.45, characterW*0.3, characterH*0.1);
                    }
                }

                if (part.name === 'body') {
                    if(part.style !== 0){
                        characterPool.ctx.drawImage(img, characterW*0.075, characterH*0.56, characterW*0.85, characterH*0.43);
                    }
                }




            }, characterPool);

            if(characterPool.curtFrame === characterPool.animationFrame.length-1){
                characterPool.curtFrame = 0 ;
            }else {
                characterPool.curtFrame ++ ;
            }

        }, 150, this);

	}

	stopAnimation () {
	    window.clearInterval(this.animationTimer);
    }

};
