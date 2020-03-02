var Common  = require('./utils/common.js')
var Defs    = require('./defs.js')
var Mural   = require('./utils/mural.js')
var Palette = require('./utils/palette.js')

var contentMargin = {left: 20, right: 20, top: 20, bottom: 20};

var graphSize = 100;

var innerGraphWidth = 50;
var innerHraphHeightMargin = { top: 10, bottom: 30 };

var graphSpacing = 20;

function OverviewGraph()
{
  var _this = this;

  this.mural             = undefined;
  this.data              = undefined;
  this.hovered           = undefined;
  this.selectedIndex     = undefined;
  this.selectionCallback = undefined;

  this.SetSelectCallback = function(callback) { _this.selectionCallback = callback; }

  this.SetHovered = function(graph)
  {
    if (_this.hovered != graph && (graph == undefined || graph.hasData))
    {
      _this.hovered = graph;
      _this.Refresh();
    }
  }

  this.SetSelected = function(index)
  {
    if (_this.selectedIndex != index)
    {
      _this.selectedIndex = index;
      _this.Refresh();
    }
  }

  this.SetData = function(database)
  {
    var graphs = [];

    var frontend = database.total[Defs.NodeNatureToKey(Defs.NodeNature.FRONTEND)];
    var backend  = database.total[Defs.NodeNatureToKey(Defs.NodeNature.BACKEND)];
    var overviewRatio = frontend > 0? frontend/(frontend+backend) : backend ? 0 : 0.5;

    graphs.push({ label: 'Overview', ratio: overviewRatio, hasData: true} );

    //Get ratios
    var maxValue = 0;
    var values = [];
    for(var i=0,sz=database.global.length;i<sz;++i)
    {
      var key = Defs.NodeNatureToKey(i);
      var value = database.total[key];
      values.push(value == undefined? 0 : value);
      maxValue = Math.max(value,maxValue);
    }

    for(var i=0,sz=database.global.length;i<sz;++i)
    {
      var hasData = database.global[i].length > 0;
      var ratio = hasData && maxValue > 0? values[i] / maxValue : 0;
      graphs.push({ label: Defs.NodeNatureToString(i), nature: i, ratio: ratio, hasData: hasData } );
    }

    _this.data = graphs;

    _this.mural.SetInnerSizeX(_this.data.length*(graphSize+graphSpacing)-graphSpacing+contentMargin.left+contentMargin.right);
  }

  this.RenderGraph = function(offset, graph)
  {
    var isEnabled = graph.hasData;
    var isSelected = _this.selectedIndex == graph.nature;
    var isShowing = _this.selectedIndex == undefined || isSelected;
    var isHovered = graph == _this.hovered;

    var context = _this.mural.context;

    context.lineWidth = 1;
    context.fillStyle = graph.nature != undefined? Palette.GetNodeColor(graph.nature) : Palette.Colors.disabledText;

    if (!isEnabled || !isShowing) { context.fillStyle = Palette.Colors.disabledText; }

    if (graph.nature == undefined)
    {
      context.fillStyle = Palette.Colors.background3;
      context.fillRect(offset[0],offset[1],graphSize,_this.mural.canvas.height-contentMargin.top-contentMargin.bottom);

      var centerX = offset[0]+graphSize*0.5;
      var centerY = offset[1]+(_this.mural.canvas.height-contentMargin.top-contentMargin.bottom)*0.5;
      var radius  = (innerGraphWidth*0.5);

      var angle = graph.ratio*2*Math.PI;

      context.fillStyle = (!isEnabled || !isShowing)? Palette.Colors.background : Palette.GetNodeColor(Defs.NodeNature.FRONTEND);
      context.beginPath();
      context.moveTo(centerX,centerY);
      context.lineTo(centerX+radius,centerY)
      context.arc(centerX, centerY, radius, 0, angle);
      context.lineTo(centerX,centerY);
      context.fill();

      context.fillStyle = (!isEnabled || !isShowing)? Palette.Colors.background2 : Palette.GetNodeColor(Defs.NodeNature.BACKEND);
      context.beginPath();
      context.moveTo(centerX,centerY);
      context.lineTo(Math.cos(angle)*radius + centerX,Math.sin(angle)*radius + centerY)
      context.arc(centerX, centerY, radius, angle, 2*Math.PI);
      context.lineTo(centerX,centerY);
      context.fill();
    }
    else
    {
      var graphLeft = offset[0]+(graphSize-innerGraphWidth)*0.5;
      var graphTop  = offset[1]+innerHraphHeightMargin.top;
      var graphHeight  = _this.mural.canvas.height-contentMargin.top-contentMargin.bottom - innerHraphHeightMargin.top - innerHraphHeightMargin.bottom;

      graphTop = graphTop + graphHeight*(1.0-graph.ratio);
      graphHeight *= graph.ratio;

      context.fillRect(graphLeft,graphTop,innerGraphWidth,graphHeight);
    }

    //Render selection
    if (isSelected || isHovered)
    {
      context.strokeStyle = isHovered? '#ffffff' : '#999999';
      context.strokeRect(offset[0],offset[1],graphSize,_this.mural.canvas.height-contentMargin.top-contentMargin.bottom);
    }

    //Render text
    var textWidth = context.measureText(graph.label).width;

    context.fillStyle = isEnabled? Palette.Colors.infoText : Palette.Colors.disabledText;
    context.fillText(graph.label,offset[0]+(graphSize-textWidth)*0.5,_this.mural.canvas.height-contentMargin.bottom-Palette.Text.fontHeight);
  }

  this.Render = function()
  {
    _this.mural.context.fillStyle = Palette.Colors.background;
    _this.mural.context.fillRect(0,0,_this.mural.canvas.width,_this.mural.canvas.height);
    _this.mural.context.font = Palette.Text.font;

    if (_this.data == undefined ) return;

    var scrollOffset = _this.mural.GetScrollOffset();

    var positionX = scrollOffset[0]+contentMargin.left;
    var positionY = scrollOffset[1]+contentMargin.top;
    for (var i=0,sz=_this.data.length;i<sz;++i)
    {
      _this.RenderGraph([positionX,positionY],_this.data[i]);
      positionX += graphSize+graphSpacing;
    }
  }

  this.Refresh = function(){ _this.mural.Render(); }


  this.OnMouseMove = function(e)
  {
    var localPosition  = _this.mural.FromGlobalToLocal(Common.GetCursorWindowPosition(e));
    var scrollPosition = _this.mural.FromLocalToScroll(localPosition);

    var hovered = undefined;

    if (scrollPosition[1] > contentMargin.top && scrollPosition[1] < (_this.mural.canvas.height - contentMargin.bottom) )
    {
      var posX = scrollPosition[0] - contentMargin.left;

      var index = Math.floor(posX / (graphSize+graphSpacing));
      var posX_remaining = posX - (index*(graphSize+graphSpacing));

      if (index >= 0 && index < _this.data.length && posX_remaining < graphSize)
      {
        hovered = _this.data[index];
      }
    }

    _this.SetHovered(hovered);
  }

  this.OnMouseOut = function(e)
  {
    _this.SetHovered(undefined);
  }

  this.OnMouseDown = function(e)
  {
    if (_this.hovered != undefined && _this.selectionCallback != undefined)
    {
      _this.selectionCallback(_this.hovered.nature);
    }
  }

  this.Init = function(canvas)
  {
    _this.mural = new Mural.Mural(canvas,_this.Render);
    _this.mural.Init();

    _this.mural.OnMouseDownFunc = _this.OnMouseDown;
    _this.mural.OnMouseMoveFunc = _this.OnMouseMove;
    _this.mural.OnMouseOutFunc  = _this.OnMouseOut;

    _this.mural.canvas.setAttribute('tabindex','0'); //This allows in chrome to focus a canvas
  }
}

exports.OverviewGraph = OverviewGraph;
