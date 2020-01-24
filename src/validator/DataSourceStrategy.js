class DataSourceStrategy {

    constructor(strategy) {
        this.strategy = strategy;

    }

    getContent = async function (keyword) {
        return this.strategy(keyword)
    };

}

module.exports.DataSourceStrategy = DataSourceStrategy;