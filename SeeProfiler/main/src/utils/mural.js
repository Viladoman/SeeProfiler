var Common       = require('./common.js')

var scrollBarDragged = null;
var scrollBarHovered = null;
var scrollMural      = null;

var scrollBarWidth       = 6;
var scrollBarActiveWidth = 11;

var scrollBarAlphaBg    = 0.1;
var scrollBarColor      = "#777777";
var scrollBarColorHover = "#999999";

//Common
function SetupCanvas(canvas){
  if (canvas != null)
  {
    // Make it visually fill the positioned parent
    canvas.style.width ='100%';
    canvas.style.height='100%';

    var dpi = window.devicePixelRatio;

    // ...then set the internal size to match
    canvas.width  = canvas.offsetWidth * dpi;
    canvas.height = canvas.offsetHeight * dpi;
  }
}

//Scroll Bar

function ScrollBar(canvasSize, orientation)
{
  this.scroll      = 0;
  this.maxScroll   = 0;
  this.canvasSize  = canvasSize;
  this.orientation = orientation; //0: Horizontal / 1:Vertical
}

function SetScroll(scrollBar, newScroll)
{
  var maxScroll = Math.max(0,scrollBar.maxScroll - scrollBar.canvasSize);
  var newScroll = Math.min(maxScroll,Math.max(0,newScroll))
  if ( newScroll != scrollBar.scroll)
  {
    scrollBar.scroll = newScroll;
    return true;
  }
  return false;
}

function RefreshScroll(scrollBar){ SetScroll(scrollBar,scrollBar.scroll); }
function SetScrollCanvasSize(scrollBar, newCanvasSize){ scrollBar.canvasSize = newCanvasSize; RefreshScroll(scrollBar); }
function SetScrollMax(scrollBar, newMaxSize){ scrollBar.maxScroll = newMaxSize; RefreshScroll(scrollBar); }
function HasScroll(scrollBar){ return scrollBar.canvasSize < scrollBar.maxScroll; }

function GetScrollMovement(movement,scrollBar){ return movement[scrollBar.orientation]*(scrollBar.maxScroll/scrollBar.canvasSize); }

function IsInsideScrollBar(localPosition,scrollBar,canvas)
{
  if (HasScroll(scrollBar))
  {
    var positionA    = scrollBar.orientation == 0? localPosition[1] : localPosition[0];
    var barThreshold = scrollBar.orientation == 0? canvas.height : canvas.width;
    if (positionA > (barThreshold-scrollBarActiveWidth))
    {
      var referenceTransform = (scrollBar.canvasSize/scrollBar.maxScroll);
      var positionB = localPosition[scrollBar.orientation];
      var barSize = scrollBar.canvasSize*referenceTransform;
      var scrollSize = scrollBar.scroll*referenceTransform;
      return positionB > scrollSize && positionB < (scrollSize+barSize);
    }
  }
  return false;
}

function RenderScrollBar(canvas, canvasContext, scrollBar)
{
  var width = canvas.width;
  var height = canvas.height;
  var hasScroll = HasScroll(scrollBar);

  canvasContext.save();
  //Background
  canvasContext.fillStyle = scrollBarColor;
  canvasContext.globalAlpha = scrollBarAlphaBg;
  if (scrollBar.orientation == 0) { canvasContext.fillRect(0,height-scrollBarWidth,width,scrollBarWidth); }
  else{ canvasContext.fillRect(width-scrollBarWidth,0,scrollBarWidth,height); }

  if (hasScroll)
  {
    canvasContext.globalAlpha = 1.0;
    canvasContext.fillStyle = scrollBar == scrollBarDragged? scrollBarColorHover : scrollBarColor;
    var barWidth = scrollBar == scrollBarHovered || scrollBar == scrollBarDragged? scrollBarActiveWidth : scrollBarWidth;
    var referenceTransform = (scrollBar.canvasSize/scrollBar.maxScroll);
    if (scrollBar.orientation == 0) { canvasContext.fillRect(scrollBar.scroll*referenceTransform,height-barWidth,referenceTransform*width,barWidth); }
    else { canvasContext.fillRect(width-barWidth,scrollBar.scroll*referenceTransform,barWidth,referenceTransform*height); }
  }

  canvasContext.restore();
}

// Mural

function Mural(canvas,renderFunc,postRenderFunc = undefined)
{
  var _this = this;

  ////////////////
  // Attributes //
  ////////////////

  this.canvas  = canvas;
  this.context = canvas.getContext("2d");

  this.scrollX = new ScrollBar(canvas.width,0);
  this.scrollY = new ScrollBar(canvas.height,1);

  this.showScroll = true;

  /////////////
  // Methods //
  /////////////

  //Scroll
  this.SetInnerSizeX = function(input){ SetScrollMax(this.scrollX,input); this.Render(); }
  this.SetInnerSizeY = function(input){ SetScrollMax(this.scrollY,input); this.Render(); }

  this.MoveScrollXTo = function(input){ SetScroll(this.scrollX,input); this.Render(); }
  this.MoveScrollYTo = function(input){ SetScroll(this.scrollY,input); this.Render(); }

  this.GetScrollOffset = function(){ return [-this.scrollX.scroll, -this.scrollY.scroll]; }

  this.FromGlobalToLocal  = function(position){ return Common.FromGlobalToLocal(position,this.canvas); }
  this.FromLocalToGlobal  = function(position){ return Common.FromLocalToGlobal(position,this.canvas); }
  this.FromLocalToScroll  = function(position){ return position == null? null : [position[0]+this.scrollX.scroll,position[1]+this.scrollY.scroll]; }
  this.FromScrollToLocal  = function(position){ return position == null? null : [position[0]-this.scrollX.scroll,position[1]-this.scrollY.scroll]; }
  this.FromGlobalToScroll = function(position){ return this.FromLocalToScroll(this.FromGlobalToLocal(position)); }
  this.FromScrollToGlobal = function(position){ return this.FromLocalToGlobal(this.FromScrollToLocal(position)); }

  this.OnMouseDownFunc  = undefined;
  this.OnMouseUpFunc    = undefined;
  this.OnMouseMoveFunc  = undefined;
  this.OnMouseWheelFunc = undefined;
  this.OnMouseOutFunc   = undefined;
  this.OnResizeFunc     = undefined;

  //Mouse Methods
  this.OnMouseMove = function(e){
    var prevScrollBarHovered = scrollBarHovered;
    var globalPosition = Common.GetCursorWindowPosition(e);
    var localPosition  = _this.FromGlobalToLocal(globalPosition);
    if (IsInsideScrollBar(localPosition,_this.scrollX,_this.canvas)){ scrollBarHovered = _this.scrollX; _this.Render(); return; }
    if (IsInsideScrollBar(localPosition,_this.scrollY,_this.canvas)){ scrollBarHovered = _this.scrollY; _this.Render(); return; }
    scrollBarHovered = null;
    if ( scrollBarHovered != prevScrollBarHovered){ _this.Render(); }

    if (scrollMural == null)
    {  //Call callback
      if (_this.OnMouseMoveFunc){ _this.OnMouseMoveFunc(e); }
    }
  }

  this.OnMouseDown = function(e){
    switch(e.button)
    {
      case 0: if (scrollBarHovered != null){ scrollMural = _this; scrollBarDragged = scrollBarHovered; _this.Render(); return; } break;
      case 1: if (scrollMural == null) { scrollMural = _this; return; } break;
    }

    //Call callback
    if (_this.OnMouseDownFunc){ _this.OnMouseDownFunc(e); }
  }

  this.OnMouseUp = function(e){ if (_this.OnMouseUpFunc){ _this.OnMouseUpFunc(e); } }
  this.OnMouseOut = function(e){
    if (_this.scrollX == scrollBarHovered || _this.scrollY == scrollBarHovered){ scrollBarHovered = null; _this.Render(); }
    if (_this.OnMouseOutFunc){ _this.OnMouseOutFunc(e); }
  }

  this.OnMouseWheel = function(e){
    if (!e.ctrlKey)
    {
      if (scrollMural == null && SetScroll(_this.scrollY, _this.scrollY.scroll + e.deltaY)){ _this.OnMouseMove(e); _this.Render(); }
    }
    if (_this.OnMouseWheelFunc){ _this.OnMouseWheelFunc(e); }
  }

  //Basic methods

  this.Refresh = function(){
    SetupCanvas(_this.canvas);
    SetScrollCanvasSize(_this.scrollX,_this.canvas.width);
    SetScrollCanvasSize(_this.scrollY,_this.canvas.height);
    _this.Render();
  }

  this.Render = function(){
    renderFunc(_this);

    if (_this.showScroll)
    {
      RenderScrollBar(_this.canvas, _this.context, _this.scrollX);
      RenderScrollBar(_this.canvas, _this.context, _this.scrollY);
    }

    if (postRenderFunc){ postRenderFunc(_this); }
  }

  this.OnResize = function()
  {
    _this.Refresh();
    if (_this.OnResizeFunc){ _this.OnResizeFunc(); }
  }

  this.Init = function(){
    _this.Refresh();

    _this.canvas.addEventListener('mousemove',   _this.OnMouseMove,    false);
    _this.canvas.addEventListener('mousedown',   _this.OnMouseDown,    false);
    _this.canvas.addEventListener('mouseup',     _this.OnMouseUp,      false);
    _this.canvas.addEventListener('mouseout',    _this.OnMouseOut,     false);
    _this.canvas.addEventListener('wheel',       _this.OnMouseWheel,   false);

    Common.OnResize(_this.canvas,_this.OnResize);
  }
}

//////////////////////////
// GENERAL MOUSE EVENTS //
//////////////////////////

document.addEventListener('mousemove', function(e){
  if ( scrollMural != null )
  {
    if (scrollBarDragged == null){
      var moveX = SetScroll(scrollMural.scrollX, scrollMural.scrollX.scroll - e.movementX);
      var moveY = SetScroll(scrollMural.scrollY, scrollMural.scrollY.scroll - e.movementY);
      if ( moveX || moveY ) { scrollMural.Render(); }
    }
    else { if (SetScroll(scrollBarDragged,scrollBarDragged.scroll + GetScrollMovement([e.movementX,e.movementY],scrollBarDragged))){ scrollMural.Render(); } }
  }
})

document.addEventListener('mouseup', function(e){
  switch(e.button)
  {
    case 0: if (scrollMural != null && scrollBarDragged != null){ scrollBarDragged = null; scrollMural.Render(); scrollMural = null; } break;
    case 1: if (scrollMural != null) { scrollMural = null; } break;
  }
})

exports.Mural = Mural;
exports.ClearSliders = function (){ if ( scrollMural != null){ scrollBarDragged = null; scrollMural.Render(); scrollMural = null; } }
