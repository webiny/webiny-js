const MATCH_STRING = "the stack is currently locked by";

module.exports = ({ error, context }) => {
    const { message } = error;

    const projectApplicationName = context.projectApplication?.id || `PROJECT_APPLICATION`;
    const environmentName = context.commandParams?.env || `ENVIRONMENT_NAME`;

    if (typeof message === "string" && message.includes(MATCH_STRING)) {
        const cmd = `yarn webiny pulumi ${projectApplicationName} --env ${environmentName} -- cancel`;

        const chalk = require("chalk");
        const message = [
            `The Pulumi error you've just experienced can occur`,
            `if one of the previous deployments has been interrupted or another deployment`,
            `is already in progress. For development purposes, the quickest way to get`,
            `past this issue is to run the following command: ${chalk.blue(cmd)}.`
        ].join(" ");

        const learnMore = "https://webiny.link/locked-stacks";

        return { message, learnMore };
    }
};
