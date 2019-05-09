const pMap = require("p-map");
const get = require("lodash/get");
const GithubApi = require("./githubApi");
const markdownRenderer = require("./markdownRenderer");

const baseUrl = "https://github.com/Webiny/webiny-js";

module.exports = async ({ labels, commits, name }) => {
    const githubApi = new GithubApi({ repo: "webiny/webiny-js" });

    function findPullRequestId(message) {
        const lines = message.split("\n");
        const firstLine = lines[0];
        const mergeMatch = firstLine.match(/^Merge pull request #(\d+) from /);
        if (mergeMatch) {
            return mergeMatch[1];
        }
        const squashMergeMatch = firstLine.match(/\(#(\d+)\)$/);
        if (squashMergeMatch) {
            return squashMergeMatch[1];
        }
        const homuMatch = firstLine.match(/^Auto merge of #(\d+) - /);
        if (homuMatch) {
            return homuMatch[1];
        }
        return null;
    }

    async function getPullRequestData(commits) {
        await pMap(
            commits,
            async commit => {
                if (commit.prNumber) {
                    commit.prData = await githubApi.getIssueData(commit.prNumber);
                }
            },
            { concurrency: 5 }
        );
    }

    function parsePullRequestData(commits) {
        commits.forEach(commit => {
            commit.prNumber = findPullRequestId(commit.subject);
        });
    }

    function assignCategories(commits) {
        commits.forEach(commit => {
            if (commit.prData && commit.prData.labels) {
                const prLabels = commit.prData.labels.map(label => label.name.toLowerCase());
                commit.categories = labels
                    .filter(label => label.tags.some(tag => prLabels.includes(tag)))
                    .map(label => label.title);
            }

            if (!commit.categories || commit.categories.length === 0) {
                // Check if commit subject starts with one of the conventional commit prefixes)
                commit.categories = labels
                    .filter(label => {
                        if (!label.prefixes) {
                            return false;
                        }

                        return label.prefixes.some(prefix => commit.subject.startsWith(prefix));
                    })
                    .map(label => label.title);
            }
        });
    }

    function packageFromPath(path) {
        const parts = path.split("/");
        if (parts[0] !== "packages" || parts.length < 3) {
            return "";
        }

        if (parts.length >= 4 && parts[1][0] === "@") {
            return `${parts[1]}/${parts[2]}`;
        }

        return parts[1];
    }

    function assignPackages(commits) {
        commits.forEach(commit => {
            commit.packages = commit.files
                .map(packageFromPath)
                .filter(Boolean)
                .filter(pkg => !pkg.startsWith("demo-"))
                .filter(onlyUnique);
        });
    }

    async function getContributors(commits) {
        const committers = {};

        for (const commit of commits) {
            const login = get(commit.prData, "user.login");
            if (login && !committers[login]) {
                committers[login] = await githubApi.getUserData(login);
            }
        }

        return Object.values(committers);
    }

    function onlyUnique(value, index, self) {
        return self.indexOf(value) === index;
    }

    parsePullRequestData(commits);
    await getPullRequestData(commits);
    await assignCategories(commits);
    assignPackages(commits);

    const release = {
        name,
        date: new Date().toISOString().split("T")[0],
        commits,
        contributors: await getContributors(commits)
    };

    return markdownRenderer({ labels, baseUrl, release });
};
