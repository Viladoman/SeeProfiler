var Defs          = require('./defs.js')
var InfoViewer    = require('./utils/infoViewer.js')
var OverviewGraph = require('./overviewGraph.js')
var Interface     = require('./interface.js')
var Palette       = require('./utils/palette.js')

const {remote, ipcRenderer} = require('electron');
const {MenuItem}   = remote;

var tabs = {}
var mainName     = 'main';
var specificName = 'specific';
var overviewGraph = undefined;
var currentTabIndex = undefined;
var contextSubMenus = undefined;

function CreateTab(baseElement,name,data,index)
{
  if (data.length == 0) return undefined;

  //Create tab div
  var tabDiv = document.createElement('div');
  tabDiv.id = name;
  tabDiv.className = 'tabcontent';

  //Create filter div
  var filterBarDiv = document.createElement('div');
  filterBarDiv.className = 'fullOverviewFilter';
  filterBarDiv.style.backgroundColor = Palette.GetNodeColor(index == undefined? Defs.NodeNature.EXECUTECOMPILER : index);

  //create canvas div
  var canvasDiv = document.createElement('div');
  canvasDiv.className = 'fullOverviewInfo';

  //Create elements
  var filter = document.createElement('input');
  filter.placeholder= 'Filter';
  filter.type= 'search';

  var canvas = document.createElement('canvas');

  //combine divs together
  filterBarDiv.appendChild(filter);
  canvasDiv.appendChild(canvas);
  tabDiv.appendChild(filterBarDiv);
  tabDiv.appendChild(canvasDiv);
  baseElement.appendChild(tabDiv);

  var info  = new InfoViewer.InfoViewer();
  info.Init(canvas,filter);
  info.SetData(data);

  return{tab: tabDiv, infoViewer: info, filter: filter};
}

function CreateTabs(database)
{
  console.log('Creating Environment...')

  var overviewElement = document.getElementById('overviewTabContainer');
  tabs[mainName] = CreateTab(overviewElement,mainName,database.objects);

  contextSubMenus = {
    main: {
      label: 'Overview',
      click: function(){ ShowTab(); },
      accelerator: 'CommandOrControl+`'
    },
    specifics: []
  };

  for(let i=0,sz=database.global.length;i<sz;++i)
  {
    var name = specificName+i;
    tabs[name] = CreateTab(overviewElement,name,database.global[i],i);
    contextSubMenus.specifics.push({
      label: Defs.NodeNatureToString(i),
      click: function(item){ ShowTab(i); },
      accelerator: (i<9)? 'CommandOrControl+'+(i+1) : undefined
    });
  }
}

function DestroyTabs()
{
  for (var key in tabs)
  {
    var tab = tabs[key];
    if (tab != undefined)
    {
      tab.tab.parentNode.removeChild(tab.tab);
    }
  }
  tabs = {};
}

function GetTab(index)
{
  var name = index == undefined? mainName : specificName+index;
  return tabs[name];
}

function ShowTab(index)
{
  currentTabIndex = undefined;

  var name = index == undefined? mainName : specificName+index;

  if ( tabs[name] == undefined ) return;

  for (var key in tabs)
  {
    if (tabs[key]) tabs[key].tab.style.display = key == name? 'block' : 'none';
  }

  currentTabIndex = index;
  overviewGraph.SetSelected(currentTabIndex);
}

function OpenTimeline(object)
{
  var args = {object: object};
  ipcRenderer.send('openExtraWindow', 'timeline', object.info.label, JSON.stringify(args));
}

function LocateTimeline(object,locateName,locateNature)
{
  var args = {object: object, locate: { name: locateName, nature: locateNature  } };
  ipcRenderer.send('openExtraWindow', 'timeline', object.info.label, JSON.stringify(args));
}

function AddTabEvents(database)
{
  //main tab
  var mainTabViewer = tabs[mainName].infoViewer;
  mainTabViewer.OnDoubleClickExternal = OpenTimeline;
  mainTabViewer.OnRowContextMenuOpenExternal = function(menu,object){
    menu.insert(0,new MenuItem({type: 'separator'}))
    menu.insert(0,new MenuItem({label: 'Open Timeline', click() { OpenTimeline(object); }}))
  }
  mainTabViewer.OnColumnContextMenuOpenExternal = function(menu,object){
    if (object && object.key)
    {
      let nature = Defs.NodeNatureFromKey(object.key);
      if (nature < Defs.NodeNatureData.GLOBAL_GATHER_THRESHOLD)
      {
        menu.insert(0,new MenuItem({type: 'separator'}));
        menu.insert(0,new MenuItem({label: 'Go to '+(object.visualizer? object.visualizer.display : object.key), click() { ShowTab(nature); }}))
      }
    }
  }

  //Secondary tabs
  for(let i=0,sz=database.global.length;i<sz;++i)
  {
    var tab = tabs[specificName+i];
    if (tab)
    {
      var tabViewer = tab.infoViewer;
      tabViewer.OnDoubleClickExternal = function(object){ LocateTimeline(object.loc.max,object.info.label,i) };
      tabViewer.OnRowContextMenuOpenExternal = function(menu,object){
        menu.insert(0,new MenuItem({type: 'separator'}))
        menu.insert(0,new MenuItem({label: 'Locate Max', click() { LocateTimeline(object.loc.max,object.info.label,i); }}))
        menu.insert(0,new MenuItem({label: 'Locate Min', click() { LocateTimeline(object.loc.min,object.info.label,i); }}))
      }
    }
  }
}

function PushTabsMenu()
{
  if (contextSubMenus)
  {
    var submenus = [contextSubMenus.main, { type: 'separator' }];
    for (var i=0,sz=contextSubMenus.specifics.length;i<sz;++i) submenus.push(contextSubMenus.specifics[i]);

    Interface.SetTabMenu(new MenuItem({ label: 'Tabs', submenu: submenus}));
  }
}

function Init(database)
{
  CreateTabs(database);

  AddTabEvents(database);

  overviewGraph = new OverviewGraph.OverviewGraph();
  overviewGraph.Init(document.getElementById('overviewGraphCanvas'));
  overviewGraph.SetData(database);

  overviewGraph.SetSelectCallback(function(nature){
    if (nature == undefined){ ShowTab(); }
    else { ShowTab(nature); }
  });

  PushTabsMenu();

  ShowTab();

//This input needs to come from outside in order to support multiple tabs
window.addEventListener('keydown', function(e){
  if ( e.ctrlKey )
  {
    if (e.keyCode == 70) { var tab = GetTab(currentTabIndex); if (tab != undefined) tab.filter.focus(); }
    if (e.keyCode == 36) { var tab = GetTab(currentTabIndex); if (tab != undefined) tab.infoViewer.GoToTop(); }
    if (e.keyCode == 35) { var tab = GetTab(currentTabIndex); if (tab != undefined) tab.infoViewer.GoToBottom(); }
  }
  else
  {
    if (e.keyCode == 33){ var tab = GetTab(currentTabIndex); if (tab != undefined) tab.infoViewer.GoToPrevPage(); }
    if (e.keyCode == 34){ var tab = GetTab(currentTabIndex); if (tab != undefined) tab.infoViewer.GoToNextPage(); }
  }

}, true);
}

function Destroy()
{
  console.log('Destroying environment...');
  DestroyTabs();
  ipcRenderer.send('closeExtraWindows');
  overviewGraph = undefined;
}

exports.Init = Init;
exports.Destroy = Destroy;
