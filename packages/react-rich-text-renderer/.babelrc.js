const defaults = require("@webiny/project-utils").createBabelConfigForReact({
    path: __dirname
});

module.exports = {
    ...defaults,
    plugins: [...defaults.plugins, "@babel/plugin-transform-modules-commonjs"]
};
