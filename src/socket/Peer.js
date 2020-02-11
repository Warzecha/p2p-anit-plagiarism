const Job = require("./Job");
const Connection = require("./Connection");
const uuid = require('uuid/v1');
const {ValidationFacade} = require("./../validator/ValidationFacade");
const {WikiDataStrategy} = require("./../validator/WikipediaSourceStrategy");
const {BingSearchStrategy} = require("./../validator/BingSourceStrategy");


module.exports = class Peer {
    constructor(address, broadcastAddress, window) {
        this.peerId = uuid().toString();
        this.window = window;
        this.activeJobs = [];
        this.currentTask = null;
        this.validationFacade = new ValidationFacade(WikiDataStrategy);

        this.connectionFacade = new Connection(address,
            broadcastAddress,
            this,
            this.handleJobUpdateMessage,
            this.handleNetworkInfoMessage,
            this.handleNewJobMessage,
            this.window)
    }

    selectStrategy(strategy) {

        switch (strategy) {
            case 'bing':
                this.validationFacade.setStrategy(BingSearchStrategy);
                break;
            case 'wiki':
                this.validationFacade.setStrategy(WikiDataStrategy);
                break;
            default:
                this.validationFacade.setStrategy(WikiDataStrategy);
                break;
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

    async emitJobProgressEvent(job, progressEvent) {
        if (progressEvent.finished) {
            console.log("emitJobProgressEvent finished", job.jobId);
            this.currentTask = null;
            // if ()
            this.window.webContents.send('jobProgressEvent', {
                job: job,
                progressEvent: progressEvent
            })
            await this.startTask();

        }
    }


    createJob(arrayOfWords, arrayOfInterestingWords, strategy, filePath) {
        let job = new Job(uuid(), arrayOfWords, {5: [], 25: []}, false, arrayOfInterestingWords, strategy, filePath);
        const newJobMessageString = new Buffer(JSON.stringify({
            messageType: 'NEW_JOB',
            job: job
        }));

        this.connectionFacade.sendNewJobNotification(newJobMessageString, job);
        this.activeJobs.unshift(job);
        this.emitNewJobEvent(job)

    };

    handleNewJobMessage = async (receivedMessage) => {
        const receivedJob = receivedMessage.job;
        console.log("Received new job: ", receivedJob.jobId);
        if (!this.activeJobs.map(value => value.jobId).includes(receivedJob.jobId)) {
            let newJob = Job.copy(receivedJob);
            this.activeJobs.unshift(newJob);
            this.emitNewJobEvent(newJob)
        }
        if (!this.currentTask) {
            await this.startTask();
        }
    };

    handleNetworkInfoMessage = (receivedMessage) => {
        receivedMessage.activeJobs.forEach(async (receivedJob) => {
            if (!this.activeJobs.map(j => j.jobId).includes(receivedJob.jobId)) {
                let newJob = Job.copy(receivedJob);
                this.activeJobs.unshift(newJob);
                this.emitNewJobEvent(newJob);
            }
        });


    };

    handleJobUpdateMessage = (receivedMessage) => {
        console.log("Received job update for job: " + receivedMessage.jobUpdate.jobId);
        let currentJob = this.activeJobs.filter(job => job.jobId === receivedMessage.jobUpdate.jobId)[0];
        console.log(currentJob.finished);

        if (currentJob) {

            if (currentJob.finished) {
                return;
            }

            if (receivedMessage.jobUpdate.finished) {
                this.emitJobProgressEvent(currentJob, {
                    finished: true,
                    result: receivedMessage.result
                });
                currentJob.finished = true;
                return;
            }
            try {
                let progress = currentJob.addNewFinishedIndexes(receivedMessage.jobUpdate.finishedIndex.index, receivedMessage.jobUpdate.finishedIndex.size, receivedMessage.results);
                this.emitJobProgressEvent(currentJob, progress);
            } catch (e) {
                this.emitJobProgressEvent(currentJob, {
                    finished: true,
                    result: receivedMessage.result
                });

            }

            // currentJob.finished = currentJob.finished ? true : receivedMessage.jobUpdate.finished;

        } else {
            let newJob = Job.copy(receivedMessage.jobUpdate);
            this.activeJobs.unshift(newJob);
            this.emitNewJobEvent(newJob);
        }
    };


    updateJob = async (jobId, finishedIndex, size, results) => {
        this.currentTask = null;

        let updatedJob = this.activeJobs.filter(activeJob => activeJob.jobId === jobId)[0];

        if (updatedJob) {
            let progress = updatedJob.addNewFinishedIndexes(finishedIndex, size, results);
            this.emitJobProgressEvent(updatedJob, progress);
            await this.connectionFacade.setJobUpdateNotification(updatedJob, progress.result);
            if (!updatedJob.finished) {
                await this.startTask();
            }

        } else {
            //    TODO: add to active jobs
        }

    };

    broadcastMessage() {
        this.connectionFacade.broadcastMessage();
    }


    findAvailableTask = () => {
        let jobToDo = this.activeJobs.filter(value => !value.finished)[0];
        console.log("NEW JONBDSAD: ", jobToDo);
        if (jobToDo) {
            this.selectStrategy(jobToDo.strategy);
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
        } else {
            console.log("Finished")
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
            console.log("Found task:", task.jobId);
            this.currentTask = task;
            let job = this.activeJobs.filter(item => item.jobId === task.jobId)[0];
            let taskWordsArray = this.getTaskData(job.arrayOfWords, task.size, task.index);
            let results = await this.validationFacade.validate(taskWordsArray, job.arrayOfInterestingWords);
            // console.log("Results: ", results);

            this.window.webContents.send('jobFinished', {
                job: job,
                results: results
            });


            await this.updateJob(job.jobId, task.index, task.size, results);
        } else {
            return;
        }

    }

}
;


function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
