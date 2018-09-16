module.exports = (config, env, defaultConfig) => {
    defaultConfig.module.rules[0].include = ["src", /webiny-/];
    defaultConfig.module.rules[0].exclude = /node_modules/;
    defaultConfig.module.rules[1].use = [{ loader: "raw-loader" }];
    defaultConfig.module.rules.unshift({
        test: /\.svg$/,
        exclude: /node_modules/,
        use: ["@svgr/webpack"]
    });
    defaultConfig.module.rules.push({
        test: /\.scss$/,
        loaders: [
            "style-loader",
            "css-loader",
            {
                loader: "sass-loader",
                options: {
                    includePaths: ["node_modules", "../../node_modules"]
                }
            }
        ]
    });
    return defaultConfig;
};
