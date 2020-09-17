const { join, basename } = require("path");
const { green } = require("chalk");
const notifier = require("node-notifier");
const { Pulumi } = require("@webiny/pulumi-sdk");
const path = require("path");
const execa = require("execa");
const ProgressBar = require("progress");
const getPackages = require("get-yarn-workspaces");
const indentString = require("indent-string");

const notify = ({ message }) => {
    notifier.notify({
        title: "Webiny CLI",
        message,
        icon: join(__dirname, "logo.png"),
        sound: false,
        wait: true
    });
};

const getStackName = folder => {
    folder = folder.split("/").pop();
    return folder === "." ? basename(process.cwd()) : folder;
};

const processHooks = async (hook, { context, ...options }) => {
    const plugins = context.plugins.byType(hook);

    for (let i = 0; i < plugins.length; i++) {
        try {
            await plugins[i].hook(options, context);
        } catch (err) {
            console.log(`🚨 Hook ${green(plugins[i].name)} encountered an error: ${err.message}`);
        }
    }
};

module.exports = async ({ options, ...inputs }, context) => {
    const start = new Date();
    const getDuration = () => {
        return (new Date() - start) / 1000;
    };

    const { env, folder, debug = true } = inputs;
    const stack = getStackName(folder);

    const projectRoot = context.paths.projectRoot;

    // Load .env.json from project root
    await context.loadEnv(path.resolve(projectRoot, ".env.json"), env, { debug });

    // Load .env.json from cwd (this will change depending on the folder you specified)
    await context.loadEnv(path.resolve(projectRoot, folder, ".env.json"), env, { debug });

    if (inputs.build) {
        const packages = getPackages().filter(item =>
            item.includes(path.join(process.cwd(), folder))
        );

        console.log('pac', packages)
        console.log(
            `⏳  Building ${packages.length} package(s) in ${green(
                path.join(process.cwd(), folder)
            )}...`
        );
        const bar = new ProgressBar(indentString("[:bar] :percent :etas", 2), {
            complete: "=",
            incomplete: " ",
            width: 1024,
            total: packages.length
        });

        const promises = [];
        for (let i = 0; i < packages.length; i++) {
            promises.push(
                new Promise(async (resolve, reject) => {
                    try {
                        const cwd = packages[i];
                        await execa("yarn", ["build"], { cwd });
                        bar.tick();

                        resolve();
                    } catch (e) {
                        reject(e);
                    }
                })
            );
        }

        await Promise.all(promises);
    }

    const stacksDir = path.join(".", folder);

    const pulumi = new Pulumi({
        defaults: {
            options: { cwd: stacksDir, env: { PULUMI_CONFIG_PASSPHRASE: "123123" } },
            flags: {
                secretsProvider: "passphrase"
            }
        }
    });

    console.log()
    if (inputs.preview) {
        console.log(`⏳  Previewing stack...`);
    } else {
        console.log(`⏳  Deploying stack...`);
    }

    let stackExists = true;
    try {
        await pulumi.run(["stack", "select", env]);
    } catch (e) {
        stackExists = false;
    }

    if (!stackExists) {
        await pulumi.run(["stack", "init", env]);
    }

    const isFirstDeploy = !stackExists;

    const beforeDeployHookParams = { isFirstDeploy, context, env, stack };

    if (inputs.preview) {
        console.log(`Skipping "hook-before-deploy" and "hook-stack-before-deploy" hooks...`);
    } else {
        // TODO: why?
        await processHooks("hook-before-deploy", beforeDeployHookParams);
        await processHooks("hook-stack-before-deploy", beforeDeployHookParams);
    }

    let subProcess;
    if (inputs.preview) {
        const pu = new Pulumi({
            defaults: {
                options: { cwd: stacksDir, env: { PULUMI_CONFIG_PASSPHRASE: "123123" } }
            }
        });
        subProcess = pu.run("preview");
    } else {
        subProcess = pulumi.run("up", {
            yes: true,
            skipPreview: true
        });
    }

    await subProcess.toConsole();

    const duration = getDuration();
    if (inputs.preview) {
        console.log(`\n🎉 Done! Preview finished in ${green(duration + "s")}.\n`);
    } else {
        console.log(`\n🎉 Done! Deploy finished in ${green(duration + "s")}.\n`);
        notify({ message: `"${folder}" stack deployed in ${duration}s.` });
    }

    // TODO: after hooks ?
};
