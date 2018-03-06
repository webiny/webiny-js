import execa from "execa";
import path from "path";
import fs from "fs-extra";

export default () => {
    return async ({ packages, logger, config }, next) => {
        for (let i = 0; i < packages.length; i++) {
            const pkg = packages[i];
            if (!pkg.nextRelease || !pkg.nextRelease.version) {
                continue;
            }

            logger.log(
                "Publishing %s version %s to npm registry",
                pkg.name,
                pkg.nextRelease.version
            );
            if (config.preview) {
                logger.log(`DRY: %s`, `npm publish ${pkg.location}`);
                logger.log(`DRY: package.json\n%s`, JSON.stringify(pkg.packageJSON, null, 2));
            } else {
                try {
                    // write the updated package.json to disk before publishing
                    fs.writeJsonSync(path.join(pkg.location, "package.json"), pkg.packageJSON, {
                        spaces: 2
                    });
                    const shell = await execa("npm", ["publish", `${pkg.location}`]);
                    process.stdout.write(shell.stdout);
                    pkg.npmPublish = {
                        ...shell
                    };
                } catch (err) {
                    process.stdout.write(err.toString());
                    pkg.npmPublish = { error: err };
                }
            }
        }

        next();
    };
};
