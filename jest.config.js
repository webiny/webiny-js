const fs = require("fs");
const path = require("path");
const { allWorkspaces } = require("@webiny/project-utils/workspaces");

const createPackageJestConfigPath = pkg => {
    const jestConfigPath = path.join(pkg, "jest.config.js");
    if (!fs.existsSync(jestConfigPath)) {
        return null;
    }
    return jestConfigPath;
};
const createPackageJestSetupPath = pkg => {
    const setupPath = path.join(pkg, "jest.setup.js");
    if (!fs.existsSync(setupPath)) {
        return null;
    }
    return setupPath;
};

const hasPackageJestConfig = pkg => {
    return !!createPackageJestConfigPath(pkg);
};

const getPackageJestSetup = pkg => {
    const setupPath = createPackageJestSetupPath(pkg);
    if (!setupPath) {
        return null;
    }
    return require(setupPath);
};

const projects = allWorkspaces()
    .reduce((collection, pkg) => {
        const hasConfig = hasPackageJestConfig(pkg);
        const setup = getPackageJestSetup(pkg);
        const basePackagePath = pkg.replace(process.cwd() + "/", "");
        if (!hasConfig && !setup) {
            return collection;
        } else if (setup && (Array.isArray(setup) === true || setup["0"] !== undefined)) {
            for (const key in setup) {
                if (!setup.hasOwnProperty(key)) {
                    continue;
                }
                collection.push({
                    ...setup[key],
                    name: `${setup[key].name}-${key}`,
                    displayName: `${setup[key].name}-${key}`,
                    rootDir: setup[key].rootDir || pkg
                });
            }
            return collection;
        }
        return collection.concat([basePackagePath]);
    }, [])
    .filter(Boolean);

console.log(projects);
module.exports = {
    projects,
    modulePathIgnorePatterns: ["dist"],
    testTimeout: 30000
};
