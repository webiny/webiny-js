const aliases = require("../project-utils/aliases");

module.exports = {
    presets: [
        [
            "@babel/preset-env",
            {
                targets: {
                    browsers: ["last 2 versions", "safari >= 7"]
                }
            }
        ],
        "@babel/preset-react",
        ["@babel/preset-typescript"]
    ],
    plugins: [
        ["@babel/plugin-proposal-class-properties"],
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
        ["babel-plugin-module-resolver", { alias: aliases, extensions: [".ts", ".tsx"] }]
    ]
};
