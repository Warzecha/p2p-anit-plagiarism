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

    this.validate = async (wordsArray, keywords) => {

        let sectionLength = wordsArray.length;

        let similarResults = [];

        wordsArray = wordsArray.slice()

        // console.log("keywords", keywords);
        // console.log("words", wordsArray);


        let content;
        for (const keyword of keywords) {
            try {
                content = await this.fetchContent(keyword);

                // console.log("keyword", keyword);


                let contentText = content[0].parsed.split(' ');
                // console.log("WIKI", contentText);


                for (let i = 0; i < contentText.length - sectionLength; i++) {

                    let subarray = contentText.slice(i, i + sectionLength);
                    // console.log("WIKI", subarray)

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
                        console.log(`Word: ${wordsArray} and ${subarray} - Score: ${sectionScore}`);
                        similarResults.push({
                            text: wordsArray.join(' '),
                            original: subarray.join(' '),
                            similrityScore: sectionScore
                        })
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
