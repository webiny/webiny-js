const path = require("path");
const fs = require("fs-extra");
const get = require("lodash.get");
const loadJson = require("load-json-file");
const writeJson = require("write-json-file");
const { green, red } = require("chalk");
const { Pulumi } = require("@webiny/pulumi-sdk");

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

const setEnvironmentFromState = async ({ env, stack, map }, context) => {
    const projectRoot = context.paths.projectRoot;
    const pulumi = new Pulumi({
        defaults: {
            options: {
                cwd: path.join(projectRoot, stack),
                env: { PULUMI_CONFIG_PASSPHRASE: "123123" }
            }
        }
    });

    const { stdout } = await pulumi.run(["stack", "output"], {
        stack: env,
        json: true
    });

    const state = JSON.parse(stdout);
    Object.assign(process.env, getStateValues(state, map));
};

module.exports = { getStateValues, updateEnvValues, setEnvironmentFromState };
