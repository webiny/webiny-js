import nock from "nock";

export default () => {
    const githubToken = process.env.GH_TOKEN || process.env.GITHUB_TOKEN || "GH_TOKEN";
    const githubUrl = process.env.GH_URL || process.env.GITHUB_URL || "https://api.github.com";

    return nock(`${githubUrl}`, {
        reqheaders: { Authorization: `token ${githubToken}` }
    });
};
