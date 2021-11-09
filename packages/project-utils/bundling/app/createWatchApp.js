module.exports = config => (options, context) => {
    return require("./watchApp")({ config, options, context });
};
