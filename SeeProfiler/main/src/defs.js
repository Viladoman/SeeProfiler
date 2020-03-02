
exports.NodeNature = {
  SOURCE:                0,
  PARSECLASS:            1,
  PARSETEMPLATE:         2,
  INSTANTIATECLASS:      3,
  INSTANTIATEFUNCTION:   4,
  CODEGENFUNCTION:       5,
  OPTMODULE:             6,
  OPTFUNCTION:           7,
  OTHER:                 8,
  RUNPASS:               9,
  PENDINGINSTANTIATIONS: 10,
  FRONTEND:              11,
  BACKEND:               12,
  EXECUTECOMPILER:       13,
  INVALID:               14,
}

exports.NodeNatureData = {
  GLOBAL_GATHER_THRESHOLD:  exports.NodeNature.RUNPASS,
  GLOBAL_DISPLAY_THRESHOLD: exports.NodeNature.EXECUTECOMPILER,
  COUNT:                    exports.NodeNature.INVALID
}

exports.NodeNatureFromString = function(natureName)
{
       if (natureName == 'Source')    { return exports.NodeNature.SOURCE; }
  else if (natureName == 'ParseClass'){ return exports.NodeNature.PARSECLASS; }
  else if (natureName == 'ParseTemplate') { return exports.NodeNature.PARSETEMPLATE; }
  else if (natureName == 'InstantiateClass'){ return exports.NodeNature.INSTANTIATECLASS; }
  else if (natureName == 'InstantiateFunction'){ return exports.NodeNature.INSTANTIATEFUNCTION; }
  else if (natureName == 'CodeGen Function'){ return exports.NodeNature.CODEGENFUNCTION; }
  else if (natureName == 'PerformPendingInstantiations'){ return exports.NodeNature.PENDINGINSTANTIATIONS; }
  else if (natureName == 'OptModule'){ return exports.NodeNature.OPTMODULE; }
  else if (natureName == 'OptFunction'){ return exports.NodeNature.OPTFUNCTION; }
  else if (natureName == 'RunPass'){ return exports.NodeNature.RUNPASS; }
  else if (natureName == 'Frontend'){ return exports.NodeNature.FRONTEND; }
  else if (natureName == 'Backend'){ return exports.NodeNature.BACKEND; }
  else if (natureName == 'ExecuteCompiler'){ return exports.NodeNature.EXECUTECOMPILER; }
  else if (natureName == 'Other'){ return exports.NodeNature.OTHER; }
  return exports.NodeNature.OTHER;
}

exports.NodeNatureToString = function(nature)
{
  switch(nature)
  {
    case exports.NodeNature.SOURCE:                return 'Source';
    case exports.NodeNature.PARSECLASS:            return 'ParseClass';
    case exports.NodeNature.PARSETEMPLATE:         return 'ParseTemplate';
    case exports.NodeNature.INSTANTIATECLASS:      return 'InstantiateClass';
    case exports.NodeNature.INSTANTIATEFUNCTION:   return 'InstantiateFunction';
    case exports.NodeNature.CODEGENFUNCTION:       return 'CodeGen Function';
    case exports.NodeNature.PENDINGINSTANTIATIONS: return 'PerformPendingInstantiations';
    case exports.NodeNature.OPTMODULE:             return 'OptModule';
    case exports.NodeNature.OPTFUNCTION:           return 'OptFunction';
    case exports.NodeNature.RUNPASS:               return 'RunPass';
    case exports.NodeNature.FRONTEND:              return 'Frontend';
    case exports.NodeNature.BACKEND:               return 'Backend';
    case exports.NodeNature.EXECUTECOMPILER:       return 'ExecuteCompiler';
    case exports.NodeNature.OTHER:                 return 'Other';

    default: return String(nature);
  }
}

exports.NodeNatureFromKey = function(key)
{
  if (key == 'source')    { return exports.NodeNature.SOURCE; }
  else if (key == 'parseClass'){ return exports.NodeNature.PARSECLASS; }
  else if (key == 'parseTemplate') { return exports.NodeNature.PARSETEMPLATE; }
  else if (key == 'instantiateClass'){ return exports.NodeNature.INSTANTIATECLASS; }
  else if (key == 'instantiateFunction'){ return exports.NodeNature.INSTANTIATEFUNCTION; }
  else if (key == 'codeGen'){ return exports.NodeNature.CODEGENFUNCTION; }
  else if (key == 'pendingInstantiations'){ return exports.NodeNature.PENDINGINSTANTIATIONS; }
  else if (key == 'optModule'){ return exports.NodeNature.OPTMODULE; }
  else if (key == 'optFunction'){ return exports.NodeNature.OPTFUNCTION; }
  else if (key == 'runPass'){ return exports.NodeNature.RUNPASS; }
  else if (key == 'frontEnd'){ return exports.NodeNature.FRONTEND; }
  else if (key == 'backend'){ return exports.NodeNature.BACKEND; }
  else if (key == 'executeCompiler'){ return exports.NodeNature.EXECUTECOMPILER; }
  else if (key == 'other'){ return exports.NodeNature.OTHER; }
  return exports.NodeNature.INVALID;
}

exports.NodeNatureToKey = function(nature)
{
  switch(nature)
  {
    case exports.NodeNature.SOURCE:                return 'source';
    case exports.NodeNature.PARSECLASS:            return 'parseClass';
    case exports.NodeNature.PARSETEMPLATE:         return 'parseTemplate';
    case exports.NodeNature.INSTANTIATECLASS:      return 'instantiateClass';
    case exports.NodeNature.INSTANTIATEFUNCTION:   return 'instantiateFunction';
    case exports.NodeNature.CODEGENFUNCTION:       return 'codeGen';
    case exports.NodeNature.PENDINGINSTANTIATIONS: return 'pendingInstantiations';
    case exports.NodeNature.OPTMODULE:             return 'optModule';
    case exports.NodeNature.OPTFUNCTION:           return 'optFunction';
    case exports.NodeNature.RUNPASS:               return 'runPass';
    case exports.NodeNature.FRONTEND:              return 'frontEnd';
    case exports.NodeNature.BACKEND:               return 'backend';
    case exports.NodeNature.EXECUTECOMPILER:       return 'executeCompiler';
    case exports.NodeNature.OTHER:                 return 'other';
    default: return String(nature);
  }
}

exports.NodeNatureToDisplayString = function(nature)
{
  switch(nature)
  {
    case exports.NodeNature.SOURCE:                return 'Source';
    case exports.NodeNature.PARSECLASS:            return 'ParseClass';
    case exports.NodeNature.PARSETEMPLATE:         return 'ParseTemplate';
    case exports.NodeNature.INSTANTIATECLASS:      return 'InstantiateClass';
    case exports.NodeNature.INSTANTIATEFUNCTION:   return 'InstantiateFunction';
    case exports.NodeNature.CODEGENFUNCTION:       return 'CodeGenFunction';
    case exports.NodeNature.PENDINGINSTANTIATIONS: return 'PendingInstantiations';
    case exports.NodeNature.OPTMODULE:             return 'OptModule';
    case exports.NodeNature.OPTFUNCTION:           return 'OptFunction';
    case exports.NodeNature.RUNPASS:               return 'RunPass';
    case exports.NodeNature.FRONTEND:              return 'Frontend';
    case exports.NodeNature.BACKEND:               return 'Backend';
    case exports.NodeNature.EXECUTECOMPILER:       return 'ExecuteCompiler';

    default: return 'Other';
  }
}

exports.NodeNatureToShortDisplayString = function(nature)
{
  switch(nature)
  {
    case exports.NodeNature.SOURCE:                return 'S';
    case exports.NodeNature.PARSECLASS:            return 'PC';
    case exports.NodeNature.PARSETEMPLATE:         return 'PT';
    case exports.NodeNature.INSTANTIATECLASS:      return 'IC';
    case exports.NodeNature.INSTANTIATEFUNCTION:   return 'IF';
    case exports.NodeNature.CODEGENFUNCTION:       return 'CG';
    case exports.NodeNature.PENDINGINSTANTIATIONS: return 'PI';
    case exports.NodeNature.OPTMODULE:             return 'OM';
    case exports.NodeNature.OPTFUNCTION:           return 'OF';
    case exports.NodeNature.RUNPASS:               return 'RP';
    case exports.NodeNature.FRONTEND:              return 'F';
    case exports.NodeNature.BACKEND:               return 'B';
    case exports.NodeNature.EXECUTECOMPILER:       return 'EC';

    default: return '';
  }
}
