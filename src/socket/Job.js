module.exports = class Job {
    constructor(jobId, arrayOfWords, arrayOfFinishedIndexes, finished, arrayOfInterestingWords) {
        this.jobId = jobId;
        this.arrayOfWords = arrayOfWords;
        this.arrayOfFinishedIndexes = arrayOfFinishedIndexes;
        this.arrayOfInterestingWords = arrayOfInterestingWords;
        this.finished = finished;
    }

     addNewFinishedIndex = (index) => {
        this.arrayOfFinishedIndexes.push(index);
         if (!this.finished && this.arrayOfWords.length === this.arrayOfFinishedIndexes.length) {
             this.finished = true;
         }
    }
};