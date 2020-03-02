var Defs   = require('./defs.js')
var FileIO = require('./fileIO.js')

var path = require('path');

var OnFinalizingCallback = undefined;

function FillGlobalData(element,globals,objectDB)
{
  if (element.type < Defs.NodeNatureData.GLOBAL_GATHER_THRESHOLD)
  {
    var globalCollection = globals[element.type];

    var found = globalCollection[element.label];
    if (found == undefined)
    {
      globalCollection[element.label] = {min: element.duration, minRef: objectDB, max: element.duration, maxRef: objectDB, acc: element.duration, num: 1};
    }
    else
    {
      var targetElement = found;

      if ( targetElement.min > element.duration )
      {
        targetElement.min = element.duration;
        targetElement.minRef = objectDB;
      }

      if ( targetElement.max < element.duration )
      {
        targetElement.max = element.duration;
        targetElement.maxRef = objectDB;
      }

      targetElement.acc += element.duration;
      ++targetElement.num;
    }
  }
}

function CreateObjectData(file,events,globals)
{
  var nodes = [];
  var objectDB = { info: { label: path.basename(file).replace(/\.[^/.]+$/, "")}};

  //replace this foreach
  for (var i=0,sz=events.length;i<sz;++i)
  {
    var element = events[i];
    if (element.tid == 0 && element.name != 'process_name')
    {
      var node = {label: element.args.detail, type: Defs.NodeNatureFromString(element.name), start: element.ts, duration: element.dur, maxDepth: 0, children: []};
      if (node.type == Defs.NodeNature.SOURCE){ node.label = path.basename(node.label); }
      if (node.type == Defs.NodeNature.EXECUTECOMPILER){ node.label = objectDB.info.label; }
      nodes.push(node);
      FillGlobalData(node,globals,objectDB);
    }
  }

  if (nodes.length > 0)
  {
    nodes.sort(function(a,b){ return a.start == b.start? b.duration - a.duration : a.start - b.start; });

    var root = nodes[0];

    var offsetCorrection = root.start; //Fix nodes as main process does not start at 0
    root.start = 0;

    var layers = [{node: root, end: root.start + root.duration }];
    var totals = Array(Defs.NodeNatureData.COUNT).fill(0);

    for (var i=1,sz=nodes.length;i<sz;++i)
    {
      var element = nodes[i];
      element.start -= offsetCorrection;
      var currentLayer = layers.length;
      if (element.start >= layers[currentLayer-1].end)
      {
        //pop all layers that are past the current timeline
        do { layers.pop() }
        while(element.start >= layers[layers.length-1].end);
      }

      //Add Child and check if same time
      var parentNode = layers[layers.length-1].node;

      //change of type ( no overlap, just add to totals )
      if (parentNode.type != element.type){ totals[element.type] += element.duration; }

      layers.push( {node: element, end: element.start + element.duration } );
    }

    objectDB.file = file;

    var objInfo = objectDB.info;
    objInfo.duration = root.duration;

    for (var i=0;i<Defs.NodeNatureData.GLOBAL_DISPLAY_THRESHOLD;i++) objInfo[Defs.NodeNatureToKey(i)] = totals[i];
  }

  return objectDB;
}

function CreateTreeRoot(file,events)
{
  var nodes = [];
  var baseLabel = path.basename(file).replace(/\.[^/.]+$/, "");

  //replace this foreach
  for (var i=0,sz=events.length;i<sz;++i)
  {
    var element = events[i];
    if (element.tid == 0 && element.name != 'process_name')
    {
      var node = {label: element.args.detail, type: Defs.NodeNatureFromString(element.name), start: element.ts, duration: element.dur, maxDepth: 0, children: []};
      if (node.type == Defs.NodeNature.SOURCE){ node.label = path.basename(node.label); }
      if (node.type == Defs.NodeNature.EXECUTECOMPILER){ node.label = baseLabel; }
      nodes.push(node);
    }
  }

  if (nodes.length > 0)
  {
    nodes.sort(function(a,b){ return a.start == b.start? b.duration - a.duration : a.start - b.start; });

    var root = nodes[0];

    var offsetCorrection = root.start; //Fix nodes as main process does not start at 0
    root.start = 0;

    var layers = [{node: root, end: root.start + root.duration }];

    for (var i=1,sz=nodes.length;i<sz;++i)
    {
      var element = nodes[i];
      element.start -= offsetCorrection;
      var currentLayer = layers.length;
      if (element.start >= layers[currentLayer-1].end)
      {
        //pop all layers that are past the current timeline
        do { layers.pop() }
        while(element.start >= layers[layers.length-1].end);
      }

      //Add Child and check if same time
      var parentNode = layers[layers.length-1].node;

      //propagate maxLayer
      var currentLayer = layers.length;
      var k=currentLayer-1;
      while(k>=0){
        var pNode = layers[k].node;
        if (pNode.maxDepth >= currentLayer) break;
        pNode.maxDepth = currentLayer;
        --k;
      }

      element.maxDepth = currentLayer;
      parentNode.children.push(element);

      layers.push( {node: element, end: element.start + element.duration } );
    }

    return root;
  }

  return undefined;
}

function AddToTotal(total, obj)
{
  for (var i=0;i<Defs.NodeNatureData.GLOBAL_DISPLAY_THRESHOLD;i++)
  {
    var key = Defs.NodeNatureToKey(i);
    if (total[key] == undefined) total[key] = 0;
    total[key] += obj.info[key];

  }
}

function FinalizeGlobalData(source, target)
{
  for(var i=0;i<source.length;++i)
  {
    var container = source[i];
    var targetContainer = target[i];
    for (var key in container)
    {
      var entry = container[key];
      targetContainer.push({
          info:{ label: key, acc: entry.acc, min: entry.min, max: entry.max, num: entry.num, avg: Math.round((entry.acc*100)/entry.num)/100 },
          loc: { min: entry.minRef, max: entry.maxRef }
        });
    }
  }
}

function Collect(paths, doneCallback)
{
  var database = { global: [], total: [], objects:[] };

  var global = [];
  for (var i=0;i<Defs.NodeNatureData.GLOBAL_GATHER_THRESHOLD;i++) { database.global.push([]); global.push({}) }

  FileIO.ParsePaths(paths,
    function(file,content)
    {
      var obj = JSON.parse(content);
      if (obj.traceEvents)
      {
        var obj = CreateObjectData(file,obj.traceEvents,global);
        AddToTotal(database.total,obj);
        database.objects.push(obj);
      }
    },
    //done callback
    function(error)
    {
      if (error)
      {
        console.log(error);
        doneCallback({error: error});
      }
      else if (database.objects.length == 0)
      {
        doneCallback(database);
      }
      else
      {
        if (OnFinalizingCallback) OnFinalizingCallback();
        FinalizeGlobalData(global,database.global);
        doneCallback(database);
      }
    }
  );
}

function CreateTreeFromFile(file,callback)
{
  FileIO.LoadSingleFile(file,function(content){
    if (content == undefined)
    {
      callback(undefined);
    }
    else
    {
      var obj = JSON.parse(content);
      if (obj.traceEvents)
      {
        callback(CreateTreeRoot(file,obj.traceEvents));
      }

    }
  });
}

exports.Load = Collect;
exports.CreateTreeFromFile = CreateTreeFromFile;

exports.SetOnFolderScan  = function(func) { FileIO.SetOnFolderScan(func); }
exports.SetOnFileFound   = function(func) { FileIO.SetOnFileFound(func); }
exports.SetOnFileParsing = function(func) { FileIO.SetOnFileParsing(func); }
exports.SetOnFileDone    = function(func) { FileIO.SetOnFileDone(func); }
exports.SetOnFinalizing  = function(func) { OnFinalizingCallback = func; }
