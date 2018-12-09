// @flowIgnore
const paths = require("react-scripts/config/paths");
const merge = require("lodash/merge");

let foundBabel = false;

module.exports = ({ packages, aliases }) => {
    return function overrideBabel(rules) {
        rules.forEach(rule => {
            if (foundBabel) {
                return;
            }

            if (rule.hasOwnProperty("options") && rule.options.hasOwnProperty("babelrc")) {
                rule.include = [paths.appSrc, ...packages];
                rule.options = {
                    ...merge(rule.options, {
                        babelrc: true,
                        babelrcRoots: packages,
                        plugins: [["babel-plugin-module-resolver", { alias: aliases }]]
                    })
                };

                foundBabel = true;

                return;
            }
            overrideBabel(
                rule.use || rule.oneOf || (Array.isArray(rule.loader) && rule.loader) || []
            );
        });
    };
};
