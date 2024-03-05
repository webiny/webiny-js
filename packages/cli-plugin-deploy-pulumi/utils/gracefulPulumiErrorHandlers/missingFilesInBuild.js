const { red } = require("chalk");

const MATCH_STRING = "failed to compute archive hash for";

module.exports = ({ error }) => {
    const { message } = error;

    if (typeof message === "string" && message.includes(MATCH_STRING)) {
        const cmd = red(`yarn webiny build {APP_NAME} --env {ENVIRONMENT_NAME}`);
        return [
            `Looks like the deployment failed because Pulumi could not retrieve the built code.`,
            `Please try again, or, alternatively, try building the project application you're`,
            `trying to deploy by running ${cmd}.`
        ].join(" ");
    }
};
