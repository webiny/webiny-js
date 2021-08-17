const get = require("lodash/get");
const { yellow } = require("chalk");

module.exports = (output, map) => {
    const values = {};
    const regex = /\${(.*)}/;

    Object.keys(map).forEach(key => {
        const valuePattern = map[key];
        const match = regex.exec(valuePattern);
        if (match) {
            const [replace, valuePath] = match;
            const value = get(output, valuePath);
            if (!value) {
                console.log(yellow(`Could not map "${valuePath}" to "${key}" - value missing.`));
                return;
            }
            values[key] = valuePattern.replace(replace, value);
        }
    });

    return values;
};
