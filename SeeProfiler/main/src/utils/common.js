
String.prototype.replaceAll = function(str1, str2, ignore)
{
    return this.replace(new RegExp(str1.replace(/([\/\,\!\\\^\$\{\}\[\]\(\)\.\*\+\?\|\<\>\-\&])/g,"\\$&"),(ignore?"gi":"g")),(typeof(str2)=="string")?str2.replace(/\$/g,"$$$$"):str2);
}

exports.CloneObject = function(obj)
{
  return obj == undefined? undefined : JSON.parse(JSON.stringify(obj));
}

exports.ShuffleContainer = function(container)
{
  var j, x, i;
  for (i = container.length - 1; i > 0; i--)
  {
      j = Math.floor(Math.random() * (i + 1));
      x = container[i];
      container[i] = container[j];
      container[j] = x;
  }
}

exports.SwapContainerElements = function(container, indexA, indexB)
{
  if (indexA >= 0 && indexA < container.length && indexB >= 0 && indexB < container.length)
  {
    var tmp = container[indexA];
    container[indexA] = container[indexB];
    container[indexB] = tmp;
    return true;
  }
  return false;
}

exports.RemoveFromContainer = function(container, element)
{
  var index = container.indexOf(element);
  if (index > -1)
  {
    container.splice(index, 1);
    return true;
  }
  return false;
};

exports.RemoveFromContainerIndex = function(container, index)
{
  if (index >= 0 && index < container.length)
  {
    container.splice(index, 1);
    return true;
  }
  return false;
}

exports.PushUnique = function(container, element)
{
  var index = container.indexOf(element);
  if (index == -1)
  {
    container.push(element);
    return true;
  }
  return false;
}

exports.GetCursorWindowPosition = function(e)
{
  var x;
  var y;
  if (e.pageX != undefined && e.pageY != undefined) {
      x = e.pageX;
      y = e.pageY;
  }
  else {
      x = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
      y = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
  }
  return [x,y];
}

exports.GetDocumentWidth = function() {
  return Math.max(
    document.body.scrollWidth,
    document.documentElement.scrollWidth,
    document.body.offsetWidth,
    document.documentElement.offsetWidth,
    document.documentElement.clientWidth
  );
}

exports.GetDocumentHeight = function() {
  return Math.max(
    document.body.scrollHeight,
    document.documentElement.scrollHeight,
    document.body.offsetHeight,
    document.documentElement.offsetHeight,
    document.documentElement.clientHeight
  );
}

exports.GetLeft = function(element){ return Math.round(element.getBoundingClientRect().left); }
exports.GetTop = function(element){ return Math.round(element.getBoundingClientRect().top); }

exports.FromGlobalToLocal = function(position,element)
{
  if (position == null) return null;
  var dpi = window.devicePixelRatio;
  return [(position[0]-exports.GetLeft(element))*dpi,(position[1]-exports.GetTop(element))*dpi];
}

exports.FromLocalToGlobal = function(position,element)
{
  if (position == null) return null;
  var dpi = window.devicePixelRatio;
  return [(position[0]/dpi)+exports.GetLeft(element),(position[1]/dpi)+exports.GetTop(element)];
}

exports.FromLocalToScroll = function(position,scrollX,scrollY){ return position == null? null : [position[0]+scrollX,position[1]+scrollY]; }
exports.FromScrollToLocal = function(position,scrollX,scrollY){ return position == null? null : [position[0]-scrollX,position[1]-scrollY]; }

exports.IsInElementLocal = function(position,element){ return position != null && position[0] >= 0 && position[0] <= element.width && position[1] >= 0 && position[1] <= element.height ; }

exports.BigTimeToString = function(input){
  var seconds = input;
  var minutes = Math.floor(seconds/60);
  var hours   = Math.floor(minutes/60);
  if (minutes > 0){ seconds = Math.floor(seconds-minutes*60); }
  if ( hours > 0) { minutes = Math.floor(minutes-hours*60); }
  return seconds == input? String(input.toFixed(2))+'s' : (hours>0? String(hours)+'h' : '')+String(minutes)+'m'+String(seconds)+'s';
}

exports.TimeToString = function(input){ return input == 0? '-' : (input < 1000? String(input)+'µs' : (input < 1000000? String((input/1000).toFixed(2))+'ms' : exports.BigTimeToString(input/1000000))); }

function componentToHex(c) {

    var hex = Math.min(c,255).toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}

exports.rgbToHex = function (r, g, b) { return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b); }
exports.hexToRgb = function (hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

exports.ShiftColor = function(color,offset)
{
  var rgb = exports.hexToRgb(color);
  return exports.rgbToHex(rgb.r+offset,rgb.g+offset,rgb.b+offset);
}

exports.NormalizeNumberString = function(str)
{
  var value = Number(str);
  value = isNaN(value)? 0 : value;
  return String(value);
}

var onResize = function(element, callback) {
  if (!onResize.watchedElementData) {
    // First time we are called, create a list of watched elements
    // and hook up the event listeners.
    onResize.watchedElementData = [];

    var checkForChanges = function() {
      onResize.watchedElementData.forEach(function(data) {
        if (data.element.offsetWidth !== data.offsetWidth ||
            data.element.offsetHeight !== data.offsetHeight) {
          data.offsetWidth = data.element.offsetWidth;
          data.offsetHeight = data.element.offsetHeight;
          data.callback();
        }
      });
    };

    // Listen to the window's size changes
    window.addEventListener('resize', checkForChanges);

    setInterval(checkForChanges, 1); //TODO -  find a good way to do this
/*
    // Listen to changes on the elements in the page that affect layout
    var observer = new MutationObserver(checkForChanges);
    observer.observe(document.body, {
      attributes: true,
      childList: true,
      characterData: true,
      subtree: true
    });
    */
  }

  // Save the element we are watching
  onResize.watchedElementData.push({
    element: element,
    offsetWidth: element.offsetWidth,
    offsetHeight: element.offsetHeight,
    callback: callback
  });
};

exports.OnResize = onResize;
