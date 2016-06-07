// This game shell was happily copied from Googler Seth Ladd's "Bad Aliens" game and his Google IO talk in 2011

window.requestAnimFrame = (function () {
    return window.requestAnimationFrame ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame ||
            window.oRequestAnimationFrame ||
            window.msRequestAnimationFrame ||
            function (/* function */ callback, /* DOMElement */ element) {
                window.setTimeout(callback, 1000 / 60);
            };
})();

function AssetManager() {
    this.successCount = 0;
    this.errorCount = 0;
    this.cache = [];
    this.downloadQueue = [];
}

AssetManager.prototype.queueDownload = function (path) {
    console.log(path.toString());
    this.downloadQueue.push(path);
}

AssetManager.prototype.isDone = function () {
    return (this.downloadQueue.length == this.successCount + this.errorCount);
}
AssetManager.prototype.downloadAll = function (callback) {
    if (this.downloadQueue.length === 0) window.setTimeout(callback, 100);
    for (var i = 0; i < this.downloadQueue.length; i++) {
        var path = this.downloadQueue[i];
        var img = new Image();
        var that = this;
        img.addEventListener("load", function () {
            console.log("dun: " + this.src.toString());
            that.successCount += 1;
            if (that.isDone()) { callback(); }
        });
        img.addEventListener("error", function () {
            that.errorCount += 1;
            if (that.isDone()) { callback(); }
        });
        img.src = path;
        this.cache[path] = img;
    }
}

AssetManager.prototype.getAsset = function(path){
    //console.log(path.toString());
    return this.cache[path];
}


function GameEngine() {
    this.entities = [];
    this.ctx = null;
    this.click = null;
    this.mouse = null;
    this.wheel = null;
    this.surfaceWidth = null;
    this.surfaceHeight = null;
    this.paused = false;
    this.running = true;
}

GameEngine.prototype.init = function (ctx) {
    this.ctx = ctx;
    this.surfaceWidth = this.ctx.canvas.width;
    this.surfaceHeight = this.ctx.canvas.height;
    this.startInput();

    console.log('game initialized');
}

GameEngine.prototype.start = function () {
    console.log("starting game");
    var that = this;
    (function gameLoop() {
        that.loop();
        requestAnimFrame(gameLoop, that.ctx.canvas);
    })();
}

GameEngine.prototype.startInput = function () {
    console.log('Starting input');

    var getXandY = function (e) {
        var x = e.clientX - that.ctx.canvas.getBoundingClientRect().left;
        var y = e.clientY - that.ctx.canvas.getBoundingClientRect().top;

        if (x < 1024) {
            x = Math.floor(x / 32);
            y = Math.floor(y / 32);
        }

        return { x: x, y: y };
    }

    var that = this;

    this.ctx.canvas.addEventListener("click", function (e) {
        that.click = getXandY(e);
    }, false);

    this.ctx.canvas.addEventListener("mousemove", function (e) {
        that.mouse = getXandY(e);
    }, false);

    this.ctx.canvas.addEventListener("mousewheel", function (e) {
        that.wheel = e;
    }, false);

    console.log('Input started');
}

GameEngine.prototype.addEntity = function (entity) {
    //console.log('added entity');
    this.entities.push(entity);
}

GameEngine.prototype.draw = function (drawCallback) {
    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    this.ctx.save();
    for (var i = 0; i < this.entities.length; i++) {
        this.entities[i].draw(this.ctx);
    }
    if (drawCallback) {
        drawCallback(this);
    }
    this.ctx.restore();
}

GameEngine.prototype.update = function () {
    var entitiesCount = this.entities.length;

    for (var i = 0; i < entitiesCount; i++) {
        var entity = this.entities[i];

        if (!entity.removeFromWorld) {
            entity.update();
        }
    }

    for (var i = this.entities.length - 1; i >= 0; --i) {
        if (this.entities[i].removeFromWorld) {
            this.entities.splice(i, 1);
        }
    }
}

GameEngine.prototype.loop = function () {
	//console.log("loop");
	if (!this.paused) {
		this.running = true;
		this.update();
	    this.draw();
	    this.running = false;
	}
    this.click = null;
    this.wheel = null;
}

function Entity(game, x, y) {
    this.game = game;
    this.x = x;
    this.y = y;
    this.removeFromWorld = false;
}

Entity.prototype.update = function () {
}

Entity.prototype.draw = function (ctx) {
    if (this.game.showOutlines && this.radius) {
        ctx.beginPath();
        ctx.strokeStyle = "green";
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        ctx.stroke();
        ctx.closePath();
    }
}

Entity.prototype.rotateAndCache = function (image, angle) {
    var offscreenCanvas = document.createElement('canvas');
    var size = Math.max(image.width, image.height);
    offscreenCanvas.width = size;
    offscreenCanvas.height = size;
    var offscreenCtx = offscreenCanvas.getContext('2d');
    offscreenCtx.save();
    offscreenCtx.translate(size / 2, size / 2);
    offscreenCtx.rotate(angle);
    offscreenCtx.translate(0, 0);
    offscreenCtx.drawImage(image, -(image.width / 2), -(image.height / 2));
    offscreenCtx.restore();
    //offscreenCtx.strokeStyle = "red";
    //offscreenCtx.strokeRect(0,0,size,size);
    return offscreenCanvas;
}

// GameBoard code below

function GameBoard() {

    Entity.call(this, null, 0, 0);
}

GameBoard.prototype = new Entity();
GameBoard.prototype.constructor = GameBoard;

GameBoard.prototype.update = function () {
    Entity.prototype.update.call(this);
}

GameBoard.prototype.draw = function (ctx) {
}

// the "main" code begins here

var ASSET_MANAGER = new AssetManager();
//ASSET_MANAGER.queueDownload("./img/RobotUnicorn.png")

ASSET_MANAGER.downloadAll(function () {
    console.log("starting up da sheild");
    var canvas = document.getElementById('gameWorld');
    var ctx = canvas.getContext('2d');

    var gameEngine = new GameEngine();
    //var gameboard = new GameBoard();
    
    
    var innocents = 40;
    var sheriffs = 2;
    var killers = 4;
    // Unarmed agents
    for (var count = 0; count < innocents; count++) {
    	var agent = new Agent(gameEngine, count, false, false);
    	console.log("Innocent: " + agent.id);
    	gameEngine.addEntity(agent);
    }
    
    // Sheriff agents (have gun, can kill killers)
    for (var count = innocents; count < innocents + sheriffs; count++) {
    	var agent = new Agent(gameEngine, count, true, false);
    	console.log("Sheriff: " + agent.id);
    	gameEngine.addEntity(agent);
    }
    
 // Sheriff agents (have gun, can kill killers)
    for (var count = innocents + sheriffs; count < innocents + sheriffs + killers; count++) {
    	var agent = new Agent(gameEngine, count, false, true);
    	console.log("Killer: " + agent.id);
    	gameEngine.addEntity(agent);
    }
    
    
//    var agent1 = new Agent(gameEngine, 1);
//    var agent2 = new Agent(gameEngine, 2);
//    var agent3 = new Agent(gameEngine, 3);
//    var agent4 = new Agent(gameEngine, 4);
//    var agent5 = new Agent(gameEngine, 5);
//    var agent6 = new Agent(gameEngine, 6);
//    var agent7 = new Agent(gameEngine, 7);
//    var agent8 = new Agent(gameEngine, 8);
//    var agent9 = new Agent(gameEngine, 9);
//    var agent10 = new Agent(gameEngine, 10);

    //gameEngine.addEntity(gameboard);
//    gameEngine.addEntity(agent1);
//    gameEngine.addEntity(agent2);
//    gameEngine.addEntity(agent3);
//    gameEngine.addEntity(agent4);
//    gameEngine.addEntity(agent5);
//    gameEngine.addEntity(agent6);
//    gameEngine.addEntity(agent7);
//    gameEngine.addEntity(agent8);
//    gameEngine.addEntity(agent9);
//    gameEngine.addEntity(agent10);
    
 
    gameEngine.init(ctx);
    gameEngine.start();
    
    
    
    
    var socket = io.connect("http://76.28.150.193:8888");
    socket.on("connect", function () {
    	console.log("Socket connected.")
    });
    socket.on("disconnect", function () {
    	console.log("Socket disconnected.")
    });
    socket.on("reconnect", function () {
    	console.log("Socket reconnected.")
    });

    

    socket.on("load", function (data) {
    	var studentName = data.studentname;
    	var stateName = data.statename;
    	var loadedStates = data.agentStates;

    	console.log("Data size: " + loadedStates.length);
    	gameEngine.pause = true;
    	while (gameEngine.running) {
    		// waiting for update to finish...
    	}
    	
    	for(var i = 0; i < gameEngine.entities.length; i++) {
    		gameEngine.entities[i].removeFromWorld = true;
    	}
    	gameEngine.update();
    	//console.log("Entity size (should be 0): " + gameEngine.entities.length);

    	for(var i = 0; i < loadedStates.length; i++) {
    		gameEngine.addEntity(convertBack(loadedStates[i], gameEngine));
    	}
    	console.log("Entity size (should be " + loadedStates.length + "): " + gameEngine.entities.length);
    	fixTrustFromSaveState(gameEngine.entities);
    	
    	gameEngine.pause = false;
    	console.log("--- DONE LOADING ---")
    });
    
    
    
    var saveButton = document.getElementById("save");
    saveButton.addEventListener("click", function() {
    	
    	gameEngine.pause = true;
    	while (gameEngine.running) {
    		// waiting for update to finish...
    	}
    	
    	var agents = [];
    	for(var i = 0; i < gameEngine.entities.length; i++) {
    		var agentSave = new AgentSaveState(gameEngine.entities[i]);
            agents.push(agentSave);
        }
    	
    	socket.emit("save", { studentname: "Justin Arnett", statename: "HiddenKillerState", agentStates: agents});
    	console.log("saved!");
    	gameEngine.pause = false;
    }, false);
    
    
    
    var loadButton = document.getElementById("load");
    loadButton.addEventListener("click", function() {
    	
    	socket.emit("load", { studentname: "Justin Arnett", statename: "HiddenKillerState" });
    	console.log("--- LOADING ---");
    }, false);
});