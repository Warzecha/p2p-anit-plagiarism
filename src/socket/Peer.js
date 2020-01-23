const NetworkPeerInfo = require("./NetworkPeerInfo");
const BroadcastMessage = require("./BroadcastMessage");
const {ipcMain} = require('electron');
const uuid = require('uuid/v1');
const dgram = require('dgram');
const PORT = 8080;

module.exports = class Peer {
    constructor(address, broadcastAddress, window) {
        this.peerId = uuid().toString();
        console.log(this.peerId);
        this.socket = dgram.createSocket("udp4");
        this.setSocketProperties();
        this.broadcastAddress = broadcastAddress;
        this.currentNetworkPeers = [];
        this.currentNetworkPeers.push(new NetworkPeerInfo(this.peerId, address));
        this.window = window;
    }

    bindPeer() {
        this.socket.bind(PORT)
    }

    setSocketProperties = () => {
        this.socket.on('listening', function () {
            console.log("Listening for broadcast message")
        });
        this.socket.on('message', (broadcastMessage, remoteInfo) => {
            broadcastMessage = JSON.parse(broadcastMessage);
            if (broadcastMessage.network == null) {
                // to znaczy że przyszedł broadcast
                if (broadcastMessage.peerId === this.peerId) {
                    console.log(`Broadcast received from self: ${this.peerId}`)
                } else {
                    console.log(`New message from ${remoteInfo.address}:${remoteInfo.port} with id: ${broadcastMessage.peerId}`);
                    this.currentNetworkPeers.push(new NetworkPeerInfo(broadcastMessage.peerId, remoteInfo.address));
                    this.socket.setBroadcast(false);
                    let networkMessage = new Buffer(JSON.stringify({
                        network: this.currentNetworkPeers
                    }));
                    this.socket.send(networkMessage, 0, networkMessage.length, PORT, remoteInfo.address, () => {
                        console.log("Sending current network to: " + remoteInfo.address)
                    })
                }

            } else {
                //pryszla pojdeyczna wiadomosc
                broadcastMessage.network.forEach((value, index) => {
                    if (!this.currentNetworkPeers.map(value1 => value1.peerId).includes(value.peerId)) {
                        this.currentNetworkPeers.push(new NetworkPeerInfo(value.peerId, value.peerAddress))
                    }
                });
            }

            this.window.webContents.send('updatePeersNetwork', {
                currentNetworkPeers: this.currentNetworkPeers
            })

        })
    };

    broadcastMessage() {
        this.socket.setBroadcast(true);
        const messageString = new Buffer(JSON.stringify(new BroadcastMessage(this.peerId)));
        this.socket.send(messageString, 0, messageString.length, PORT, this.broadcastAddress, function () {
            console.log("Sent broadcast message")
        })
    }

};
