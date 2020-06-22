const path = require("path");
const fs = require("fs-extra");
const get = require("lodash.get");
const loadJson = require("load-json-file");
const writeJson = require("write-json-file");
const { green, red } = require("chalk");

const getStateValues = (state, valueMap) => {
    const values = {};
    const regex = /\${(.*)}/;
    Object.keys(valueMap).forEach(key => {
        const valuePattern = valueMap[key];
        const match = regex.exec(valuePattern);
        if (match) {
            const [replace, valuePath] = match;
            const value = get(state, valuePath);
            if (!value) {
                console.log(`⚠️  Missing value for ${green(key)} (${green(valuePath)})`);
                return;
            }
            values[key] = valuePattern.replace(replace, value);
        }
    });

    return values;
};

const updateEnvValues = (envDir, envMap) => async ({ env, state }) => {
    const envPath = path.join(envDir, ".env.json");
    if (!fs.existsSync(envPath)) {
        console.log(`⚠️  Missing ${red(".env.json")} at ${red(envDir)}.`);
        return;
    }
    const json = await loadJson(envPath);
    if (!json[env]) {
        json[env] = {};
    }
    Object.assign(json[env], await getStateValues(state, envMap));
    await writeJson(envPath, json);
};

const setEnvironmentFromState = ({ env, stack, map }, context) => {
    const stateFile = context.resolve(".webiny", "state", stack, env, "Webiny.json");
    if (!fs.existsSync(stateFile)) {
        console.log(
            [
                "",
                `🚨 State file ${green(context.replaceProjectRoot(stateFile))} does not exist!`,
                `Make sure you have deployed your ${green(stack)} stack for the ${green(
                    env
                )} environment.`,
                "",
                `To deploy the stack, run the following command from the root of your project:`,
                "",
                `  $ ${green(`yarn webiny deploy ${stack} --env=${env}`)}`,
                ""
            ].join("\n")
        );
        process.exit(1);
    }
    const { outputs: state } = require(stateFile);

    Object.assign(process.env, getStateValues(state, map));
};

module.exports = { getStateValues, updateEnvValues, setEnvironmentFromState };
