const fetch = require("node-fetch");

const bannerGist =
    "https://gist.githubusercontent.com/Pavel910/182a07dc2725d3206a9cfc537a1e51c4/raw/banner.js";

module.exports = {
    getSuccessBanner: () => {
        return fetch(bannerGist)
            .then(res => res.text())
            .catch(() => {
                // Fallback message in case gist is unavailable.
                return [
                    `\n🏁 Your Webiny project is ready!!\n`,
                    `If this is your first Webiny project, or maybe you simply forgot what to do next, head over to 🔗 https://docs.webiny.com.`,
                    `In case of any issues, get in touch via 🔗 https://github.com/webiny/webiny-js/issues.`
                ].join("\n");
            });
    }
};
