const chalk = require("chalk");
const { getPackages } = require("./utils");

const outputJSON = obj => {
    console.log(JSON.stringify(obj, null, 2));
};

module.exports = async ({ json, withPath, folder, ignoreFolder, scope, ignoreScope }) => {
    let folders = [],
        ignoreFolders = [],
        scopes = [],
        ignoreScopes = [];

    if (folder) {
        folders = Array.isArray(folder) ? folder : [folder];
    }
    if (ignoreFolder) {
        ignoreFolders = Array.isArray(ignoreFolder) ? ignoreFolder : [ignoreFolder];
    }

    if (scope) {
        scopes = Array.isArray(scope) ? scope : [scope];
    }

    if (ignoreScope) {
        ignoreScopes = Array.isArray(ignoreScope) ? scope : [ignoreScope];
    }

    const packages = getPackages({ scopes, ignoreScopes, folders, ignoreFolders });

    const output = packages.reduce((current, item) => {
        current[item.name] = item.path;
        return current;
    }, {});

    if (json) {
        // `withPath` outputs a key => value object, containing workspace name and absolute path
        if (withPath) {
            outputJSON(output);
        } else {
            outputJSON(Object.keys(output));
        }
        return;
    }

    packages.forEach(item => {
        if (withPath) {
            console.log(`${chalk.green(item.name)} (${chalk.blue(item.path)})`);
        } else {
            console.log(chalk.green(item.name));
        }
    });
};
