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

const getPackageKeywords = pkg => {
    const file = path.join(pkg, "package.json");
    if (!fs.existsSync(file)) {
        throw new Error(`Missing package.json "${file}".`);
    }
    const content = fs.readFileSync(file).toString();
    try {
        const json = JSON.parse(content);
        return Array.isArray(json.keywords) ? json.keywords : [];
    } catch (ex) {
        throw new Error(`Could not parse package.json "${file}".`);
    }
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

const identifiers = {};
const createPackageName = initialName => {
    let name = initialName;
    let current = 0;
    while (identifiers[name]) {
        name = `${initialName}-${current}`;
    }
    return name;
};

const createPackageFilter = (args = []) => {
    const filters = args
        .filter(arg => {
            return arg.startsWith("--keyword=");
        })
        .map(arg => {
            return arg.replace("--keyword=", "");
        });
    return (packageKeywords = []) => {
        if (
            !packageKeywords ||
            filters.length === 0 ||
            (packageKeywords.length === 0 && filters.length === 0)
        ) {
            return true;
        }
        for (const filter of filters) {
            // a single keyword in the argument
            const result = packageKeywords.includes(filter);
            if (result) {
                return true;
            }
        }
        return false;
    };
};

const isPackageAllowed = createPackageFilter(process.argv);

const projects = allWorkspaces()
    .reduce((collection, pkg) => {
        const hasConfig = hasPackageJestConfig(pkg);
        const setup = getPackageJestSetup(pkg);
        const basePackagePath = pkg.replace(process.cwd() + "/", "");

        if (!hasConfig && !setup) {
            return collection;
        }
        const keywords = getPackageKeywords(pkg);
        if (!isPackageAllowed(keywords)) {
            return collection;
        }

        if (setup && (Array.isArray(setup) === true || setup["0"] !== undefined)) {
            for (const key in setup) {
                const name = createPackageName(setup[key].name);
                if (!setup.hasOwnProperty(key)) {
                    continue;
                }
                collection.push({
                    ...setup[key],
                    name: name,
                    displayName: name,
                    rootDir: setup[key].rootDir || pkg
                });
            }
            return collection;
        }
        return collection.concat([basePackagePath]);
    }, [])
    .filter(Boolean);

if (projects.length === 0) {
    console.log(`There are no packages found. Please check the filters if you are using those.`);
    process.exit(1);
}
module.exports = {
    projects,
    modulePathIgnorePatterns: ["dist"],
    testTimeout: 30000
};
