module.exports = (config, env, defaultConfig) => {
    defaultConfig.module.rules[0].include = [__dirname + "/../src", /webiny-/];
    defaultConfig.module.rules[0].exclude = /node_modules/;
    defaultConfig.module.rules[1].use = [{ loader: "raw-loader" }];
    defaultConfig.module.rules[1].include = [__dirname + "/../src", /webiny-/];
    defaultConfig.module.rules.unshift({
        test: /\.svg$/,
        exclude: /node_modules/,
        use: ["@svgr/webpack"]
    });
    defaultConfig.module.rules.push({
        test: /\.scss$/,
        include: [__dirname + "/../src", /webiny-/],
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

    defaultConfig.module.rules = defaultConfig.module.rules.filter(
        r => r !== null && r !== undefined
    );

    return defaultConfig;
};
