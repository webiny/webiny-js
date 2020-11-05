const readJson = require("load-json-file");
const getPackages = require("get-yarn-workspaces");
const { yellow } = require("chalk");

module.exports = () => {
    return getPackages()
        .map(path => {
            const packageJsonPath = path + "/package.json";
            const tsConfigJsonPath = path + "/tsconfig.json";
            const tsConfigBuildJsonPath = path + "/tsconfig.build.json";

            let packageJson, tsConfigJson, tsConfigBuildJson;
            packageJson = readJson.sync(packageJsonPath);

            try {
                tsConfigJson = readJson.sync(tsConfigJsonPath);
                tsConfigBuildJson = readJson.sync(tsConfigBuildJsonPath);
            } catch {
                // Do nothing.
            }

            try {
                return {
                    packageFolder: path,
                    packageJsonPath,
                    tsConfigJsonPath,
                    tsConfigBuildJsonPath,
                    packageJson,
                    tsConfigJson,
                    tsConfigBuildJson
                };
            } catch {
                console.log(yellow(`Ignoring ${path}/package.json`));
                return null;
            }
        })
        .filter(Boolean);
};
