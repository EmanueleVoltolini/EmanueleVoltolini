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
var real_source = [5,7];
var N_iter = 0;
receiver = {x:1,y:1};
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
	if (idx==5){
		schermata_6.style.display = "inline";
		setup_simulation2();
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
	my_room = room; //DEBUG

	schermata_attuale = 0;
	render_schermata(schermata_attuale);
}

///////////////////////////////////////////////////////////////////////////
////////////////////////////////RIR SIM FRONTEND///////////////////////////
////////////////////////////////METODO ORLANDYNO///////////////////////////
///////////////////////////////////////////////////////////////////////////

//RIR SIM CONTROLLER
function setup_simulation(){
	RIR_canvas.height = window.innerHeight-20;
	RIR_canvas.width  = window.innerWidth -20;
	render_all(RIR_iteration(my_room,real_source,0));
}
function prev_iter(){
	N_iter--;
	render_all(RIR_iteration(my_room,real_source,0)); //FIXME
}
function next_iter(){	
	N_iter++;
	render_all(RIR_iteration(my_room,real_source,0)); //FIXME
}

//RIR SIM RENDER
var ctx_rir = RIR_canvas.getContext("2d");
var x_center = Math.round(window.innerWidth/2);			//
var y_center = Math.round(window.innerHeight/2);		// scaling variables init
var scale = 10;											//

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
	ctx_rir.drawImage(dino,scale*x+x_center,scale*y+y_center);
}

///////////////////////////////////////////////////////////////////////////
////////////////////////////////RIR SIM FRONTEND///////////////////////////
//////////////////////////////////METODO SARTI/////////////////////////////
///////////////////////////////////////////////////////////////////////////

//RIR SIM CONTROLLER
function setup_simulation2(){
	RIR_canvas2.height = window.innerHeight-20;
	RIR_canvas2.width  = window.innerWidth -20;
	render_all_source(RIR_iteration_source(my_room,real_source,0));
}
function prev_iter_source(){
	N_iter--;
	render_all_source(RIR_iteration_source(my_room,real_source,0)); //FIXME
}
function next_iter_source(){	
	N_iter++;
	render_all_source(RIR_iteration_source(my_room,real_source,0)); //FIXME
}

//RIR SIM RENDER
var ctx_rir2 = RIR_canvas2.getContext("2d");
var x_center = Math.round(window.innerWidth/2);			//
var y_center = Math.round(window.innerHeight/2);		// scaling variables init
var scale = 10;											//

function render_all_source(virtual_sources){
	clear_canvas();
	var extremes = {x_max:0,x_min:0,y_max:0,y_min:0}; //evaluate center and scaling factor
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
	scale = Math.floor(Math.min(RIR_canvas2.height/drawHeight,RIR_canvas2.width/drawWidth)*0.92);

	x_center = Math.round(RIR_canvas2.width/2 - scale*(extremes.x_max + extremes.x_min)/2);
	y_center = Math.round(RIR_canvas2.height/2 - scale*(extremes.y_max + extremes.y_min)/2);
	//actual render
	render_room2(my_room,virtual_sources[0][0].source,"red");
	my_room.edges.forEach(draw_line);
	for (j=0;j<virtual_sources.length;j++){
		this_list = virtual_sources[j];
		for (k=0;k<this_list.length;k++){
			this_VS = this_list[k];
			render_source2(this_VS.source[0],this_VS.source[1]);
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
	render_source2(source_[0],source_[1]);
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
function render_source2(x,y){
	ctx_rir2.globalAlpha = 1;
	ctx_rir2.drawImage(dino,scale*x+x_center,scale*y+y_center);
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

/*TODO LIST

-Capire dove si mette la sorgente!!
-Sistemare FSM con tutte le features
*/

///////////////////////////////////////////////////////////////////////////
////////////////////////////////RIR SIM BACKEND////////////////////////////
///////////////////////////////////////////////////////////////////////////

///////////////////////////////////////FUNCTION DECLARATION///////////////////////////////

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

function mirror_room(room,edge){
    var mirror_edge;
    var m_room = [];
    for(i=0;i<room.edges.length;i++){
        mirror_edge = mirror_segment(room.edges[i],edge);
        m_room.push(mirror_edge);
    }
    return {edges: m_room}
}

function intersection(edge,point_a,point_b){
    var y_int;
    var x_int;
    var q_ab;
    var m_ab;
    var q_edge;
    var m_edge;
    //check the case when the edge is vertical
    if (edge.x_a == edge.x_b && (point_a[0] != point_b[0] || point_a[1] != point_b[1])){
        y_int = edge.y_a;
        x_int = (point_b[0] - point_a[0]) * ((y_int - point_a[1])/(point_b[1] - point_a[1])) + point_a[0];
    }
    //check the case when the edge is horizontal
    else if (edge.y_a == edge.y_b && (point_a[0] != point_b[0] || point_a[1] != point_b[1])){
        x_int = edge.x_a;
        y_int = (point_b[1] - point_a[1]) * ((x_int - point_a[0])/(point_b[0] - point_a[0])) + point_a[1];
    }
    else if (point_a[0] == point_b[0]){             //case in which the segment AB is vertical
        if (edge.x_a == edge.x_b){                  //case parallel segments
            return 0;
        }
        else if (edge.y_a == edge.y_b){             //case AB is vertical and edge is horizontal
            if (point_a[0]<= Math.max(edge.x_a,edge.x_b) && point_a[0]>= Math.min(edge.x_a,edge.x_b)){
                return [x_int,y_int];
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
                return [x_int,y_int];
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
    if((Math.min(edge.x_a,edge.x_b)<=x_int && Math.max(edge.x_a,edge.x_b)>=x_int)||(Math.min(edge.y_a,edge.y_b)<=y_int && Math.max(edge.y_a,edge.y_b)>=y_int)){
        return [x_int,y_int];
    }
    else{
        return 0;
    }
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

function RIR_iteration_source(room,source,receiver){
    var virtual_sources = [];
    var this_iteration =[];
    var virt_source;
    var reflect_edge;
    var virt_length;
    virtual_sources.push([{source: source, edge: -1, parent : null, audible: false, attenuation: 1}]);
    for (idx=1;idx <= N_iter;idx++){
        virt_length = virtual_sources[idx-1].length;
        for(n=0;n<virt_length;n++){
            source = virtual_sources[idx-1][n].source;
            reflect_edge = virtual_sources[idx-1][n].edge;
            for(j=0;j<room.edges.length;j++){
                if(reflect_edge != j){    
					virt_source = mirror_point(room.edges[j],source);
					atten = virtual_sources[idx-1][n].attenuation * room.edges[j].reflect
                    this_iteration.push({source: virt_source, edge: j, parent: virtual_sources[idx-1][n],audible: false, attenuation: atten});
                }
            }
        }  
        virtual_sources.push(this_iteration);  
        this_iteration = [];
    }
    return virtual_sources;
}