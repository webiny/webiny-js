const { green } = require("chalk");
const fs = require("fs");

module.exports = (opts = {}) => (
    {
        type: "hook-stack-after-deploy",
        hook(params) {
            const stackName = opts.stackName || "apps";

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
        name: "hook-stacks-info-apps",
        type: "hook-stacks-info",
        hook() {
            const stackName = opts.stackName || "apps";

            const info = [];
            const stackEnvs = fs.readdirSync(`./.webiny/state/${stackName}`);
            for (const stackEnv of stackEnvs) {
                const webinyJson = JSON.parse(
                    fs.readFileSync(`./.webiny/state/apps/${stackEnv}/Webiny.json`).toString()
                );
                if (!webinyJson.outputs) {
                    // This env wasn't deployed succesfully
                    continue;
                }
                const url = webinyJson.outputs.cdn.url;

                info.push({ stack: stackName, env: stackEnv, url });
            }
            if (info.length) {
                console.log(`List of URLs for stack "${stackName}"`);
                const prettyInfo =
                    info
                        .map(
                            stackInfo =>
                                `  Environment "${stackInfo.env}"\n` +
                                `    ${stackInfo.url}/ (site app)\n` +
                                `    ${stackInfo.url}/admin`
                        )
                        .join("\n\n") + "\n\n";
                console.log(prettyInfo);
            } else {
                console.log(`There are no available URLs for stack ${stackName} yet.`);
            }
        }
    }
);

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
