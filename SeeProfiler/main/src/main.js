var Interface = require('./interface.js')
var Collector = require('./collector.js')
var Cover     = require('./cover.js')
var Overview  = require('./overview.js')

var cover = new Cover.Cover();

Interface.Init();

Collector.SetOnFolderScan(function(dir){ cover.OnFolderScan(dir); } )
Collector.SetOnFileFound(function(file){ cover.OnFileFound(file); })
Collector.SetOnFileParsing(function(file){ cover.OnFileParsing(file); })
Collector.SetOnFileDone(function(file){ cover.OnFileDone(file); })
Collector.SetOnFinalizing(function(){ cover.OnFinalizing(); })

cover.AddPathsSelectedCallback(function(paths){
  cover.Loading();

  Collector.Load(paths,function(input)
  {
    if (input && input.objects && input.objects.length)
    {
      console.log("Valid data found!");
      Overview.Init(input);
      cover.UnCover();
    }
    else if (input.error)
    {
      console.log(input.error);
      cover.Cover();
    }
    else
    {
      console.log("Data not found!");
      cover.Cover();
    }
  });
});

Interface.SetCloseFunc(function(){
  Overview.Destroy();
  cover.Cover();
})

//Trigger everything
cover.Init();
