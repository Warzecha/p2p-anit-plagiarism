const axios = require("axios");
const {DataSourceStrategy} = require("./DataSourceStrategy");

const prepareUrl = (keyword) => encodeURI(getSearchUrl(keyword));
const getSearchUrl = (keyword) => `https://api.cognitive.microsoft.com/bingcustomsearch/v7.0/search?q=${keyword}+pdf&customconfig=60e9d352-3ed0-4af1-92cc-03f665324ea3&mkt=pl-PL`;
const crawler = require('crawler-request');

const getSearchResults = async (keyword) => {
    try {
        const searchResponse = (await axios.get(prepareUrl(keyword), {
            headers: {'Ocp-Apim-Subscription-Key': 'e4b9e6770dc34e52b3f8f4f7d5a5c7d8'}
        })).data;


        let pdfUrlList = searchResponse.webPages.value
            .map(item => item.url)
            .filter(url => url.includes("pdf"));

        console.log("Bing data", pdfUrlList);

        let data = [];


        for (let url of pdfUrlList.slice(0, 1)) {
            let response = await crawler(url)

            let formatted = response.text
                .replace(/(?<!\S)[A-Za-z]+(?!\S)|(?<!\S)[A-Za-z]+(?=:(?!\S))/g, '')
                .replace(/[\n.,:?!<|>=+\-\/\^()]/g, '')
                .replace(/[\s]+/g, ' ')
                .replace(/[\t]+/g, ' ');

            data.push(formatted)

        }
        return data;

    } catch (e) {
        console.log("Something went wrong", e)
    }

};

module.exports.BingSearchStrategy = new DataSourceStrategy(getSearchResults);

