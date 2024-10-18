const fs = require("fs");
const path = require("path");
const semver = require("semver");
const execa = require("execa");
const loadJsonFile = require("load-json-file");
const { allWorkspaces } = require("../packages/project-utils/workspaces");

const types = ["dependencies", "devDependencies", "peerDependencies"];
const findPackages = (collection, json, matching) => {
    return types.reduce((packages, type) => {
        const deps = json[type];
        if (!deps) {
            return packages;
        }
        for (const pkg in deps) {
            if (pkg.match(matching) === null) {
                continue;
            } else if (!packages[pkg]) {
                packages[pkg] = {
                    version: semver.coerce(deps[pkg]),
                    latest: null
                };
                continue;
            }
            const version = semver.coerce(deps[pkg]);
            const existing = packages[pkg].version;
            if (!semver.gt(existing.raw, version.raw)) {
                continue;
            }
            packages[pkg] = {
                version: version,
                latest: null
            };
        }

        return packages;
    }, collection);
};

const updateBabelPackages = async () => {
    const packages = allWorkspaces().map(pkg => {
        return path.resolve(process.cwd(), pkg);
    });

    packages.push(path.resolve(process.cwd()));

    const babelPackages = packages.reduce((collection, pkg) => {
        const target = path.resolve(pkg, "package.json");
        if (!fs.existsSync(target)) {
            console.log(`File not found: ${target}`);
            return collection;
        }
        const json = loadJsonFile.sync(target);
        collection = findPackages(collection, json, /^@babel\//);
        return collection;
    }, {});

    for (const pkg in babelPackages) {
        try {
            const result = await execa("npm", ["show", pkg, "version"]);
            if (!result.stdout) {
                continue;
            }
            const version = semver.coerce(result.stdout);
            babelPackages[pkg].latest = version;
            if (semver.gt(version.raw, babelPackages[pkg].version.raw) === false) {
                continue;
            }
            babelPackages[pkg].updateToLatest = true;
        } catch (ex) {
            console.error(`Could not find "${pkg}" latest version on npm.`, ex);
        }
    }

    for (const pkg in babelPackages) {
        const target = babelPackages[pkg];
        if (!target.updateToLatest) {
            console.log(`"${pkg}" is already up-to-date (${target.version.raw}).`);
            continue;
        }
        await execa("yarn", ["up", `${pkg}@^${target.latest.raw}`]);
        console.log(`"${pkg}" updated from "${target.version.raw}" to ${target.latest.raw}.`);
    }
};

updateBabelPackages();
