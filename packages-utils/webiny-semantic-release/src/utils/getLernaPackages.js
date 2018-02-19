import Repository from "lerna/lib/Repository";
import PackageUtilities from "lerna/lib/PackageUtilities";

export default () => {
    const repository = new Repository();
    return PackageUtilities.getPackages(repository)
        .filter(pkg => !pkg.isPrivate())
        .map(pkg => {
            return {
                name: pkg.name,
                location: pkg.location,
                packageJSON: pkg.toJSON()
            };
        });
};
