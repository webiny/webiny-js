const path = require("path");
const yargs = require("yargs");
const log = require("./log");
const getProject = require("./getProject");
const { boolean } = require("boolean");

// Load environment variables from following sources:
// - `webiny.project.ts` file
// - `.env` file
// - `.env.{PASSED_ENVIRONMENT}` file

const project = getProject();

// `webiny.project.ts` file.
// Environment variables defined via the `env` property.
if (project.config.env) {
    Object.assign(process.env, project.config.env);
}

// `.env.{PASSED_ENVIRONMENT}` and `.env` files.
let paths = [path.join(project.root, ".env")];

if (yargs.argv.env) {
    paths.push(path.join(project.root, `.env.${yargs.argv.env}`));
}

// Let's load environment variables
for (let i = 0; i < paths.length; i++) {
    const path = paths[i];
    const { error } = require("dotenv").config({ path });
    if (boolean(yargs.argv.debug)) {
        if (error) {
            log.debug(`No environment file found on ${log.debug.hl(path)}.`);
        } else {
            log.success(`Successfully loaded environment variables from ${log.success.hl(path)}.`);
        }
    }
}

// Feature flags defined via the `featureFlags` property.
// We set twice, to be available for both backend and frontend application code.
// TODO: one day we might want to sync this up a bit.
if (project.config.featureFlags) {
    process.env.WEBINY_FEATURE_FLAGS = JSON.stringify(project.config.featureFlags);
    process.env.REACT_APP_WEBINY_FEATURE_FLAGS = JSON.stringify(project.config.featureFlags);
}

// With 5.38.0, we are hiding the `WEBINY_ELASTICSEARCH_INDEX_LOCALE` env variable and always setting it to `true`.
// This is because this variable is not something users should be concerned with, nor should they be able to change it.
// In order to ensure backwards compatibility, we first check if the variable is set, and if it is, we don't override it.
const esIndexLocaleEnvVarExists = "WEBINY_ELASTICSEARCH_INDEX_LOCALE" in process.env;
if (!esIndexLocaleEnvVarExists) {
    process.env.WEBINY_ELASTICSEARCH_INDEX_LOCALE = "true";
}
