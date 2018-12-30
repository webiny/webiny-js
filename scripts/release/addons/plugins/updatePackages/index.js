const _ = require("lodash");

/**
 * Update package.json of the package with its new version and new versions of all dependencies
 *
 * @param deps
 * @param packages
 * @param version
 */
function updateDeps(deps, packages, version) {
    const lib = {};
    _.each(packages, pkg => {
        lib[pkg.name] = version;
    });

    _.each(deps, (v, dep) => {
        if (dep in lib) {
            deps[dep] = "^" + version;
        }
    });
}

module.exports = () => {
    return async ({ packages }, next) => {
        for (let i = 0; i < packages.length; i++) {
            const pkg = packages[i];

            if (!pkg.isAddon || !pkg.nextRelease) {
                continue;
            }

            // Update package.json data
            pkg.package.version = pkg.nextRelease.version;
            updateDeps(pkg.package.dependencies, packages, pkg.nextRelease.version);
            updateDeps(pkg.package.devDependencies, packages, pkg.nextRelease.version);
        }

        next();
    };
};
