const path = require("path");
const getPackages = require("get-yarn-workspaces");
const packages = getPackages();

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
                alias: packages.reduce((alias, pPath) => {
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
