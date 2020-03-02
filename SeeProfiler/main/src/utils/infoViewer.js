var Common  = require('./common.js')
var Mural   = require('./mural.js')
var Palette = require('./palette.js')

const {remote,clipboard} = require('electron');
const {Menu, MenuItem}   = remote;

var headerSectionHeight = 25;
var totalSectionHeight = 35;
var elementHeight = 20;
var textMarginLeft = 10;
var defaultFieldWidth = 100;
var columnModifyThreshold = 5;

var DisplayType = {
  None: 0,
  Time: 1,
}

var fieldVisualizer =
  [
    { key: 'label',                 display: 'Name',                   defaultWidth: 250,  type: DisplayType.None, showTotal: true },

    //Files
    { key: 'duration',              display: 'Duraton',                defaultWidth: 80,   type: DisplayType.Time, showTotal: true },
    { key: 'frontEnd',              display: 'Frontend',               defaultWidth: 80,   type: DisplayType.Time, showTotal: true },
    { key: 'backend',               display: 'Backend',                defaultWidth: 80,   type: DisplayType.Time, showTotal: true },
    { key: 'source',                display: 'Source',                 defaultWidth: 80,   type: DisplayType.Time, showTotal: true },
    { key: 'parseClass',            display: 'Parse Class',            defaultWidth: 80,   type: DisplayType.Time, showTotal: true },
    { key: 'parseTemplate',         display: 'Parse Template',         defaultWidth: 95,  type: DisplayType.Time, showTotal: true },
    { key: 'instantiateClass',      display: 'Instantiate Class',      defaultWidth: 95,  type: DisplayType.Time, showTotal: true },
    { key: 'instantiateFunction',   display: 'Instantiate Function',   defaultWidth: 115,  type: DisplayType.Time, showTotal: true },
    { key: 'codeGen',               display: 'Code Generation',        defaultWidth: 105,  type: DisplayType.Time, showTotal: true },
    { key: 'optModule',             display: 'Optimize Module',        defaultWidth: 105,  type: DisplayType.Time, showTotal: true },
    { key: 'optFunction',           display: 'Optimize Function',      defaultWidth: 105,  type: DisplayType.Time, showTotal: true },
    { key: 'pendingInstantiations', display: 'Pending Instantiations', defaultWidth: 120,  type: DisplayType.Time, showTotal: true },
    { key: 'runPass',               display: 'Run Pass',               defaultWidth: 80,  type: DisplayType.Time, showTotal: true },
    { key: 'other',                 display: 'Other',                  defaultWidth: 75,  type: DisplayType.Time, showTotal: true },

    //Elements
    { key: 'num',                   display: 'Count',                  defaultWidth: 70,   type: DisplayType.None, showTotal: true },
    { key: 'acc',                   display: 'Accumulated',            defaultWidth: 110,  type: DisplayType.Time, showTotal: true },
    { key: 'max',                   display: 'Max',                    defaultWidth: 110,  type: DisplayType.Time, showTotal: false },
    { key: 'min',                   display: 'Min',                    defaultWidth: 110,  type: DisplayType.Time, showTotal: false },
    { key: 'avg',                   display: 'Average',                defaultWidth: 110,  type: DisplayType.Time, showTotal: false },
  ];

function GetFieldVisualizer(key) { for (var i=0;i<fieldVisualizer.length;++i) { if (fieldVisualizer[i].key == key){ return fieldVisualizer[i]; } } return null;  }
function FindFieldVisualizerIndex(key){ for (var i=0;i<fieldVisualizer.length;++i) { if (fieldVisualizer[i].key == key){ return i; } } return -1; }

function DataFieldSorter(a,b){
  var indexA = FindFieldVisualizerIndex(a.key);
  var indexB = FindFieldVisualizerIndex(b.key);
  if (indexA < 0) return indexB < 0? 0 : 1;
  if (indexB < 0) return -1;
  return indexA - indexB;
};

//order of importance for display
function InfoViewer()
{
  var _this          = this;
  this.mural         = undefined;
  this.data          = undefined; //real reference to the raw data ( try presorting for each field N*K*sizeof(pointer) memory )
  this.dataFields    = undefined;
  this.activeData    = undefined; //vector to the actual objects after filtering
  this.totalInfo     = undefined;
  this.hovered       = undefined;
  this.selected      = undefined;
  this.sortKey       = undefined;
  this.currentFilter = '';

  this.OnDoubleClickExternal = undefined;
  this.OnRowContextMenuOpenExternal = undefined;
  this.OnColumnContextMenuOpenExternal = undefined;

  this.GetFullWidth = function()
  {
    ret = 0;
    _this.dataFields.forEach(element => { ret += element.width; });
    return ret;
  }

  this.SetDataFields = function()
  {
    _this.dataFields = [];
    if (_this.data != undefined && _this.data.length > 0 && _this.data[0].info != undefined)
    {
      var firstElementInfo = _this.data[0].info;
      for (var key in firstElementInfo)
      {
        var varType = typeof(firstElementInfo[key]);
        if ( varType == 'number' || varType == 'string')
        {
          var visualizer = GetFieldVisualizer(key);
          _this.dataFields.push({ key: key, width: visualizer == null? defaultFieldWidth : visualizer.defaultWidth, visualizer: visualizer });
        }
      }
    }

    _this.dataFields.sort(DataFieldSorter);
  }

  this.SetData = function(data)
  {
    _this.data = data;

    _this.SetDataFields();

    if (_this.filter) _this.filter.value = '';

    if(_this.dataFields.length > 0) { _this.SetSort({field:_this.dataFields[0]}); }

    _this.ApplyFilter();
  }

  this.AddToTotalInfo = function(element)
  {
    if (!element.info) return;

    for (var key in element.info)
    {
      var value = element.info[key];
      if (typeof(value) == 'number')
      {
        if (!_this.totalInfo.hasOwnProperty(key)){ _this.totalInfo[key] = 0; }
        _this.totalInfo[key] += value;
      }
    }
  }

  this.GoToTop      = function() { _this.mural.MoveScrollYTo(0); }
  this.GoToBottom   = function() { _this.mural.MoveScrollYTo(_this.mural.scrollY.maxScroll); }
  this.GoToPrevPage = function() { _this.mural.MoveScrollYTo(_this.mural.scrollY.scroll-(_this.mural.canvas.height-(headerSectionHeight+totalSectionHeight))); }
  this.GoToNextPage = function() { _this.mural.MoveScrollYTo(_this.mural.scrollY.scroll+(_this.mural.canvas.height-(headerSectionHeight+totalSectionHeight))); }

  this.SatisfiesFilter = function(element,filterEntries)
  {
    for (var i=0;i<filterEntries.length;++i)
    {
      if ( element.info.label.toUpperCase().indexOf(filterEntries[i]) < 0){ return false; }
    }
    return true;
  }

  this.ApplyFilter = function()
  {
    _this.activeData = [];
    _this.totalInfo = { label: 'TOTAL' };

    if (!_this.data) return;

    var filterStr = _this.filter? _this.filter.value.toUpperCase() : '';
    var filterEntries = filterStr.split(' ');

    var data = _this.data;
    for (var i=0,sz=data.length;i<sz;++i){
      var element = data[i];
      if (_this.SatisfiesFilter(element,filterEntries))
      {
        _this.activeData.push(element);
        _this.AddToTotalInfo(element);
      }
    }

    _this.currentFilter = filterStr;

    _this.hovered = undefined;

    _this.mural.SetInnerSizeX(_this.GetFullWidth());
    _this.mural.SetInnerSizeY(_this.activeData.length*elementHeight+headerSectionHeight+totalSectionHeight);
  }
/*

//Fix this it does not work and hangs the system ( make a continous async operation )
  this.ApplyFilterDelta = function()
  {
    _this.totalInfo = { label: 'TOTAL' };

    if (!_this.data) return;

    var filterStr = _this.filter? _this.filter.value.toUpperCase() : '';
    var filterEntries = filterStr.split(' ');

    var data = _this.activeData;
    for (var i=0,sz=data.length;i<sz;){
      var element = data[i];
      if (_this.SatisfiesFilter(element,filterEntries))
      {
        ++i;
        _this.AddToTotalInfo(element);
      }
      else
      {
        //remove element
        data.splice(i, 1);
        --sz;
      }
    }

    _this.currentFilter = filterStr;

    _this.hovered = undefined;

    _this.mural.SetInnerSizeX(_this.GetFullWidth());
    _this.mural.SetInnerSizeY(_this.activeData.length*elementHeight+headerSectionHeight+totalSectionHeight);
  }
*/
  this.SetSort = function(sortKey)
  {
    if (_this.data == undefined || _this.data.length == 0) return;

    //build input key if no bigtosmall specified
    if (sortKey.bigToSmall == undefined )
    {
      if (_this.sortKey != undefined && _this.sortKey.field == sortKey.field){ sortKey.bigToSmall = !_this.sortKey.bigToSmall; }
      else
      {
        var key = sortKey.field.key;
        if(typeof(_this.data[0].info[key]) == 'string'){ sortKey.bigToSmall = false; }
        else { sortKey.bigToSmall = true; }
      }
    }

    //perform operation to update
    if (_this.sortKey && sortKey.field == _this.sortKey.field)
    {
      if (sortKey.bigToSmall == _this.sortKey.bigToSmall) return;
      _this.data.reverse();
    }
    else
    {
      var key = sortKey.field.key;
      var isString = typeof(_this.data[0].info[key]) == 'string';
      if(sortKey.bigToSmall){
        if (isString) _this.data.sort(function(a, b) { return b.info[key].localeCompare(a.info[key]); });
        else _this.data.sort(function(a,b){return b.info[key] - a.info[key]; })
      }
      else {
        if (isString) _this.data.sort(function(a, b) { return a.info[key].localeCompare(b.info[key]); });
        else _this.data.sort(function(a,b){return a.info[key] - b.info[key]; })
      }
    }

    _this.sortKey = sortKey;
  }

  this.RenderHeader = function(offset)
  {
    var context = _this.mural.context;

    context.strokeStyle = Palette.Colors.infoText;
    context.lineWidth = 3;

    var accumWidth = offset[0];
    for(var i=0;i<_this.dataFields.length;++i)
    {
      var field = _this.dataFields[i];
      var width = i >= (_this.dataFields.length - 1)? _this.mural.canvas.width - accumWidth : field.width;

      context.fillStyle = _this.hovered && _this.hovered.column && _this.hovered.column == field? Palette.Colors.background2Selected : Palette.Colors.background2;
      context.fillRect(accumWidth,0,width,headerSectionHeight);

      context.beginPath();
      context.moveTo(accumWidth, 0);
      context.lineTo(accumWidth, headerSectionHeight);
      context.stroke();

      context.fillStyle = Palette.Colors.nodeText;
      var content = field.visualizer == null? field.key : field.visualizer.display;

      if (_this.sortKey != undefined && _this.sortKey.field == field){ content = (_this.sortKey.bigToSmall? '▼ ' : '▲ ') +content; }

      context.fillText(content,accumWidth+textMarginLeft,(headerSectionHeight+Palette.Text.fontHeight)*0.5);

      accumWidth += width;
    }

    context.beginPath();
    context.moveTo(0, headerSectionHeight);
    context.lineTo(_this.mural.canvas.width,headerSectionHeight);
    context.stroke();
  }

  this.RenderTotal = function(offset)
  {
    var context = _this.mural.context;

    context.strokeStyle = Palette.Colors.infoText;
    context.lineWidth = 2;

    var baseHeight = _this.mural.canvas.height-totalSectionHeight;

    var accumWidth = offset[0];
    for(var i=0;i<_this.dataFields.length;++i)
    {
      var field = _this.dataFields[i];
      var width = i >= (_this.dataFields.length - 1)? _this.mural.canvas.width - accumWidth : field.width;

      context.fillStyle = Palette.Colors.background2;
      context.fillRect(accumWidth,baseHeight,width,totalSectionHeight);

      context.beginPath();
      context.moveTo(accumWidth, baseHeight);
      context.lineTo(accumWidth, baseHeight+totalSectionHeight);
      context.stroke();

      if (field.visualizer != undefined && field.visualizer.showTotal != undefined && field.visualizer.showTotal)
      {
        context.fillStyle = Palette.Colors.nodeText;
        var content = (field.visualizer != null && field.visualizer.type == DisplayType.Time)? Common.TimeToString(_this.totalInfo[field.key]) : String(_this.totalInfo[field.key]);
        if (i==0){ content += ' ('+_this.activeData.length+')'; }
        context.fillText(content,accumWidth+textMarginLeft,baseHeight+(elementHeight+Palette.Text.fontHeight)*0.5);
      }

      accumWidth += width;
    }

    context.beginPath();
    context.moveTo(0, baseHeight);
    context.lineTo(_this.mural.canvas.width,baseHeight);
    context.stroke();
  }

  this.RenderElement = function(element,offset)
  {
    var context = _this.mural.context;

    context.strokeStyle = Palette.Colors.infoText;
    context.lineWidth = 1;

    var bgColor = _this.hovered && _this.hovered.row && _this.hovered.row.info == element? Palette.Colors.backgroundSelected : Palette.Colors.background;

    var accumWidth = offset[0];
    for(var i=0;i<_this.dataFields.length;++i)
    {
      var field = _this.dataFields[i];
      var width = i >= (_this.dataFields.length - 1)? _this.mural.canvas.width - accumWidth : field.width;

      context.fillStyle = bgColor;
      context.fillRect(accumWidth,offset[1],width,elementHeight);

      context.beginPath();
      context.moveTo(accumWidth, offset[1]);
      context.lineTo(accumWidth, offset[1]+elementHeight);
      context.stroke();

      context.fillStyle = Palette.Colors.nodeText;
      var content = (field.visualizer != null && field.visualizer.type == DisplayType.Time)? Common.TimeToString(element[field.key]) : String(element[field.key]);
      context.fillText(content,accumWidth+textMarginLeft,offset[1]+(elementHeight+Palette.Text.fontHeight)*0.5);

      accumWidth += width;
    }

    context.beginPath();
    context.moveTo(0, offset[1]+elementHeight);
    context.lineTo(_this.mural.canvas.width,offset[1]+elementHeight);
    context.stroke();

  }

  this.Render = function()
  {
    //Clear background
    _this.mural.context.fillStyle = Palette.Colors.background;
    _this.mural.context.fillRect(0,0,_this.mural.canvas.width,_this.mural.canvas.height);

    _this.mural.context.font = Palette.Text.font;

    var scrollOffset = _this.mural.GetScrollOffset();

    if (_this.activeData != undefined && _this.activeData.length > 0)
    {
      var startIndex = Math.floor(-scrollOffset[1]/elementHeight);
      var endIndex = Math.min(_this.activeData.length,Math.floor(startIndex + _this.mural.canvas.height/elementHeight));

      for (var i=startIndex;i<endIndex;++i)
      {
        var verticalOffset = (i*elementHeight)+headerSectionHeight; //offset with the header space
        _this.RenderElement(_this.activeData[i].info,[scrollOffset[0],verticalOffset+scrollOffset[1]]);
      }

      //render this at the end so it draw on top of everything
      _this.RenderHeader(scrollOffset);
      _this.RenderTotal(scrollOffset);
    }
    else if (_this.data)
    {
      _this.RenderHeader(scrollOffset);
    }
  }

  this.SetHovered = function(input)
  {
    var isHoverDifferent = (_this.hovered && (input == undefined || _this.hovered.row != input.row || _this.hovered.column != input.column || _this.hovered.columnModify != input.columnModify)) || input != undefined
    if (isHoverDifferent)
    {
      _this.hovered = input;
      _this.mural.Render();

      //Update cursor
      _this.mural.canvas.style.cursor = _this.hovered && _this.hovered.columnModify? 'col-resize' : 'default';
    }
  }

  this.OnMouseDown = function(e)
  {
    if (_this.hovered)
    {
      if(e.button == 0)
      {
        if (_this.hovered.column){ _this.SetSort({field: _this.hovered.column}); _this.ApplyFilter(); }
        else if(_this.hovered.columnModify){
          _this.selected = _this.hovered;
          _this.hovered = undefined;
        }
      }
    }
  }

  this.OnGlobalMouseUp = function(e)
  {
    if (_this.selected)
    {
      _this.selected = undefined;
      _this.OnMouseMove(e);
    }
  }

  this.OnMouseUp = function(e){ _this.OnMouseMove(e); }

  this.OnGlobalMouseMove = function(e)
  {
    if (_this.selected && _this.selected.columnModify)
    {
      var field = _this.selected.columnModify;
      field.width = Math.max(20,Math.min(field.width+e.movementX));
      _this.mural.SetInnerSizeX(_this.GetFullWidth());
    }
  }

  this.OnMouseMove = function(e)
  {
    //if not performing any action:
    if (_this.selected == undefined)
    {
      var localPosition  = _this.mural.FromGlobalToLocal(Common.GetCursorWindowPosition(e));
      var scrollPosition = _this.mural.FromLocalToScroll(localPosition);

      if (localPosition[1] < elementHeight)
      {
        localPosition[0] = scrollPosition[0]; //apply horizontal scroll only

        var fieldIndex = 0;
        for (var i=0;i<_this.dataFields.length;++i)
        {
          fieldIndex = i;
          if (localPosition[0] < _this.dataFields[i].width) break;
          localPosition[0] -= _this.dataFields[i].width;
        }

        if (fieldIndex < _this.dataFields.length)
        {
          var field = _this.dataFields[fieldIndex];
          if (fieldIndex < (_this.dataFields.length-1) && localPosition[0] > field.width-columnModifyThreshold){ _this.SetHovered({ columnModify: field }); }
          else if (fieldIndex > 0 && localPosition[0] < columnModifyThreshold){ _this.SetHovered({ columnModify: _this.dataFields[fieldIndex-1]}) }
          else _this.SetHovered( {column: field });
        }
        else { _this.SetHovered(undefined); }
      }
      else if (localPosition[1] < _this.mural.canvas.height-elementHeight)
      {

        var index = (Math.floor((scrollPosition[1]-headerSectionHeight)/elementHeight));
        _this.SetHovered(index < _this.activeData.length? {row: _this.activeData[index]} : undefined);
      }
      else _this.SetHovered(undefined);
    }
  }

  this.OnMouseOut = function()
  {
    _this.SetHovered(undefined);
  }

  this.OnDoubleClick = function(e)
  {
    if (_this.hovered && _this.hovered.row && _this.OnDoubleClickExternal)
    {
      _this.OnDoubleClickExternal(_this.hovered.row);
    }
  }

  this.OnContextMenu = function(e)
  {
    if (_this.hovered)
    {
      if (_this.hovered.row)
      {
        let contextualElement = _this.hovered.row;

        const menu = new Menu();

        for(var i=0,sz=_this.dataFields.length;i<sz;++i)
        {
          let dataField =  _this.dataFields[i];
          let key = dataField.key;
          let displayName = dataField.visualizer? dataField.visualizer.display : key;
          menu.append(new MenuItem({label: 'Copy '+displayName, click() { clipboard.writeText(String(contextualElement.info[key])); }}))
        }

        if (_this.OnRowContextMenuOpenExternal) { _this.OnRowContextMenuOpenExternal(menu,contextualElement); }

        menu.popup(remote.getCurrentWindow());
      }
      else if (_this.hovered.column)
      {
        const menu = new Menu();

        let contextualElement = _this.hovered.column;
        menu.append(new MenuItem({label: 'Sort ▲', click() { _this.SetSort({field: contextualElement,bigToSmall: false}); _this.ApplyFilter(); }}));
        menu.append(new MenuItem({label: 'Sort ▼', click() { _this.SetSort({field: contextualElement,bigToSmall: true});  _this.ApplyFilter(); }}));

        if (_this.OnColumnContextMenuOpenExternal) { _this.OnColumnContextMenuOpenExternal(menu,contextualElement); }

        menu.popup(remote.getCurrentWindow());
      }
      _this.SetHovered(undefined);
    }
  }

  this.OnFilterChanged = function()
  {
    //if we are acummulating filter then use the already filtered list as it is guarateed to be a subset of it
    //if ( _this.currentFilter.length == 0 || _this.filter.value.toUpperCase().indexOf(_this.currentFilter) < 0) { _this.ApplyFilter()}
    //else {_this.ApplyFilterDelta(); }

    _this.ApplyFilter()
  }

  this.Refresh = function(){ _this.mural.Render(); }

  this.Init = function(canvas,filter)
  {
    _this.filter = filter;
    if (_this.filter) _this.filter.addEventListener('input', _this.OnFilterChanged);

    _this.mural = new Mural.Mural(canvas,_this.Render);
    _this.mural.Init();

    _this.mural.OnMouseDownFunc = _this.OnMouseDown;
    _this.mural.OnMouseUpFunc   = _this.OnMouseUp;
    _this.mural.OnMouseMoveFunc = _this.OnMouseMove;
    _this.mural.OnMouseOutFunc  = _this.OnMouseOut;

    _this.mural.canvas.setAttribute('tabindex','0'); //This allows in chrome to focus a canvas
    _this.mural.canvas.addEventListener('contextmenu', _this.OnContextMenu);
    _this.mural.canvas.addEventListener('dblclick', _this.OnDoubleClick);

    document.addEventListener('mousemove', _this.OnGlobalMouseMove);
    document.addEventListener('mouseup',   _this.OnGlobalMouseUp);
  }
}

exports.InfoViewer = InfoViewer;
