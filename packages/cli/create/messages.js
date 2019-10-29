const fetch = require("node-fetch");

const bannerUrl =
    "https://raw.githubusercontent.com/webiny/cli-resources/master/messages/project-created.txt";

module.exports = {
    getSuccessBanner: () => {
        return fetch(bannerUrl)
            .then(res => res.text())
            .catch(() => {
                // Fallback message in case repo is unavailable.
                return [
                    `\n🏁 Your Webiny project is ready!!\n`,
                    `If this is your first Webiny project, or maybe you simply forgot what to do next, head over to 🔗 https://docs.webiny.com.`,
                    `In case of any issues, get in touch via 🔗 https://github.com/webiny/webiny-js/issues.`
                ].join("\n");
            });
    }
};
