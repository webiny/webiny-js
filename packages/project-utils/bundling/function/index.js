module.exports.buildFunction = (options, context) => {
    return require("./executor")(options, context);
};
