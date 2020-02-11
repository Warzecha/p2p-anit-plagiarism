module.exports = class Job {
    constructor(jobId, arrayOfWords, finishedChunks, finished, arrayOfInterestingWords, strategy) {
        this.jobId = jobId;
        this.arrayOfWords = arrayOfWords;
        this.arrayOfInterestingWords = arrayOfInterestingWords;
        this.finishedChunks = finishedChunks;

        this.strategy = strategy || 'wiki';
        this.totalResults = [];
        this.finished = finished;
    }


    addNewFinishedIndexes = (index, size, results) => {

        if (!this.finishedChunks[size].includes(index) && !this.finished) {
            this.finishedChunks[size].push(index);
            this.totalResults = this.totalResults.concat(results);

            let jobIsFinished = true;

            let sizes = Object.keys(this.finishedChunks);

            let targetValue = 0;
            let currentValue = 0;

            for (let s of sizes) {
                targetValue += (this.arrayOfWords.length - parseInt(s) + 1);
                currentValue += (this.finishedChunks[s].length);
            }

            for (let key of Object.keys(this.finishedChunks)) {
                if (this.arrayOfWords.length - parseInt(key) + 1 !== this.finishedChunks[key].length) {
                    jobIsFinished = false;
                    break;
                }
            }

            this.finished = jobIsFinished;

            console.log(`Progress: ${currentValue} of ${targetValue}`);

            if (jobIsFinished) {
                let totalResult = (this.totalResults.reduce((acc, results) => acc + 1, 0)) / targetValue;
                console.log("JOB FINISHED", this.totalResults);
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
        } else {
            return {
                finished: false
            }
        }

    };

    static copy(other) {
        return new Job(other.jobId,
            other.arrayOfWords,
            other.finishedChunks,
            other.finished,
            other.arrayOfInterestingWords,
            other.strategy)
    }

};
