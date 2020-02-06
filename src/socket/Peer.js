const Job = require("./Job");
const ConnectionFacade = require("./ConnectionFacade");
const uuid = require('uuid/v1');
const {ValidationManager} = require("./../validator/ValidationManager");
const {WikiDataStrategy} = require("./../validator/WikipediaSourceStrategy");
const {BingSearchStrategy} = require("./../validator/BingSourceStrategy");


module.exports = class Peer {
    constructor(address, broadcastAddress, window, strategy) {
        this.peerId = uuid().toString();
        this.window = window;
        this.activeJobs = [];
        this.currentTask = null;
        this.validationManager = new ValidationManager(WikiDataStrategy);

        this.connectionFacade = new ConnectionFacade(address,
            broadcastAddress,
            this,
            this.handleJobUpdateMessage,
            this.handleNetworkInfoMessage,
            this.handleNewJobMessage,
            this.window)
    }

    selectStrategy(strategy) {
        if (strategy === 'bing') {
            this.validationManager = new ValidationManager(BingSearchStrategy);
        } else if (strategy === 'wiki') {
            this.validationManager = new ValidationManager(WikiDataStrategy);
        } else {
            this.validationManager = new ValidationManager(WikiDataStrategy);
        }
    }

    bindPeer() {
        this.connectionFacade.bindPeer()
    }

    emitNewJobEvent(job) {
        this.window.webContents.send('newJobEvent', {
            job: job
        })
    }

    emitJobProgressEvent(job, progressEvent) {
        console.log("emitJobProgressEvent");
        if (progressEvent.finished) {
            this.window.webContents.send('jobProgressEvent', {
                job: job,
                progressEvent: progressEvent
            })
        }
    }

    createJob(arrayOfWords, arrayOfInterestingWords, strategy) {
        let job = new Job(uuid(), arrayOfWords, {5: [], 25: []}, false, arrayOfInterestingWords, strategy);
        const newJobMessageString = new Buffer(JSON.stringify({
            messageType: 'NEW_JOB',
            job: job
        }));

        this.connectionFacade.sendNewJobNotification(newJobMessageString, job);

        this.activeJobs.push(job);
        this.emitNewJobEvent(job)
    };


    handleNewJobMessage = async (receivedMessage) => {
        const receivedJob = receivedMessage.job;
        console.log("Received new job: ", receivedJob.jobId);
        if (!this.activeJobs.map(value => value.jobId).includes(receivedJob.jobId)) {
            let newJob = new Job(receivedJob.jobId, receivedJob.arrayOfWords, receivedJob.finishedChunks, receivedJob.finished, receivedJob.arrayOfInterestingWords, receivedJob.strategy);
            this.activeJobs.push(newJob);
            this.emitNewJobEvent(newJob)
        }
        if (!this.currentTask) {
            await this.startTask();
        }
    };

    handleNetworkInfoMessage = (receivedMessage) => {
        receivedMessage.activeJobs.forEach(async (receivedJob) => {
            if (!this.activeJobs.map(j => j.jobId).includes(receivedJob.jobId)) {
                let newJob = new Job(receivedJob.jobId, receivedJob.arrayOfWords, receivedJob.finishedChunks, receivedJob.finished, receivedJob.arrayOfInterestingWords, receivedJob.strategy);
                this.activeJobs.push(newJob);
                this.emitNewJobEvent(newJob)
            }
        });

    };

    handleJobUpdateMessage = (receivedMessage) => {
        console.log("Received job update for job: " + receivedMessage.jobUpdate.jobId);
        let currentJob = this.activeJobs.filter(job => job.jobId === receivedMessage.jobUpdate.jobId)[0];

        if (currentJob) {

            try {
                let progress = currentJob.addNewFinishedIndexes(receivedMessage.jobUpdate.finishedIndex.index, receivedMessage.jobUpdate.finishedIndex.size, receivedMessage.results);
                this.emitJobProgressEvent(currentJob, progress);
            } catch (e) {
                this.emitJobProgressEvent(currentJob, {
                    finished: true
                })
            }
            currentJob.finished = currentJob.finished ? true : receivedMessage.jobUpdate.finished;

        } else {
            let newJob = new Job(receivedMessage.jobUpdate.jobId, receivedMessage.jobUpdate.arrayOfWords, receivedMessage.jobUpdate.finishedChunks, receivedMessage.jobUpdate.finished, receivedMessage.jobUpdate.arrayOfInterestingWords, receivedMessage.strategy);
            this.activeJobs.push(newJob);
            this.emitNewJobEvent(newJob);
        }
    };


    updateJob = async (jobId, finishedIndex, size, results) => {
        this.currentTask = null;
        let updated = false;
        let isNowFinished = false;
        let arrayOfInterestingWords = [];
        let finishedChunks = [];
        let arrayOfWords = [];
        let strategy = null;
        for (let i = 0; i < this.activeJobs.length; i++) {
            let job = this.activeJobs[i];
            if (job.jobId === jobId) {
                let progress = job.addNewFinishedIndexes(finishedIndex, size, results);
                updated = true;
                isNowFinished = job.finished;
                arrayOfInterestingWords = job.arrayOfInterestingWords;
                finishedChunks = job.finishedChunks;
                strategy = job.strategy;
                this.emitJobProgressEvent(job, progress);
            }
        }


        if (updated) {
            await this.connectionFacade.setJobUpdateNotification(
                jobId,
                finishedIndex,
                size,
                results,
                isNowFinished,
                arrayOfInterestingWords,
                finishedChunks,
                arrayOfWords,
                strategy
            );
        }

        await this.startTask();

    };

    broadcastMessage() {
        this.connectionFacade.broadcastMessage();
    }

    findAvailableTask = () => {
        let jobToDo = this.activeJobs.filter(value => !value.finished)[0];

        this.selectStrategy(jobToDo.strategy);

        if (jobToDo) {

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

            // console.log("Available tasks left: ", availableTasks);
            return availableTasks[getRandomInt(0, availableTasks.length - 1)]
        }
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
        if (task) {
            console.log("Found task:", {i: task.index, s: task.size});
            this.currentTask = task;
            let job = this.activeJobs.filter(item => item.jobId === task.jobId)[0];
            let taskWordsArray = this.getTaskData(job.arrayOfWords, task.size, task.index);
            let results = await this.validationManager.validate(taskWordsArray, job.arrayOfInterestingWords);
            console.log("Results: ", results);


            this.window.webContents.send('jobFinished', {
                job: job,
                results: results
            });


            await this.updateJob(job.jobId, task.index, task.size, results);
        }

    }

}
;


function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
