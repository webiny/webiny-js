module.exports = {
    appEntry(entry) {
        if (process.env.NODE_ENV === "production") {
            return entry;
        }

        return [
            "react-hot-loader/patch",
            "webpack-hot-middleware/client?quiet=false&noInfo=true&warn=false&overlay=true&reload=false",
            "webpack/hot/only-dev-server",
            entry
        ];
    },
    SpaConfigPlugin: require("./plugins/SpaConfigPlugin")
};
