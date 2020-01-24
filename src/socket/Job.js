module.exports = class Job {
    constructor(jobId, arrayOfWords, finishedChunks, finished, arrayOfInterestingWords) {
        this.jobId = jobId;
        this.arrayOfWords = arrayOfWords;
        this.arrayOfInterestingWords = arrayOfInterestingWords;
        this.finishedChunks = finishedChunks;

        this.finished = finished;
    }

    addNewFinishedIndexes = (index, size) => {

        if (! this.finishedChunks[size].includes(index)) {
            this.finishedChunks[size].push(index);
        }

        let jobIsFinished = Object.keys(this.finishedChunks).reduce((acc, size) => {
            return acc && (this.arrayOfWords.length === this.finishedChunks[size].length - (size - 1));
        }, true);

    //    TODO: announce finished job

    };


};