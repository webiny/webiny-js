const { measureDuration } = require("../../utils");
const ora = require("ora");

const spinnerMessages = [
    [60, "Still deploying..."],
    [120, "Still deploying, please wait..."],
    [180, "Some resources take some time to become ready, please wait..."],

    [270, "Still deploying, please don't interrupt..."],
    [360, "Still deploying, please be patient..."],
    [450, "Still deploying, please don't interrupt..."],
    [540, "Still deploying, please be patient..."],

    [600, "Deploying for 10 minutes now, probably a couple more to go..."],
    [720, "Still deploying, shouldn't be much longer now..."],

    [840, "Looks like it's taking a bit longer than usual, please wait..."],
    [900, "Deploying for 15 minutes now, hopefully it's almost done..."],

    [1200, "Deploying for 20 minutes now, hopefully it's almost done..."]
];

module.exports = async ({ inputs, context, pulumi }) => {
    // We always show deployment logs when doing previews.
    const showDeploymentLogs = inputs.deploymentLogs;

    const PULUMI_SECRETS_PROVIDER = process.env.PULUMI_SECRETS_PROVIDER;
    const PULUMI_CONFIG_PASSPHRASE = process.env.PULUMI_CONFIG_PASSPHRASE;

    const getDeploymentDuration = measureDuration();

    const spinner = ora("Deploying...");

    try {
        const subprocess = pulumi.run({
            command: "up",
            args: {
                yes: true,
                skipPreview: true,
                secretsProvider: PULUMI_SECRETS_PROVIDER,
                debug: inputs.debug
            },
            execa: {
                env: {
                    WEBINY_ENV: inputs.env,
                    WEBINY_PROJECT_NAME: context.project.name,
                    PULUMI_CONFIG_PASSPHRASE
                }
            }
        });

        if (showDeploymentLogs) {
            subprocess.stdout.pipe(process.stdout);
            subprocess.stderr.pipe(process.stderr);
            await subprocess;
        } else {
            spinner.start();

            // When showing spinner, we want to show a few messages to the user.
            // The deployment process can take in some cases 10-15 minutes, so we want to
            // give the user some feedback.
            const timeouts = spinnerMessages.map(([seconds, message]) => {
                return setTimeout(() => {
                    spinner.text = message;
                }, seconds * 1000);
            });

            // Every second, let's add a dot to the end of the message. Once we reach
            // three, we start over.
            const interval = setInterval(() => {
                const spinnerText = spinner.text;
                if (spinnerText.endsWith("...")) {
                    spinner.text = spinnerText.substring(0, spinnerText.length - 3);
                } else {
                    spinner.text = spinnerText + ".";
                }
            }, 1000);

            try {
                await subprocess;
            } finally {
                timeouts.forEach(clearTimeout);
                clearInterval(interval);
            }
        }

        const message = `Deployed in ${getDeploymentDuration()}.`;

        if (showDeploymentLogs) {
            context.success(message);
        } else {
            spinner.succeed(message);
        }
    } catch (e) {
        // If the deployment logs were already shown, we don't want to do anything.
        if (showDeploymentLogs) {
            throw e;
        }

        spinner.fail(`Deployment failed. For more details, please check the error logs below.`);
        console.log();
        console.log(e.stderr || e.stdout || e.message);
        throw e;
    }
};
