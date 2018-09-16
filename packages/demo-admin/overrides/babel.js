const babel = require("../.babelrc");

let foundBabel = false;

const overrideBabel = function(rules) {
    rules.forEach(rule => {
        if (foundBabel) {
            return;
        }

        if (rule.hasOwnProperty("options") && rule.options.hasOwnProperty("babelrc")) {
            rule.options = {
                compact: false,
                cacheDirectory: false,
                highlightCode: true,
                ...babel
            };

            foundBabel = true;

            return;
        }
        overrideBabel(rule.use || rule.oneOf || (Array.isArray(rule.loader) && rule.loader) || []);
    });
};

module.exports = overrideBabel;
