///////////////////////////////////////VARIABLE DECLARATION/////////////////////////////////

var edge = {x_a:0, y_a:0, x_b:3, y_b:3 ,reflect:1};
var start = 0;
var zoom = 0;
var source = [2,1];
var receiver = [1,2];
var reflect = 1;

///////////////////////////////////////FUNCTION DECLARATION///////////////////////////////
/*function RIR_estimation(room,source,receiver){
    for (i=0,i<(room.vertex).length,i++){
    mirror_source(room.vertex[i],source);
    }
}*/

function mirror_source(edge,source){
    if (edge.x_a == edge.x_b){
        x_out = source[0]  + 2 * (edge.x_a - source[0]);
        y_out = source[1];
    }
    else if (edge.y_a == edge.y_b){
        x_out = source[0];
        y_out = source[1] - 2 * (source[1] - edge.y_a);
    }
    else{
    var m = ((edge.y_b - edge.y_a)/(edge.x_b - edge.x_a));
    var q = edge.y_a - m * edge.x_a;
    var dist = Math.abs(source[1] - (m*source[0] + q)) / Math.sqrt(1 + Math.pow(m,2));
    var x_out = source[0] + 2 * dist / (Math.sqrt(1 + 1/Math.pow(m,2)));
    var y_out = source[1] - (x_out - source[0])/m;
    }
    return [x_out,y_out]
}

function intersection(edge,point_a,pont_b){

}