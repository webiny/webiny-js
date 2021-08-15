import path from "path";
import fs from "fs";
import { Octokit } from "octokit";
const { Base64 } = require("js-base64");

export default async (args: {
    octokit: Octokit;
    owner: string;
    repo: string;
    branch: string;
    author: { name: string; email: string };
}) => {
    const { octokit, owner, repo, branch, author } = args;

    const cwd = path.join(__dirname, "files", "workflows");

    const filesPaths = [];
    readDirectory(cwd, filesPaths);

    for (let i = 0; i < filesPaths.length; i++) {
        const filePath = filesPaths[i];

        const content = fs.readFileSync(filePath, "utf-8");
        const contentEncoded = Base64.encode(content);

        await octokit.rest.repos.createOrUpdateFileContents({
            owner,
            repo,
            branch,
            path: path.relative(cwd, filePath),
            message: `ci: create Webiny CI/CD pipeline`,
            content: contentEncoded,
            committer: author,
            author
        });
    }

    return;
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
