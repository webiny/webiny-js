const commitAnalyzer = require("@semantic-release/commit-analyzer");
const readPkg = require("read-pkg");
const getRelevantCommits = require("./utils/relevantCommits");

const winston = require("winston");
winston.cli();
const logger = new winston.Logger({
    transports: [new winston.transports.Console()]
});
const log = logger.cli();

module.exports = function(pluginConfig, _ref) {
    return new Promise(resolve => {
        readPkg(process.cwd()).then(pkg => {
            const relevantCommits = getRelevantCommits(_ref.commits, pkg);

            commitAnalyzer({}, Object.assign(_ref, { commits: relevantCommits }), function(
                err,
                type
            ) {
                log.info(
                    "Analyzed",
                    relevantCommits.length,
                    "/",
                    _ref.commits.length,
                    "commits to determine type",
                    type,
                    "for",
                    pkg.name
                );
                relevantCommits.length &&
                    log.info(
                        "Relevant commits:\n*",
                        relevantCommits.map(c => c.subject).join("\n* ")
                    );
                resolve(type);
            });
        });
    });
};
