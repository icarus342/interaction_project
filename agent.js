/**
 * 
 */
const RADIUS = 10;

function getDistance(a, b) {
	var dx = a.x - b.x;
    var dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
}

function getDirection(a, b) {
	var dx = a.x - b.x;
    var dy = a.y - b.y;
    return Math.atan2(dy, dx);
}


function Agent(game, id, hasGun, hasKnife) {
	this.game = game;
	this.id = id;
	this.targetList = [];
	this.x;
	this.y;
	this.radius = RADIUS;
	this.visualRadius = 150;
	this.trust = [];
	this.hasGun = hasGun;
	this.hasKnife = hasKnife;
	this.maxSpeed = -1.5;
	this.currentSpeed = 0;
	this.velocity = {x: 0, y: 0};
	this.following = null;
	this.angle = Math.random() * 2 * Math.PI;
	this.behaviorCount = Math.floor(Math.random() * 100);
	this.init();
}

Agent.prototype = new Entity();
Agent.prototype.constructor = Agent;

Agent.prototype.init = function () {
	this.spawnRandom();
}

Agent.prototype.spawnRandom = function () {
	this.x = Math.floor(Math.random() * (800 - (RADIUS)) + (RADIUS));
	this.y = Math.floor(Math.random() * (800 - (RADIUS)) + (RADIUS));
	for (var i = 0; i < this.game.entities.length; i++) {
		if (this === this.game.entities[i]) {continue;}
		var a = {x: this.x, y: this.y};
		var b = {x: this.game.entities[i].x, y: this.game.entities[i].y};
		if (getDistance(a, b) < this.radius + this.game.entities[i].radius) {
			this.spawnRandom();
		}
	}
}

Agent.prototype.update = function () {
//	console.log("START: " + this.id);
//	console.log(this.trust);
//	console.log("END");
	
	if (this.hasGun) {
		// Sheriff update logic
		for (var i = 0; i < this.game.entities.length; i++) {
			this.updateTrust(this.game.entities[i]);
			this.convinceOthers(this.game.entities[i]);
		}
		if (this.behaviorCount > 120) {
			this.updateBehavior();
			this.behaviorCount = Math.floor(Math.random() * 100);
			this.angle = Math.random() * 2 * Math.PI;
		}
		for (var i = 0; i < this.game.entities.length; i++) {
			if (this.isVisible(this.game.entities[i]) &&
					this.trust[this.game.entities[i].id] != undefined &&
					this.trust[this.game.entities[i].id].value < -1000 ) {
				this.following = this.game.entities[i];
			} else {
				this.following = null;
			}
		}
		this.behaviorCount++;
		this.move();
		if (this.following != null) {
			console.log("Sheriff Chasing");
			var a = {x: this.x, y: this.y};
			var b = {x: this.following.x, y: this.following.y};
			if (getDistance(a, b) < RADIUS * 2 + 50) {
				// KILL IT
				if (this.following.hasKnife) {
					console.log("Shot Killer!");
				} else {
					console.log("Shot Innocent!");
				}
				
				this.following.removeFromWorld = true;
				this.following = null;
			}
		}
		
		
	} else if (this.hasKnife) {
		// Killer update logic
		this.targetList.length = 0;
		for (var i = 0; i < this.game.entities.length; i++) {
			if (this.isVisible(this.game.entities[i])) {
				this.targetList.push(this.game.entities[i]);
			}
		}
		if (this.targetList.length <= 3 && this.targetList.length > 0 && !this.targetList[0].hasKnife) {
			this.following = this.targetList[0];
		} else {
			this.following = null;
		}
		for (var i = 0; i < this.game.entities.length; i++) {
			this.updateTrust(this.game.entities[i]);
			this.convinceOthers(this.game.entities[i]);
		}
		if (this.behaviorCount > 120) {
			this.behaviorCount = Math.floor(Math.random() * 100);
			this.angle = Math.random() * 2 * Math.PI;
		}
		this.behaviorCount++;
		this.move();
		if (this.following != null) {
			var a = {x: this.x, y: this.y};
			var b = {x: this.following.x, y: this.following.y};
			if (getDistance(a, b) < RADIUS * 2 + 5) {
				// KILL IT
				this.following.removeFromWorld = true;
				for (var i = 0; i < this.game.entities.length; i++) {
					if (this.isVisible(this.game.entities[i]) && this.game.entities[i].id != this.following.id) {
						console.log("scared innocent!");
						if (this.game.entities[i].hasGun) {
							console.log("alerted sheriff");
						}
						this.game.entities[i].trust[this.id].value = -2000
					}
				}
				this.following = null;
			}
		}
		
		
		
	} else {
		// Other update logic
		for (var i = 0; i < this.game.entities.length; i++) {
			this.updateTrust(this.game.entities[i]);
			this.convinceOthers(this.game.entities[i]);
		}
		if (this.behaviorCount > 120) {
			this.updateBehavior();
			this.behaviorCount = Math.floor(Math.random() * 100);
			this.angle = Math.random() * 2 * Math.PI;
		}
		this.behaviorCount++;
		this.move();
	}
}

Agent.prototype.draw = function () {
	
	// Draw Circle
	this.game.ctx.beginPath();
	if (this.hasGun) {
		this.game.ctx.strokeStyle = "blue";
	    this.game.ctx.fillStyle = "blue";
	} else if (this.hasKnife) {
		this.game.ctx.strokeStyle = "red";
	    this.game.ctx.fillStyle = "red";
	} else {
		this.game.ctx.strokeStyle = "green";
	    this.game.ctx.fillStyle = "green";
	}
    this.game.ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
    this.game.ctx.stroke();
    this.game.ctx.fill();
    this.game.ctx.closePath();
    
    // Draw gun
    if (this.hasGun) {
    	this.game.ctx.strokeStyle = "grey";
        this.game.ctx.strokeRect(this.x, this.y, 2, 3);
    }
}

Agent.prototype.move = function () {
	if (this.following === null) {
		this.velocity.x = this.maxSpeed * Math.cos(this.angle);
		this.velocity.y = this.maxSpeed * Math.sin(this.angle);
	} else if (this.following.following != null &&
			!this.hasGun &&
			this.following.following.id === this.id) {
		this.velocity.x = this.maxSpeed * Math.cos(this.angle);
		this.velocity.y = this.maxSpeed * Math.sin(this.angle);
	} else {
		var angle = getDirection({x: this.x, y: this.y}, {x: this.following.x, y: this.following.y});
		this.velocity.x = this.maxSpeed * Math.cos(angle);
		this.velocity.y = this.maxSpeed * Math.sin(angle);
		var a = {x: this.x, y: this.y};
		var b = {x: this.following.x, y: this.following.y};
		if (getDistance(a, b) < this.visualRadius/6 && !this.hasGun) {
			this.velocity.x = this.velocity.x  * -1;
			this.velocity.y = this.velocity.y  * -1;
		} else if (getDistance(a, b) < this.visualRadius/2) {
			this.velocity.x = this.velocity.x / 2;
			this.velocity.y = this.velocity.y / 2;
		}
	}
	
	// Check if in range of untrusted agents
	for (var i = 0; i < this.game.entities.length; i++) {
		if (this.isVisible(this.game.entities[i]) &&
				this.trust[this.game.entities[i].key] != undefined &&
				this.trust[this.game.entities[i].key].value < 0) {
			
			var a = {x: this.x, y: this.y};
			var b = {x: this.game.entities[i].x, y: this.game.entities[i].y};
			var trustValue = this.trust[this.game.entities[i].key].value;
			var percentChance = Math.log10(Math.abs(trustValue) * 0.1 + 1) * 100;
			
			if (Math.random() * 100 < percentChance) {
				this.angle = getDirection(a, b) + Math.PI;
				this.velocity.x = this.maxSpeed * Math.cos(angle);
				this.velocity.y = this.maxSpeed * Math.sin(angle);
			}
		}
	}
	
	this.updatePositionWithCollision();
}

Agent.prototype.updatePositionWithCollision = function () {
	this.x += this.velocity.x;
	if (this.x < this.radius || this.x > 800 - this.radius) {
		this.x -= this.velocity.x;
	}
	this.y += this.velocity.y;
	if (this.y < this.radius || this.y > 800 - this.radius) {
		this.y -= this.velocity.y;
	}
	
	for (var i = 0; i < this.game.entities.length; i++) {
		if (this === this.game.entities[i]) {continue;}
		var a = {x: this.x, y: this.y};
		var b = {x: this.game.entities[i].x, y: this.game.entities[i].y};
		if (getDistance(a, b) < this.radius + this.game.entities[i].radius) {
			//var currentAngle = Math.atan2(this.velocity.y, this.velocity.x)
			var angleBetween = getDirection(a, b) + (Math.PI / 2);
			this.y -= this.velocity.y;
			this.x -= this.velocity.x;
			this.angle += Math.PI;
//			this.velocity.y = this.maxSpeed * Math.sin(angleBetween);
//			this.velocity.x = this.maxSpeed * Math.cos(angleBetween);
//			
//			this.y += this.velocity.y;
//			if (this.y < this.radius || this.y > 800 - this.radius) {
//				this.y -= this.velocity.y;
//			}
//			this.x += this.velocity.x;
//			if (this.x < this.radius || this.x > 800 - this.radius) {
//				this.x -= this.velocity.x;
//			}
		}
	}
}

Agent.prototype.updateBehavior = function () {
	var trusted = null;
	//console.log("id:" + this.id + " trustCount:" + this.trust.length);
	for (let key in this.trust) {
		if (this.trust[key].agent === undefined) { continue; }
		if (!this.trust.hasOwnProperty(key) || this.trust[key].agent.removeFromWorld === true) { continue; }
			//console.log("this: " + this.id + "  trusted: " + key);
			if (trusted === null && this.isVisible(this.trust[key].agent)) {
				trusted = key;
			} else if (this.isVisible(key) && this.trust[key].value > this.trust[trusted].value) {
				trusted = key;
			}
	}
	if (trusted === null) {
		this.following = null;
		return;
	}
	var trustValue = this.trust[trusted].value;
	var percentChance = Math.log10(trustValue * 0.05 + 2.7) * 100;
	//console.log(trustValue + " " + percentChance + "%");
	if (Math.random() * 100 < percentChance) {
		this.following = this.trust[trusted].agent;
	} else {
		this.following = null;
	}
	
}

Agent.prototype.convinceOthers = function (otherAgent) {
	if (this.isVisible(otherAgent)) {
		for (var i = 0; i < this.game.entities.length; i++) {
			//var trustValue = this.trust[this.game.entities[i].id].value;
			var tempAgent = this.game.entities[i];
			if (this.trust[tempAgent.id] != undefined && this.trust[tempAgent.id].value < -20) {
				if (otherAgent.trust[tempAgent.id] === undefined) {
					if (otherAgent.trust[this.id] > 45) { // if > 300, will listen
						otherAgent.trust[tempAgent.id] = {value: 0, agent: otherAgent};
					}
				} else {
					//if (otherAgent.trust[this.id] > 20) { // if > 300, will listen
						//console.log("listened neg");
						otherAgent.trust[tempAgent.id].value += (this.trust[tempAgent.id].value / 10000);
					//}
				}
				
			} else if (this.trust[tempAgent.id] != undefined && this.trust[tempAgent.id].value > 40) {
				if (otherAgent.trust[tempAgent.id] === undefined) {
					if (otherAgent.trust[this.id] != undefined && otherAgent.trust[this.id].value > 45) { // if > 300, will listen
						otherAgent.trust[tempAgent.id] = {value: (Math.random()*60), agent: otherAgent};
					}
				} else {
					if (otherAgent.trust[this.id] != undefined && otherAgent.trust[this.id].value > 45) { // if > 300, will listen
						//console.log("listened");
						otherAgent.trust[tempAgent.id].value += 0.02;
					}
				}
			}
		}
	}
}

Agent.prototype.updateTrust = function (otherAgent) {
	if (this.isVisible(otherAgent)) {
		if (!this.trust.hasOwnProperty(otherAgent.id)) {
			//console.log(this.id + " " + otherAgent.id + " this ran");
			this.trust[otherAgent.id] = {value: (Math.random() * 35), agent: otherAgent};
		}
		if (this.trust[otherAgent.id].value < -25) {
			this.trust[otherAgent.id].value -= .05;
		} else {
			this.trust[otherAgent.id].value += 0.05;
		}
	} else {
		var agnt = this.trust[otherAgent.id];
		if (agnt != null && agnt != undefined) {
			this.trust[otherAgent.id].value -= 0.05;
		}
	}
}

Agent.prototype.isVisible = function (other) {
	if (this === other) {return false;}
	if (getDistance({x: this.x, y: this.y}, {x: other.x, y: other.y}) < this.visualRadius) {
		//console.log(this.id + " " + other.id + " is visible");
		return true;
	} else {
		//console.log(this.id + " " + other.id + " is not visible");
		return false;
	}
}

