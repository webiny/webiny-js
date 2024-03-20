const NO_VALUE = "-";
const isCI = require("is-ci");

const getData = async context => {
    const { getUser } = require("../wcp/utils");
    const { getNpxVersion } = require("./getNpxVersion");
    const { getNpmVersion } = require("./getNpmVersion");
    const { getPulumiVersions } = require("./getPulumiVersions");
    const { getYarnVersion } = require("./getYarnVersion");
    const { getDatabaseSetupLabel } = require("./getDatabaseSetup");

    const [pulumiVersion, pulumiAwsVersion] = await getPulumiVersions();

    const wcpProjectId = process.env.WCP_PROJECT_ID;
    const wcpUser = await getUser().catch(() => null);
    const wcpUsingProjectEnvironmentApiKey = Boolean(process.env.WCP_ENVIRONMENT_API_KEY);

    return [
        {
            sectionName: "Webiny Project",
            data: {
                Name: context.project.name,
                Version: context.version,
                "Database Setup": getDatabaseSetupLabel(),
                "Debug Enabled": process.env.DEBUG === "true" ? "Yes" : "No",
                "Feature Flags": process.env.WEBINY_FEATURE_FLAGS || "N/A"
            }
        },
        {
            sectionName: "Webiny Control Panel (WCP)",
            data: {
                "Project ID": wcpProjectId,
                User: wcpUser?.email || "N/A",
                "Using Project Environment API Key": wcpUsingProjectEnvironmentApiKey ? "Yes" : "No"
            }
        },
        {
            sectionName: "Host",
            data: {
                OS: `${process.platform} (${process.arch})`,
                "Node.js": process.version,
                NPM: await getNpmVersion(),
                NPX: await getNpxVersion(),
                Yarn: await getYarnVersion(),
                "Is CI": isCI ? "Yes" : "No"
            }
        },
        {
            sectionName: "Pulumi",
            data: {
                "@pulumi/pulumi": pulumiVersion,
                "@pulumi/aws": pulumiAwsVersion,
                "Secrets Provider": process.env.PULUMI_SECRETS_PROVIDER,
                "Using Password": process.env.PULUMI_CONFIG_PASSPHRASE ? "Yes" : "No"
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

                    Object.keys(data).forEach(key => {
                        console.log(key.padEnd(36), data[key] || NO_VALUE);
                    });
                });
            }
        );
    }
};
