const releaseNotesGenerator = require("@semantic-release/release-notes-generator");

export default () => {
    return async ({ packages, config }, next) => {
        // Detect next version for all packages
        for (let i = 0; i < packages.length; i++) {
            const pkg = packages[i];
            if (!pkg.nextRelease || !pkg.nextRelease.version) {
                continue;
            }

            packages[i]["releaseNotes"] = await releaseNotesGenerator(
                {},
                {
                    commits: pkg.commits,
                    lastRelease: pkg.lastRelease,
                    nextRelease: pkg.nextRelease,
                    options: { repositoryUrl: config.repositoryUrl }
                }
            );
        }

        next();
    };
};
