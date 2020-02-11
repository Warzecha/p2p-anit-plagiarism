const {LevensteinValidator} = require('./LevensteinValidator');

function ValidationFacade(strategy) {
    this.strategy = strategy;
    this.keywordContent = {};
    this.validator = new LevensteinValidator();

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
        let similarResults = [];

        let content;
        for (const keyword of keywords) {
            try {
                content = await this.fetchContent(keyword);
                similarResults.push(...this.validator.validate(wordsArray, content))
            } catch (e) {

                console.error(`For keyword ${keyword}`, e)
            }
        }
        return similarResults;
    }

}


module.exports.ValidationFacade = ValidationFacade;
