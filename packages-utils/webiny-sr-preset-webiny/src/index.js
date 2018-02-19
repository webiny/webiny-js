import path from "path";
import fs from "fs";
import githubPublish from "webiny-semantic-release/lib/plugins/github/publish";
import npmVerify from "webiny-semantic-release/lib/plugins/npm/verify";
import updatePackageJson from "webiny-semantic-release/lib/plugins/updatePackageJson";
import npmPublish from "webiny-semantic-release/lib/plugins/npm/publish";
import releaseNotes from "webiny-semantic-release/lib/plugins/releaseNotesGenerator";
import analyzeCommits from "webiny-semantic-release/lib/plugins/analyzeCommits";
import githubVerify from "webiny-semantic-release/lib/plugins/github/verify";

export const plugins = [
    // Verify tokens
    githubVerify(),
    npmVerify(),
    // Ensure packages that are about to be published contain README.md
    ({ packages, logger }, next) => {
        let errors = [];
        packages.map(pkg => {
            if (!fs.existsSync(path.join(pkg.location, "README.md"))) {
                errors.push(pkg.name);
            }
        });

        if (errors.length) {
            logger.log(
                "Missing README.md file in the following packages:\n- %s",
                errors.join("\n- ")
            );
            throw new Error("README.md file not found in all packages!");
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
