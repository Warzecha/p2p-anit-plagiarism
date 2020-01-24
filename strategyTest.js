const {BingSearchStrategy} = require("./src/validator/BingSourceStrategy");
const {WikiDataStrategy} = require("./src/validator/WikipediaSourceStrategy");
const {ValidationManager} = require("./src/validator/ValidationManager");


let validationManager = new ValidationManager(BingSearchStrategy);


let praca = ["Agent", "Dialogflow", "jest", "dostępne", "są", "programy", "rozpoznające", "poprawnie", "odpowiedzialny", "za", "przeprowadzanie", "rozmowy", "z", "użytkownikiem", "końcowym", ".", "Zaimplementowany", "moduł", "przetwarzania", "języka", "naturalnego", "pozwala", "na", "zrozumienie", "ludzkiej", "mowy", "pod", "postacią", "tekstu", "lub", "plików", "audio", "i", "jej", "transformację", "do", "ustrukturyzowanego", "formatu", "który", "może", "być", "interpretowany", "przez", "pozostałe", "serwisy"];


const iterate = async () => {
    let suspicious = [];
    for (let i = 0; i < praca.length - 5; i++) {
        let arr = praca.slice(i, i + 5);
        let res = await validationManager.validate(arr, ['rozpoznawanie mowy pdf']);
        if (!!res && res.length > 0) {
            suspicious.push(res)
        }
    }

    console.log(suspicious)
};

iterate();



