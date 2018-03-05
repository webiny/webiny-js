import { expect } from "chai";
import { stub } from "sinon";
import getCommits from "../../src/plugins/analyzeCommits/getCommits";
import { gitRepo, gitCommits } from "./../utils/gitCommands";

const cwd = process.cwd();

describe("[analyzeCommits] getCommits test", function() {
    this.timeout(5000);
    let logger;

    before(() => {
        logger = {
            log: stub(),
            error: stub()
        };
    });

    afterEach(() => {
        process.chdir(cwd);
    });

    it("should retrieve all commits if there is no latest release", async () => {
        await gitRepo();
        const commits = await gitCommits(["Feature 1", "Feature 2"]);
        const actualCommits = await getCommits(null, "master", logger);

        expect(actualCommits).to.deep.equal(commits);
    });

    it("should retrieve all commits since latest release", async () => {
        await gitRepo();
        const commits = await gitCommits(["Feature 1", "Feature 2", "Feature 3"]);
        const actualCommits = await getCommits(commits[commits.length - 1].hash, "master", logger);

        expect(actualCommits).to.deep.equal(commits.slice(0, 2));
    });

    it("should return empty array if there were no commits since latest release", async () => {
        await gitRepo();
        const commits = await gitCommits(["Feature 1", "Feature 2"]);
        const actualCommits = await getCommits(commits[0].hash, "master", logger);

        expect(actualCommits).to.be.empty;
    });

    it("should return empty array if there no commits", async () => {
        await gitRepo();
        const actualCommits = await getCommits(null, "master", logger);

        expect(actualCommits).to.be.empty;
    });
});
