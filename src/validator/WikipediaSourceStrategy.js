const axios = require("axios");
const {DataSourceStrategy} = require("./DataSourceStrategy");

const prepareUrl = (title) => encodeURI(contentUrl + title.replace(/\s+/g, '_'));
const searchUrl = (keyword) => `https://pl.wikipedia.org/w/api.php?format=json&action=opensearch&search=${keyword}`;
const contentUrl = `https://pl.wikipedia.org/w/api.php?action=query&prop=revisions&rvprop=content&format=json&titles=`;


const getWikiContent = async (keyword) => {
    try {
        const searchResponse = await axios.get(searchUrl(keyword));

        let titleList = searchResponse.data[1];
        let articleUrlList = searchResponse.data[3];

        let sourcesList = [];

        for (let i = 0; i < titleList.length; i++) {
            sourcesList.push({
                title: titleList[i],
                url: articleUrlList[i]
            })
        }

        let data = [];

        for (let {title, url} of sourcesList) {
            const res = await axios.get(prepareUrl(title));
            const pages = res.data.query.pages;
            const pageId = Object.keys(pages)[0];

            const parsed = pages[pageId].revisions[0]['*']
                .replace(/<(\w+)+>[^<]*<\/\1>/g, '')
                .replace(/\|[^\]]*\]\]|\[\[|\]\]|'''/g, '')
                .replace(/<!--|-->|:|(^[ \t]*\n)|==[^\]]*/g, '')
                .replace(/\[\[|{{|}}/g, '')
                .replace(/\|/g, ' ')
                .replace(', )', ')')
                .replace(/Dopracować.*/g, '')
                .replace(/(^[ \t]*\n)/g, '')
                .replace(/[–\-_'\*,\.()]/g, '')
                .replace(/\s+/g, ' ');

            data.push({title, url, parsed})
        }


        data.forEach(item => {
            console.log("=============================");
            console.log(item)
        })

    } catch (e) {
        console.log("Something went wrong", e)
    }


};

module.exports.wikiDataStrategy = new DataSourceStrategy(getWikiContent);

