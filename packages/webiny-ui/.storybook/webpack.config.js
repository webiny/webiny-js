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
    // Remove last 2 rules related to `scss` files
    defaultConfig.module.rules.pop();
    defaultConfig.module.rules.pop();

    // Add our own scss rule
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

    return defaultConfig;
};
