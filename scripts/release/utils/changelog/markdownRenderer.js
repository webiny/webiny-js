const COMMIT_FIX_REGEX = /(fix|close|resolve)(e?s|e?d)? [T#](\d+)/i;

module.exports = ({ labels, baseUrl, release }) => {
    let contributors = [];

    function renderContributionsByPackage(commits) {
        // Group commits in category by package
        const commitsByPackage = {};
        for (const commit of commits) {
            // Array of unique packages.
            const changedPackages = commit.packages || [];

            const packageName = renderPackageNames(changedPackages);

            commitsByPackage[packageName] = commitsByPackage[packageName] || [];
            commitsByPackage[packageName].push(commit);
        }

        const packageNames = Object.keys(commitsByPackage);

        return packageNames
            .map(packageName => {
                const pkgCommits = commitsByPackage[packageName];
                return `* ${packageName}\n${renderContributionList(pkgCommits, "  ")}`;
            })
            .join("\n");
    }

    function renderPackageNames(packageNames) {
        return packageNames.length > 0 ? packageNames.map(pkg => `\`${pkg}\``).join(", ") : "Other";
    }

    function renderContributionList(commits, prefix = "") {
        return commits
            .map(renderContribution)
            .filter(Boolean)
            .map(rendered => `${prefix}* ${rendered}`)
            .join("\n");
    }

    function renderContribution(commit) {
        const issue = commit.prData;
        if (issue) {
            let markdown = "";

            if (issue.number && issue.pull_request && issue.pull_request.html_url) {
                const prUrl = issue.pull_request.html_url;
                markdown += `[#${issue.number}](${prUrl}) `;
            }

            if (issue.title && issue.title.match(COMMIT_FIX_REGEX)) {
                issue.title = issue.title.replace(
                    COMMIT_FIX_REGEX,
                    `Closes [#$3](${baseUrl}/issues/$3)`
                );
            }

            markdown += `${issue.title} ([@${issue.user.login}](${issue.user.html_url}))`;

            return markdown;
        }

        // If there is no PR related to the commit we still want to render it
        const commitLink = `[${commit.commit.short}](${baseUrl}/commit/${commit.commit.short})`;
        let markdown = commit.subject.replace(/\w+(\(.*\))?:(.*)/, "$2") + ` (${commitLink})`;

        // Without PR, we don'y have exact user data, so we need to take it from the commit data.
        // We also attempt to match the committer name with the known contributors list.
        const {
            committer: { name }
        } = commit;

        const user = contributors.find(c => c.name === name || c.login === name);

        if (user) {
            return markdown + ` ([@${user.login}](${user.html_url}))`;
        }

        return markdown + ` (${name})`;
    }

    function renderContributorList(contributors) {
        const renderedContributors = contributors
            .map(contributor => `- ${renderContributor(contributor)}`)
            .sort();

        return `#### Committers: ${contributors.length}\n${renderedContributors.join("\n")}`;
    }

    function renderContributor(contributor) {
        if (contributor.html_url) {
            const userNameAndLink = `[@${contributor.login}](${contributor.html_url})`;
            if (contributor.name) {
                return `${contributor.name} (${userNameAndLink})`;
            } else {
                return userNameAndLink;
            }
        }

        return contributor.name;
    }

    function hasPackages(commits) {
        return commits.some(commit => commit.packages !== undefined && commit.packages.length > 0);
    }

    function groupByCategory(allCommits) {
        return labels.map(label => {
            // Keep only the commits that have a matching label
            let commits = allCommits.filter(
                commit => commit.categories && commit.categories.includes(label.title)
            );

            return { name: label.title, commits };
        });
    }

    // Group commits in release by category
    const categories = groupByCategory(release.commits);
    const categoriesWithCommits = categories.filter(category => category.commits.length > 0);

    // Skip this iteration if there are no commits available for the release
    if (categoriesWithCommits.length === 0) return "";

    let markdown = `## ${release.name} (${release.date})`;

    for (const category of categoriesWithCommits) {
        markdown += `\n\n#### ${category.name}\n`;

        if (hasPackages(category.commits)) {
            markdown += renderContributionsByPackage(category.commits);
        } else {
            markdown += renderContributionList(category.commits);
        }
    }

    // Make sure all committers are in the list of contributors
    release.commits.forEach(commit => {
        const name = commit.committer.name;
        const isContributor = release.contributors.find(c => c.name === name || c.login === name);

        if (!isContributor) {
            release.contributors.push({ name });
        }
    });

    if (release.contributors) {
        markdown += `\n\n${renderContributorList(release.contributors)}`;
    }

    return markdown;
};
