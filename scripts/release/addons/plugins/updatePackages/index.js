const _ = require("lodash");

/**
 * Update package.json of the package with its new version and new versions of all dependencies
 *
 * @param deps
 * @param packages
 * @param version
 */
function updateDeps(deps, packages) {
    const lib = {};
    _.each(packages, pkg => {
        lib[pkg.name] = _.get(pkg, "nextRelease.version", _.get(pkg, "lastRelease.version"));
    });

    _.each(deps, (version, dep) => {
        if (dep in lib) {
            deps[dep] = "^" + lib[dep];
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
            updateDeps(pkg.package.dependencies, packages);
            if (pkg.package.devDependencies) {
                updateDeps(pkg.package.devDependencies, packages);
            }
            if (pkg.package.peerDependencies) {
                updateDeps(pkg.package.peerDependencies, packages);
            }
        }

        next();
    };
};
