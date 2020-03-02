var fs = require('fs');
var path = require('path');

var OnFolderScanCallback = undefined;
var OnFileFoundCallback = undefined;
var OnFileParsingCallback = undefined;
var OnFileDoneCallback = undefined;

function IsDirectory(dir,callback){ fs.stat(dir, function(err, stat) { callback((stat && stat.isDirectory())); }); }

function IsExtensionFile(file,extension)
{
  var extensionLength = extension.length+1;
  return file.length > extensionLength && file.indexOf('.'+extension) == file.length-extensionLength;
}

function ParseCompilerData(file,callback,doneCallback)
{
  if (IsExtensionFile(file,'json'))
  {
    if (OnFileFoundCallback) OnFileFoundCallback(file);
    fs.readFile(file, 'utf8', function(err, data){
      if (err){ console.log(err); }
      else if (data.startsWith('{"traceEvents":') || data.startsWith('{ "traceEvents":')){
        if (OnFileParsingCallback) OnFileParsingCallback(file);
        callback(file,data);
      }
      if (OnFileDoneCallback) OnFileDoneCallback(file);
      doneCallback();
    });
  }
  else
  {
    doneCallback();
  }
}

function ParseDir(dir,callback,doneCallback)
{
  if (OnFolderScanCallback) OnFolderScanCallback(dir);
  fs.readdir(dir, function(err, list) {
    if (err) { doneCallback(err); return; }
    var pending = list.length;
    if (pending == 0) return;
    list.forEach(function(file) {
      file = path.resolve(dir, file);
      fs.stat(file, function(err, stat) {
        if (stat && stat.isDirectory())
        {
          ParseDir(file, callback, function(error){
            if (error) doneCallback(error);
            else if (!--pending) doneCallback();
          });
        }
        else
        {
          ParseCompilerData(file,callback,function(error){
            if (error) doneCallback(error);
            else if (!--pending) doneCallback();
          });
        };
      });
    });
  });
}

function ParsePath(path,callback,doneCallback)
{
  IsDirectory(path,function(isDirectory){
    if (isDirectory){ ParseDir(path,callback,doneCallback); }
    else { ParseCompilerData(path,callback,doneCallback); }
  });
}

function ParsePaths(paths,callback,doneCallback)
{
  var sz = paths.length;
  if (sz == 0) doneCallback();

  var pending = sz;
  for (var i=0;i<sz;++i)
  {
    ParsePath(paths[i],callback,function(error){
      if (error) doneCallback(error);
      else if (!--pending) doneCallback();
    })
  }
}

function LoadSingleFile(file,callback)
{
  fs.readFile(file, 'utf8', function(err, data){
    if (err){ console.log(err); callback(undefined); }
    else callback(data);
  });
}

exports.ParsePaths     = ParsePaths;
exports.LoadSingleFile = LoadSingleFile;

exports.SetOnFolderScan  = function(func) { OnFolderScanCallback = func; }
exports.SetOnFileFound   = function(func) { OnFileFoundCallback = func; }
exports.SetOnFileParsing = function(func) { OnFileParsingCallback = func; }
exports.SetOnFileDone    = function(func) { OnFileDoneCallback = func; }
