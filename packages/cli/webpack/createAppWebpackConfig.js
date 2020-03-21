module.exports = () => {
    if (process.env.NODE_ENV === "development") {
        return require("./app/createDevConfig")();
    }

    return require("./app/createProdConfig")();
};
