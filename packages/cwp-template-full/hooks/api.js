const { green, blue } = require("chalk");
const fs = require("fs");

module.exports = (opts = {}) => (
    {
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
    },
    {
        name: "hook-stacks-info-api",
        type: "hook-stacks-info",
        hook() {
            const stackName = opts.stackName || "api";

            const info = [];
            const stackEnvs = fs.readdirSync(`./.webiny/state/${stackName}`);
            for (const stackEnv of stackEnvs) {
                const cdnJson = JSON.parse(
                    fs.readFileSync(`./.webiny/state/api/${stackEnv}/Webiny.cdn.json`).toString()
                );
                const url = cdnJson.output.url;

                info.push({ stack: stackName, env: stackEnv, url });
            }
            // TODO: do the same for "app" stacks in "./apps.js"
            if (info.length) {
                console.log(`  List of URLs for stack "${stackName}"`);
                const prettyInfo = info
                    .map(stackInfo => `${stackInfo.url} [env = "${stackInfo.env}"]`)
                    .join("\n");
                console.log(prettyInfo);
            } else {
                console.log(`There are no available URLs for stack ${stackName} yet.`);
            }
        }
    }
);

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
