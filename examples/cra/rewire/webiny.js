const path = require("path");
const { loaderNameMatches } = require("react-app-rewired");

const matcher = rule => {
    return loaderNameMatches(rule, "babel-loader");
};

const getRule = function(rules) {
    let found = null;

    for (let i = 0; i < rules.length; i++) {
        const rule = rules[i];
        if (matcher(rule)) {
            found = rules;
            break;
        } else {
            const rules = rule.use || rule.oneOf || [];
            const nested = getRule(rules, matcher);
            if (nested) {
                found = nested;
                break;
            }
        }
    }

    return found;
};

module.exports = config => {
    const rule = getRule(config.module.rules);
    rule.push({ loader: path.resolve("./hot-accept-loader") });
};
