// @flowIgnore
const path = require("path");
const getPackages = require("get-yarn-workspaces");
const paths = require("react-scripts/config/paths");
const merge = require("lodash/merge");
const packages = getPackages();

let foundBabel = false;

const aliases = packages.reduce((aliases, dir) => {
    const name = path.basename(dir);
    aliases[`^${name}/types`] = `${name}/types`;
    aliases[`^${name}/(?!src)(.+)$`] = `${name}/src/\\1`;
    return aliases;
}, {});

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
                    babelrcRoots: packages,
                    plugins: [["babel-plugin-module-resolver", { alias: aliases }]]
                })
            };

            foundBabel = true;

            return;
        }
        overrideBabel(rule.use || rule.oneOf || (Array.isArray(rule.loader) && rule.loader) || []);
    });
};

module.exports = overrideBabel;
