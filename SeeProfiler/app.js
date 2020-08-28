const {app, BrowserWindow, ipcMain} = require('electron')
const path = require('path')
const url = require('url')

// Electron reload ( reloads the app on change ) / remove on deploy
// If app is packaged (in production environment), we don't load electron-reload
if (!app.isPackaged){
    require('electron-reload')(__dirname, {
        electron: path.join(__dirname, 'node_modules', '.bin', 'electron')
    })
}

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win

let iconPath = process.platform === "win32"? path.join(__dirname, 'main', 'data', 'logo.ico') : undefined;

let extraWindows = [];

function CloseAllExtraWindows()
{
  //reference windows to avoid auto cannibalism on the close event skipping closures
  var tmpWindows = [];

  for (var i=0;i<extraWindows.length;++i)
  {
    tmpWindows.push(extraWindows[i].win);
  }

  //Close all the window elements
  for (var i=0;i<tmpWindows.length;++i)
  {
    tmpWindows[i].close();
  }
}

function CreateWindow () {

  // Create the browser window.
  win = new BrowserWindow({width: 1600, height: 900, show: false, icon: iconPath, webPreferences: {
    nodeIntegration: true,
    enableRemoteModule: true
  }})

  // and load the index.html of the app.
  win.loadURL(url.format({
    pathname: path.join(__dirname, 'main/index.html'),
    protocol: 'file:',
    slashes: true
  }))

  // Open the DevTools.
  //win.webContents.openDevTools()

  // Emitted when the window is closed.
  win.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    CloseAllExtraWindows();
    win = null
  })

  win.once('ready-to-show', () => { win.show() })
}

function FindExtraWindow(id){
  for (var i=0;i<extraWindows.length;++i)
  {
    if (extraWindows[i].id == id){ return extraWindows[i].win; }
  }
  return null;
}

function CreateExtraWindow(winFolder,id,args){

  winObj = { id: id, args: args };

  // Create the browser window.
  winObj.win = new BrowserWindow({width: 1400, height: 900, show: false, icon: iconPath, webPreferences: {
    nodeIntegration: true ,
    enableRemoteModule: true
  }})

  // and load the index.html of the app.
  winObj.win.loadURL(url.format({
   pathname: path.join(__dirname, winFolder+'/index.html'),
   protocol: 'file:',
   slashes: true
  }))

  // Open the DevTools.
  //winObj.win.webContents.openDevTools()
  winObj.win.setMenu(null);

  // Emitted when the window is closed.
  winObj.win.on('closed', () => {
    for (var i=0;i<extraWindows.length;++i)
    {
      if (extraWindows[i].id == winObj.id)
      {
        extraWindows.splice(i, 1);
        break;
      }
    }
 })

 winObj.win.once('ready-to-show', () => {
   winObj.win.show();
   if (winObj.args){ winObj.win.webContents.send('args' , winObj.args); winObj.args = undefined; }
  })

 extraWindows.push(winObj);

 console.log(extraWindows);

 return winObj;
}

ipcMain.on('show-tool', function(){ win.show(); })

ipcMain.on('openExtraWindow', (event, winFolder, id, args) => {
  //Find if already exists ( if so, focus(), if not create new extra window)
  var compoundId = winFolder+'_'+id;
  var extraWin = FindExtraWindow(compoundId);
  if (extraWin == null) { CreateExtraWindow(winFolder,compoundId,args); }
  else
  {
    extraWin.focus();
    if (args){ extraWin.webContents.send('args' , args); }
  }
})

ipcMain.on('closeExtraWindows', CloseAllExtraWindows);

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', CreateWindow)
app.on('window-all-closed', app.quit);
app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {
    CreateWindow()
  }
})

process.on('uncaughtException', function (err) { console.log(err); })

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
