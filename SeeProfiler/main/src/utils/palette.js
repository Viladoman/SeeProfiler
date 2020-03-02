var Defs = require('../defs.js')

exports.Colors = {
  background:          '#333333',
  backgroundSelected:  '#535353',
  background2:         '#191919',
  background2Selected: '#393939',
  background3:         '#252525',
  nodeText:            '#ffffff',
  nodeOutline:         '#000000',
  infoText:            '#ffffff',
  disabledText:        '#777777',
}

exports.Text = {
  font:       '10px sans-serif',
  fontHeight: 10,
}

exports.GetNodeColor = function(nature)
{
  switch(nature)
  {
    case Defs.NodeNature.SOURCE:                return '#550055';
    case Defs.NodeNature.PARSECLASS:            return '#aa7300';
    case Defs.NodeNature.PARSETEMPLATE:         return '#aa7333';
    case Defs.NodeNature.INSTANTIATECLASS:      return '#007700';
    case Defs.NodeNature.INSTANTIATEFUNCTION:   return '#007733';
    case Defs.NodeNature.CODEGENFUNCTION:       return '#034736';
    case Defs.NodeNature.PENDINGINSTANTIATIONS: return '#000077';
    case Defs.NodeNature.OPTMODULE:             return '#773311';
    case Defs.NodeNature.OPTFUNCTION:           return '#2d4262';
    case Defs.NodeNature.RUNPASS:               return '#005555';
    case Defs.NodeNature.FRONTEND:              return '#888800';
    case Defs.NodeNature.BACKEND:               return '#885100';
    case Defs.NodeNature.EXECUTECOMPILER:       return '#337766';
    case Defs.NodeNature.OTHER:                 return '#770000';
    default: return '#333333';
  }
}
