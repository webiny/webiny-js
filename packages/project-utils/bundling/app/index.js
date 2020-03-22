module.exports.buildApp = options => {
    if (process.env.NODE_ENV === "development") {
        return require("./createDevConfig")(options);
    }

    return require("./createProdConfig")(options);
};
