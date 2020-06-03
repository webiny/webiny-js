const { green } = require("chalk");

module.exports = {
    hooks: {
        afterDeploy(params) {
            if (params.isFirstDeploy) {
                printFirstDeploySummary(params);
            } else {
                printDeploySummary(params);
            }
        }
    }
};

function printFirstDeploySummary({ state }) {
    if (!state.cdn) {
        return;
    }

    const adminUrl = state.cdn.url + "/admin";

    console.log(
        [
            "🏁 Congratulations! You've just deployed your Webiny Apps stack for the first time.",
            `⏳ Please note that CDN distribution takes some time to propagate, so allow ~10 minutes for it to become accessible.`,
            ``,
            `Once the CDN is up, your ${green("admin")} app will be available at ${green(
                adminUrl
            )}`,
            ``,
            `To finish the system setup, open the app in your browser and follow the installation wizard.`
        ].join("\n")
    );
}

function printDeploySummary({ state }) {
    if (!state.cdn) {
        return;
    }

    const adminUrl = state.cdn.url + "/admin";

    console.log(`🔗 Access your ${green("admin")} app at ${green(adminUrl)}`);
}
