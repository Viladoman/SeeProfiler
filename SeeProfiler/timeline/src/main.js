var Timeline = require('../../main/src/utils/timeline.js')
var Collector = require('../../main/src/collector.js')

const {ipcRenderer} = require('electron');

//init
var timeline = new Timeline.Timeline();
timeline.Init(document.getElementById('timeline'));

function ProcessLocate(data)
{
  //perform the locate straight away
  if (timeline.data && data.locate)
  {
    console.log('LOCATE: ' + data.locate.name);
    timeline.LocateItem(data.locate.name, data.locate.nature);
  }
}

//listen for data
ipcRenderer.on('args' , function(event , data)
{
  var data = JSON.parse(data);
  if (timeline.data == undefined && data.object)
  {
    document.title = 'Timeline: ' + data.object.info.label;
    Collector.CreateTreeFromFile(data.object.file,function(root){
      data.object.root = root;
      timeline.SetData(data.object);
      ProcessLocate(data);
    });
  }
  else
  {
    ProcessLocate(data);
  }

});

//This input needs to come from outside in order to support multiple tabs
document.addEventListener('keydown', function(e){ if (e.ctrlKey && e.shiftKey && e.keyCode == 73) ipcRenderer.send('toggle-devtools'); }, true);
