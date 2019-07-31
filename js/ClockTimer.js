class ClockTimer {
	constructor(canvas, config = {}) {
		this.ctx = canvas.getContext('2d');
		this.objType = 'ClockTimer'; // Mark the object type.
		this.updateTimer = null;

		// pos
		this.x = config.x || 0;
		this.y = config.y || 0;

		// status
		this.needsUpdateFrame = false;
		this.status = config.hasOwnProperty('status') ? config.status : 'running' ;
		this.direction = config.hasOwnProperty('direction') ? (config.direction >= 0 ? 1 : -1) : 1 ;

		// const
		this.time = config.hasOwnProperty('time') ? config.time : 60 ; // seconds
		this.curtTime = this.direction === 1 ? 0 : this.time;
		this.speed = config.hasOwnProperty('speed') ? config.speed : 1000 ; // milliseconds
		this.degProgress = this.direction === 1 ? 0 : 360;
		this.size = config.hasOwnProperty('size') ? config.size : 25 ;
		this.area = [this.x-this.size, this.y-this.size, this.x+this.size, this.y+this.size];

		// style
		this.startColor = config.hasOwnProperty('startColor') ? config.startColor : 'rgb(0, 255, 0)';
		this.endColor = config.hasOwnProperty('endColor') ? config.endColor : 'rgb(255, 0, 0)';
		this.gradients = this.interpolateColors(this.startColor, this.endColor, 360);

		this.textStyle = config.hasOwnProperty('textStyle') ? config.textStyle : '12px Arial';
		this.textColor = config.hasOwnProperty('textColor') ? config.textColor : '#000';

		return this;
	}

	startTimer(){

		this.drawTimer();

		var ClockTimer = this;
		this.status = 'running';
		this.updateTimer = window.setInterval(function () {
			if (ClockTimer.direction === 1) {
				if (ClockTimer.curtTime < ClockTimer.time) {
					ClockTimer.curtTime++;
					ClockTimer.degProgress += (360 / ClockTimer.time);
					ClockTimer.drawTimer();
					ClockTimer.needsUpdateFrame = true;
				}
				if (ClockTimer.curtTime === ClockTimer.time) {
					ClockTimer.status = 'stop';
					window.clearInterval(ClockTimer.updateTimer);
				}
			}
			if (ClockTimer.direction === -1) {
				if (ClockTimer.curtTime > 0) {
					ClockTimer.curtTime--;
					ClockTimer.degProgress -= (360 / ClockTimer.time);
					ClockTimer.drawTimer();
					ClockTimer.needsUpdateFrame = true;
				}
				if (ClockTimer.curtTime === 0) {
					ClockTimer.status = 'stop';
					window.clearInterval(ClockTimer.updateTimer);
				}
			}

		}, this.speed, ClockTimer);

	}

	moveTimer(x, y){
		if(typeof x !== 'number' || typeof y !== 'number') return false;
		this.x += x;
		this.y += y;
		this.drawTimer();
	}

	drawTimer(){
		console.log('Draw Timer');

		this.ctx.save();

		this.ctx.clearRect(0, 0, this.size*2, this.size*2);

		var grd = this.ctx.createRadialGradient(this.x, this.y, 5, this.x, this.y, this.size);
		if(this.direction === 1){
			var colorIndex = Math.ceil(this.degProgress) < 360 ? Math.ceil(this.degProgress) : 359 ;
		}else if(this.direction === -1){
			var colorIndex = 360-Math.ceil(this.degProgress) < 360 ? 360-Math.ceil(this.degProgress) : 359 ;
		}
		grd.addColorStop(0, 'rgba(255, 255, 255, 1)');
		grd.addColorStop(0.7, 'rgba(' + this.gradients[colorIndex][0] + ', ' + this.gradients[colorIndex][1] + ', ' + this.gradients[colorIndex][2] + ', 1)');
		grd.addColorStop(1, 'rgba(' + this.gradients[colorIndex][0] + ', ' + this.gradients[colorIndex][1] + ', ' + this.gradients[colorIndex][2] + ', 0)');
		this.ctx.fillStyle = grd;

		//Draw Center Circle
		this.ctx.beginPath();
		this.ctx.arc(this.x, this.y, this.size*0.5, 0, 2 * Math.PI);
		this.ctx.strokeStyle = 'rgba(255, 0, 0, 1)';
		this.ctx.lineWidth = 0;
		this.ctx.stroke();
		this.ctx.fill();

		//Draw Big Pizza
		if(this.degProgress !== 0){
			this.ctx.beginPath();
			if(this.degProgress === 360){
				this.ctx.arc(this.x, this.y, this.size, 0, 2 * Math.PI);
			}else {
				this.ctx.arc(this.x, this.y, this.size, 1.5 * Math.PI, this.toRad(this.degProgress-90));
			}
			this.ctx.lineTo(this.x, this.y);
			this.ctx.closePath();
			this.ctx.strokeStyle = 'rgba(255, 125, 125, 0)';
			this.ctx.lineWidth = 0;
			this.ctx.stroke();
			this.ctx.fill();
		}

		//Draw First Line
		this.ctx.beginPath();
		this.ctx.moveTo(this.x, this.y);
		this.ctx.lineTo(this.x, 0);
		this.ctx.strokeStyle = 'rgba(255, 255, 255, 1)';
		this.ctx.lineWidth = 5;
		this.ctx.stroke();

		//Draw Second Line
		if(this.degProgress !== 0 && this.degProgress !== 360){
			this.ctx.beginPath();
			this.ctx.moveTo(this.x, this.y);
			if(this.direction === 1){
				this.ctx.lineTo(this.x + Math.cos(this.toRad(this.degProgress-90)) * this.size, this.y + Math.sin(this.toRad(this.degProgress-90)) * this.size);
			}else if(this.direction === -1){
				this.ctx.lineTo(this.x - Math.cos(this.toRad(this.degProgress+90)) * this.size, this.y - Math.sin(this.toRad(this.degProgress+90)) * this.size);
			}
			this.ctx.strokeStyle = 'rgba(255, 255, 255, 1)';
			this.ctx.lineWidth = 5;
			this.ctx.stroke();
		}

		//Draw Text
		this.ctx.fillStyle = this.textColor;
		this.ctx.textAlign = 'center';
		this.ctx.textBaseline = 'middle';
		this.ctx.font = this.textStyle;
		this.ctx.fillText(this.curtTime, this.x, this.y);

		this.ctx.restore();

	}

	toRad(deg){
		return deg * Math.PI / 180;
	}

	interpolateColors(color1, color2, steps) {
		if (arguments.length < 3) return false;
		var stepFactor = 1 / (steps - 1), interpolatedColorArray = [];

		color1 = color1.match(/\d+/g).map(Number);
		color2 = color2.match(/\d+/g).map(Number);

		for(var i = 0; i < steps; i++) {
			var rgbs = color1.slice();
			for (var k = 0; k < 3; k++) {
				rgbs[k] = Math.round(rgbs[k] + (stepFactor * i) * (color2[k] - color1[k]));
			}
			interpolatedColorArray.push([rgbs[0], rgbs[1], rgbs[2]]);
		}

		return interpolatedColorArray;
	}

	hexToRgb(hex) {
		var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
		return result ? 'rgb(' + parseInt(result[1], 16) + ', ' + parseInt(result[2], 16) + ', ' + parseInt(result[3], 16) + ')' : null;
	}

	rgbToHex(r, g, b) {
		return "#" + (r.toString(16).length == 1 ? "0" + r.toString(16) : r.toString(16)) + (g.toString(16).length == 1 ? "0" + g.toString(16) : g.toString(16)) + (b.toString(16).length == 1 ? "0" + b.toString(16) : b.toString(16));
	}

};
