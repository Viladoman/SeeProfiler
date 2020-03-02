var Interface = require('./interface.js')

const {dialog} = require('electron').remote;

var hardcodedDir = undefined;
//hardcodedDir = '... Your Hardcoded path here for fast development ...';

function OpenFilesDialog(callback) { dialog.showOpenDialog({ properties: ['openFile', 'multiSelections'], filters: [{ name: 'Json', extensions: ['json'] }] }, callback); }
function OpenDirsDialog(callback) { dialog.showOpenDialog({ properties: [ 'openDirectory', 'multiSelections'] }, callback); }

function Cover()
{
  var _this = this;
  this.containerElement = undefined;
  this.dragElement = undefined;
  this.selectDir = undefined;
  this.selectFiles = undefined;
  this.logElement = undefined;
  this.objectCounter = [0,0];
  this.OnPathsSelectedCallbacks  = [];
  this.acceptingFiles = true;

  this.OnFolderScan =function(dir){ console.log('Scanning: '+dir); }

  this.OnFileFound = function(file)
  {
    ++_this.objectCounter[1];
    if (_this.logElement) _this.logElement.innerHTML = 'Processing... (' + _this.objectCounter[0] +'/'+ _this.objectCounter[1] +')';
  }

  this.OnFileParsing = function(file){ console.log('Parsing: '+file); }

  this.OnFileDone = function(file)
  {
    ++_this.objectCounter[0];
    if (_this.logElement) _this.logElement.innerHTML = 'Processing... (' + _this.objectCounter[0] +'/'+ _this.objectCounter[1] +')';
  }

  this.OnFinalizing = function()
  {
    console.log('Finalizing...');
    if (_this.logElement) _this.logElement.innerHTML = 'Finalizing...';
  }

  this.Cover = function()
  {
    _this.containerElement.style.top = '0';
    _this.logElement.innerHTML = 'DRAG YOUR FILES HERE';
    _this.objectCounter = [0,0];
    Interface.SetStartMenu();

    _this.OnDragLeave();
    _this.acceptingFiles = true;
    _this.dragElement.style.display = 'block';
  }

  this.Loading = function()
  {
    Interface.SetLoadingMenu();
    _this.logElement.innerHTML = 'Processing...';
    _this.acceptingFiles = false;
    _this.dragElement.style.display = 'none';
  }

  this.UnCover = function()
  {
    _this.containerElement.style.top = '-100%';
    _this.logElement.innerHTML = '';
    _this.objectCounter = [0,0];
    Interface.SetMainMenu();
  }

  this.OnDragOver = function()
  {
    document.documentElement.style.setProperty('--drag-border-size', "25px");
  }

  this.OnDragLeave = function()
  {
    document.documentElement.style.setProperty('--drag-border-size', "10px");
  }

  this.AddPathsSelectedCallback = function(callback){ _this.OnPathsSelectedCallbacks.push(callback); }
  this.NotifyPathsSelected = function(paths){ _this.OnPathsSelectedCallbacks.forEach(element => { element(paths); });}

  this.OnDropFiles = function(e)
  {
    e.preventDefault(); //important to avoid opening the file
    let paths = [];
    for (let f of e.dataTransfer.files){ paths.push( f.path ) };
    _this.OnTargetSelected(paths);
    return false;
  }

  this.OnTargetSelected = function(paths)
  {
    if (_this.acceptingFiles)
    {
      _this.NotifyPathsSelected(paths);
    }
  }

  this.OpenDialogFiles = function (){ OpenFilesDialog(_this.OnTargetSelected); }
  this.OpenDialogDirs = function(){ OpenDirsDialog(_this.OnTargetSelected); }

  this.Init = function()
  {
    _this.containerElement = document.getElementById('cover');
    _this.dragElement      = document.getElementById('dragTarget');
    _this.logElement       = document.getElementById('coverLine');

    if(_this.dragElement)
    {
      _this.dragElement.ondragover = (e) => { _this.OnDragOver(); return false; };
      _this.dragElement.ondragleave = () => { _this.OnDragLeave(); return false; };
      _this.dragElement.ondragend = () => { return false; };
      _this.dragElement.ondrop = _this.OnDropFiles;
    }

    Interface.SetCover(_this);

    _this.Cover();

    if (hardcodedDir != undefined){ _this.NotifyPathsSelected([hardcodedDir]); }
  }
}


exports.Cover = Cover;
