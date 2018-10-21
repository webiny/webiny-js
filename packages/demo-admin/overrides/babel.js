const getPackages = require("get-yarn-workspaces");
const paths = require("react-scripts/config/paths");
const merge = require("lodash/merge");
const babel = require("../.babelrc");
const packages = getPackages();

let foundBabel = false;

const overrideBabel = function(rules) {
    rules.forEach(rule => {
        if (foundBabel) {
            return;
        }

        if (rule.hasOwnProperty("options") && rule.options.hasOwnProperty("babelrc")) {
            rule.include = [paths.appSrc, ...packages];
            rule.options = {
                ...merge(rule.options, {
                    babelrc: true,
                    cacheDirectory: false,
                    highlightCode: true,
                    ...babel
                })
            };

            foundBabel = true;

            return;
        }
        overrideBabel(rule.use || rule.oneOf || (Array.isArray(rule.loader) && rule.loader) || []);
    });
};

module.exports = overrideBabel;
