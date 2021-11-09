module.exports = config => (options, context) => {
    return require("./buildApp")({ config, options, context });
};
