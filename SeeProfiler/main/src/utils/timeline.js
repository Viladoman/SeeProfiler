var Common  = require('./common.js')
var Defs    = require('../defs.js')
var Mural   = require('./mural.js')
var Palette = require('./palette.js')

//TODO select and show full name
//context menu to jump back to the overview page

var layerSize = 30;
var zoomFactor = 1.25;
var textSpaceThreshold = 15;
var contentMargin = { top: 20, bottom: 20, left: 20, right: 20 };
var textMargin = 10;

function Timeline()
{
  var _this = this;

  this.mural = undefined;
  this.data  = undefined;
  this.scale = 1.0;

  this.GetMinScale = function(){ return (_this.mural.canvas.width-contentMargin.left-contentMargin.right)/_this.data.info.duration; }

  this.SetScale = function(input)
  {
    if (!_this.data) return;

    var newScale = Math.max(_this.GetMinScale(),input);
    if (newScale != _this.scale)
    {
      _this.scale = newScale;
      _this.mural.SetInnerSizeX(_this.data.info.duration*_this.scale+contentMargin.left+contentMargin.right);
      _this.mural.SetInnerSizeY((_this.data.root.maxDepth+1)*layerSize+contentMargin.top+contentMargin.bottom);
    }
  }

  this.SetData = function(data)
  {
    _this.data = data;
    _this.SetScale(_this.GetMinScale());
  }

  this.FindElementRecursive = function(node, label, nature)
  {
    if (node.type == nature && node.label == label)
    {
      return node;
    }

    //recurse
    for (var i=0,sz=node.children.length;i<sz;++i) {
      var found = _this.FindElementRecursive(node.children[i],label,nature);
      if (found)
      {
        return found;
      }
    }

    return undefined;

  }

  this.LocateItem = function(label, nature)
  {
    var node = _this.FindElementRecursive(_this.data.root,label,nature);
    if (node)
    {
      var locateMargin = 20;

      var scale = (_this.mural.canvas.width-(locateMargin*2))/node.duration;

      var offset =  (node.start*scale)+contentMargin.left-locateMargin;

      _this.SetScale(scale);
      _this.mural.MoveScrollXTo(offset);
    }

    //Seek the element
    //Once found scroll and scale accordingly
  }

  this.RenderNodeRecursive = function(node,offset,layer)
  {
    var nodePosition = [node.start*_this.scale+offset[0],layer*layerSize+offset[1]];
    var length = node.duration*_this.scale;

    if (nodePosition[0] > _this.mural.canvas.width || nodePosition[0]+length < 0){ return; } //clip out of canvas nodes

    var context = _this.mural.context;

    if (length <= 5)
    {
      //render outline
      context.moveTo(nodePosition[0], nodePosition[1]);
      context.lineTo(nodePosition[0], nodePosition[1]+layerSize*((node.maxDepth-layer)+1));
    }
    else
    {
      //outer body
      context.lineWidth = 1;
      context.fillStyle = Palette.GetNodeColor(node.type);
      context.fillRect(nodePosition[0],nodePosition[1],length,layerSize);

      //render outline
      context.strokeRect(nodePosition[0],nodePosition[1],length,layerSize);

      //clamp size to screen for text center
      var nodeRange = [Math.max(nodePosition[0],0),Math.min(_this.mural.canvas.width,nodePosition[0]+length)];
      var textRange = (nodeRange[1]-nodeRange[0]) - textMargin*2;
      if ( textRange > textSpaceThreshold)
      {
        var midPoint = (nodeRange[0]+nodeRange[1])*0.5;

        var label = Defs.NodeNatureToDisplayString(node.type);
        var labelSize = context.measureText(label).width;

        if (labelSize < textRange )
        {
          var label2 = node.label.length>0? ': '+ node.label : '';
          var labelSize2 = context.measureText(label2).width;

          if ((labelSize+labelSize2) < textRange)
          {
            label += label2;
            labelSize += labelSize2;

            var label3 = ' ('+Common.TimeToString(node.duration)+')';
            var labelSize3 = context.measureText(label3).width;
            if ((labelSize+labelSize3) < textRange){ label += label3; labelSize += labelSize3; }
          }
        }
        else
        {
          //SUPER SHORT VERSION
          label = Defs.NodeNatureToShortDisplayString(node.type);
          labelSize = context.measureText(label).width;
        }

        //render label
        context.fillStyle = Palette.Colors.nodeText;
        context.fillText(label,midPoint-labelSize*0.5,nodePosition[1]+(layerSize+Palette.Text.fontHeight)*0.5);
      }

      //recurse
      for (var i=0,sz=node.children.length;i<sz;++i) _this.RenderNodeRecursive(node.children[i],offset,layer+1);
    }
  }

  this.Render = function()
  {
    //Clear background
    _this.mural.context.fillStyle = Palette.Colors.background;
    _this.mural.context.fillRect(0,0,_this.mural.canvas.width,_this.mural.canvas.height);

    if (_this.data)
    {
      var scrollOffset = _this.mural.GetScrollOffset();
      var offset = [scrollOffset[0]+contentMargin.left,scrollOffset[1]+contentMargin.top]
      var context = _this.mural.context;

      context.font = Palette.Text.font;
      context.strokeStyle = Palette.Colors.nodeOutline;
      context.beginPath();

      _this.RenderNodeRecursive(_this.data.root,offset,0);

      context.stroke();
    }
  }

  this.OnResize = function(){ _this.SetScale(_this.scale); }

  this.Refresh = function(){ _this.mural.Render(); }

  this.OnMouseWheel = function(e){
    if (e.ctrlKey)
    {
      var globalPosition = Common.GetCursorWindowPosition(e);
      var localPosition  = _this.mural.FromGlobalToLocal(globalPosition);
      var pivotPoint = localPosition[0]-_this.mural.GetScrollOffset()[0]-contentMargin.left;
      let prevScale = _this.scale;

      var factor = e.deltaY*0.01 > 0? 1.0/zoomFactor : zoomFactor;

      _this.SetScale(_this.scale*factor);

      let newScale = _this.scale;

      var scaleFactor = newScale/prevScale;

      _this.mural.MoveScrollXTo(pivotPoint*(newScale/prevScale)-localPosition[0]+contentMargin.left);

      //console.log(pivotPoint)

      //if (scrollMural == null && SetScroll(_this.scrollY, _this.scrollY.scroll + e.deltaY)){ _this.OnMouseMove(e); _this.Render(); }
    }
  }

  this.Init = function(canvas)
  {
    _this.mural = new Mural.Mural(canvas,_this.Render);
    _this.mural.Init();

    //_this.mural.OnMouseDownFunc = OnMouseDown;
    //_this.mural.OnMouseUpFunc   = OnMouseUp;
    //_this.mural.OnMouseMoveFunc = OnMouseMove;
    //_this.mural.OnMouseOutFunc  = OnMouseOut;
    _this.mural.OnMouseWheelFunc = _this.OnMouseWheel;
    _this.mural.OnResizeFunc     = _this.OnResize;

    _this.mural.canvas.setAttribute('tabindex','0'); //This allows in chrome to focus a canvas
    //_this.mural.canvas.addEventListener('keydown',OnCanvasKeyDown);
    //_this.mural.canvas.addEventListener('contextmenu', OnContextMenu);
  }
}

exports.Timeline = Timeline;
