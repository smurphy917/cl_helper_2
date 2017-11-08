const {app, BrowserWindow} = require('electron')
const path = require('path')
const url = require('url')
const pkginfo = require('pkginfo')(module)
export {CLHelper} from './core'
import * as fs from 'fs';

import * as Datastore from 'nedb';

if(app.getName() !== module.exports.productName){
  app.setName(module.exports.productName);
  app.setPath('userData',path.join(app.getPath('appData'),app.getName()));
}
if(!fs.existsSync(app.getPath('userData'))){
  fs.mkdirSync(app.getPath('userData'));
}
export const database = new Datastore({
  filename: path.join(app.getPath('userData'),'data.db'),
  autoload:true
});

database.ensureIndex({fielName: 'key', unique: true});

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
export let MainWindow

function createWindow () {
  // Create the browser window.
  MainWindow = new BrowserWindow({width: 800, height: 600})

  // and load the index.html of the app.
  MainWindow.loadURL(url.format({
    pathname: path.join(__dirname,'..', 'templates', 'index.html'),
    protocol: 'file:',
    slashes: true
  }))

  // Open the DevTools.
  MainWindow.webContents.openDevTools()

  // Emitted when the window is closed.
  MainWindow.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    MainWindow = null
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (MainWindow === null) {
    createWindow()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.