import execa from "execa";
import tempy from "tempy";

import chai from "./utils/chai";
import Git from "../src/utils/git";
import {
    gitRepo,
    gitCommits,
    gitGetCommits,
    gitTagVersion,
    gitCheckout
} from "./utils/gitCommands";

const { expect } = chai;

const cwd = process.cwd();

describe("git test", function() {
    this.timeout(5000);

    let git = new Git();

    afterEach(() => {
        process.chdir(cwd);
    });

    it("should fetch all commits and tags", async () => {
        await gitRepo();
        await gitCommits(["Commit 1", "Commit 2"]);

        const clone = tempy.directory();
        await execa("git", ["clone", "file://" + process.cwd(), clone, "--depth=1"]);
        process.chdir(clone);

        const commits = await gitGetCommits();
        expect(commits).to.have.lengthOf(1);

        await git.fetchAll();

        const allCommits = await gitGetCommits();
        expect(allCommits).to.have.lengthOf(2);
    });

    it("should retrieve SHA of tag head", async () => {
        await gitRepo();
        const commits = await gitCommits(["Commit 1", "Commit 2"]);
        await gitTagVersion("v1.0.0");

        return git.tagHead("v1.0.0").should.be.fulfilled.then(sha => {
            expect(sha).to.equal(commits[0].commit.long);
        });
    });

    it("should return `null` if invalid tag name is given", async () => {
        return git.tagHead("invalid/.something").should.be.fulfilled.then(sha => {
            expect(sha).to.be.null;
        });
    });

    it("should retrieve tag names", async () => {
        await gitRepo();
        await gitCommits(["Commit 1"]);
        await gitTagVersion("v1.0.0");

        return git.tags().should.become(["v1.0.0"]);
    });

    it("should verify tag name", async () => {
        return Promise.all([
            git.verifyTagName("v1.0.0").should.become(true),
            git.verifyTagName("package@v1.0.0").should.become(true),
            git.verifyTagName("package@1.0.0").should.become(true),
            git.verifyTagName("some/name").should.become(true),
            git.verifyTagName("some/.name").should.become(false)
        ]);
    });

    it("should check if ref is in branch history", async () => {
        await gitRepo();
        const [c1] = await gitCommits(["Commit 1", "Commit 2"]);
        await gitCheckout("dev");
        const [c3] = await gitCommits(["Commit 3", "Commit 4"]);
        await gitCheckout("master", false);
        const [c5, c6] = await gitCommits(["Commit 5", "Commit 6"]);

        return Promise.all([
            git.isRefInHistory(c1.commit.long).should.become(true),
            git.isRefInHistory(c5.commit.long).should.become(true),
            gitCheckout("dev", false).then(() => {
                return Promise.all([
                    git.isRefInHistory(c1.commit.long).should.become(true),
                    git.isRefInHistory(c3.commit.long).should.become(true),
                    git.isRefInHistory(c5.commit.long).should.become(false),
                    git.isRefInHistory(c6.commit.long).should.become(false)
                ]);
            })
        ]);
    });

    it("should retrieve HEAD commit SHA", async () => {
        await gitRepo();
        const [c1] = await gitCommits(["Commit 1"]);

        return git.head().should.become(c1.commit.long);
    });

    it("should retrieve git repo URL", async () => {
        await gitRepo();
        await execa("git", ["remote", "add", "origin", "git@github.com:owner/repo.git"]);
        return git.repoUrl().should.become("git@github.com:owner/repo.git");
    });

    it("should retrieve `undefined` if git repo URL is not set", async () => {
        await gitRepo();
        return git.repoUrl().should.become(undefined);
    });
});
