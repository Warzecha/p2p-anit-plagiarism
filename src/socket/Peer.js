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
        let job = new Job(uuid(), arrayOfWords, {5: [], 25: []}, false, arrayOfInterestingWords);
        this.socket.setBroadcast(false);
        const newJobMessageString = new Buffer(JSON.stringify({
            messageType: 'NEW_JOB',
            job: job
        }));

        this.currentNetworkPeers.forEach(peer => {
            this.socket.send(newJobMessageString, 0, newJobMessageString.length, PORT, peer.peerAddress, () => {
                console.log("Sending new job to: " + peer.peerId + " for job: " + job.jobId)
            })
        });

        this.activeJobs.push(job);

    };

    handleNewJobMessage = async (receivedMessage) => {
        const receivedJob = receivedMessage.job;
        console.log("Received new job: ", receivedJob.jobId);
        if (!this.activeJobs.map(value => value.jobId).includes(receivedJob.jobId)) {
            this.activeJobs.push(receivedJob);
        }
        if (!this.currentTask) {
            await this.startTask();
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

        receivedMessage.activeJobs.forEach(async (receivedJob) => {
            if (!this.activeJobs.map(j => j.jobId).includes(receivedJob.jobId)) {
                this.activeJobs.push(new Job(receivedJob.jobId, receivedJob.arrayOfWords, receivedJob.finishedChunks, receivedJob.finished, receivedJob.arrayOfInterestingWords))
            }

            // if (!this.currentTask) {
            //     await this.startTask();
            // }
        });

        this.window.webContents.send('updatePeersNetwork', {
            currentNetworkPeers: this.currentNetworkPeers
        })
    };

    handleJobUpdateMessage = (receivedMessage) => {
        this.activeJobs.forEach(job => {
            if (job.jobId === receivedMessage.jobUpdate.jobId) {
                job.addNewFinishedIndexes(receivedMessage.jobUpdate.finishedIndex.index, receivedMessage.jobUpdate.finishedIndex.size, receivedMessage.results);
                job.finished = receivedMessage.jobUpdate.finished
            }
        });
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
                    this.handleJobUpdateMessage(receivedMessage);
                    break;
                case "NEW_JOB":
                    await this.handleNewJobMessage(receivedMessage);
                    break;
                default:
                    return;
            }


        })
    };

    updateJob = async (jobId, finishedIndex, size, results) => {
        this.currentTask = null;
        let updated = false;
        let isNowFinished = false;
        for (let i = 0; i < this.activeJobs.length; i++) {
            let job = this.activeJobs[i];
            if (job.jobId === jobId) {
                job.addNewFinishedIndexes(finishedIndex, size, results);
                updated = true;
                isNowFinished = job.finished
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
                    results: results,
                    finished: isNowFinished
                }
            }));

            for (let peer of this.currentNetworkPeers) {
                if (peer.peerId !== this.peerId) {
                    await this.socket.send(jobUpdateMessageString, 0, jobUpdateMessageString.length, PORT, peer.peerAddress, () => {
                        console.log("Sending job update to: " + peer.peerId + " for job: " + jobId)
                    })
                }
            }
        }

        await this.startTask();

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
            for (let i = 0; i < jobToDo.arrayOfWords.length - size + 1; i++) {
                if (!jobToDo.finishedChunks[size].includes(i)) {
                    availableTasks.push({
                        index: i,
                        size: size,
                        jobId: jobToDo.jobId
                    })
                }
            }
        });

        console.log("Available tasks left: ", availableTasks);
        return availableTasks[getRandomInt(0, availableTasks.length-1)]
    };

    getTaskData = (wordsArray, size, index) => {
        if (wordsArray.length <= size) {
            return wordsArray
        } else {
            return wordsArray.slice(parseInt(index), parseInt(index) + parseInt(size));
        }
    };

    startTask = async () => {
        let task = this.findAvailableTask();
        console.log("Found task:", {i: task.index, s: task.size});
        if (task) {
            this.currentTask = task;
            let job = this.activeJobs.filter(item => item.jobId === task.jobId)[0];
            let taskWordsArray = this.getTaskData(job.arrayOfWords, task.size, task.index);
            let results = await this.validationManager.validate(taskWordsArray, job.arrayOfInterestingWords);
            console.log("Results: ", results);
            await this.updateJob(job.jobId, task.index, task.size, results);
        }

    }

};


function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
