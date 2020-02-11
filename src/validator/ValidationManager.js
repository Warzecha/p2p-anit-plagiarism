const levenshtein = require('js-levenshtein');

const SCORE_THRESHOLD = 0.2;

function ValidationManager(strategy) {
    this.strategy = strategy;
    this.keywordContent = {};

    this.fetchContent = async (keyword) => {
        if (this.keywordContent[keyword]) {
            return this.keywordContent[keyword]
        } else {
            const content = this.strategy.getContent(keyword);
            this.keywordContent[keyword] = content;
            return content
        }
    };

    this.setStrategy = (strategy) => {
        this.strategy = strategy;
    };

    this.validate = async (wordsArray, keywords) => {

        let sectionLength = wordsArray.length;

        let similarResults = [];


        let content;
        for (const keyword of keywords) {
            try {
                content = await this.fetchContent(keyword);

                if (content[0]) {
                    let contentText = content[0].parsed.split(' ');
                    for (let i = 0; i < contentText.length - sectionLength; i++) {

                        let subarray = contentText.slice(i, i + sectionLength);

                        let sectionScore = 0;

                        for (let j = 0; j < sectionLength; j++) {

                            if (wordsArray[j] && subarray[j]) {
                                let relativeDistance = levenshtein(wordsArray[j], subarray[j]) / wordsArray[j].length;
                                if (relativeDistance < SCORE_THRESHOLD) {
                                    sectionScore++;
                                }
                            }
                        }


                        if (sectionScore >= wordsArray.length * 0.8) {
                            similarResults.push({
                                text: wordsArray.join(' '),
                                original: subarray.join(' '),
                                similrityScore: sectionScore
                            })
                        }

                    }
                }

            } catch (e) {

                console.error(`For keyword ${keyword}`, e)
            }
        }
        return similarResults;
    }
}


module.exports.ValidationManager = ValidationManager;
