const { bold } = require("chalk");
const { getNpxVersion } = require("./getNpxVersion");
const { getPulumiVersions } = require("./getPulumiVersions");
const { getYarnVersion } = require("./getYarnVersion");

const getData = async context => {
    const [pulumiVersion, pulumiAwsVersion] = await getPulumiVersions();

    return [
        {
            sectionName: "Webiny",
            data: {
                Name: context.project.name,
                Version: context.version,
                Template: context.project.config.template || "N/A"
            }
        },
        {
            sectionName: "Webiny Control Panel (WCP)",
            data: {
                "Project ID": context.project.config.id || process.env.WCP_PROJECT_ID
            }
        },
        {
            sectionName: "Pulumi",
            data: {
                "@pulumi/pulumi": pulumiVersion,
                "@pulumi/aws": pulumiAwsVersion
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
                    console.log(bold(sectionName));
                    Object.keys(data).forEach(key => {
                        console.log(key.padEnd(20), data[key] || "N/A");
                    });
                });
            }
        );
    }
};
