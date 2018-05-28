/* eslint-disable */
import { getIfUtils, removeEmpty } from "webpack-config-utils";

const { ifDevelopment } = getIfUtils(process.env.NODE_ENV);

export default {
    presets: [
        [
            "babel-preset-env",
            {
                targets: {
                    browsers: ["last 2 versions", "safari >= 7"]
                }
            }
        ],
        "babel-preset-react"
    ],
    plugins: removeEmpty([
        ifDevelopment("react-hot-loader/babel"),
        ["babel-plugin-lodash"],
        ["babel-plugin-transform-object-rest-spread", { useBuiltIns: true }],
        ["babel-plugin-transform-decorators-legacy"],
        ["babel-plugin-syntax-dynamic-import"],
        [
            "babel-plugin-transform-runtime",
            {
                polyfill: false,
                regenerator: true
            }
        ],
        ["babel-plugin-transform-builtin-extend", { globals: ["Error"] }],
        // This plugin is required to force all css/scss imports to have a resourceQuery
        [
            "babel-plugin-transform-rename-import",
            {
                original: "^(.*?.s?css)$",
                replacement: "$1?"
            }
        ]
    ])
};
