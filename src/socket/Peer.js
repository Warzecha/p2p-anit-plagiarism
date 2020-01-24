const NetworkPeerInfo = require("./NetworkPeerInfo");
const BroadcastMessage = require("./BroadcastMessage");
const Job = require("./Job");
const uuid = require('uuid/v1');
const dgram = require('dgram');
const {ValidationManager} = require("./../validator/ValidationManager");
const {WikiDataStrategy} = require("./../validator/WikipediaSourceStrategy");

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
        this.activeJobs = [];
        this.currentTask = null;

        this.validationManager = new ValidationManager(WikiDataStrategy);

    }

    bindPeer() {
        this.socket.bind(PORT)
    }

    createJob(arrayOfWords, arrayOfInterestingWords) {
        let job = new Job(uuid(), arrayOfWords, [], false, arrayOfInterestingWords);
        this.socket.setBroadcast(false);
        const newJobMessageString = new Buffer(JSON.stringify({
            messageType: 'NEW_JOB',
            job: job
        }));

        this.currentNetworkPeers.forEach(value => {
            this.socket.send(newJobMessageString, 0, newJobMessageString.length, PORT, value.peerAddress, () => {
                console.log("Sending new job to: " + value.peerId + " for job: " + job.jobId)
            })
        });

        this.activeJobs.push(job);

    };

    handleNewJobMessage = (receivedMessage) => {
        const receivedJob = receivedMessage.job;
        if (!this.activeJobs.map(value => value.jobId).includes(receivedJob.jobId)) {
            this.activeJobs.push(receivedJob);
        }
    };

    handleBroadcastMessage = (receivedMessage, remoteInfo) => {
        if (receivedMessage.peerId === this.peerId) {
            console.log(`Broadcast received from self: ${this.peerId}`)
        } else {
            console.log(`New message from ${remoteInfo.address}:${remoteInfo.port} with id: ${receivedMessage.peerId}`);
            this.currentNetworkPeers.push(new NetworkPeerInfo(receivedMessage.peerId, remoteInfo.address));
            this.socket.setBroadcast(false);
            let networkMessage = new Buffer(JSON.stringify({
                messageType: 'NETWORK_MESSAGE',
                network: this.currentNetworkPeers,
                activeJobs: this.activeJobs
            }));
            this.socket.send(networkMessage, 0, networkMessage.length, PORT, remoteInfo.address, () => {
                console.log("Sending current network to: " + remoteInfo.address)
            })
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

        receivedMessage.activeJobs.forEach((value) => {
            if (!this.activeJobs.map(value1 => value1.jobId).includes(value.jobId)) {
                this.activeJobs.push(new Job(value.jobId, value.arrayOfWords, value.finishedChunks, value.finished, value.arrayOfInterestingWords))
            }

            if (!this.currentTask) {
                this.startTask();
            }
        });

        this.window.webContents.send('updatePeersNetwork', {
            currentNetworkPeers: this.currentNetworkPeers
        })
    };

    handleJobUpdateMessage = (receivedMessage) => {
        this.activeJobs.forEach(value => {
            if (value.jobId === receivedMessage.jobUpdate.jobId) {
                value.addNewFinishedIndexes(receivedMessage.jobUpdate.finishedIndex.index, receivedMessage.jobUpdate.finishedIndex.size);
                value.finished = receivedMessage.jobUpdate.finished
            }
        });
    };

    setSocketProperties = () => {
        this.socket.on('listening', function () {
            console.log("Listening for broadcast message")
        });

        this.socket.on('message', (receivedMessage, remoteInfo) => {
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
                    this.handleJobUpdateMessage(receivedMessage);
                    break;
                case "NEW_JOB":
                    this.handleNewJobMessage(receivedMessage);
                    break;
                default:
                    return;
            }


        })
    };

    updateJob = (jobId, finishedIndex, size) => {
        let updated = false;
        let isNowFinished = false;
        for (let i = 0; i < this.activeJobs.length; i++) {
            let job = this.activeJobs[i];
            if (job.jobId === jobId) {
                if (!job.finishedChunks[size].includes(finishedIndex)) {
                    job.addNewFinishedIndexes(finishedIndex, size);
                    updated = true;
                    isNowFinished = job.finished
                }
            }
        }

        if (updated) {
            this.socket.setBroadcast(false);
            const jobUpdateMessageString = new Buffer(JSON.stringify({
                messageType: 'JOB_UPDATE',
                jobUpdate: {
                    jobId: jobId,
                    finishedIndex: {
                        index: finishedIndex,
                        size: size
                    },
                    finished: isNowFinished
                }
            }));

            this.currentNetworkPeers.forEach(value => {
                this.socket.send(jobUpdateMessageString, 0, jobUpdateMessageString.length, PORT, value.peerAddress, () => {
                    console.log("Sending job update to: " + value.peerId + " for job: " + jobId)
                })
            })
        }

    };

    broadcastMessage() {
        this.socket.setBroadcast(true);
        const messageString = new Buffer(JSON.stringify(new BroadcastMessage(this.peerId)));
        this.socket.send(messageString, 0, messageString.length, PORT, this.broadcastAddress, function () {
            console.log("Sent broadcast message")
        })
    }

    findAvailableTask = () => {
        let jobToDo = this.activeJobs.filter(value => !value.finished)[0];

        let availableTasks = [];

        Object.keys(jobToDo.finishedChunks).forEach(size => {

            for (let i = 0; i < jobToDo.finishedChunks[size].length; i++) {
                if (!jobToDo.finishedChunks[size].includes(i)) {
                    availableTasks.push({
                        index: i,
                        size: size,
                        jobId: jobToDo.jobId
                    })
                }
            }
        });

        return availableTasks[getRandomInt(0, availableTasks.length)]
    };

    getTaskData = (wordsArray, size, index) => {
        if (wordsArray.length <= size) {
            return wordsArray
        } else {
            return wordsArray.slice(index, index + size)
        }
    };

    startTask = async () => {
        let task = this.findAvailableTask();
        let job = this.activeJobs.filter(item => item.jobId === task.jobId)[0];

        let taskWordsArray = this.getTaskData(job.arrayOfWords, task.size, task.index);

        let results = await this.validationManager.validate(taskWordsArray, job.arrayOfInterestingWords);

        console.log("Results: ", results)




    }

};


function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
