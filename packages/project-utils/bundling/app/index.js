module.exports.buildApp = options => {
    process.env.NODE_ENV = "production";

    if (!process.env.REACT_APP_ENV) {
        process.env.REACT_APP_ENV = "browser";
    }

    return require("./createProdConfig")(options);
};

module.exports.startApp = options => {
    process.env.NODE_ENV = "development";

    if (!process.env.REACT_APP_ENV) {
        process.env.REACT_APP_ENV = "browser";
    }

    return require("./createDevConfig")(options);
};
