const path = require("path");
const paths = require("react-scripts/config/paths");

module.exports = {
    presets: ["babel-preset-react-app"],
    plugins: [
        ["react-hot-loader/babel"],
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
    ]
};
