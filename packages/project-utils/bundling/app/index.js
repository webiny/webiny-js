module.exports.buildApp = options => {
    if (!process.env.REACT_APP_ENV) {
        process.env.REACT_APP_ENV = "browser";
    }

    if (process.env.NODE_ENV === "development") {
        return require("./createDevConfig")(options);
    }

    return require("./createProdConfig")(options);
};
