/* eslint-disable */
const { getIfUtils, removeEmpty } = require("webpack-config-utils");
const { ifDevelopment } = getIfUtils(process.env.NODE_ENV);

module.exports = {
    presets: [
        [
            "babel-preset-env",
            {
                targets: {
                    browsers: ["last 2 versions", "safari >= 7"]
                }
            }
        ],
        require.resolve("babel-preset-react")
    ],
    plugins: removeEmpty([
        ifDevelopment(require.resolve("react-hot-loader/babel")),
        [require.resolve("babel-plugin-transform-object-rest-spread"), { useBuiltIns: true }],
        [require.resolve("babel-plugin-syntax-dynamic-import")],
        [require.resolve("babel-plugin-lodash")],
        [require.resolve("babel-plugin-transform-builtin-extend"), { globals: ["Error"] }],
        // This plugin is required to force all css/scss imports to have a resourceQuery
        [
            require.resolve("babel-plugin-transform-rename-import"),
            {
                original: "^(.*?.s?css)$",
                replacement: "$1?"
            }
        ]
    ])
};
