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
    return async ({ packages, nextRelease = null }, next, finish) => {
        if (!nextRelease) {
            return finish();
        }

        for (let i = 0; i < packages.length; i++) {
            const pkg = packages[i];

            // Update package.json data
            pkg.package.version = nextRelease.version;
            updateDeps(pkg.package.dependencies, packages, nextRelease.version);
            updateDeps(pkg.package.devDependencies, packages, nextRelease.version);
        }

        next();
    };
};
