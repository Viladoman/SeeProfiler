
const {remote, ipcRenderer,shell} = require('electron')
const {Menu, MenuItem, dialog} = remote

var versionNumber = require('electron').remote.app.getVersion();

var closeFunc = undefined;

var viewMenu = new MenuItem({
  label: 'View',
  submenu: [
    { role: 'reload' },
    { role: 'forcereload' },
    { type: 'separator' },
    { role: 'toggledevtools' },
    { type: 'separator' },
    { role: 'togglefullscreen' }
  ]
});

var helpMenu = new MenuItem({
  label: 'Help',
  submenu: [
    { label: 'Quick Guide', click: function () {
      dialog.showMessageBox(null, {
        type: 'info',
        title: 'See++ Compiler Profiler',
        message: 'Quick Guide',
        detail: '1. Compile your C++ files using Clang 9 ( or superior ) with the "-ftime-trace" flag.\n'+
                '2. Open/Drop the generated .json files here for inspection.'
        });
    }},
    { label: 'Documentation', click: function () { shell.openExternal('https://github.com/Viladoman/SeeProfiler/wiki') }, accelerator: 'CommandOrControl+F1' },
    { type: 'separator' },
    { label: 'Github', click: function () { shell.openExternal('https://github.com/Viladoman/SeeProfiler') } },
    { label: 'Twitter', click: function () { shell.openExternal('https://twitter.com/Viladoman') } },
    { type: 'separator' },
    { label: 'About', click: function () {
      dialog.showMessageBox(null, {
        type: 'info',
        title: 'See++ Compiler Profiler',
        message: 'See++ Compiler Profiler',
        detail: 'Author: Ramon Viladomat' +
                '\nVersion: ' + versionNumber +
                '\nElectron: '+ process.versions.electron +
                '\nChrome: '  + process.versions.chrome +
                '\nNode: '    + process.versions.node,
        });
    }},
  ]
});

var fileMenu = new MenuItem({ label: 'File' });

var tabMenu = undefined;

function GetCloseMenuItem()
{
  return process.platform === 'darwin'? { role: 'close' } : { role: 'quit' }
}

exports.SetTabMenu = function(input){ tabMenu = input; }
exports.SetCloseFunc = function (func){ closeFunc = func; }
exports.SetCover = function(cover)
{
    fileMenu = new MenuItem({
      label: 'File',
      submenu: [
        { label: 'Open Folder',  click: function(){ cover.OpenDialogDirs() }, accelerator: 'CommandOrControl+O' },
        { label: 'Open Files',   click: function(){ cover.OpenDialogFiles() }, accelerator: 'CommandOrControl+Shift+O' },
        { type: 'separator' },
        GetCloseMenuItem(),
      ]
    });
}

exports.SetStartMenu = function()
{
  const menu = new Menu();
  menu.append(fileMenu);
  menu.append(viewMenu);
  menu.append(helpMenu);
  Menu.setApplicationMenu(menu);
}

exports.SetLoadingMenu = function()
{
  const menu = new Menu();
  menu.append(new MenuItem({ label: 'File', submenu: [ GetCloseMenuItem(), ] }));
  menu.append(viewMenu);
  menu.append(helpMenu);
  Menu.setApplicationMenu(menu);
}

exports.SetMainMenu = function()
{
  const menu = new Menu();
  menu.append(new MenuItem({
    label: 'Actions',
    submenu: [
      { label: 'Close Extra Windows',  click: function(){ ipcRenderer.send('closeExtraWindows'); }, accelerator: 'CommandOrControl+Shift+W' },
      { type: 'separator' },
      { label: 'Close Session',  click: function(){ if (closeFunc) closeFunc(); }, accelerator: 'CommandOrControl+L' },
      { type: 'separator' },
      GetCloseMenuItem(),
    ]
  }));

  menu.append(viewMenu);
  if (tabMenu) menu.append(tabMenu);
  menu.append(helpMenu);

  Menu.setApplicationMenu(menu);
}

exports.Init = function()
{
  //Do here any initial window hooks
}

