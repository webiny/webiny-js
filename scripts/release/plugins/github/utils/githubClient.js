const Octokit = require("@octokit/rest");

module.exports = ({ githubToken }) => {
    const github = new Octokit();
    github.authenticate({ type: "token", token: githubToken });
    return github;
};
