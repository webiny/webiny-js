import { expect } from "chai";
import { stub } from "sinon";
import _ from "lodash";
import compose from "webiny-compose";
import analyzeCommitsFactory from "../../src/plugins/analyzeCommits";
import { gitRepo, gitCommits } from "./../utils/gitCommands";
import Git from "../../src/utils/git";
import { gitTagVersion } from "../utils/gitCommands";

const cwd = process.cwd();

describe("[analyzeCommits] plugin test", () => {
    let logger;
    let release;

    before(() => {
        logger = {
            log: stub(),
            error: stub()
        };

        release = compose([analyzeCommitsFactory()]);
    });

    beforeEach(() => {
        process.chdir(cwd);
    });

    it("should set version 1.0.0 if no previous releases are found", async () => {
        await gitRepo();
        await gitCommits(["feat(scope): add feature 1\naffects: package-1\nDEMO"]);

        const params = {
            packages: [{ name: "package-1" }],
            logger,
            git: new Git(),
            config: {
                branch: "master",
                tagFormat: () => "v${version}"
            }
        };
        await release(params);

        expect(params.packages[0].nextRelease.version).to.equal("1.0.0");
        expect(params.packages[0].lastRelease).to.be.empty;
    });

    it("should increase feature part of the version on `feature` commits", async () => {
        await gitRepo();
        await gitCommits(["feat(scope): add feature 1\naffects: package-1"]);

        const original = {
            packages: [{ name: "package-1" }],
            logger,
            git: new Git(),
            config: {
                branch: "master",
                tagFormat: () => "v${version}"
            }
        };

        let params = _.cloneDeep(original);
        await release(params);
        await gitTagVersion(params.packages[0].nextRelease.gitTag);

        await gitCommits(["feat(scope): add feature 2\naffects: package-1"]);
        params = _.cloneDeep(original);
        await release(params);

        expect(params.packages[0].nextRelease.version).to.equal("1.1.0");
        expect(params.packages[0].lastRelease.version).to.equal("1.0.0");
    });

    it("should increase patch part of the version on `fix` commits", async () => {
        await gitRepo();
        await gitCommits(["feat(scope): add feature 1\naffects: package-1"]);

        const original = {
            packages: [{ name: "package-1" }],
            logger,
            git: new Git(),
            config: {
                branch: "master",
                tagFormat: () => "v${version}"
            }
        };

        let params = _.cloneDeep(original);
        await release(params);
        await gitTagVersion(params.packages[0].nextRelease.gitTag);

        await gitCommits(["fix(scope): add fix\naffects: package-1"]);
        params = _.cloneDeep(original);
        await release(params);

        expect(params.packages[0].nextRelease.version).to.equal("1.0.1");
        expect(params.packages[0].lastRelease.version).to.equal("1.0.0");
    });

    it("should increase breaking part of the version on `breaking change` commits", async () => {
        await gitRepo();
        await gitCommits(["feat(scope): add feature 1\naffects: package-1"]);

        const original = {
            packages: [{ name: "package-1" }],
            logger,
            git: new Git(),
            config: {
                branch: "master",
                tagFormat: () => "v${version}"
            }
        };

        let params = _.cloneDeep(original);
        await release(params);
        await gitTagVersion(params.packages[0].nextRelease.gitTag);

        await gitCommits([
            "feature(scope): removed a feature\naffects: package-1\n\nBREAKING CHANGE: removed a feature"
        ]);
        params = _.cloneDeep(original);
        await release(params);

        expect(params.packages[0].nextRelease.version).to.equal("2.0.0");
        expect(params.packages[0].lastRelease.version).to.equal("1.0.0");
    });

    it("should not create `nextRelease` if commit type is not one of `major`, `minor` or `patch`", async () => {
        await gitRepo();
        await gitCommits(["feat(scope): add feature 1\naffects: package-1"]);

        const original = {
            packages: [{ name: "package-1" }],
            logger,
            git: new Git(),
            config: {
                branch: "master",
                tagFormat: () => "v${version}"
            }
        };

        let params = _.cloneDeep(original);
        await release(params);
        await gitTagVersion(params.packages[0].nextRelease.gitTag);

        await gitCommits(["chore(scope): added Flow types"]);
        params = _.cloneDeep(original);
        await release(params);

        expect(params.packages[0].nextRelease).to.be.undefined;
        expect(params.packages[0].lastRelease.version).to.equal("1.0.0");
    });
});
