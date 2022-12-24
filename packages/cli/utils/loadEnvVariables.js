const path = require("path");
const yargs = require("yargs");
const { log, getProject } = require("./utils");
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

