class ValidationManager {
    constructor() {
        this._dataSourceStrategy = null

    }

    setDataSourceStrategy(strategy) {
        this._dataSourceStrategy = strategy;
    }
}