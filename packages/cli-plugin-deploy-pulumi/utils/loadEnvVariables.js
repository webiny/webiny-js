const path = require("path");

// Tries to load env files from a couple of different places, for a stack and a given environment.

// 1. Load from {PROJECT_APPLICATION_FOLDER}/.env.{PROVIDED_ENV}
// 2. Load from {PROJECT_APPLICATION_FOLDER}/.env
// 3. Load from {PROJECT_ROOT}/.env.{PROVIDED_ENV}
// 4. Load from {PROJECT_ROOT}/.env

module.exports = async (inputs, context) => {
    const { folder, env, debug } = inputs;

    const projectRoot = context.paths.projectRoot;

    if (env) {
        await context.loadEnv(path.resolve(projectRoot, folder, `.env.${env}`), { debug });
        await context.loadEnv(path.resolve(projectRoot, folder, `.env`), { debug });
        await context.loadEnv(path.resolve(projectRoot, `.env.${env}`), { debug });
        await context.loadEnv(path.resolve(projectRoot, `.env`), { debug });
    }
};
