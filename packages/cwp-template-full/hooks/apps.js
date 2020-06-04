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
            `Once your CDN is up, the following URLs will be available:`,
            ``,
            `   - ${green("site")} app: ${green(state.cdn.url)}`,
            `   - ${green("admin")} app: ${green(adminUrl)}`,
            ``,
            `To finish the system setup, you need to complete the installation wizard at: ${green(
                adminUrl
            )}`,
            `After you finish the installation, your system is ready to use!`
        ].join("\n")
    );
}

function printDeploySummary({ state }) {
    if (!state.cdn) {
        return;
    }

    const adminUrl = state.cdn.url + "/admin";

    console.log(
        [
            `🔗 Access your apps at:`,
            `   - ${green("site")} app: ${green(state.cdn.url)}`,
            `   - ${green("admin")} app: ${green(adminUrl)}`
        ].join("\n")
    );
}
