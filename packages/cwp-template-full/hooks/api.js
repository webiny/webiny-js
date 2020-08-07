const { green, blue, cyan, gray } = require("chalk");
const fs = require("fs");
const path = require("path");
const readJson = require("load-json-file");
const indentString = require("indent-string");

const getTitle = (environmentsCount = 0) => {
    let title = "Stack: apps";
    if (environmentsCount) {
        title += ` (${environmentsCount} environment`;
        title += environmentsCount > 1 ? `s)` : `)`;
    }
    return cyan(title);
};

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
        async hook({ last }) {
            const stackName = opts.stackName || "api";
            const stackFolder = `./.webiny/state/${stackName}`;

            try {
                if (!fs.existsSync(stackFolder)) {
                    console.log(getTitle());
                    console.log("Nothing to show (stack not deployed).");
                    return;
                }

                const stackEnvs = fs.readdirSync(stackFolder);
                if (!stackEnvs.length) {
                    console.log(getTitle());
                    console.log("Nothing to show (stack not deployed).");
                    return;
                }

                console.log(getTitle(stackEnvs.length));
                for (let i = 0; i < stackEnvs.length; i++) {
                    const stackEnv = stackEnvs[i];

                    const webinyJson = await readJson(
                        path.join(stackFolder, stackEnv, "Webiny.json")
                    );

                    if (webinyJson.outputs) {
                        console.log(gray(`${stackEnv}`));
                        printDeploySummary({ state: webinyJson.outputs, indent: 2 });
                    }

                    const last = i === stackEnvs.length - 1;
                    if (!last) {
                        console.log();
                    }
                }
            } finally {
                // Add space between this plugin and the next one that's about to be called.
                !last && console.log();
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

function printDeploySummary({ state, indent = 0 }) {
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
                .map(item => indentString(item, indent))
                .join("\n")
        );
    }
}
