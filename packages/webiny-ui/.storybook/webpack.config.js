module.exports = ({ config }) => {
    config.module.rules[0].include = [__dirname + "/../src", /webiny-/];
    config.module.rules[0].exclude = /node_modules/;
    config.module.rules[1].use = [{ loader: "raw-loader" }];
    config.module.rules[1].include = [__dirname + "/../src", /webiny-/];
    config.module.rules.unshift({
        test: /\.svg$/,
        issuer: {
            test: /.jsx?$/
        },
        use: ["@svgr/webpack"]
    });

    // Add our own scss rule
    config.module.rules.push({
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

    return config;
};
