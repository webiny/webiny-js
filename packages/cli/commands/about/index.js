const NO_VALUE = "-";

const getData = async context => {
    const { getUser } = require("../wcp/utils");
    const { getNpxVersion } = require("./getNpxVersion");
    const { getPulumiVersions } = require("./getPulumiVersions");
    const { getYarnVersion } = require("./getYarnVersion");
    const localStorage = require("../../utils/localStorage");

    const [pulumiVersion, pulumiAwsVersion] = await getPulumiVersions();

    const commandsHistory = localStorage().get("history") || [];
    const last10Commands = commandsHistory.slice(1, 11); // We skip the first command, which is the current one.

    return [
        {
            sectionName: "Webiny Project",
            data: {
                Name: context.project.name,
                Version: context.version,
                Template: context.project.config.template || NO_VALUE,
                "Debug Enabled": process.env.DEBUG === "true" ? "Yes" : "No",
                "Feature Flags": process.env.WEBINY_FEATURE_FLAGS || "N/A"
            }
        },
        {
            sectionName: "Webiny Control Panel (WCP)",
            data: {
                "Project ID": context.project.config.id || process.env.WCP_PROJECT_ID,
                User: await getUser()
                    .catch(() => "N/A")
                    .then(res => res.email),
                Authentication: process.env.WEBINY_PROJECT_ENVIRONMENT_API_KEY
                    ? "Project Environment API Key"
                    : "Personal Access Token"
            }
        },
        {
            sectionName: "Pulumi",
            data: {
                "@pulumi/pulumi": pulumiVersion,
                "@pulumi/aws": pulumiAwsVersion,
                "Used AWS Region": process.env.AWS_REGION,
                "Secrets Provider": process.env.PULUMI_SECRETS_PROVIDER,
                "Using Password": process.env.PULUMI_CONFIG_PASSPHRASE ? "Yes" : "No"
            }
        },
        {
            sectionName: "Host",
            data: {
                OS: `${process.platform} (${process.arch})`,
                "Node.js": process.version,
                NPX: await getNpxVersion(),
                Yarn: await getYarnVersion()
            }
        },
        {
            sectionName: "Last 10 Commands Executed",
            data: {
                Commands: last10Commands
            }
        }
    ];
};

module.exports = {
    type: "cli-command",
    name: "cli-command-about",
    create({ yargs, context }) {
        yargs.command(
            "about",
            `Prints out information helpful for debugging purposes.`,
            yargs => {
                yargs.option("json", {
                    describe: "Emit output as JSON.",
                    type: "boolean",
                    default: false
                });
            },
            async yargs => {
                const data = await getData(context);

                if (yargs.json) {
                    console.log(JSON.stringify(data, null, 2));
                    return;
                }

                data.forEach(({ sectionName, data }, index) => {
                    if (index > 0) {
                        console.log();
                    }

                    const { bold } = require("chalk");
                    console.log(bold(sectionName));

                    // Custom rendering for "Last 10 Commands Executed" section.
                    Object.keys(data).forEach(key => {
                        if (sectionName === "Last 10 Commands Executed") {
                            data[key].forEach((command, index) => {
                                console.log(`  ${index + 1}. ${command}`);
                            });
                            return;
                        }
                        console.log(key.padEnd(30), data[key] || NO_VALUE);
                    });
                });
            }
        );
    }
};
