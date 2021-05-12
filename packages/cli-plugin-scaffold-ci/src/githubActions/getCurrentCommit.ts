import { Octokit } from "octokit";

export default async (args: { octokit: Octokit; owner: string; repo: string; branch: string }) => {
    const { octokit, owner, repo, branch } = args;

    const { data: refData } = await octokit.rest.git.getRef({
        owner,
        repo,
        ref: `heads/${branch}`
    });
    const commitSha = refData.object.sha;
    const { data: commitData } = await octokit.rest.git.getCommit({
        owner,
        repo,
        commit_sha: commitSha
    });

    return {
        commitSha,
        treeSha: commitData.tree.sha
    };
};
