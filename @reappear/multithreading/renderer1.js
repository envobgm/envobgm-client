const { ipcRenderer } = require('electron');

ipcRenderer.on('ping', (event, arg) => {
  // do something
  console.log('谢谢，', event, arg);
});
