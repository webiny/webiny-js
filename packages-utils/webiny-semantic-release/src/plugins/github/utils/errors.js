export default {
    EINVALIDGITHUBURL: () => ({
        message: "The git repository URL is not a valid GitHub URL.",
        details: `The \`repositoryUrl\` must be a valid GitHub URL with the format \`<GitHub_or_GHE_URL>/<owner>/<repo>.git. Make sure it is defined in your package.json.`
    }),
    EMISSINGREPO: ({ owner, repo }) => ({
        message: `The repository ${owner}/${repo} doesn't exist.`,
        details: `The repository must be accessible with the [GitHub API](https://developer.github.com/v3).`
    }),
    EGHNOPERMISSION: ({ owner, repo }) => ({
        message: `The GitHub token doesn't allow to push on the repository ${owner}/${repo}.`,
        details: `The user associated with the GitHub token must allow to push to the repository ${owner}/${repo}.`
    }),
    EINVALIDGHTOKEN: ({ owner, repo }) => ({
        message: "Invalid GitHub token.",
        details: `\`GH_TOKEN\` or \`GITHUB_TOKEN\` environment variable must be a valid [personal token](https://help.github.com/articles/creating-a-personal-access-token-for-the-command-line) allowing to push to the repository ${owner}/${repo}.`
    }),
    ENOGHTOKEN: () => ({
        message: "No GitHub token specified.",
        details: `A GitHub personal token must be created and set in the \`GH_TOKEN\` or \`GITHUB_TOKEN\` environment variable on your CI environment.`
    })
};
