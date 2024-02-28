const NO_VALUE = "-";

const getData = async context => {
    const { getUser } = require("../wcp/utils");
    const { getNpxVersion } = require("./getNpxVersion");
    const { getNpmVersion } = require("./getNpmVersion");
    const { getPulumiVersions } = require("./getPulumiVersions");
    const { getYarnVersion } = require("./getYarnVersion");
    const { getDatabaseSetupLabel } = require("./getDatabaseSetup");

    const [pulumiVersion, pulumiAwsVersion] = await getPulumiVersions();

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
            sectionName: "Host",
            data: {
                OS: `${process.platform} (${process.arch})`,
                "Node.js": process.version,
                NPM: await getNpmVersion(),
                NPX: await getNpxVersion(),
                Yarn: await getYarnVersion()
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
                        console.log(key.padEnd(30), data[key] || NO_VALUE);
                    });
                });
            }
        );
    }
};
