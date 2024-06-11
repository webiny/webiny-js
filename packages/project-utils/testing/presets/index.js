const path = require("path");
const fs = require("fs");
const getYarnWorkspaces = require("get-yarn-workspaces");
const loadJsonFile = require("load-json-file");

const getAllPackages = targetKeywords => {
    const yargs = require("yargs");
    const { storage = "ddb" } = yargs.argv;

    if (!storage) {
        throw Error(`Missing required --storage parameter!`);
    }

    // Set the storage type as an environment variable.
    process.env.WEBINY_STORAGE_OPS = storage;

    const storagePriority = storage.split(",");

    const packages = getYarnWorkspaces(process.cwd())
        .map(pkg => pkg.replace(/\\/g, "/"))
        .filter(pkg => pkg.match(/\/packages\//) !== null);

    // Find packages that match the given sets of tags.
    const packageJsons = packages
        .map(pkg => {
            const json = loadJsonFile.sync(pkg + "/package.json");
            return {
                path: pkg,
                name: json.name,
                keywords: json.keywords || []
            };
        })
        .filter(pkg => {
            for (const set of targetKeywords) {
                if (set.every(tag => pkg.keywords.includes(tag))) {
                    return true;
                }
            }
            return false;
        });

    // Now we need to filter based on the required storage type, but also use fallback, if possible.
    const results = [];

    for (const set of targetKeywords) {
        for (const storage of storagePriority) {
            const matchingPackage = packageJsons.find(pkg => {
                return [...set, storage].every(tag => pkg.keywords.includes(tag));
            });

            if (matchingPackage) {
                results.push(matchingPackage);
                break;
            }
        }
    }

    return results;
};

const removeEmptyPreset = preset => {
    if (!preset || Object.keys(preset).length === 0) {
        return false;
    }
    return true;
};

const getPackagesPresets = targetKeywords => {
    if (!targetKeywords || targetKeywords.length === 0) {
        throw new Error(`You must pass keywords to search for in the packages.`);
    }

    if (!Array.isArray(targetKeywords[0])) {
        targetKeywords = [targetKeywords];
    }

    const packages = getAllPackages(targetKeywords);
    if (packages.length === 0) {
        return [];
    }
    const items = [];
    /**
     * We go through all available packages to build presets for them.
     */
    for (const pkg of packages) {
        const presetsPath = path.join(pkg.path, "__tests__/__api__/presets.js");
        if (!fs.existsSync(presetsPath)) {
            throw new Error(`Missing presets.js of the "${pkg.name}" package: ${presetsPath}`);
        }
        /**
         * We expect presets file to contain an array of presets.
         * We do not check for the actual contents of the presets arrays since they can be quite different per package.
         */
        const presets = require(presetsPath);
        if (Array.isArray(presets) === false) {
            throw new Error(`Presets in package "${pkg.name}" must be defined as an array.`);
        } else if (presets.length === 0) {
            throw new Error(`There are no presets in the file "${presetsPath}".`);
        }

        items.push(...presets.filter(removeEmptyPreset));
    }
    return items;
};

module.exports = (...targetKeywords) => {
    return getPackagesPresets(targetKeywords);
};
