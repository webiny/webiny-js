const extractSrcDeps = require("./extractSrcDeps");
const fs = require("fs");

const extractDepsFromPackageJson = ({
    dependencies = {},
    devDependencies = {},
    peerDependencies = {}
}) => {
    return {
        dependencies: Object.keys(dependencies),
        devDependencies: Object.keys(devDependencies),
        peerDependencies: Object.keys(peerDependencies)
    };
};

const getPackageConfig = ({ dir }) => {
    const path = process.cwd() + "/" + dir + "/checkdep.config.js";
    const exists = fs.existsSync(path);
    if (exists) {
        return require(path);
    }
    return {};
};

const extractIgnoredDepsFromConfig = (config = {}) => {
    const ignore = config.ignore || {};
    return {
        src: ignore.src || [],
        dependencies: ignore.dependencies || [],
        devDependencies: ignore.devDependencies || [],
        peerDependencies: ignore.peerDependencies || []
    };
};

const isIgnoredDep = ({ type, dep, config, packageConfig }) => {
    let ignored = extractIgnoredDepsFromConfig(packageConfig);

    if (ignored[type]) {
        if (ignored[type] === true) {
            return true;
        }

        if (Array.isArray(ignored[type]) && ignored[type].includes(dep)) {
            return true;
        }
    }

    ignored = extractIgnoredDepsFromConfig(config);

    if (ignored[type]) {
        if (ignored[type] === true) {
            return true;
        }

        if (Array.isArray(ignored[type]) && ignored[type].includes(dep)) {
            return true;
        }
    }

    return false;
};

const checkPackage = async ({ dir, config }) => {
    let packageJson;
    try {
        packageJson = JSON.parse(fs.readFileSync(dir + "/package.json", "utf8"));
    } catch (e) {
        throw Error("Could not parse package.json located at " + dir + "/package.json");
    }

    const packageConfig = getPackageConfig({ dir });

    const deps = {
        src: extractSrcDeps({ dir: process.cwd() + "/" + dir, packageConfig, packageJson, config }),
        packageJson: extractDepsFromPackageJson(packageJson)
    };

    const output = {
        packageJson,
        dir,
        errors: {
            count: 0,
            deps: {
                src: deps.src.filter(dep => {
                    if (dep === packageJson.name) {
                        return false;
                    }

                    if (
                        deps.packageJson.dependencies.includes(dep) ||
                        deps.packageJson.devDependencies.includes(dep) ||
                        deps.packageJson.peerDependencies.includes(dep)
                    ) {
                        return false;
                    }

                    if (isIgnoredDep({ type: "src", config, packageConfig, dep })) {
                        return false;
                    }

                    return true;
                }),
                dependencies: deps.packageJson.dependencies.filter(dep => {
                    if (deps.src.includes(dep)) {
                        return false;
                    }

                    if (isIgnoredDep({ type: "dependencies", config, packageConfig, dep })) {
                        return false;
                    }

                    return true;
                }),
                devDependencies: deps.packageJson.devDependencies.filter(dep => {
                    if (deps.src.includes(dep)) {
                        return false;
                    }

                    if (isIgnoredDep({ type: "devDependencies", config, packageConfig, dep })) {
                        return false;
                    }

                    return true;
                }),
                peerDependencies: deps.packageJson.peerDependencies.filter(dep => {
                    if (deps.src.includes(dep)) {
                        return false;
                    }

                    if (isIgnoredDep({ type: "peerDependencies", config, packageConfig, dep })) {
                        return false;
                    }

                    return true;
                })
            }
        }
    };

    output.errors.count =
        output.errors.deps.src.length +
        output.errors.deps.dependencies.length +
        output.errors.deps.devDependencies.length +
        output.errors.deps.peerDependencies.length;

    return output;
};

module.exports = checkPackage;
