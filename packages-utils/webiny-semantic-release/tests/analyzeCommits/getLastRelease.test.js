import { expect } from "chai";
import { stub } from "sinon";
import getLastReleaseFactory from "../../src/plugins/analyzeCommits/getLastRelease";
import Git from "../../src/utils/git";
import { gitRepo, gitCommits, gitTagVersion, gitCheckout } from "./../utils/gitCommands";

const cwd = process.cwd();

describe("[analyzeCommits] getLastRelease test", function() {
    this.timeout(5000);

    let logger;
    let getLastRelease;

    beforeEach(() => {
        logger = {
            log: stub(),
            error: stub()
        };

        getLastRelease = getLastReleaseFactory({ logger, git: new Git() });
    });

    afterEach(() => {
        process.chdir(cwd);
    });

    it("should retrieve the latest valid tag", async () => {
        await gitRepo();
        // First commit
        await gitCommits(["Feature 1"]);
        await gitTagVersion("not-semver");
        // Second commit
        const commits = await gitCommits(["Feature 2"]);
        await gitTagVersion("v2.0.0");
        // Third commit
        await gitCommits(["Feature 3"]);
        await gitTagVersion("v1.0.0");
        // Fourth commit
        await gitCommits(["Feature 4"]);
        await gitTagVersion("v3.0");

        const result = await getLastRelease(`v\${version}`, logger);

        expect(result).to.deep.equal({
            gitHead: commits[0].hash,
            gitTag: "v2.0.0",
            version: "2.0.0"
        });
        expect(logger.log.args[0]).to.deep.equal([
            "Found git tag %s associated with version %s",
            "v2.0.0",
            "2.0.0"
        ]);
    });

    it("should retrieve the highest tag in the history of the current branch", async () => {
        await gitRepo();
        // Add commit to the master branch
        await gitCommits(["Feature 1"]);
        await gitTagVersion("v1.0.0");
        // Create the new branch 'development' from master
        await gitCheckout("development");
        await gitCommits(["Feature 2"]);
        await gitTagVersion("v3.0.0");
        // Checkout master
        await gitCheckout("master", false);
        // Add another commit to the master branch
        const commits = await gitCommits(["Feature 3"]);
        await gitTagVersion("v2.0.0");

        const result = await getLastRelease(`v\${version}`, logger);

        expect(result).to.deep.equal({
            gitHead: commits[0].hash,
            gitTag: "v2.0.0",
            version: "2.0.0"
        });
    });

    it("should retrieve an empty object if no valid tags are found", async () => {
        // Create a git repository, set the current working directory at the root of the repo
        await gitRepo();
        // Create some commits and tags
        await gitCommits(["Feature 1"]);
        await gitTagVersion("invalid");
        await gitCommits(["Feature 2"]);
        await gitTagVersion("v2.0.x");
        await gitCommits(["Feature 3"]);
        await gitTagVersion("v3.0");

        const result = await getLastRelease(`v\${version}`, logger);

        expect(result).to.deep.equal(result, {});
        expect(logger.log.args[0][0]).to.equal("No git tag version found");
    });

    it('should retrieve the highest valid tag corresponding to the "tagFormat"', async () => {
        await gitRepo();
        const [{ hash: gitHead }] = await gitCommits(["Feature 1"]);
        await gitTagVersion("1.0.0");

        expect(await getLastRelease(`\${version}`, logger)).to.deep.equal({
            gitHead,
            gitTag: "1.0.0",
            version: "1.0.0"
        });

        await gitTagVersion("foo-1.0.0-bar");
        expect(await getLastRelease(`foo-\${version}-bar`, logger)).to.deep.equal({
            gitHead,
            gitTag: "foo-1.0.0-bar",
            version: "1.0.0"
        });

        await gitTagVersion("foo-v1.0.0-bar");
        expect(await getLastRelease(`foo-v\${version}-bar`, logger)).to.deep.equal({
            gitHead,
            gitTag: "foo-v1.0.0-bar",
            version: "1.0.0"
        });

        await gitTagVersion("(.+)/1.0.0/(a-z)");
        expect(await getLastRelease(`(.+)/\${version}/(a-z)`, logger)).to.deep.equal({
            gitHead,
            gitTag: "(.+)/1.0.0/(a-z)",
            version: "1.0.0"
        });

        await gitTagVersion("2.0.0-1.0.0-bar.1");
        expect(await getLastRelease(`2.0.0-\${version}-bar.1`, logger)).to.deep.equal({
            gitHead,
            gitTag: "2.0.0-1.0.0-bar.1",
            version: "1.0.0"
        });
    });
});
