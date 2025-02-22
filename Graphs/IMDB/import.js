var fs=require("fs");
(function() {
  var console = require("console");
  var internal = require("internal");
  var db = internal.db;
 
  var vName = "imdb_vertices";
  var eName = "imdb_edges";
  var gName = "imdb";
  var gm = require('@arangodb/general-graph');
  var g;
  try {
    g = gm._create(gName);
    g.drop();
  } catch (e) {

  }
  g = gm._create(gName);
  g._addVertexCollection(vName);
  var rel = gm._relation(eName, vName, vName);
  g._extendEdgeDefinitions(rel);
  var genres = {};
  
  var toKey = function(d) {
    return d.toLowerCase().replace(" ", "-");
  };

  var storeVertex = function(d) {
    if (d.releaseDate) {
      var datF = new Date(parseInt(d.releaseDate));
      datF = datF.getFullYear();
      datF = Math.floor(datF / 10) * 10;
      datS = datF + 10;
      var dat = datF + "-" + datS;
      d.released = dat;
    }
    g.addVertex(d._key, d);
    if (d.genre) {
      var gK = toKey(d.genre);
      if (!genres[gK]) {
        genres[gK] = true;
        g.addVertex(gK, {label: d.genre});
      }
      g.addEdge(gK, d._key, null, "has_movie");
    }
  };

  var storeEdge = function(d) {
    var to = d._to;
    var from = d._from;

    delete d._key;
    try {
      g.addEdge(from, to, null, d["$label"], d);
    } catch (e) {
      console.log("Failed:", from, "->", to);
    }
  };

  var verticesCollection = db._collection(vName);
  verticesCollection.ensureFulltextIndex("description", 3);
  verticesCollection.ensureFulltextIndex("title", 3);
  verticesCollection.ensureFulltextIndex("name", 3);
  verticesCollection.ensureFulltextIndex("birthplace", 3);

  internal.processJsonFile(fs.join(__dirname, "nodes.json"), storeVertex);
  internal.processJsonFile(fs.join(__dirname, "edges.json"), storeEdge);
}());
