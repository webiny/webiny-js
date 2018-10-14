const path = require("path");
const getPackages = require("get-yarn-workspaces");
const packages = getPackages(path.join(process.cwd(), "packages"));

module.exports = {
    babelrcRoots: packages,
    plugins: [
        ["@babel/plugin-proposal-class-properties"],
        [
            "babel-plugin-module-resolver",
            {
                alias: packages.reduce((aliases, dir) => {
                    const name = path.basename(dir);
                    aliases[`^${name}/types`] = `${name}/types`;
                    aliases[`^${name}/(?!src)(.+)$`] = `${name}/src/\\1`;
                    return aliases;
                }, {})
            }
        ]
    ]
};
