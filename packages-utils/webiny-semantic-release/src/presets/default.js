import githubPublish from "../plugins/github/publish";
import npmVerify from "../plugins/npm/verify";
import updatePackageJson from "../plugins/updatePackageJson";
import npmPublish from "../plugins/npm/publish";
import releaseNotes from "../plugins/releaseNotes";
import analyzeCommits from "../plugins/analyzeCommits";
import githubVerify from "../plugins/github/verify";

export const plugins = () => {
    return [
        // Verify tokens
        githubVerify(),
        npmVerify(),
        // Analyze all commits and generate new versions and nextRelease data
        analyzeCommits(),
        // Update package.json version and versions of dependencies
        updatePackageJson(),
        // Generate release notes based on commits and nextRelease data from previous plugin
        releaseNotes(),
        // Publish
        npmPublish(),
        githubPublish()
    ];
};
