const uuid = require('uuid');

const Peer = require('./socket/Peer');
const ifaces = require('os').networkInterfaces();
const electron = require('electron');
const {app, BrowserWindow, Tray, Menu, ipcMain} = electron;
const axios = require('axios');
const path = require('path');
const isDev = require('electron-is-dev');
require('electron-reload')(__dirname);
const fs = require('fs');
const pdf = require('pdf-parse');

let mainWindow;
let tray = null;
let peer = null;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        title: "P2P - Anti Plagiarism App",
        webPreferences: {
            nodeIntegration: true,
            // devTools: true
        },

    });

    mainWindow.loadURL(
        isDev
            ? 'http://localhost:3000'
            : `file://${path.join(__dirname, '../build/index.html')}`,
    );

    mainWindow.on('closed', () => {
        mainWindow = null
    });

    // mainWindow.webContents.openDevTools();

}

const getIpAndMask = () => {
    let ip = null;
    let mask = null;

    Object.keys(ifaces).forEach(function (ifname) {

        ifaces[ifname].forEach(function (iface) {
            if (iface.family === 'IPv4' && !iface.internal) {
                ip = iface.address;
                mask = iface.netmask;
            }
        });
    });

    return {
        ip: ip,
        mask: mask
    }
};

const createTray = () => {
    tray = new Tray('assets/cloud_icon.png');
    const contextMenu = Menu.buildFromTemplate([
        {label: 'Open', click: createWindow},
        {label: 'Quit', click: () => app.quit()},
    ]);

    tray.setToolTip('This is my application.');
    tray.setContextMenu(contextMenu)
};

app.on('ready', () => {
    createTray();
    createWindow();
});

ipcMain.on('connectToPearNetwork', ((event) => {
    const {ip, mask} = getIpAndMask();
    let broadcast = ip.split('.');
    console.log(broadcast);
    let finalBroadCast = `${broadcast[0]}.${broadcast[1]}.${broadcast[2]}.255`;

    console.log(ip);
    console.log(finalBroadCast);

    peer = new Peer(ip, finalBroadCast, mainWindow);
    peer.bindPeer();

    setTimeout(() => {
        peer.broadcastMessage();
        // let customPeersList = [peer.peerId, uuid().toString(), uuid().toString()];

        event.sender.send('connectToPearNetworkResponse', {
            peerId: peer.peerId,
        })

    }, 2000);

}));


// ipcMain.on('updatePeerNetwork', ((event, args) => {
//
// }));

ipcMain.on('parseFiles', ((event, args) => {
    args.files.forEach((file) => {
        const path = file.path;
        console.log(path);
        let dataBuffer = fs.readFileSync(path);
        let text;

        pdf(dataBuffer).then((data) => {

            text = data.text.replace(/(^[ \t]*\n)/gm, "");
            let formatted = text.split('.').map((split) => {
                return split.replace(/\s+/g, " ");
            }).join('').replace(/,/g, "").toLocaleLowerCase();
            // console.log(formatted);
            let formattedArray = formatted.split(' ');
            let interestingArray = [];
            for (let i = 0; i < formattedArray.length; i++) {
                if (formattedArray[i].length > 4) {
                    let numberOfOccurrences = 0;
                    for (let j = 0; j < formattedArray.length - 1; j++) {
                        if (formattedArray[i] === formattedArray[j]) {
                            numberOfOccurrences++;
                        }
                    }

                    if (interestingArray.length === 0) {
                        interestingArray.push({
                            word: formattedArray[i],
                            numberOfOccurrences: numberOfOccurrences
                        })
                    } else if (!interestingArray.map(value => value.word).includes(formattedArray[i]) && interestingArray[0].numberOfOccurrences <= numberOfOccurrences) {
                        interestingArray.unshift({
                            word: formattedArray[i],
                            numberOfOccurrences: numberOfOccurrences
                        })
                    }

                    if (interestingArray.length > 5) {
                        interestingArray.pop();
                    }

                }
            }

            console.log(interestingArray.map(value => value.word));
            peer.createJob(formattedArray, interestingArray.map(value => value.word));
            // let array5 = splitToArray(formatted, 5);
            // let array25 = splitToArray(formatted, 25);
        })

    })

}));


const splitToArray = (formattedText, size) => {
    let array = [];
    let words = formattedText.split(' ');
    if (words.length <= size) {
        return [formattedText]
    } else {
        for (let i = 0; i < words.length - size; i++) {
            array.push(words.slice(i, i + size).join(' '))
        }
        return array;
    }
};


// app.on('window-all-closed', () => {
//     if (process.platform !== 'darwin') {
//         app.quit()
//     }
// });

app.on('activate', () => {
    if (mainWindow === null) {
        createWindow()
    }
});
