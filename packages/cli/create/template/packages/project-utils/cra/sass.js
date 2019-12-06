// @flowIgnore
const isObject = require("lodash.isobject");
const path = require("path");

const materialNodeModules = require.resolve("@material/base/package.json").split("@material")[0];

const includePaths = [path.resolve("./src"), path.resolve("./node_modules"), materialNodeModules];

const overrideSass = function(rules) {
    let parent = rules;
    rules.forEach((rule, index) => {
        if (typeof rule === "string" && rule.includes("sass-loader")) {
            if (parent) {
                parent.splice(index, 1, {
                    loader: rule,
                    options: { sassOptions: { includePaths } }
                });
            }
            return;
        }

        if (rule.use || rule.oneOf) {
            parent = rule.use || rule.oneOf;
        }

        if (
            isObject(rule) &&
            typeof rule.loader === "string" &&
            rule.loader.includes("sass-loader")
        ) {
            if (!rule.options.sassOptions) {
                rule.options.sassOptions = {};
            }
            rule.options.sassOptions.includePaths = includePaths;
            return;
        }

        overrideSass(rule.use || rule.oneOf || (Array.isArray(rule.loader) && rule.loader) || []);
    });
};

module.exports = config => {
    overrideSass(config.module.rules);
    config.resolve.extensions.push(".scss");
};
