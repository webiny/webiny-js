const fs = require("fs");
const path = require("path");
const { allWorkspaces } = require("@webiny/project-utils/workspaces");

// Loads environment variables defined in the project root ".env" file.
const { parsed } = require("dotenv").config({ path: path.join(__dirname, ".env") });
if (parsed) {
    console.log('The following environment variables were included from the root ".env" file:');
    console.log(
        Object.keys(parsed).reduce((current, item) => {
            return current + `‣ ${item}\n`;
        }, "")
    );
}

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

// Extract positional arguments after --logHeapUsage (we assume those are package names/paths)
// --logHeapUsage is the last optional parameter defined in package.json "test" script.
const positionalParams = process.argv
    .slice(process.argv.indexOf("--logHeapUsage"))
    .filter(p => !p.startsWith("--"));

const packagesInParams = positionalParams
    .map(p => {
        if (p.includes("packages")) {
            return path.resolve(p);
        }

        return path.resolve("packages", p);
    })
    .map(p => p.replace(/\\/g, "/"));

function isPackageInParams(pkg) {
    if (!packagesInParams.length) {
        return true;
    }

    return packagesInParams.some(p => p.startsWith(pkg));
}

const projects = allWorkspaces()
    .map(p => p.replace(/\\/g, "/"))
    .reduce((collection, pkg) => {
        const hasConfig = hasPackageJestConfig(pkg);
        const setup = getPackageJestSetup(pkg);
        const basePackagePath = pkg.replace(process.cwd() + "/", "");

        if (!hasConfig && !setup) {
            return collection;
        }
        // we need to filter out the packages that do not match required keywords, if any
        const keywords = getPackageKeywords(pkg);
        if (!isPackageAllowed(keywords)) {
            return collection;
        }

        if (!isPackageInParams(pkg)) {
            return collection;
        }

        if (setup && (Array.isArray(setup) === true || setup["0"] !== undefined)) {
            for (const key in setup) {
                if (!setup.hasOwnProperty(key)) {
                    continue;
                }
                const subPackage = setup[key];
                // we need to filter out the subpackage as well
                if (!isPackageAllowed(subPackage.keywords)) {
                    continue;
                }
                // keywords does not exist in jest config so remove it
                // there will be error if not removed
                delete subPackage["keywords"];
                const name = createPackageName(subPackage.name);
                collection.push({
                    ...subPackage,
                    name: name,
                    displayName: name,
                    rootDir: subPackage.rootDir || pkg
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
