const { green, cyan, gray } = require("chalk");
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

module.exports = (opts = {}) => [
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
        async hook({ last }) {
            const stackName = opts.stackName || "apps";
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
];

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

function printDeploySummary({ state, indent = 0 }) {
    if (!state.cdn) {
        return;
    }

    const adminUrl = state.cdn.url + "/admin";

    console.log(
        [
            `🔗 Access your apps at:`,
            `   - ${green("site")} app: ${green(state.cdn.url)}`,
            `   - ${green("admin")} app: ${green(adminUrl)}`
        ]
            .map(item => indentString(item, indent))
            .join("\n")
    );
}
