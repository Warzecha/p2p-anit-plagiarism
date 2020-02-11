const Peer = require('./socket/Peer');
const ifaces = require('os').networkInterfaces();
const electron = require('electron');
const {app, BrowserWindow, Tray, Menu, ipcMain} = electron;
const path = require('path');
const isDev = require('electron-is-dev');
require('electron-reload')(__dirname);
const fs = require('fs');
const pdf = require('pdf-parse');

let mainWindow;
let tray = null;
let peer = null;

async function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1000,
        height: 600,
        title: "P2P - Anti Plagiarism App",
        resizable: false,
        webPreferences: {
            nodeIntegration: true,
        },

    });

    await mainWindow.loadURL(
        isDev
            ? 'http://localhost:3000'
            : `file://${path.join(__dirname, '../build/index.html')}`,
    );

    mainWindow.on('closed', () => {
        mainWindow = null
    });

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

app.on('ready', async () => {
    createTray();
    await createWindow();
});


ipcMain.on('connectToPearNetwork', ((event) => {
    const {ip, mask} = getIpAndMask();
    let broadcast = ip.split('.');
    console.log(broadcast);

    let finalBroadCast = `${broadcast[0]}.${broadcast[1]}.${broadcast[2]}.15`;

    console.log(ip);
    console.log(finalBroadCast);

    peer = new Peer(ip, finalBroadCast, mainWindow, );
    peer.bindPeer();

    setTimeout(() => {
        peer.broadcastMessage();
        event.sender.send('connectToPearNetworkResponse', {
            peerId: peer.peerId,
        })

    }, 2000);

}));

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
            peer.createJob(formattedArray, interestingArray.map(value => value.word), args.strategy, path);
        })

    })

}));

app.on('activate', async () => {
    if (mainWindow === null) {
        await createWindow()
    }
});
