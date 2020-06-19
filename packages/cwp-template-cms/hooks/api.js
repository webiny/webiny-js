const { green, blue } = require("chalk");

module.exports = (opts = {}) => ({
    type: "hook-stack-after-deploy",
    hook(params) {
        const stackName = opts.stackName || "api";

        if (params.stack !== stackName) {
            return;
        }

        if (params.isFirstDeploy) {
            printFirstDeploySummary(params);
        } else {
            printDeploySummary(params);
        }
    }
});

function printFirstDeploySummary({ state }) {
    const hasGraphQL = state.apolloGateway;
    const hasCMS = state.cmsContent;
    if (state.cdn && state.apolloGateway) {
        console.log(
            [
                "🏁 Congratulations! You've just deployed your Webiny API stack for the first time.",
                `⏳ Please note that CDN distribution takes some time to propagate, so allow ~10 minutes for it to become accessible.`,
                ``,
                `Once your CDN is up, the following URLs will be available for you to use:`,
                ``,
                hasGraphQL && `🔗 Main GraphQL API: ${green(state.cdn.url + "/graphql")}`,
                hasCMS && `🔗 CMS API:`,
                hasCMS &&
                    `   - Content Delivery API: ${green(state.cdn.url + "/cms/read/production")}`,
                hasCMS &&
                    `   - Content Preview API: ${green(state.cdn.url + "/cms/preview/production")}`,
                ``,
                ``,
                `To finish the system setup, you need to start your ${green(
                    "admin"
                )} app and complete the installation wizard:`,
                `1) ${blue("cd apps/admin")}`,
                `2) ${blue("yarn start")}`,
                ``,
                `After you finish the wizard, your system is ready for development.`,
                `To learn more about the ${green(
                    "admin"
                )} app, visit https://docs.webiny.com/docs/webiny-apps/admin/introduction`
            ]
                .filter(l => l !== false)
                .join("\n")
        );
    }
}

function printDeploySummary({ state }) {
    const hasGraphQL = state.apolloGateway;
    const hasCMS = state.cmsContent;
    if (state.cdn && state.apolloGateway) {
        console.log(
            [
                hasGraphQL && `🔗 Main GraphQL API: ${green(state.cdn.url + "/graphql")}`,
                hasCMS && `🔗 CMS API:`,
                hasCMS &&
                    `   - Content Delivery API: ${green(state.cdn.url + "/cms/read/production")}`,
                hasCMS &&
                    `   - Content Preview API: ${green(state.cdn.url + "/cms/preview/production")}`
            ]
                .filter(l => l !== false)
                .join("\n")
        );
    }
}
