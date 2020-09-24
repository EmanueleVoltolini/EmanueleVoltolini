///////////////////////////////////////VARIABLE DECLARATION/////////////////////////////////

var edge = {x_a:0, y_a:0, x_b:3, y_b:3 ,reflect:1};
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
var real_source = [2,1];
var receiver = [1,2];
var N_iter = 3;

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
    if((Math.min(edge.x_a,edge.x_b)<=x_int && Math.max(edge.x_a,edge.x_b)>=x_int)&&(Math.min(edge.y_a,edge.y_b)<=y_int && Math.max(edge.y_a,edge.y_b)>=y_int && x_int && y_int)){
        return [x_int,y_int];
    }
    else{
        return 0;
    }
}

function RIR_iteration_source(room,source,receiver){
    var virtual_sources = [];
    var this_iteration =[];
    var virt_source;
    var reflect_edge;
    var virt_length;
    virtual_sources.push([{source: source, edge: -1, parent : null, audible: true, attenuation: 1}]);
    for (idx=1;idx <= N_iter;idx++){
        virt_length = virtual_sources[idx-1].length;
        for(n=0;n<virt_length;n++){
            source = virtual_sources[idx-1][n].source;
            reflect_edge = virtual_sources[idx-1][n].edge;
            for(j=0;j<room.edges.length;j++){
                if(reflect_edge != j){    
					virt_source = mirror_point(room.edges[j],source);
					atten = virtual_sources[idx-1][n].attenuation * room.edges[j].reflect
                    this_iteration.push({source: virt_source, edge: j, parent: virtual_sources[idx-1][n],audible: true, attenuation: atten});
                }
            }
        }  
        virtual_sources.push(this_iteration);  
        this_iteration = [];
    }

    virtual_sources = audibility_check(room, virtual_sources, receiver);

    return virtual_sources;
}

function audibility_check(room,v_sources,receiver){
    var s = [];
    var s_prev = [];
    var current_edge;
    var b_inter;
    var a_inter;
    for(q=0;q<room.edges.length;q++){
        if (intersection(room.edges[q],v_sources[0][0].source,receiver) != 0){
            v_sources[0][0].audible = false;
        };
    }
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
                        //CODICE PRECEDENTE
                        v_sources[g][l].audible = false;
                    }
                }
                else{
                    v_sources[g][l].audible = false;
                };
            }
        }
    }
    return v_sources
}

                        //CODICE PRECEDENTE
                        //DA CONTROLLARE PROBABILMENTE SBAGLIATO FACCIO UN CONTROLLO INUTILE
                        /*for(q=0;q<room.edges.length;q++){
                            if (intersection(room.edges[q],a_inter,receiver) != 0 && v_sources[g][l].audible != false){
                                v_sources[g][l].audible = false;
                            };
                        else{
                        v_sources[g][l].audible = false;
                        }
                        }*/