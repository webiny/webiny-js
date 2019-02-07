const getSrcDeps = require("./getSrcDeps");
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

const extractIgnoredDepsFromPackageJson = ({ depCheck = {} }) => {
    const ignore = depCheck.ignore || {};
    return {
        src: ignore.src || [],
        dependencies: ignore.dependencies || [],
        devDependencies: ignore.devDependencies || [],
        peerDependencies: ignore.peerDependencies || []
    };
};

const checkPackage = async ({ dir }) => {
    const srcDeps = getSrcDeps(process.cwd() + "/" + dir);
    const packageJson = JSON.parse(fs.readFileSync(dir + "/package.json", "utf8"));
    const deps = extractDepsFromPackageJson(packageJson);
    const ignored = extractIgnoredDepsFromPackageJson(packageJson);

    const output = {
        packageJson,
        dir,
        errors: {
            count: 0,
            deps: {
                src: srcDeps.filter(dep => {
                    if (
                        deps.dependencies.includes(dep) ||
                        deps.devDependencies.includes(dep) ||
                        deps.peerDependencies.includes(dep)
                    ) {
                        return false;
                    }

                    if (dep === packageJson.name) {
                        return false;
                    }

                    if (ignored.src.includes(dep)) {
                        return false;
                    }

                    return true;
                }),
                dependencies: deps.dependencies.filter(dep => {
                    if (srcDeps.includes(dep)) {
                        return false;
                    }

                    if (ignored.dependencies.includes(dep)) {
                        return false;
                    }

                    return true;
                }),
                devDependencies: deps.devDependencies.filter(dep => {
                    if (srcDeps.includes(dep)) {
                        return false;
                    }

                    if (ignored.devDependencies.includes(dep)) {
                        return false;
                    }

                    return true;
                }),
                peerDependencies: deps.peerDependencies.filter(dep => {
                    if (srcDeps.includes(dep)) {
                        return false;
                    }

                    if (ignored.peerDependencies.includes(dep)) {
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
