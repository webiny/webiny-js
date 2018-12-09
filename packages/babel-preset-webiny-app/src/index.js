// @flowIgnore
module.exports = function(api, opts, env) {
    const isDevelopment = env === "development";

    return {
        plugins: [
            isDevelopment && ["react-hot-loader/babel"],
            ["babel-plugin-emotion", { autoLabel: true }],
            [
                "babel-plugin-named-asset-import",
                {
                    loaderMap: {
                        svg: {
                            ReactComponent: "@svgr/webpack![path]"
                        }
                    }
                }
            ],
            ["babel-plugin-lodash", { id: ["lodash", "recompose"] }]
        ].filter(Boolean)
    };
};
