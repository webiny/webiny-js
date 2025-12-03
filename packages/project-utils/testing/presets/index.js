import path from "path";
import fs from "fs";
import getYarnWorkspaces from "get-yarn-workspaces";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { PackageJson } from "@webiny/build-tools/utils/PackageJson.js";

const MIN_STORAGE_LENGTH = 1;
const DEFAULT_STORAGE = "ddb";
/**
 * @param argv {string[]}
 * @returns {string}
 */
const getStorage = argv => {
    /**
     * Storage is available in process.env?
     */
    const envValue = process.env.WEBINY_STORAGE;
    if (typeof envValue === "string" && envValue.length > 2) {
        return envValue;
    }
    /**
     * This is if storage is available in args.
     */
    const args = yargs(argv);
    const argsValue = args.storage;
    if (typeof argsValue === "string" && argsValue.length > 2) {
        return argsValue;
    }
    /**
     * Then we try to get --storage=([a-z])
     */
    const matched = argv
        .map(item => {
            const matched = item.match(/^--storage=([^\s]+)$/);
            return matched ? matched[1] : null;
        })
        .find(item => {
            return !!item;
        });
    if (typeof matched === "string" && matched.length > MIN_STORAGE_LENGTH) {
        return matched;
    }
    /**
     * Last attempt is to find --storage and then take next index.
     */
    const index = argv.findIndex(item => {
        return item === "--storage";
    });
    if (index === -1) {
        return DEFAULT_STORAGE;
    }
    const value = argv[index + 1];
    if (typeof value === "string" && value.length > MIN_STORAGE_LENGTH) {
        return value;
    }
    return DEFAULT_STORAGE;
};

const getAllPackages = targetKeywords => {
    const storage = getStorage(hideBin(process.argv));

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
    const packageJsons = [];
    for (const pkg of packages) {
        const pkgJson = PackageJson.fromFile(pkg + "/package.json");
        const { name, keywords = [] } = pkgJson.getJson();

        for (const set of targetKeywords) {
            if (set.every(tag => keywords.includes(tag))) {
                packageJsons.push({
                    path: pkg,
                    name,
                    keywords
                });
            }
        }
    }
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

const getPackagesPresets = async targetKeywords => {
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
        //eslint-disable-next-line import/dynamic-import-chunkname
        const presets = await import(presetsPath).then(m => m.default ?? m);
        if (Array.isArray(presets) === false) {
            throw new Error(`Presets in package "${pkg.name}" must be defined as an array.`);
        } else if (presets.length === 0) {
            throw new Error(`There are no presets in the file "${presetsPath}".`);
        }

        items.push(...presets.filter(removeEmptyPreset));
    }
    return items;
};

export const getPresets = async (...targetKeywords) => {
    return getPackagesPresets(targetKeywords);
};
