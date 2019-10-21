const get = require("lodash.get");
const { green } = require("chalk");

module.exports = {
    getStateValues(state, valueMap) {
        const values = {};
        const regex = /\${(.*)}/;
        for (const key in valueMap) {
            const valuePattern = valueMap[key];
            const match = regex.exec(valuePattern);
            if (match) {
                const [replace, valuePath] = match;
                const value = get(state, valuePath);
                if (!value) {
                    console.log(`⚠️  Missing value for ${green(key)} (${green(valuePath)})`);
                    continue;
                }
                values[key] = valuePattern.replace(replace, value);
            }
        }

        return values;
    }
};
