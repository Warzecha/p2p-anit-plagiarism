const SCORE_THRESHOLD = 0.2;
const levenshtein = require('js-levenshtein');

function LevensteinValidator() {

    this.validate = (wordsArray, content) => {
        let sectionLength = wordsArray.length;


        let similarResults = [];

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


        return similarResults;
    }
}


module.exports.LevensteinValidator = LevensteinValidator;
