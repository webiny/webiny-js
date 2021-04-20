module.exports.buildFunction = (options, context) => {
    return require("./build")(options, context);
};

module.exports.watchFunction = (options, context) => {
    return require("./watch")(options, context);
};
