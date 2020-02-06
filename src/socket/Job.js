module.exports = class Job {
    constructor(jobId, arrayOfWords, finishedChunks, finished, arrayOfInterestingWords) {
        this.jobId = jobId;
        this.arrayOfWords = arrayOfWords;
        this.arrayOfInterestingWords = arrayOfInterestingWords;
        this.finishedChunks = finishedChunks;

        this.totalResults = [];

        this.finished = finished;
    }

    addNewFinishedIndexes = (index, size, results) => {

        if (!this.finishedChunks[size].includes(index)) {
            this.finishedChunks[size].push(index);
            this.totalResults = this.totalResults.concat(results);

            let jobIsFinished = true;

            let sizes = Object.keys(this.finishedChunks);

            let targetValue = 0;
            let currentValue = 0;

            for (let s of sizes) {
                targetValue += (this.arrayOfWords.length - parseInt(s) + 1);
                currentValue += (this.finishedChunks[s].length);
                console.log("For size: " + s + " " + (this.finishedChunks[s].length) + " of " + (this.arrayOfWords.length - parseInt(s) + 1))
            }

            for (let key of Object.keys(this.finishedChunks)) {
                if (this.arrayOfWords.length - parseInt(key) + 1 !== this.finishedChunks[key].length) {
                    jobIsFinished = false;
                    break;
                }
            }

            this.finished = jobIsFinished;

            if (jobIsFinished) {
                let totalResult = (this.totalResults.reduce((acc, results) => acc + results.similrityScore, 0)) / this.arrayOfWords.length;
                console.log("JOB FINISHED");
                console.log("Results", totalResult);
                return {
                    finished: true,
                    progress: 1,
                    result: totalResult
                };

            } else {
                return {
                    finished: false,
                    progress: currentValue / targetValue,
                };
            }
        }

    };

};
