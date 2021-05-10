import path from "path";
import fs from "fs";
import { readFile } from "fs-extra";
import { Octokit } from "octokit";

export default async (args: { octokit: Octokit; org: string; repo: string }) => {
    const { octokit, org, repo } = args;
    const branch = "main";

    const currentCommit = await getCurrentCommit(octokit, org, repo, branch);

    const cwd = path.join(__dirname, "githubActions", "workflows");

    const filesPaths = [];
    readDirectory(cwd, filesPaths);

    const filesBlobs = await Promise.all(filesPaths.map(createBlobForFile(octokit, org, repo)));
    const pathsForBlobs = filesPaths.map(fullPath => path.relative(cwd, fullPath));

    const newTree = await createNewTree(
        octokit,
        org,
        repo,
        filesBlobs,
        pathsForBlobs,
        currentCommit.treeSha
    );

    const commitMessage = `ci: create Webiny CI/CD pipeline`;
    const newCommit = await createNewCommit(
        octokit,
        org,
        repo,
        commitMessage,
        newTree.sha,
        currentCommit.commitSha
    );
    await setBranchToCommit(octokit, org, repo, branch, newCommit.sha);
};

const getCurrentCommit = async (octokit: Octokit, org: string, repo: string, branch: string) => {
    const { data: refData } = await octokit.rest.git.getRef({
        owner: org,
        repo,
        ref: `heads/${branch}`
    });
    const commitSha = refData.object.sha;
    const { data: commitData } = await octokit.rest.git.getCommit({
        owner: org,
        repo,
        commit_sha: commitSha
    });

    return {
        commitSha,
        treeSha: commitData.tree.sha
    };
};

function readDirectory(dir, files) {
    fs.readdirSync(dir).forEach(File => {
        const absolute = path.join(dir, File);
        if (fs.statSync(absolute).isDirectory()) {
            return readDirectory(absolute, files);
        }
        return files.push(absolute);
    });
}

// ===============================================================================================

// Notice that readFile's utf8 is typed differently from Github's utf-8
const getFileAsUTF8 = (filePath: string) => readFile(filePath, "utf8");

const createBlobForFile = (octokit: Octokit, org: string, repo: string) => async (
    filePath: string
) => {
    const content = await getFileAsUTF8(filePath);
    const blobData = await octokit.rest.git.createBlob({
        owner: org,
        repo,
        content,
        encoding: "utf-8"
    });
    return blobData.data;
};

const createNewTree = async (
    octokit: Octokit,
    owner: string,
    repo: string,
    // blobs: octokit.rest.gitCreateBlobResponse[], TODO: check this type.
    blobs: any[],
    paths: string[],
    parentTreeSha: string
) => {
    // My custom config. Could be taken as parameters
    const tree = blobs.map(({ sha }, index) => ({
        path: paths[index],
        mode: `100644`,
        type: `blob`,
        sha
    // })) as octokit.rest.gitCreateTreeParamsTree[]; TODO: check this type.
    })) as any[];

    const { data } = await octokit.rest.git.createTree({
        owner,
        repo,
        tree,
        base_tree: parentTreeSha
    });

    return data;
};

const createNewCommit = async (
    octo: Octokit,
    org: string,
    repo: string,
    message: string,
    currentTreeSha: string,
    currentCommitSha: string
) =>
    (
        await octo.rest.git.createCommit({
            owner: org,
            repo,
            message,
            tree: currentTreeSha,
            parents: [currentCommitSha]
        })
    ).data;

const setBranchToCommit = (
    octokit: Octokit,
    org: string,
    repo: string,
    branch: string,
    commitSha: string
) =>
    octokit.rest.git.updateRef({
        owner: org,
        repo,
        ref: `heads/${branch}`,
        sha: commitSha
    });
