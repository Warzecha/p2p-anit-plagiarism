const NetworkPeerInfo = require("./NetworkPeerInfo");
const BroadcastMessage = require("./BroadcastMessage");

const uuid = require('uuid/v1');
const dgram = require('dgram');
const PORT = 8080;

module.exports = class Peer {
    constructor(address, broadcastAddress) {
        this.peerId = uuid().toString();
        console.log(this.peerId);
        this.socket = dgram.createSocket("udp4");
        this.setSocketProperties();
        this.broadcastAddress = broadcastAddress;
        this.currentNetworkPeers = new Set();
        this.currentNetworkPeers.add(new NetworkPeerInfo(this.peerId, address));
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
            if (broadcastMessage.peerId === this.peerId) {
                console.log(`Broadcast received from self: ${this.peerId}`)
            } else {
                console.log(`New message from ${remoteInfo.address}:${remoteInfo.port} with id: ${broadcastMessage.peerId}`)
            }
        })
    };

    broadcastMessage() {
        this.socket.setBroadcast(true);
        const messageString = new Buffer(JSON.stringify(new BroadcastMessage(this.peerId)));
        this.socket.send(messageString, 0, messageString.length, PORT, this.broadcastAddress, function () {
            console.log("Sent broadcast message")
        })
    }

}
