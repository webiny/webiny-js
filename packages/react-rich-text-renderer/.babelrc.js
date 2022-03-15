const defaults = require("../../.babel.react")({
    path: __dirname
});

module.exports = {
    ...defaults,
    plugins: [...defaults.plugins, "@babel/plugin-transform-modules-commonjs"]
};
