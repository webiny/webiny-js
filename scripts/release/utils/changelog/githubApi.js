const fetch = require("cross-fetch");

module.exports = class GithubAPI {
    constructor({ repo }) {
        this.repo = repo;
    }

    async getIssueData(issue) {
        return this.fetch(`https://api.github.com/repos/${this.repo}/issues/${issue}`);
    }

    async getUserData(login) {
        return this.fetch(`https://api.github.com/users/${login}`);
    }

    async fetch(url) {
        const res = await fetch(url, {
            headers: {
                Authorization: `token ${process.env.GH_TOKEN}`
            }
        });
        return res.json();
    }
};
