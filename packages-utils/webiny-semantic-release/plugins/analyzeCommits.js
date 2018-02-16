const commitAnalyzer = require("@semantic-release/commit-analyzer");
const readPkg = require("read-pkg");
const getRelevantCommits = require("./utils/relevantCommits");

module.exports = function(pluginConfig, _ref) {
    return new Promise(resolve => {
        readPkg(process.cwd()).then(pkg => {
            const relevantCommits = getRelevantCommits(_ref.commits, pkg);

            commitAnalyzer({}, Object.assign(_ref, { commits: relevantCommits })).then(type => {
                console.log(
                    `Analyzed ${relevantCommits.length}/${
                        _ref.commits.length
                    } commits to determine type ${type} for ${pkg.name}`
                );
                relevantCommits.length &&
                    console.log(
                        `Relevant commits:\n* ${relevantCommits.map(c => c.subject).join("\n* ")}`
                    );
                resolve(type);
            });
        });
    });
};
