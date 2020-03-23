const path = require("path");
const aliases = require("@webiny/project-utils/aliases/webpack");

const includePaths = [
    path.join(__dirname, "../node_modules"),
    path.join(__dirname, "../../../node_modules"),
    path.join(__dirname, "../../../node_modules/material-components-web/node_modules")
];

module.exports = ({ config }) => {
    config.resolve.extensions.push(".ts", ".tsx");
    config.resolve.alias = aliases;

    config.module.rules.push({
        test: /\.tsx?$/,
        use: [
            {
                loader: require.resolve("babel-loader"),
                options: {
                    babelrc: true,
                    ...require("../.babelrc.js")
                }
            },
            require.resolve("react-docgen-typescript-loader")
        ]
    });

    config.module.rules.unshift({
        test: /\.scss$/,
        use: [
            "style-loader",
            "css-loader",
            {
                loader: "sass-loader",
                options: { includePaths }
            }
        ]
    });

    return config;
};
