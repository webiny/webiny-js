const path = require("path");
const get = require("lodash.get");
const loadJson = require("load-json-file");
const writeJson = require("write-json-file");
const { green } = require("chalk");

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
    const json = await loadJson(envPath);
    if (!json[env]) {
        json[env] = {};
    }
    Object.assign(json[env], await getStateValues(state, envMap));
    await writeJson(envPath, json);
};

module.exports = { getStateValues, updateEnvValues };
