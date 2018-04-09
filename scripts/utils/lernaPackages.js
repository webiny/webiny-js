const Repository = require("lerna/lib/Repository");
const PackageUtilities = require("lerna/lib/PackageUtilities");

module.exports = () =>
    PackageUtilities.getPackages(new Repository())
        .filter(pkg => !pkg.isPrivate()) // do not include private packages
        .map(pkg => {
            return {
                name: pkg.name,
                location: pkg.location,
                package: pkg.toJSON()
            };
        });
