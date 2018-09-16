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
        [
            "babel-plugin-module-resolver",
            {
                alias: paths.srcPaths.reduce((alias, item) => {
                    const pPath = item.endsWith("/src")
                        ? item
                            .split("/")
                            .slice(0, -1)
                            .join("/")
                        : item;
                    const pName = path.basename(pPath);
                    alias[`^${pName}/types$`] = pName + "/types";
                    alias[`^${pName}/(?!src)(.+)$`] = pName + "/src/\\1";
                    return alias;
                }, {})
            }
        ],
        ["babel-plugin-lodash", { id: ["lodash", "recompose"] }]
    ]
};
