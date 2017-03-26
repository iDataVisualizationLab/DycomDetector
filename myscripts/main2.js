/* 2017
 * Tommy Dang, Assistant professor, iDVL@TTU
 *
 * THIS SOFTWARE IS BEING PROVIDED "AS IS", WITHOUT ANY EXPRESS OR IMPLIED
 * WARRANTY.  IN PARTICULAR, THE AUTHORS MAKE NO REPRESENTATION OR WARRANTY OF ANY KIND CONCERNING THE MERCHANTABILITY
 * OF THIS SOFTWARE OR ITS FITNESS FOR ANY PARTICULAR PURPOSE.
 */


var graphByMonths = [];
var termList = {}; // List of term to feed to TimeArcs in main.js

function computeMonthlyGraphs() {
    for (var m = 1; m < numMonth; m++) {
        var arr = [];
        for (var i = 0; i < termArray.length; i++) {
            var att = termArray[i].term;
            if (terms[att][m]) {
                var obj = new Object();
                var previous = 0;
                if (terms[att][m - 1])
                    previous = terms[att][m - 1];
                var net = (terms[att][m] + 1) / (previous + 1);
                obj.term = att;
                obj.net = net;
                obj.count = terms[att][m];
                obj.category = termArray[i].category;
                obj.m = m;
                arr.push(obj);
            }
        }

        arr.sort(function (a, b) {
            if (a.count < b.count) {
                return 1;
            }
            if (a.count > b.count) {
                return -1;
            }
            return 0;
        });
        var arr2 = arr.filter(function (d, i) {
            return i < 100;
        });

        var cut = 1;
        graphByMonths[m] = [];
        while (cut < 30) {
            // *********** VERTICES **************
            var nodes5 = [];
            for (var i = 0; i < arr2.length; i++) {
                var nod = new Object();
                nod.id = i;
                nod.m = m;
                nod.category = arr2[i].category;
                nod.name = arr2[i].term;
                nod.net = arr2[i].net;
                nod.x = xStep + xScale(nod.m);   // 2016 initialize x position
                nod.y = height / 2;

                //if (termArray3[i].isConnected>0)  // Only allow connected items
                nodes5.push(nod);

                termList[nod.name] = nod;// List of term to feed to TimeArcs in main.js
            }
            // *********** EDGES **************
            var links5 = [];
            var relationshipMax5 = 0;
            // for(var cut=1; cut<30;cut++){
            for (var i = 0; i < nodes5.length; i++) {
                var term1 = nodes5[i].name;
                for (var j = i + 1; j < nodes5.length; j++) {
                    var term2 = nodes5[j].name;
                    if (relationship[term1 + "__" + term2] && relationship[term1 + "__" + term2][m] >= cut) {
                        var l = new Object();
                        l.source = nodes5[i];
                        nodes5[i].isConnected = true;
                        l.target = nodes5[j];
                        nodes5[j].isConnected = true;
                        l.count = relationship[term1 + "__" + term2][m];
                        l.m = m;
                        links5.push(l);
                        if (relationship[term1 + "__" + term2][m] > relationshipMax5)
                            relationshipMax5 = relationship[term1 + "__" + term2][m];
                    }
                }
            }


            var tempnodes = nodes5.filter(function (d, i) {
                return d.isConnected;
            });
            var templinks = links5;
            if(tempnodes.length==0&&templinks.length==0){
                break;
            }

            var graph = {};
            graph.nodes = tempnodes;
            graph.links = templinks;

            var node_ids = [], link_ids = [];
            tempnodes.forEach(function (d) {
                node_ids.push(d.id);
            });
            templinks.forEach(function (d) {
                link_ids.push({"source": d.source.id, "target": d.target.id, "weight": 1})
            });

            var community = jLouvain().nodes(node_ids).edges(link_ids)();
            var adjmatrix = create_adjmatrix(graph);
            graph.nodes.forEach(function (d) {
                d.community = community[d.id];
            });

            var groups = d3.nest()
                .key(function (d) {
                    return d.community;
                })
                .entries(graph.nodes);
            var partition = [];
                groups.forEach(function (d) {
                    var par = [];
                    d.values.forEach(function (a) {
                        par.push(graph.nodes.findIndex(x => x.id == a.id)
                        )
                    });
                    partition.push(par);
                })
            graph.Qmodularity = modularity(partition, adjmatrix);
            graph.cutoff = cut;
            graphByMonths[m].push(graph);
            cut += 1;
        }
        //console.log(graphByMonths[m].sort(function (a,b) {
        //    return b.Qmodularity - a.Qmodularity
        //}));
         updateSubLayout(graphByMonths[m][0].nodes, graphByMonths[m][0].links, m);
    }
}