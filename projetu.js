///////////////////////////////////////////////////////////////////////////
////////////////////////////////DEBUG//////////////////////////////////////
///////////////////////////////////////////////////////////////////////////
var my_room = {
	name: "Stanza di Orland",
	points: [{x:0,y:0},{x:10,y:0},{x:10,y:10},{x:0,y:10},{x:0,y:0}],
	edges: [
		{x_a:0, y_a:0, x_b:10,y_b:0, reflect : 0.1},
		{x_a:10,y_a:0, x_b:10,y_b:10,reflect : 0.5},
		{x_a:10,y_a:10,x_b:0, y_b:10,reflect : 0.5},
		{x_a:0, y_a:10,x_b:0, y_b:0, reflect : 0.5}
	]
}
saved_rooms = [my_room];
///////////////////////////////////////////////////////////////////////////

var schermata_attuale = 0;

///////////////////////////////////////////////////////////////////////////
//////////////////////////////CONTROLLER///////////////////////////////////
///////////////////////////////////////////////////////////////////////////

//Schermata 1
document.querySelectorAll(".selector").forEach(function(obj,idx){
    obj.onclick = function (){
        schermata_attuale = idx + 1;
        render_schermata(schermata_attuale);
    }
})

///////////////////////////////////////////////////////////////////////////
////////////////////////////////EDITOR/////////////////////////////////////
///////////////////////////////////////////////////////////////////////////

//EDITOR RENDER
function render_schermata(idx){
	document.querySelectorAll(".schermata").forEach(
		function(obj){obj.style.display = "none";}
	)
	if (idx==0){
        schermata_1.style.display = "inline";
    }
    if (idx==1){
        schermata_2.style.display = "inline";
        open_editor();
    }
    if (idx==2){
		schermata_3.style.display = "inline";
		setup_simulation();
    }
    if (idx==3){
        schermata_4.style.display = "inline";
    }
    if (idx==4){
        schermata_5.style.display = "inline";
    }
}
var ctx = canvas.getContext("2d");
function drawCoords(x, y) {
	var c = grid.translate(x, y);
	ctx.save();
	ctx.fillStyle = "#000";
	ctx.fillText("("+c.x+", "+c.y+")", 10, 15);
	ctx.restore();
}

//EDITOR DATA OBJECTS
var Shape = function() {
	this.reset();
};
Shape.prototype = {
	reset: function() {
		this.points = [];
		this.last = -1;
		this.reflectivities = [];
	},
	addPoint: function(p) {
		if (this.last >= 0 &&
		   (p.x === this.getLast().x &&
			p.y === this.getLast().y)
		) {
			return;
		}
		this.points.push(p);
		this.last = this.points.length - 1;
		refl = parseInt(reflectivity_selector.value)/100;
		this.reflectivities.push(refl);
	},
	
	getLast: function() {
		return {
			x: this.points[this.last].x,
			y: this.points[this.last].y
		}
	},
	draw: function(grid_) {
		if (this.last < 1) {
			return;
		}
		ctx.save();
		ctx.beginPath();
		for (var i = 0; i <= this.last; i++) {
			var p = grid_.toPoint(this.points[i]);
			if (i === 0) {
				ctx.moveTo(p.x, p.y);
				continue;
			}
			ctx.lineTo(p.x, p.y);
		}
		ctx.stroke();
		ctx.restore();
	}
};
var Grid = function() {
	this.canvas = document.createElement("canvas");
	this.ctx = this.canvas.getContext("2d");
};
Grid.prototype = {
	set: function(size) {//imposta dimensione griglia
		this.size = size;
		var wt = Math.ceil(canvas.width / size);
		var ht = Math.ceil(canvas.height / size);
		this.width = (wt + wt%2) * size + 1;
		this.height = (ht + ht%2) * size + 1;
		this.x = Math.round((canvas.width - this.width)/2);
		this.y = Math.round((canvas.height - this.height)/2);
		this.origo = {
			x: Math.round(this.width/(this.size*2)),
			y: Math.round(this.height/(this.size*2))
		};
		this.canvas.width = this.width;
		this.canvas.height = this.height;
		this.createGrid();
		this.draw();
	},
	createGrid: function() {
		var x = 0.5,
			y = 0.5,
			w = this.width-1,
			h = this.height-1;
		this.ctx.save();
		this.ctx.strokeStyle = "#e4e4e4";
		this.ctx.fillStyle = "#fff";
		this.ctx.fillRect(0, 0, this.width, this.height);
		this.ctx.beginPath();
		this.ctx.rect(x, y, w, h);
		while (x < w) {
			x += this.size;
			this.ctx.moveTo(x, y);
			this.ctx.lineTo(x, y+h);
		}
		x = 0.5;
		while (y < h) {
			y += this.size;
			this.ctx.moveTo(x, y);
			this.ctx.lineTo(x+w, y);
		}
		this.ctx.stroke();
		this.ctx.beginPath();
		this.ctx.fillStyle = "#00f";
		this.ctx.arc(this.origo.x * this.size + 0.5, this.origo.y * this.size + 0.5, 3, 0, 2*Math.PI);
		this.ctx.fill();
		this.ctx.restore();
	},
	draw: function() {
		ctx.drawImage(this.canvas, this.x, this.y);
	},
	translate: function(x, y) {
		x = Math.round((x - this.x) / this.size);
		y = Math.round((y - this.y) / this.size);
		return {
			x: x - this.origo.x,
			y: y - this.origo.y
		}
	},
	toPoint: function(p) {
		return {
			x: (p.x + this.origo.x) * this.size + this.x + 0.5,
			y: (p.y + this.origo.y) * this.size + this.y + 0.5
		}
	}
};
var Tools = {
	MOVE: 0,
	LINE: 1
}
var shape, grid, currentTool = Tools.LINE;

//EDITOR CONTROLLER
function open_editor(){//inizializzazioni all'apertura dell'editor
    shape = new Shape();    //inizializza poligono 
    grid = new Grid();      //crea oggetto griglia
    grid.set(20);
    windowResize();
	window.onresize = windowResize;
	currentTool = Tools.LINE;
	nome_stanza.value = "";
}
window.onmousedown = function(evt){
    if (schermata_attuale==1){//solo in editing
	    var x = evt.x - 5;
	    var y = evt.y - 5;
	    if (0 > x || canvas.width < x ||
		    0 > y || canvas.height < y
	    ) {
		    return;
	    }
	    if (currentTool === Tools.LINE) {
		    var c = grid.translate(x, y);
		    shape.addPoint(c);
		    if (shape.last > 0 &&
			    c.x === shape.points[0].x &&
			    c.y === shape.points[0].y
		    ) {
			    currentTool = Tools.MOVE;
		    }
		    grid.draw();
		    shape.draw(grid);
            drawCoords(x, y);
        }
	}
}
window.onmousemove = function(evt) {
    if (schermata_attuale==1){//solo in editing
	    var x = evt.x - 5;
	    var y = evt.y - 5;
	    if (0 > x || canvas.width < x ||
	    	0 > y || canvas.height < y
	    ) {
	    	return;
	    }
	    grid.draw();
	    shape.draw(grid);
	    if (currentTool === Tools.LINE && shape.last >= 0) {
	    	var c = grid.toPoint(shape.getLast());
	    	ctx.beginPath();
	    	ctx.moveTo(c.x, c.y);
	    	ctx.lineTo(x, y);
	    	ctx.stroke();
	    }
        drawCoords(x, y);
    }
}
function windowResize() {
	canvas.width = window.innerWidth - 230;
    canvas.height = window.innerHeight - 50;
    refl_container.style.left = window.innerWidth - 200;
    grid.set(20);
	shape.draw(grid);
}
function save_room(){
	var name = nome_stanza.value;
	var room = {
		name: name,
		points: shape.points,
		edges: [],
	}
	for (i=0;i<shape.last;i++){
		this_edge = {
			x_a: shape.points[i].x,
			y_a: shape.points[i].y,
			x_b: shape.points[i+1].x,
			y_b: shape.points[i+1].y,
			reflect : shape.reflectivities[i+1]
		}
		room.edges.push(this_edge)
	}
	
	/// SOMEHOW PUSH TO DATABASE

	schermata_attuale = 0;
	render_schermata(schermata_attuale);
}

///////////////////////////////////////////////////////////////////////////
////////////////////////////////RIR SIM FRONTEND///////////////////////////
///////////////////////////////////////////////////////////////////////////

//RIR SIM CONTROLLER
function setup_simulation(){
	room_names_container.style.display = "inline";
	saved_rooms.forEach(create_buttons);
	RIR_canvas.height = window.innerHeight-20;
	RIR_canvas.width  = window.innerWidth -20;
}
function create_buttons(obj,idx){
	this_div = document.createElement('div');
	this_div.innerHTML = obj.name;
	this_div.classList.add("room_name");
	room_names_container.appendChild(this_div);
	this_div.onclick = function(){
		room = saved_rooms[idx];
		room_names_container.style.display = "none";
	}
}

//RIR SIM RENDER
var ctx_rir = RIR_canvas.getContext("2d");

var x_center = Math.round(window.innerWidth/2);			//
var y_center = Math.round(window.innerHeight/2);		// FIXME!
var scale = 10;											//

function render_all(virtual_sources){
	var extremes = {x_max:0,x_min:0,y_max:0,y_min:0};
	for (j=0;j<virtual_sources.length;j++){ //evaluate center and scaling factor
		this_list = virtual_sources[j];
		for (k=0;k<this_list.length;k++){
			this_VS = this_list[k];
			//check for max/min x/y
		}
	}
	//set scale_factor/center
	for (j=0;j<virtual_sources.length;j++){ //evaluate center and scaling factor
		this_list = virtual_sources[j];
		for (k=0;k<this_list.length;k++){
			this_VS = this_list[k];
			render_room(this_VS,"red");
		}
	}
}

function render_room(room_,color){
	var N = room_.edges.length;
	ctx_rir.fillStyle = color;
	ctx_rir.globalAlpha = 0.5;
	ctx_rir.beginPath();
	ctx_rir.moveTo(room_.points[0].x*scale+x_center,room_.points[0].y*scale+y_center);
	for (i=0;i<N;i++){
		ctx_rir.lineTo(room_.points[i+1].x*scale+x_center,room_.points[i+1].y*scale+y_center);
	}
	ctx_rir.closePath();
	ctx_rir.fill();
}
function render_receiver(x,y){
	ctx_rir.moveTo(x+x_center,y+y_center+5);
	ctx_rir.beginPath();
	ctx_rir.arc(x+x_center,y+y_center+5,5,0,2*Math.PI);
	ctx_rir.stroke();
}
function render_source(x,y){
	ctx_rir.drawImage(dino,x+x_center,y+y_center);
}

/*TODO LIST

-contorni delle room
-scaling function e offset

*/