"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _webpackConfigUtils = require("webpack-config-utils");

const { ifDevelopment } = (0, _webpackConfigUtils.getIfUtils)(
    process.env.NODE_ENV
); /* eslint-disable */
exports.default = {
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
    plugins: (0, _webpackConfigUtils.removeEmpty)([
        ifDevelopment("react-hot-loader/babel"),
        ["babel-plugin-lodash"],
        ["babel-plugin-transform-object-rest-spread", { useBuiltIns: true }],
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
//# sourceMappingURL=babel.js.map
