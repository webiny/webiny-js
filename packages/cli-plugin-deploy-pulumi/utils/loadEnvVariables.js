// Tries to load env files from a couple of different places, for a stack and a given environment.

// 1. Load from {PROJECT_APPLICATION_FOLDER}/.env.{PROVIDED_ENV}
// 2. Load from {PROJECT_APPLICATION_FOLDER}/.env

module.exports = async (inputs, context) => {
    const path = require("path");

    const { folder, env, debug } = inputs;

    const projectRoot = context.project.root;

    if (env) {
        await context.loadEnv(path.resolve(projectRoot, folder, `.env.${env}`), { debug });
        await context.loadEnv(path.resolve(projectRoot, folder, `.env`), { debug });
    }
};
