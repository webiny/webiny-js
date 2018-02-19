import _ from "lodash";

/**
 * Update package.json of the package with its new version and new versions of all dependencies
 *
 * @param deps
 * @param packages
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

export default () => {
    return async ({ packages }, next) => {
        for (let i = 0; i < packages.length; i++) {
            const pkg = packages[i];
            if (!pkg.nextRelease || !pkg.nextRelease.version) {
                continue;
            }

            // Update package.json data
            pkg.packageJSON.version = pkg.nextRelease.version;
            updateDeps(pkg.packageJSON.dependencies, packages);
            updateDeps(pkg.packageJSON.devDependencies, packages);
        }

        next();
    };
};
