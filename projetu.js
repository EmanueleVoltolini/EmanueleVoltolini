// controllare grafico con iterazioni

///////////////////////////////////////////////////////////////////////////
////////////////////////////////DEBUG//////////////////////////////////////
///////////////////////////////////////////////////////////////////////////
var my_room = {
	name: "Stanza di Orland",
	points: [{x:0,y:0},{x:10,y:0},{x:10,y:10},{x:0,y:10},{x:0,y:0}],
	edges: [
		{x_a:0, y_a:0, x_b:10,y_b:0, reflect : 0.1},
		{x_a:10,y_a:0, x_b:10,y_b:10,reflect : 0.5},
		{x_a:10,y_a:10,x_b:0, y_b:10,reflect : 0.7},
		{x_a:0, y_a:10,x_b:0, y_b:0, reflect : 1}
	]
}
saved_rooms = [my_room];
var real_source = [2,1];
var N_iter = 0;
receiver = {x:1,y:2};
var my_ULA = {x:5,y:0,angle:0,aperture:10,N_mic:10};
///////////////////////////////////////////////////////////////////////////

//CONSTANT
var sound_velocity = 340;  // [m/s]
var reflections = {delays: [], magnitude:[], colors: [], iter: []};
var signal_pow = 100;
var color = ["#000000","#0000FF","#DC143C","#00FFFF","#00FF00","#FFA500","#DDA0DD","#2E8B57","#FFFF00","#EE82EE",
			  "#008080","#800000","#FFB6C1","#FFD700","#696969","#1E90FF","#FFE4C4","#FF6347","#F5F5F5","#CD853F"];
var iteration = ["Direct path","First iteration","Second iteration", "Third iteration", "Fourth iteration", "Fifth iteration", "Sixth iteration","Seventh iteration"];
var iter_labels = []

///////////////////////////////////////////////////////////////////////////
//////////////////////////////////FSM//////////////////////////////////////
///////////////////////////////////////////////////////////////////////////

//FSM DATA OBJECTS
var schermata_attuale = 0;

//FSM CONTROLLER
document.querySelectorAll(".selector").forEach(function(obj,idx){
    obj.onclick = function (){
        schermata_attuale = idx + 1;
        render_schermata(schermata_attuale);
    }
})

//FSM RENDER
function render_schermata(idx){
	document.querySelectorAll(".schermata").forEach(
		function(obj){obj.style.display = "none";}
	)
	if (idx==0){
        schermata_1.style.display = "inline";
    }
    if (idx==1){//EDIT
        schermata_2.style.display = "inline";
        open_editor();
    }
    if (idx==2){//SIMULATION
		schermata_3.style.display = "inline";
		setup_simulation();
    }
    if (idx==3){//ULA
		schermata_4.style.display = "inline";
		full_simulation_ULA();
    }
    if (idx==4){//CREDITS
		schermata_5.style.display = "inline";
	}
	if (idx==5){//SARTI
		schermata_6.style.display = "inline";
		setup_simulation2();
	}
	if (idx==6){//OUTPUT
		document.body.style.cursor = 'wait';//NOT WORKING!!!
		schermata_7.style.display = "inline";
		full_simulation_single_receiver();
		fillChart();
		document.body.style.cursor = 'default';
    }
}

///////////////////////////////////////////////////////////////////////////
////////////////////////////////EDITOR/////////////////////////////////////
///////////////////////////////////////////////////////////////////////////

//EDITOR RENDER
var ctx = canvas.getContext("2d");
var ctx2 = canvas2.getContext("2d");
var ctx3 = canvas3.getContext("2d");
function drawCoords(x, y) {//render della shape
	var c = grid.translate(x, y);
	ctx.save();
	ctx.fillStyle = "#000";
	ctx.fillText("("+c.x+", "+c.y+")", 10, 15);
	ctx.restore();
}
function draw_receiver_editor(e){//drag and drop ricevitore
	ctx2.clearRect(0,0,canvas2.width,canvas2.height);
	ctx2.globalAlpha = 0.5;
	ctx2.moveTo(e.clientX,e.clientY);
	ctx2.beginPath();
	ctx2.arc(e.clientX,e.clientY,5,0,2*Math.PI);
	ctx2.stroke();
	ctx2.fillStyle = "black";
	ctx2.fill();
	ctx2.closePath();
	c = grid.translate(e.clientX-5,e.clientY-5);
	R_x_input.value = c.x;
	R_y_input.value = c.y;
}
function draw_source_editor(e){//drag and drop sorgente
	ctx2.clearRect(0,0,canvas2.width,canvas2.height);
	ctx2.globalAlpha = 0.5;
	ctx2.drawImage(dino_images[0],e.clientX,e.clientY);
	c = grid.translate(e.clientX-5,e.clientY-5);
	RS_x_input.value = c.x;
	RS_y_input.value = c.y;
}
function draw_ULA_editor(e){//drag and drop array
	ctx2.clearRect(0,0,canvas2.width,canvas2.height);
	ctx2.globalAlpha = 0.5;
	ctx2.strokeStyle = "black";
	ctx2.lineWidth = "2px"
	ctx2.beginPath();
	editor_active_objects.ULA_angle = -Math.PI/4;
	var swing_y = Math.round(30*Math.sin(editor_active_objects.ULA_angle));
	var swing_x = Math.round(30*Math.cos(editor_active_objects.ULA_angle));
	ctx2.moveTo(e.clientX-5 -swing_x , e.clientY-5 -swing_y);
	ctx2.lineTo(e.clientX-5 +swing_x , e.clientY-5 +swing_y);
	ctx2.stroke();
	ctx2.closePath();
	c = grid.translate(e.clientX-5,e.clientY-5);
	ULA_x_input.value = c.x;
	ULA_y_input.value = c.y;
}
function rotate_ULA_editor(e){//rotate array
	ctx2.clearRect(0,0,canvas2.width,canvas2.height);
	ctx2.globalAlpha = 0.5;
	ctx2.strokeStyle = "black";
	ctx2.lineWidth = "2px"
	ctx2.beginPath();
	var x = editor_active_objects.ULA_x-5;
	var y = editor_active_objects.ULA_y-5;
	editor_active_objects.ULA_angle = Math.atan((e.clientY-5-y)/(e.clientX-5-x));
	var swing_y = Math.round(30*Math.sin(editor_active_objects.ULA_angle));
	var swing_x = Math.round(30*Math.cos(editor_active_objects.ULA_angle));
	ctx2.moveTo(x -swing_x , y -swing_y);
	ctx2.lineTo(x +swing_x , y +swing_y);
	ctx2.stroke();
	ctx2.closePath();
	ULA_theta_input.value = (-editor_active_objects.ULA_angle * 180/Math.PI) + "°";
}
function scale_ULA_editor(e){//rescale array
	ctx2.clearRect(0,0,canvas2.width,canvas2.height);
	ctx2.globalAlpha = 0.5;
	ctx2.strokeStyle = "black";
	ctx2.lineWidth = "2px"
	ctx2.beginPath();
	var x = editor_active_objects.ULA_x-5;
	var y = editor_active_objects.ULA_y-5;
	var rho = Math.sqrt(Math.pow(e.clientX-x,2) + Math.pow(e.clientY-y,2));
	var theta = editor_active_objects.ULA_angle;
	var swing_y = Math.round(rho*Math.sin(theta));
	var swing_x = Math.round(rho*Math.cos(theta));
	ctx2.moveTo(x -swing_x , y -swing_y);
	ctx2.lineTo(x +swing_x , y +swing_y);
	ctx2.stroke();
	ctx2.closePath();
	editor_active_objects.ULA_aperture = 2*rho;
	ULA_a_input.value = editor_active_objects.ULA_aperture/grid.size;
}
function render_objects_editor(){//mostra gli oggetti già inseriti
	ctx3.clearRect(0,0,canvas2.width,canvas2.height);
	if (typeof editor_active_objects.RS_x !== 'undefined' && typeof editor_active_objects.RS_y !== 'undefined'){
		ctx3.drawImage(dino_images[0],editor_active_objects.RS_x,editor_active_objects.RS_y);
	}
	if (typeof editor_active_objects.R_x !== 'undefined' && typeof editor_active_objects.R_x !== 'undefined'){
		ctx3.moveTo(editor_active_objects.R_x,editor_active_objects.R_y);
		ctx3.beginPath();
		ctx3.arc(editor_active_objects.R_x,editor_active_objects.R_y,5,0,2*Math.PI);
		ctx3.stroke();
		ctx3.fillStyle = "black";
		ctx3.fill();
		ctx3.closePath();
	}
	if (typeof editor_active_objects.ULA_x !== 'undefined' && typeof editor_active_objects.ULA_x !== 'undefined'){
		ctx3.beginPath();
		var x = editor_active_objects.ULA_x-5;
		var y = editor_active_objects.ULA_y-5;
		var rho = editor_active_objects.ULA_aperture/2;
		var theta = editor_active_objects.ULA_angle;
		var swing_y = Math.round(rho*Math.sin(theta));
		var swing_x = Math.round(rho*Math.cos(theta));
		ctx3.moveTo(x -swing_x , y -swing_y);
		ctx3.lineTo(x +swing_x , y +swing_y);
		ctx3.stroke();
		ctx3.closePath();
	}
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
var editor_status = 0;
var editor_active_objects = {};

function editor_FSM(){//modifica il comportamento all'inserzione degli oggetti
	if (editor_status==0){
		canvas2.onmousemove = null;
	}
	if (editor_status==1){//inserzione sorgente reale
		canvas2.onmousemove = draw_source_editor;
		canvas2.onclick = function(e){
			canvas2.onmousemove = null;
			editor_status = 0;
			editor_active_objects.RS_x = e.clientX;
			editor_active_objects.RS_y = e.clientY;
			render_objects_editor();
		}
	}
	if (editor_status==2){//inserzione ricevitore
		canvas2.onmousemove = draw_receiver_editor;
		canvas2.onclick = function(e){
			canvas2.onmousemove = null;
			editor_status = 0;
			editor_active_objects.R_x = e.clientX;
			editor_active_objects.R_y = e.clientY;
			render_objects_editor();
		}
	}
	if (editor_status==3){//inserzione array
		canvas2.onmousemove = draw_ULA_editor;
		canvas2.onclick = function(e){
			editor_status = 4;
			editor_active_objects.ULA_x = e.clientX;
			editor_active_objects.ULA_y = e.clientY;
			editor_FSM();
		}
	}
	if (editor_status==4){//rotazione array
		canvas2.onmousemove = rotate_ULA_editor;
		canvas2.onclick = function(){
			editor_status = 5;
			editor_FSM();
		}
	}
	if (editor_status==5){//dilatazione array
		canvas2.onmousemove = scale_ULA_editor;
		canvas2.onclick = function(){
			canvas2.onmousemove = null;
			editor_status = 0;
			render_objects_editor();
		}
	}
}

//EDITOR CONTROLLER
function open_editor(){//inizializzazioni all'apertura dell'editor
    shape = new Shape();    //inizializza poligono 
    grid = new Grid();      //crea oggetto griglia
	grid.set(20);
	editor_active_objects = {};
    windowResize();
	window.onresize = windowResize;
	currentTool = Tools.LINE;
	info_container.style.display = "none";
	nome_stanza.value = "";
	RS_x_input.value = "SOURCE X";
	RS_y_input.value = "SOURCE Y";
	R_x_input.value = "MIC X";
	R_y_input.value = "MIC Y";
	ULA_x_input.value = "ARRAY X";
	ULA_y_input.value = "ARRAY Y";
	ULA_theta_input.value = "ANGLE";
	ULA_a_input.value = "APERTURE";
	editor_status = 0;
	editor_FSM();
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
				currentTool = Tools.MOVE;///finita la shape
				info_container.style.display = "block";
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
	canvas2.width = window.innerWidth - 230;
	canvas2.height = window.innerHeight - 50;
	canvas3.width = window.innerWidth - 230;
    canvas3.height = window.innerHeight - 50;
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
	my_room = room; //DEBUG
	real_source[0] = grid.translate(editor_active_objects.RS_x,editor_active_objects.RS_y).x;
	real_source[1] = grid.translate(editor_active_objects.RS_x,editor_active_objects.RS_y).y;
	receiver.x = grid.translate(editor_active_objects.R_x,editor_active_objects.R_y).x;
	receiver.y = grid.translate(editor_active_objects.R_x,editor_active_objects.R_y).y;
	my_ULA.x = grid.translate(editor_active_objects.ULA_x,editor_active_objects.ULA_y).x;
	my_ULA.y = grid.translate(editor_active_objects.ULA_x,editor_active_objects.ULA_y).y;
	my_ULA.angle = editor_active_objects.ULA_angle;
	my_ULA.aperture = editor_active_objects.ULA_aperture/grid.size;

	schermata_attuale = 0;
	render_schermata(schermata_attuale);
}
function click_source(){
	editor_status = 1;
	editor_FSM();
}
function click_receiver(){
	editor_status = 2;
	editor_FSM();
}
function click_ULA(){
	editor_status = 3;
	editor_FSM();
}
///////////////////////////////////////////////////////////////////////////
////////////////////////////////RIR SIM FRONTEND///////////////////////////
////////////////////////////////METODO ORLANDYNO///////////////////////////
///////////////////////////////////////////////////////////////////////////

//RIR SIM DATA OBJECTS
var big_rir_sim;

//RIR SIM CONTROLLER
function setup_simulation(){
	N_iter = 0;
	RIR_canvas.height = window.innerHeight-20;
	RIR_canvas.width  = window.innerWidth -20;
	render_all(RIR_iteration(my_room,real_source,0));
}
function prev_iter(){
	N_iter--;
	big_rir_sim = RIR_iteration(my_room,real_source,0);
	render_all(big_rir_sim);
}
function next_iter(){
	N_iter++;
	big_rir_sim = RIR_iteration(my_room,real_source,0);
	render_all(big_rir_sim);
}

//RIR SIM RENDER
var dino_images = document.querySelectorAll('.dinos');
var ctx_rir = RIR_canvas.getContext("2d");
var x_center = Math.round(window.innerWidth/2);	//
var y_center = Math.round(window.innerHeight/2);// scaling variables init
var scale = 10;									//

function render_all(virtual_sources){
	clear_canvas();
	var extremes = {x_max:0,x_min:0,y_max:0,y_min:0}; //evaluate center and scaling factor
	for (ja=0;ja<virtual_sources.length;ja++){
		this_list = virtual_sources[ja];
		for (ka=0;ka<this_list.length;ka++){
			this_VS = this_list[ka];
			this_VS.room.edges.forEach(function (obj){//check for max/min x/y
				if (obj.x_a > extremes.x_max){extremes.x_max = obj.x_a;}
				if (obj.x_a < extremes.x_min){extremes.x_min = obj.x_a;}
				if (obj.y_a > extremes.y_max){extremes.y_max = obj.y_a;}
				if (obj.y_a < extremes.y_min){extremes.y_min = obj.y_a;}
				if (obj.x_b > extremes.x_max){extremes.x_max = obj.x_b;}
				if (obj.x_b < extremes.x_min){extremes.x_min = obj.x_b;}
				if (obj.y_b > extremes.y_max){extremes.y_max = obj.y_b;}
				if (obj.y_b < extremes.y_min){extremes.y_min = obj.y_b;}
			})
		}
	}
	//set scale_factor/center
	drawWidth = extremes.x_max - extremes.x_min;
	drawHeight = extremes.y_max - extremes.y_min;
	scale = Math.floor(Math.min(RIR_canvas.height/drawHeight,RIR_canvas.width/drawWidth)*0.95);

	x_center = Math.round(RIR_canvas.width/2 - scale*(extremes.x_max + extremes.x_min)/2);
	y_center = Math.round(RIR_canvas.height/2 - scale*(extremes.y_max + extremes.y_min)/2);
	//actual render
	for (j=0;j<virtual_sources.length;j++){
		this_list = virtual_sources[j];
		for (k=0;k<this_list.length;k++){
			this_VS = this_list[k];
			render_room(this_VS.room,this_VS.source,"red");
			render_source(this_VS.source.x,this_VS.source.y);
		}
	}
	render_receiver(receiver.x,receiver.y);
}
function render_room(room_,source_,color){
	var N = room_.edges.length;
	ctx_rir.fillStyle = color;
	ctx_rir.globalAlpha = 1;
	ctx_rir.beginPath();
	ctx_rir.moveTo(room_.edges[0].x_a*scale+x_center,room_.edges[0].y_a*scale+y_center);
	for (i=0;i<N;i++){
		ctx_rir.lineTo(room_.edges[i].x_b*scale+x_center,room_.edges[i].y_b*scale+y_center);
		ctx_rir.lineWidth = Math.round(20*room_.edges[i].reflect) + 'px';
		ctx_rir.stroke();
	}
	ctx_rir.closePath();
	ctx_rir.globalAlpha = 0.5;
	ctx_rir.fill();
	render_source(source_[0],source_[1]);
}
function render_receiver(x,y){
	ctx_rir.globalAlpha = 1;
	ctx_rir.moveTo(scale*x+x_center,scale*y+y_center+5);
	ctx_rir.beginPath();
	ctx_rir.arc(scale*x+x_center,scale*y+y_center+5,5,0,2*Math.PI);
	ctx_rir.stroke();
	ctx_rir.fillStyle = "black";
	ctx_rir.fill();
	ctx_rir.closePath();
}
function render_source(x,y){
	ctx_rir.globalAlpha = 1;
	ctx_rir.drawImage(dino_images[0],scale*x+x_center,scale*y+y_center);
}

///////////////////////////////////////////////////////////////////////////
////////////////////////////////RIR SIM FRONTEND///////////////////////////
//////////////////////////////////METODO SARTI/////////////////////////////
///////////////////////////////////////////////////////////////////////////

//RIR SIM DATA OBJECTS
var big_rir_sim;
var show_path = false;
var animations = false;
var animationTimer;
var animationPhase = 0;
var prev_status = {};//for zoom management
var next_status = {};
var N_frames = 10;
var ULA_data = [];

//RIR SIM CONTROLLER
function setup_simulation2(){
	N_iter = 0;
	RIR_canvas2.height = window.innerHeight-20;
	RIR_canvas2.width  = window.innerWidth -20;
	RIR_canvas3.height = window.innerHeight-20;
	RIR_canvas3.width  = window.innerWidth -20;
	RIR_canvas3.style.display = "none";
	big_rir_sim = RIR_iteration_source(my_room,real_source,[receiver.x,receiver.y]);
	scale_and_center(big_rir_sim);
	render_all_source(big_rir_sim);
	draw_path(big_rir_sim,receiver);
}
function prev_iter_source(){
	N_iter--;
	big_rir_sim = RIR_iteration_source(my_room,real_source,[receiver.x,receiver.y]);
	scale_and_center(big_rir_sim);
	render_all_source(big_rir_sim);
	draw_path(big_rir_sim,receiver);
}
function next_iter_source(){
	N_iter++;
	big_rir_sim = RIR_iteration_source(my_room,real_source,[receiver.x,receiver.y]);
	animationPhase = 0;

	prev_status.scale = scale;	//SAVE OLD ZOOM STATUS
	prev_status.x = x_center;
	prev_status.y = y_center;
	scale_and_center(big_rir_sim);//SET NEW ZOOM STATUS
	next_status.scale = scale;	//SAVE NEW ZOOM STATUS
	next_status.x = x_center;
	next_status.y = y_center;

	if (animations){animationTimer = setInterval(draw_animation,100);}
	else{
		scale_and_center(big_rir_sim);
		render_all_source(big_rir_sim);
		draw_path(big_rir_sim,receiver);
	}
}
function show_hide_path(){
	show_path = !show_path;
	if (show_path){
		pathbutton.innerHTML = "HIDE PATHS";
		RIR_canvas3.style.display = "";
	}
	else {
		pathbutton.innerHTML = "SHOW PATHS";
		RIR_canvas3.style.display = "none";
	}
}
function toggle_animation(){
	animations = !animations;
}

//RIR SIM RENDER
var dino_images = document.querySelectorAll('.dinos');
var ctx_rir2 = RIR_canvas2.getContext("2d");
var ctx_rir3 = RIR_canvas3.getContext("2d");
var x_center = Math.round(window.innerWidth/2);	//
var y_center = Math.round(window.innerHeight/2);// scaling variables init
var scale;										//

function scale_and_center(virtual_sources){
	var extremes = {x_max:0,x_min:0,y_max:0,y_min:0};
	my_room.edges.forEach(function(obj){
		if (obj.x_a>extremes.x_max){extremes.x_max = obj.x_a;}
		if (obj.x_a<extremes.x_min){extremes.x_min = obj.x_a;}
		if (obj.y_a>extremes.y_max){extremes.y_max = obj.y_a;}
		if (obj.y_a<extremes.y_min){extremes.y_min = obj.y_a;}
	})
	for (ja=0;ja<virtual_sources.length;ja++){
		this_list = virtual_sources[ja];
		for (ka=0;ka<this_list.length;ka++){
			this_VS = this_list[ka];
			sx = this_VS.source[0];
			sy = this_VS.source[1];
			if (sx > extremes.x_max){extremes.x_max = sx;}
			if (sx < extremes.x_min){extremes.x_min = sx;}
			if (sy > extremes.y_max){extremes.y_max = sy;}
			if (sy < extremes.y_min){extremes.y_min = sy;}
		}
	}
	//set scale_factor/center
	drawWidth = extremes.x_max - extremes.x_min;
	drawHeight = extremes.y_max - extremes.y_min;
	scale = Math.min(RIR_canvas2.height/drawHeight,RIR_canvas2.width/drawWidth)*0.92;
	x_center = Math.round(RIR_canvas2.width/2 - scale*(extremes.x_max + extremes.x_min)/2);
	y_center = Math.round(RIR_canvas2.height/2 - scale*(extremes.y_max + extremes.y_min)/2);
}
function render_all_source(virtual_sources){
	clear_canvas();
	render_room2(my_room,virtual_sources[0][0].source,"red");
	my_room.edges.forEach(draw_line);
	for (j=0;j<virtual_sources.length;j++){
		this_list = virtual_sources[j];
		for (k=0;k<this_list.length;k++){
			this_VS = this_list[k];
			render_source2(this_VS.source[0],this_VS.source[1],j%7);
		}
	}
	render_receiver2(receiver.x,receiver.y);
}
function render_room2(room_,source_,color){
	var N = room_.edges.length;
	ctx_rir2.fillStyle = color;
	ctx_rir2.globalAlpha = 1;
	ctx_rir2.beginPath();
	ctx_rir2.moveTo(room_.edges[0].x_a*scale+x_center,room_.edges[0].y_a*scale+y_center);
	for (i=0;i<N;i++){
		ctx_rir2.lineTo(room_.edges[i].x_b*scale+x_center,room_.edges[i].y_b*scale+y_center);
		ctx_rir2.lineWidth = Math.round(20*room_.edges[i].reflect) + 'px';
		ctx_rir2.stroke();
	}
	ctx_rir2.closePath();
	ctx_rir2.globalAlpha = 0.5;
	ctx_rir2.fill();
	render_source2(source_[0],source_[1],0);
}
function render_receiver2(x,y){
	ctx_rir2.globalAlpha = 1;
	ctx_rir2.strokeStyle = 'black';
	ctx_rir2.moveTo(scale*x+x_center,scale*y+y_center+5);
	ctx_rir2.beginPath();
	ctx_rir2.arc(scale*x+x_center,scale*y+y_center+5,5,0,2*Math.PI);
	ctx_rir2.stroke();
	ctx_rir2.fillStyle = "black";
	ctx_rir2.fill();
	ctx_rir2.closePath();
}
function render_source2(x,y,color_idx){
	ctx_rir2.globalAlpha = 1;
	ctx_rir2.drawImage(dino_images[color_idx],scale*x+x_center,scale*y+y_center);
}
function clear_canvas(){
	ctx_rir.clearRect(0, 0, RIR_canvas.width, RIR_canvas.height);
	ctx_rir2.clearRect(0, 0, RIR_canvas2.width, RIR_canvas2.height);
}
function draw_line(edge){
	ctx_rir2.beginPath();
	if (Math.abs(edge.x_b - edge.x_a) > Math.abs(edge.y_b - edge.y_a)){// rette "orizzontali"
		m = (edge.y_b - edge.y_a) / (edge.x_b - edge.x_a);
		q = edge.y_a - m*edge.x_a;
		h_0 = q*scale + y_center - (x_center * m);
		h_end = h_0 + m*RIR_canvas2.width;
		ctx_rir2.strokeStyle = 'blue';
		ctx_rir2.lineWidth = '5px';
		ctx_rir2.moveTo(0,h_0);
		ctx_rir2.lineTo(RIR_canvas2.width,h_end);
		ctx_rir2.stroke();
	}
	else{// rette "verticali"
		co_m = (edge.x_b - edge.x_a)/(edge.y_b - edge.y_a);
		co_q = edge.x_a - co_m*edge.y_a;
		j_0 = co_q*scale + x_center - (y_center * co_m);
		j_end = j_0 + co_m*RIR_canvas2.height;
		ctx_rir2.strokeStyle = 'blue';
		ctx_rir2.lineWidth = '5px';
		ctx_rir2.moveTo(j_0,0);
		ctx_rir2.lineTo(j_end,RIR_canvas2.height);
		ctx_rir2.stroke();
	}
	ctx_rir2.closePath();
}
function draw_path(virtual_sources,receiver){
	ctx_rir3.clearRect(0, 0, RIR_canvas2.width, RIR_canvas2.height);
	ctx_rir3.beginPath();
	ctx_rir3.strokeStyle = 'grey';
	ctx_rir3.moveTo(receiver.x*scale+x_center,receiver.y*scale+y_center);
	for (ij=0;ij<virtual_sources.length;ij++){
		this_list = virtual_sources[ij];
		for (ik=0;ik<this_list.length;ik++){
			this_VS = this_list[ik]
			if (!this_VS.audible){
				ctx_rir3.moveTo(receiver.x*scale+x_center,receiver.y*scale+y_center);//go to receiver
				ctx_rir3.lineTo(this_VS.source[0]*scale+x_center,this_VS.source[1]*scale+y_center);//line to source
				ctx_rir3.stroke();
			}
		}
	}
	ctx_rir3.closePath();
	ctx_rir3.beginPath();
	ctx_rir3.strokeStyle = 'yellow';
	for (ij=0;ij<virtual_sources.length;ij++){
		this_list = virtual_sources[ij];
		for (ik=0;ik<this_list.length;ik++){
			this_VS = this_list[ik]
			if (this_VS.audible){
				ctx_rir3.moveTo(receiver.x*scale+x_center,receiver.y*scale+y_center);//go to receiver
				ctx_rir3.lineTo(this_VS.source[0]*scale+x_center,this_VS.source[1]*scale+y_center);//line to source
				ctx_rir3.stroke();
			}
		}
	}
	ctx_rir3.closePath();
}
function draw_animation(){
	//linear interpolations
	x_center = (1-animationPhase/N_frames)*prev_status.x + (animationPhase/N_frames)*next_status.x;
	y_center = (1-animationPhase/N_frames)*prev_status.y + (animationPhase/N_frames)*next_status.y;
	scale = (1-animationPhase/N_frames)*prev_status.scale + (animationPhase/N_frames)*next_status.scale;
	///start animation
	old_sim = big_rir_sim.slice(0,big_rir_sim.length-1);
	render_all_source(old_sim);
	draw_path(old_sim,receiver);
	/////end animation
	if (animationPhase>= N_frames){
		clearInterval(animationTimer);
		scale_and_center(big_rir_sim);
		render_all_source(big_rir_sim);
		draw_path(big_rir_sim,receiver);
	}
	animationPhase++;
}
function addData(chart, label_chart, data_chart, color_chart) {
//	console.log(color)
	var dataset = {
			data : data_chart,
			backgroundColor : color_chart,
			label : label_chart
		}
    chart.data.datasets.push(dataset,);
    chart.update();
}
function fillChart(){
	////////////////////////////////////////CHART CODE////////////////////////////////////////////
	var ctx_chart = document.getElementById('delayChart').getContext('2d');  //create a ctx for the chart
	data_approx();  								//approximation of the data in order to have a better visualization of the delays
	barChart = new Chart(ctx_chart, {               //creation of the new chart
		type:'bar',
		data: {
			labels: reflections.delays,
			datasets:[

			]
		},
		options: {
			legend: {
					display: true,
			},
			title: {
			  display: true,
			  text: 'Room Impulse Response'
			},
			scales: {
				xAxes: [{
					stacked: true
				}],
				yAxes: [{
					stacked: true
				}]
			}
		}

	});
	//for cycle to fill the dataset dynamically
	for(i=0;i<=N_iter;i++){
		var data_mag = [];
		var color_data = [];
		for(j=0;j<reflections.delays.length;j++){
			color_data.push(color[i]);
			if(reflections.iter[j]==i){
				data_mag.push(reflections.magnitude[j]);
			}
			else{
				data_mag.push(0);  //add value 0 for the value != num iter that we are considering
			}
		}
		addData(barChart,iter_labels[i],data_mag,color_data); //call the function to fill the chart
	}
	//////////////////////////////////////////////END OF CHART CODE//////////////////////////////////////////////////////
}

/*TODO LIST
-salvataggio/caricamento dati -> capire DB con orlandone
-Sistemare FSM con tutte le features -> dopo il successivo
	-save
	-load
-Frontend ULA -> grafici? informazioni? capire con orlandone
-Backend ULA (parametric)
-Sistemare output audio
*/

///////////////////////////////////////////////////////////////////////////
////////////////////////////////RIR SIM BACKEND////////////////////////////
///////////////////////////////////////////////////////////////////////////

sound_velocity = 340;

function bubbleSort(){//function used to sort the reflection array accordingly with the delays
    let len = reflections.delays.length;
    let swapped;
    do {
        swapped = false;
        for (let i = 0; i < len; i++) {
            if (reflections.delays[i] > reflections.delays[i + 1]) {
				let tmp_delay = reflections.delays[i];
				let tmp_mag = reflections.magnitude[i];
				let tmp_col = reflections.colors[i];
				let tmp_iter = reflections.iter[i];
				reflections.delays[i] = reflections.delays[i + 1];
				reflections.magnitude[i] = reflections.magnitude[i + 1];
				reflections.colors[i] = reflections.colors[i + 1];
				reflections.iter[i] = reflections.iter[i + 1];
				reflections.delays[i + 1] = tmp_delay;
				reflections.magnitude[i + 1] = tmp_mag;
				reflections.colors[i + 1] = tmp_col;
				reflections.iter[i + 1] = tmp_iter;				
                swapped = true;
            }
        }
    } while (swapped);
}
function data_approx(){
	for(k=0;k<reflections.delays.length;k++){
		reflections.delays[k] = Math.round(reflections.delays[k]*10000)/10000;
		reflections.magnitude[k] = Math.round(reflections.magnitude[k]*10000)/10000;	
	}
}
function point_distance(point_a,point_b){
	var distance;
	var x = point_a[0] - point_b[0]
	var y =	point_a[1] - point_b[1];
	distance = Math.sqrt(Math.pow(x,2) + Math.pow(y,2));
	return distance;
}
function mirror_point(edge,source){    
    var x_out;
    var y_out;                   
    if (edge.x_a == edge.x_b){
        x_out = source[0]  + 2 * (edge.x_a - source[0]);
        y_out = source[1];
    }
    else if (edge.y_a == edge.y_b){
        x_out = source[0];
        y_out = source[1] - 2 * (source[1] - edge.y_a);
    }
    else{
    var m = (edge.y_b - edge.y_a)/(edge.x_b - edge.x_a);
    var q = (edge.x_b * edge.y_a - edge.x_a * edge.y_b)/(edge.x_b - edge.x_a);
    var q_perp = source[1] + (1/m) * source[0];
    var x_int = (q_perp - q)/(m + 1/m);
    var y_int = m * x_int + q;
    x_out = source[0] + 2 * (x_int - source[0]);
    y_out = source[1] - 2 * (source[1] - y_int);
    }
    return [x_out,y_out]
}
function mirror_segment(segment,mirror){
    var mirror_segment;
    var p_a = mirror_point(mirror, [segment.x_a,segment.y_a]);
    var p_b = mirror_point(mirror, [segment.x_b,segment.y_b]);
    mirror_segment = {x_a: p_a[0],y_a: p_a[1],x_b: p_b[0],y_b: p_b[1],reflect: segment.reflect};
    return mirror_segment
}
function intersection(edge,point_a,point_b){
    var y_int;
    var x_int;
    var q_ab;
    var m_ab;
    var q_edge;
    var m_edge;
    //check the case when the edge is vertical
    if (edge.x_a == edge.x_b && (point_a[0] != point_b[0] || point_a[1] != point_b[1]) && (Math.max(point_a[0],point_b[0])>edge.x_a) && (Math.min(point_a[0],point_b[0])<edge.x_a)){
        x_int = edge.x_a;
        y_int = (point_b[1] - point_a[1]) * ((x_int - point_a[0])/(point_b[0] - point_a[0])) + point_a[1];
        return [x_int,y_int];
    }
    //check the case when the edge is horizontal
    else if (edge.y_a == edge.y_b && (point_a[0] != point_b[0] || point_a[1] != point_b[1]) && Math.max(point_a[1],point_b[1])>edge.y_a && Math.min(point_a[1],point_b[1])<edge.y_a){
        y_int = edge.y_a;
        x_int = (point_b[0] - point_a[0]) * ((y_int - point_a[1])/(point_b[1] - point_a[1])) + point_a[0];
        return [x_int,y_int];
    }
    else if (point_a[0] == point_b[0]){             //case in which the segment AB is vertical
        if (edge.x_a == edge.x_b){                  //case parallel segments
            return 0;
        }
        else if (edge.y_a == edge.y_b){             //case AB is vertical and edge is horizontal
            if (point_a[0]<= Math.max(edge.x_a,edge.x_b) && point_a[0]>= Math.min(edge.x_a,edge.x_b)){
                x_int = point_a[0];
                y_int = edge.y_a;
            }
            else{return 0}
        }
        else{
            y_int = point_a[1];
            x_int = (edge.x_b - edge.x_a) * ((y_int - edge.y_a)/(edge.y_b - edge.y_a)) + edge.x_a;
        }
    }
    else if (point_a[1] == point_b[1]){             //case in which the segment AB is horizontal
        if (edge.y_a == edge.y_b){                  //case vertical segments
            return 0;
        }
        else if (edge.x_a == edge.x_b){             //case AB is horizontal and edge is vertical
            if (point_a[1]<= Math.max(edge.y_a,edge.y_b) && point_a[1]>= Math.min(edge.y_a,edge.y_b)){
                x_int = edge.x_a;
                y_int = point_a[1];
            }
            else{return 0}
        }
        else{
            x_int = point_a[0];
            y_int = (edge.y_b - edge.y_a) * ((x_int - edge.x_a)/(edge.x_b - edge.x_a)) + edge.y_a;
        }
    }
    else{                                           //other cases
        m_edge = (edge.y_b - edge.y_a)/(edge.x_b - edge.x_a);
        q_edge = edge.y_a - m_edge * edge.x_a;
        m_ab = (point_b[1] - point_a[1])/(point_b[0] - point_a[0]);
        q_ab = point_b[1] - m_ab * point_b[0];
        x_int = (q_ab - q_edge)/(m_edge - m_ab);
        y_int = m_ab * x_int + q_ab;
    }          
	if( (Math.min(point_a[0],point_b[0])<x_int && Math.max(point_a[0],point_b[0])>x_int) &&
		(Math.min(point_a[1],point_b[1])<y_int && Math.max(point_a[1],point_b[1])>y_int) && 
		(Math.min(edge.x_a  ,edge.x_b  )<x_int && Math.max(edge.x_a  ,edge.x_b  )>x_int) &&
		(Math.min(edge.y_a  ,edge.y_b  )<y_int && Math.max(edge.y_a  ,edge.y_b  )>y_int) && x_int != null && y_int != null) {
        return [x_int,y_int];
    }
    else{
        return 0;
    }
}
function RIR_iteration_source(room,source,receiver){
    var virtual_sources = [];
    var this_iteration = [];
    var virt_source;
    var reflect_edge;
    var virt_length;
    virtual_sources.push([{source: source, edge: -1, parent : null, audible: true, attenuation: 1, time: -1, iter: 0}]);
    for (idx=1;idx <= N_iter;idx++){
        virt_length = virtual_sources[idx-1].length;
        for(n=0;n<virt_length;n++){
            source = virtual_sources[idx-1][n].source;
            reflect_edge = virtual_sources[idx-1][n].edge;
            for(j=0;j<room.edges.length;j++){
                if(reflect_edge != j){    
					virt_source = mirror_point(room.edges[j],source);
					atten = virtual_sources[idx-1][n].attenuation * room.edges[j].reflect
                    this_iteration.push({source: virt_source, edge: j, parent: virtual_sources[idx-1][n],audible: true, attenuation: atten, time: -1, iter: idx});
                }
            }
        }  
        virtual_sources.push(this_iteration);  
        this_iteration = [];
    }

	virtual_sources = audibility_check(room, virtual_sources, receiver);
	virtual_sources = time_distance(virtual_sources,receiver);

    return virtual_sources;
}
function audibility_check(room,v_sources,receiver){
	this_illuminator_in_path = [];
	/*
    var s = [];
    var s_prev = [];
    var current_edge;
    var b_inter;
	var a_inter;
	*/
    for(q=0;q<room.edges.length;q++){
        if (intersection(room.edges[q],v_sources[0][0].source,receiver) != 0){
			v_sources[0][0].audible = false;
			/*console.log(room.edges[q])
			console.log(v_sources[0][0].source)
			console.log(receiver)*/
        }
	}
	/*
    for(g=v_sources.length-1;g>=1;g--){
        for(l=v_sources[g].length-1;l>=0;l--){
            current_edge = v_sources[g][l].edge;
            s = v_sources[g][l].source;

            s_prev = v_sources[g][l].parent.source;
            prev_edge = v_sources[g][l].parent.edge;
            b_inter = intersection(room.edges[current_edge],s,receiver);
            if(prev_edge != -1){
                if ( b_inter!= 0){
                    a_inter = intersection(room.edges[prev_edge],b_inter,s_prev);
                    if ( a_inter==0){
                        v_sources[g][l].audible = false;
                    }
                }
                else{
                    v_sources[g][l].audible = false;
                };
            }
            else{
                for(q=0;q<room.edges.length;q++){
                    if (intersection(room.edges[q],b_inter,receiver) != 0 && v_sources[g][l].audible != false && q!=current_edge){
                        v_sources[g][l].audible = false;
                    }
                }
            }
        }
	}*/
	for(g=1; g<v_sources.length;g++){
        for(l=0;l<v_sources[g].length;l++){
			this_source = v_sources[g][l];
			this_point_in_path = this_source;    		//initialization
			this_illuminator_in_path = [...receiver]; 	//initialization
			prev_illuminator_edge_idx = -1;				//init. to avoid approximation errors
			while(this_point_in_path.parent !== null){  //until we arrive to the real source
				edge_idx = this_point_in_path.edge;
				edge = room.edges[edge_idx];			//get the right edge for reflection 
				p_int = intersection(edge,this_illuminator_in_path,this_point_in_path.source);//and the point of reflection
				if (p_int == 0){ 				//no possible reflection?
					this_source.audible = false;//kill this path. source inaudible
					break;						//no need to go on
				}								//otherwise
				for (q=0;q<room.edges.length;q++){//for any edge
					if (q == edge_idx){continue;} //that is not the right one for reflection
					if (q == prev_illuminator_edge_idx){continue;}//nor the one on which stays the illuminator
					obstacle = room.edges[q];	  //let's call it obstacle
					if (intersection(obstacle,this_illuminator_in_path,p_int)!=0){ //check if it crosses the path
						this_source.audible = false;
						break;
					}
				}
				this_illuminator_in_path = [...p_int];			//update
				this_point_in_path = this_point_in_path.parent;	//update
				prev_illuminator_edge_idx = edge_idx;			//update
			}
			if (this_source.audible){//no need to enter here if source is unaudible
				for (q=0;q<room.edges.length;q++){//last part of the while loop is cut away: do the last check!
					if (q==edge_idx){continue;}
					obstacle = room.edges[q];
					if (intersection(obstacle,this_illuminator_in_path,v_sources[0][0].source)!=0){
						this_source.audible = false;
						break;
					}
				}
			}
		}
	}
    return v_sources
}
function mirror_room(room,edge){
    var mirror_edge;
    var m_room = [];
    for(i=0;i<room.edges.length;i++){
        mirror_edge = mirror_segment(room.edges[i],edge);
        m_room.push(mirror_edge);
    }
    return {edges: m_room}
}
function RIR_iteration(room,source,receiver){
    var virtual_sources = [];
    var this_iteration =[];
    var virt_source;
    var virt_room;
    var reflect_edge;
    var virt_length;
    virtual_sources.push([{source: source,room: room, edge: -1}]);
    for (idx=1;idx <= N_iter;idx++){
        virt_length = virtual_sources[idx-1].length;
        for(n=0;n<virt_length;n++){
            room = virtual_sources[idx-1][n].room;
            source = virtual_sources[idx-1][n].source;
            reflect_edge = virtual_sources[idx-1][n].edge;
            for(j=0;j<room.edges.length;j++){
                if(reflect_edge != j){    
                    virt_source = mirror_point(room.edges[j],source);
                    virt_room = mirror_room(room,room.edges[j]);
                    this_iteration.push({source: virt_source,room: virt_room, edge: j});
                }
            }
        }  
        virtual_sources.push(this_iteration);  
        this_iteration = [];
    }
    return virtual_sources;
}
function time_distance(virt_sources,receiver){
	var s;
	var dist;
	var t;
	var delay;
	dist = point_distance(real_source,receiver);
	virt_sources[0][0].time = dist / sound_velocity;
	virt_sources[0][0].attenuation = virt_sources[0][0].attenuation / dist;
	iter_labels.push(iteration[0]);
	if (virt_sources[0][0].audible == true){
		reflections.delays.push(virt_sources[0][0].time);
		reflections.magnitude.push(virt_sources[0][0].attenuation*signal_pow)
		reflections.colors.push(color[0]);
		reflections.iter.push(0);
	}
	for(i=1;i<virt_sources.length;i++){
		iter_labels.push(iteration[i]);
		for(j=0;j<virt_sources[i].length;j++){
			s = virt_sources[i][j];
			dist = point_distance(s.source,s.parent.source);
			t = dist/sound_velocity;
			delay = t + virt_sources[i][j].parent.time;
			s.attenuation = s.attenuation / (delay*sound_velocity);
			virt_sources[i][j].time = delay;
			if (virt_sources[i][j].audible==true){
				reflections.delays.push(delay);
				reflections.magnitude.push(virt_sources[i][j].attenuation*signal_pow);
				reflections.colors.push(color[virt_sources[i][j].iter]);
				reflections.iter.push(virt_sources[i][j].iter);
			}
		}
	}
	bubbleSort();
	return virt_sources;
}
function ULA_responses(room,source,ULA){
	N_iter = 5;
	var responses = [];
	var this_receiver = {};
	for (mic_idx = 0; mic_idx<ULA.N_mic; mic_idx++){
		this_receiver.x = ULA.x-Math.cos(ULA.angle)*0.5*ULA.aperture + mic_idx*ULA.aperture*Math.cos(ULA.angle)/(ULA.N_mic-1);
		this_receiver.y = ULA.y-Math.sin(ULA.angle)*0.5*ULA.aperture + mic_idx*ULA.aperture*Math.sin(ULA.angle)/(ULA.N_mic-1);
		
		var big_tree = RIR_iteration_source(room,source,[this_receiver.x,this_receiver.y]);
		
		var this_response = [];
		for (hh=0;hh<big_tree.length;hh++){
			this_iteration = big_tree[hh];
			for (jj=0;jj<this_iteration.length;jj++){
				this_source = this_iteration[jj];
				this_response.push({time:this_source.time,attenuation:this_source.attenuation});
			}
		}
		responses.push(this_response);
	}
	return responses;
}
function compile_buffer(v_sources){
	for(ij=0;ij<v_sources.length;ij++){
		this_iteration = v_sources[ij];
		for(ki=0;ki<this_iteration.length;ki++){
			this_source = this_iteration[ki];
			if (this_source.audible){
				sample = Math.round(this_source.time*audioCtx.sampleRate);
				level = this_source.attenuation;
				myBuffer.getChannelData(0)[sample] += level;//left channel
				myBuffer.getChannelData(1)[sample] += level;//right channel
			}
		}
	}
}
function full_simulation_single_receiver(){
	N_iter = 10;
	big_rir_sim = RIR_iteration_source(my_room,real_source,[receiver.x,receiver.y]);
	compile_buffer(big_rir_sim);
}
function SignalsClass(){
	this.to_complex = function (input_array){//complex "real" numbers
		var output_array = [];
		input_array.forEach(function(val,idx){
			output_array[idx] = new math.complex(val,0);
		})
		return output_array;
	}
	this.to_cartesian = function (p){//for nthRoots, it's in polar coords
		re = p.r * Math.cos(p.phi);
		im = p.r * Math.sin(p.phi);
		c = new math.complex(re,im);
		return c;
	}
	this.FFT = function (input_array){//no need to explain
		if (input_array.length == 1){return input_array;}//base step for recursion
		else {
			complex_1 = math.complex(1,0);
			var W = this.to_cartesian(math.nthRoot(complex_1,input_array.length)[1]);
			var w_e = [];
			var w_o = [];
			var even_array = [];
			var odd_array = [];
			for (y=0;y<input_array.length;y+=2){ //compile even and odd arrays
				even_array.push(input_array[y]);
				odd_array.push(input_array[y+1]);
			}
			for (y=0;y<input_array.length/2;y++){w_e.push(math.pow(W,y));}//compile coefficients array
			for (y=input_array.length/2;y<input_array.length;y++){w_o.push(math.pow(W,y));}
			var E = this.FFT(even_array);//recursion
			var O = this.FFT(odd_array); //recursion
			var out_1 = math.add(E,math.dotMultiply(O,w_e));//coefficients
			var out_2 = math.add(E,math.dotMultiply(O,w_o));
			return out_1.concat(out_2);
		}
	}
	this.pad = function (input_array,n){//zero padding
		input_array = input_array.slice(0,n);
		output = new Array(n).fill(0);
		input_array.forEach(function(val,idx){
			output[idx] = val;
		})
		return output;
	}
	this.convolve = function (array_1,array_2){
		window1 = [...array_1];
		window2 = [...array_2];
		window1 = this.pad(window1,array_1.length+array_2.length-1);
		for (k=1;k<array_2.length;k++){
			window1[-k] = 0;//math.complex(0,0);
		}
		output = [];
		for (z=-array_2.length+1; z<array_1.length;z++){
			var sum = 0;//math.complex(0,0);
			for (j=0;j<array_2.length;j++){
				sum = math.add(sum, math.multiply(window1[j+z],window2[j]));
			}
			output.push(sum);
		}
		return output;
	}
	this.sine = function (N,f){
		var w_n = 2*Math.PI*f/audioCtx.sampleRate;
		var output = [];
		for (var e=0;e<N;e++){
			output.push(Math.cos(w_n*e));
		}
		return output;
	}
	return this;
}
Signals = new SignalsClass();

function full_simulation_ULA(freq,duration,step_degrees){
	var duration_pow_2 = Math.pow(2,Math.ceil(Math.log2(duration)));
	var sine = Signals.sine(duration_pow_2,freq);
	var sine_fft = Signals.FFT(Signals.to_complex(sine));
	var ULA_data = ULA_responses(my_room,real_source,my_ULA);//contains reflection objects
	var ULA_data_timeDomain = []; //Sampled impulse response
	var ULA_data_freqDomain = []; //init
	for (var x=0;x<ULA_data.length;x++){
		var this_row = ULA_data[x];
		var this_output_row = new Array(duration).fill(0);
		for (var y=0;y<this_row.length;y++){
			var this_pulse = this_row[y];
			if (this_pulse.time*audioCtx.sampleRate<duration){
				this_output_row[Math.floor(this_pulse.time*audioCtx.sampleRate)] += this_pulse.attenuation;
			}
		}
		this_output_row = Signals.pad(this_output_row,duration_pow_2);
		ULA_data_timeDomain.push(this_output_row);
		this_output_row = Signals.FFT(Signals.to_complex(this_output_row));
		this_output_row = math.dotMultiply(this_output_row,sine_fft);
		ULA_data_freqDomain.push(this_output_row);
	}
	//return ULA_data_freqDomain;
	//finally GOT THE DATA from the mics
	var omega_c = freq*2*Math.PI;
	var d = my_ULA.aperture/(my_ULA.N_mic-1);
	//DAS BEAMFORMER
	var p_spectrum = [];
	for (var theta=-90;theta<=90;theta+=step_degrees){
		var omega_s = d*omega_c*Math.sin(Math.PI/180 * theta)/sound_velocity;
		var a = [];
		for (var c=0;c<my_ULA.N_mic;c++){
			a.push(math.exp(math.multiply(math.complex(0,-1),c*omega_s)));
		}//GOT the steering vector
		var power = math.complex(0,0);
		for (var c=0;c<my_ULA.N_mic;c++){
			power = math.add(power,math.sum(math.multiply(a[c],ULA_data_freqDomain[c])));
		}
		p_spectrum.push(power.abs());
	}
	return p_spectrum;
}
///////////////////////////////////////////////////////////////////////////
/////////////////////////////////AUDIO PLAYOUT/////////////////////////////
///////////////////////////////////////////////////////////////////////////

audioCtx = new AudioContext();
BUFFER_DURATION = 3;
myBuffer = audioCtx.createBuffer(2,audioCtx.sampleRate*BUFFER_DURATION,audioCtx.sampleRate);

function play_buffer(){
	var source = audioCtx.createBufferSource();
	// set the buffer in the AudioBufferSourceNode
	source.buffer = myBuffer;
	// connect the AudioBufferSourceNode to the
	// destination so we can hear the sound
	source.connect(audioCtx.destination);
	// start the source playing
	source.start();
}
function convolve(idx){
	myConv = audioCtx.createConvolver();
	if (idx==0){
		myConv.buffer = myBuffer;
		var audio = new Audio("elephant_snarl.wav");
		//audio.crossOrigin = "anonymous";
		var source = audioCtx.createMediaElementSource(audio);
		source.connect(audioCtx.destination);
		//source.connect(myConv);
		//myConv.connect(audioCtx.destination);
		audio.play();
	}
}