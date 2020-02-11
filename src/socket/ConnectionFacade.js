const NetworkPeerInfo = require("./NetworkPeerInfo");
const BroadcastMessage = require("./BroadcastMessage");
const dgram = require('dgram');

const PORT = 8080;

module.exports = class ConnectionFacade {
    constructor(address, broadcastAddress, peer, onJobUpdateMessage, onNetworkInfoMessage, onNewJobMessage, window) {
        this.peer = peer;
        this.socket = dgram.createSocket("udp4");
        this.setSocketProperties();
        this.broadcastAddress = broadcastAddress;
        this.currentNetworkPeers = [];
        this.currentNetworkPeers.push(new NetworkPeerInfo(this.peer.peerId, address));
        this.window = window;

        this.onJobUpdateMessage = onJobUpdateMessage;
        this.onNetworkInfoMessage = onNetworkInfoMessage;
        this.onNewJobMessage = onNewJobMessage;
    }

    bindPeer() {
        this.socket.bind(PORT)
    }

    sendNewJobNotification(newJobMessageString, job) {
        this.socket.setBroadcast(false);

        this.currentNetworkPeers.forEach(peer => {
            this.socket.send(newJobMessageString, 0, newJobMessageString.length, PORT, peer.peerAddress, () => {
                console.log("Sending new job to: " + peer.peerId + " for job: " + job.jobId)
            })
        });

    };

    sendNetworkMessage = (remoteInfo) => {
        this.socket.setBroadcast(false);

        let networkMessage = new Buffer(JSON.stringify({
            messageType: 'NETWORK_MESSAGE',
            network: this.currentNetworkPeers,
            activeJobs: this.peer.activeJobs
        }));
        this.socket.send(networkMessage, 0, networkMessage.length, PORT, remoteInfo.address, () => {
            console.log("Sending current network to: " + remoteInfo.address)
        })
    };

    handleBroadcastMessage = (receivedMessage, remoteInfo) => {
        if (receivedMessage.peerId === this.peer.peerId) {
            console.log(`Broadcast received from self: ${this.peer.peerId}`)
        } else {
            console.log(`New message from ${remoteInfo.address}:${remoteInfo.port} with id: ${receivedMessage.peerId}`);
            this.currentNetworkPeers = this.currentNetworkPeers.filter(peer => peer.address !== remoteInfo.address);
            this.currentNetworkPeers.push(new NetworkPeerInfo(receivedMessage.peerId, remoteInfo.address));
            this.sendNetworkMessage(remoteInfo)
        }

        this.window.webContents.send('updatePeersNetwork', {
            currentNetworkPeers: this.currentNetworkPeers
        })
    };

    handleNetworkInfoMessage = (receivedMessage) => {
        receivedMessage.network.forEach((value) => {
            if (!this.currentNetworkPeers.map(value1 => value1.peerId).includes(value.peerId)) {
                this.currentNetworkPeers.push(new NetworkPeerInfo(value.peerId, value.peerAddress))
            }
        });

        this.onNetworkInfoMessage(receivedMessage);

        this.window.webContents.send('updatePeersNetwork', {
            currentNetworkPeers: this.currentNetworkPeers
        })
    };


    setSocketProperties = () => {
        this.socket.on('listening', function () {
            console.log("Listening for broadcast message")
        });

        this.socket.on('message', async (receivedMessage, remoteInfo) => {
            receivedMessage = JSON.parse(receivedMessage);
            const messageType = receivedMessage.messageType;
            switch (messageType) {
                case "BROADCAST":
                    this.handleBroadcastMessage(receivedMessage, remoteInfo);
                    break;
                case "NETWORK_MESSAGE":
                    this.handleNetworkInfoMessage(receivedMessage);
                    break;
                case "JOB_UPDATE":
                    this.onJobUpdateMessage(receivedMessage);
                    break;
                case "NEW_JOB":
                    await this.onNewJobMessage(receivedMessage);
                    break;
                default:
                    return;
            }

        })
    };

    setJobUpdateNotification = async (job) => {
        this.socket.setBroadcast(false);
        const jobUpdateMessageString = new Buffer(JSON.stringify({
            messageType: 'JOB_UPDATE',
            jobUpdate: job
        }));

        for (let peer of this.currentNetworkPeers) {
            if (peer.peerId !== this.peer.peerId) {
                await this.socket.send(jobUpdateMessageString, 0, jobUpdateMessageString.length, PORT, peer.peerAddress, () => {
                    console.log("Sending job update to: " + peer.peerId + " for job: " + job.jobId)
                })
            }
        }
    };

    broadcastMessage() {
        this.socket.setBroadcast(true);
        const messageString = new Buffer(JSON.stringify(new BroadcastMessage(this.peer.peerId)));
        this.socket.send(messageString, 0, messageString.length, PORT, this.broadcastAddress, function () {
            console.log("Sent broadcast message")
        })
    }

};

