import { expect } from "chai";
import { stub } from "sinon";
import relevantCommits from "../../src/plugins/analyzeCommits/relevantCommits";
import { gitRepo, gitCommits } from "./../utils/gitCommands";

const cwd = process.cwd();

describe("[analyzeCommits] relevantCommits test", () => {
    let logger;
    const messages = [
        "feat(scope): add feature 1\naffects: package-1, ,",
        "feat(scope): add feature 2\n\naffects: package-2, ",
        "fix(scope): fix a bug\naffects: package-1,package-2",
        "feat(scope): add feature 4\naffects:",
        "chore(scope): cleanup"
    ];

    before(() => {
        logger = {
            log: stub(),
            error: stub()
        };
    });

    beforeEach(() => {
        process.chdir(cwd);
    });

    it("should retrieve commits that affect a particular package", async () => {
        await gitRepo();
        const commits = await gitCommits(messages);

        let actualCommits = await relevantCommits(commits, { name: "package-1" });
        expect(actualCommits).to.have.lengthOf(2);
        expect(actualCommits[0].hash).to.equal(commits[2].hash);
        expect(actualCommits[1].hash).to.equal(commits[4].hash);

        actualCommits = await relevantCommits(commits, { name: "package-2" });
        expect(actualCommits).to.have.lengthOf(2);
        expect(actualCommits[0].hash).to.equal(commits[2].hash);
        expect(actualCommits[1].hash).to.equal(commits[3].hash);
    });

    it("should retrieve an empty array if no relevant commits were found", async () => {
        await gitRepo();
        const commits = await gitCommits(messages);
        const actualCommits = await relevantCommits(commits, { name: "package-3" });

        expect(actualCommits).to.have.lengthOf(0);
    });
});
