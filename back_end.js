///////////////////////////////////////VARIABLE DECLARATION/////////////////////////////////

var edge = {x_a:0, y_a:0, x_b:3, y_b:3 ,reflect:1};
var start = 0;
var zoom = 0;
var source = [2,1];
var receiver = [1,2];
var reflect = 1;

///////////////////////////////////////FUNCTION DECLARATION///////////////////////////////

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
                return 1;
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
                return 1;
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
        return 1;
    }
    else{
        return 0;
    }
}