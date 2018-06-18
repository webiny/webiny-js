const path = require("path");
const cloneDeep = require("lodash.clonedeep");

const ruleChildren = loader =>
    loader.use || loader.oneOf || (Array.isArray(loader.loader) && loader.loader) || [];

const findIndexAndRules = (rulesSource, ruleMatcher) => {
    let result = undefined;
    const rules = Array.isArray(rulesSource) ? rulesSource : ruleChildren(rulesSource);
    rules.some(
        (rule, index) =>
            (result = ruleMatcher(rule)
                ? { index, rules }
                : findIndexAndRules(ruleChildren(rule), ruleMatcher))
    );
    return result;
};

const findRule = (rulesSource, ruleMatcher) => {
    const { index, rules } = findIndexAndRules(rulesSource, ruleMatcher);
    return rules[index];
};

const cssRuleMatcher = rule => rule.test && String(rule.test) === String(/\.css$/);

const createLoaderMatcher = loader => rule =>
    rule.loader && rule.loader.indexOf(`${path.sep}${loader}${path.sep}`) !== -1;
const cssLoaderMatcher = createLoaderMatcher("css-loader");
const postcssLoaderMatcher = createLoaderMatcher("postcss-loader");
const resolveUrlLoaderMatcher = createLoaderMatcher("resolve-url-loader");
const fileLoaderMatcher = createLoaderMatcher("file-loader");

const addAfterRule = (rulesSource, ruleMatcher, value) => {
    const { index, rules } = findIndexAndRules(rulesSource, ruleMatcher);
    rules.splice(index + 1, 0, value);
};

const addBeforeRule = (rulesSource, ruleMatcher, value) => {
    const { index, rules } = findIndexAndRules(rulesSource, ruleMatcher);
    rules.splice(index, 0, value);
};

module.exports = function(config, env) {
    const cssRule = findRule(config.module.rules, cssRuleMatcher);
    const sassRule = cloneDeep(cssRule);
    const cssModulesRule = cloneDeep(cssRule);

    cssRule.exclude = /\.module\.css$/;

    const cssModulesRuleCssLoader = findRule(cssModulesRule, cssLoaderMatcher);
    cssModulesRuleCssLoader.options = Object.assign(
        { modules: true, localIdentName: "[local]___[hash:base64:5]" },
        cssModulesRuleCssLoader.options
    );
    addBeforeRule(config.module.rules, fileLoaderMatcher, cssModulesRule);

    sassRule.test = /\.s[ac]ss$/;
    sassRule.exclude = /\.module\.s[ac]ss$/;
    sassRule.use = ["style-loader", "css-loader", "resolve-url-loader", "sass-loader?sourceMap"];

    addBeforeRule(config.module.rules, fileLoaderMatcher, sassRule);

    const sassModulesRule = cloneDeep(cssModulesRule);
    sassModulesRule.test = /\.module\.s[ac]ss$/;
    sassModulesRule.use = [
        "style-loader",
        {
            loader: "css-loader",
            options: {
                modules: true,
                importLoaders: 2
            }
        },
        "resolve-url-loader",
        "sass-loader?sourceMap"
    ];

    addBeforeRule(config.module.rules, fileLoaderMatcher, sassModulesRule);

    return config;
};
