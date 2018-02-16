const releaseNotesGenerator = require("@semantic-release/release-notes-generator");
const readPkg = require("read-pkg");
const getRelevantCommits = require("./utils/relevantCommits");

module.exports = function(pluginConfig, _ref) {
    return readPkg(process.cwd()).then(pkg => {
        // Get only relevant commits
        _ref.commits = getRelevantCommits(_ref.commits, pkg);
        return releaseNotesGenerator(pluginConfig, _ref);
    });
};
