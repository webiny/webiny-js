import path from "path";
import fs from "fs";
import {
    analyzeCommits,
    releaseNotes,
    githubVerify,
    githubPublish,
    npmVerify,
    npmPublish,
    updatePackageJson
} from "webiny-semantic-release";

export const plugins = () => {
    return [
        // Verify tokens
        githubVerify(),
        npmVerify(),
        // Ensure packages that are about to be published contain README.md
        ({ packages, logger }, next, finish) => {
            let errors = [];
            packages.map(pkg => {
                if (!fs.existsSync(path.join(pkg.location, "README.md"))) {
                    errors.push(pkg.name);
                }
            });

            if (errors.length) {
                logger.error(
                    "Missing README.md file in the following packages:\n\t- %s",
                    errors.join("\n- ")
                );
                finish();
                return;
            }
            next();
        },
        // Analyze all commits and generate new versions and nextRelease data
        analyzeCommits(),
        // Update package.json version and versions of dependencies
        updatePackageJson(),
        // Make sure "main" field does not start with `src/`
        ({ packages, logger }, next) => {
            packages.map(pkg => {
                const json = pkg.packageJSON;
                if (json.main && (json.main.startsWith("src/") || json.main.startsWith("./src/"))) {
                    logger.log(`Updating \`main\` field of %s`, pkg.name);
                    json.main = json.main.replace("src/", "lib/");
                }
            });
            next();
        },
        // Generate release notes based on commits and nextRelease data from previous plugin
        releaseNotes(),
        // Publish
        npmPublish(),
        githubPublish()
    ];
};
