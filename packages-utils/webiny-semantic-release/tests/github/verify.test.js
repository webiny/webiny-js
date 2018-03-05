import chai from "./../utils/chai";
import nock from "nock";
import { stub } from "sinon";
import compose from "webiny-compose";
import githubVerifyFactory from "../../src/plugins/github/verify";
import githubClient from "./utils/githubClient";

const { expect } = chai;

const envVars = { ...process.env };

describe("[github verify] plugin test", () => {
    let logger;
    let release;

    beforeEach(() => {
        ["GH_TOKEN", "GITHUB_TOKEN", "GH_URL", "GH_PREFIX", "GITHUB_PREFIX"].map(
            key => delete process.env[key]
        );

        logger = {
            log: stub(),
            error: stub()
        };

        release = compose([
            githubVerifyFactory({
                githubClient: {
                    retry: { retries: 3, factor: 1, minTimeout: 1, maxTimeout: 1 },
                    limit: { search: 1, core: 1 },
                    globalLimit: 1
                }
            })
        ]);
    });

    afterEach(() => {
        // Restore process.env variables
        process.env = { ...envVars };
        nock.cleanAll();
    });

    it("should verify access to repository", async () => {
        const owner = "repo-owner";
        const repo = "repo-name";

        process.env.GH_TOKEN = "github_token";

        const params = {
            logger,
            config: {
                repositoryUrl: `git+https://github.com/${owner}/${repo}.git`
            }
        };

        const github = githubClient()
            .get(`/repos/${owner}/${repo}`)
            .reply(200, { permissions: { push: true } });

        expect(await release(params)).to.not.throw;
        expect(github.isDone()).to.be.true;
    });

    it("should skip verification if release is in preview mode", async () => {
        const params = {
            logger,
            config: {
                preview: true
            }
        };

        expect(await release(params)).to.not.throw;
    });

    it("should throw error if repo is not found", async () => {
        const owner = "repo-owner";
        const repo = "repo-name";

        process.env.GH_TOKEN = "github_token";

        const params = {
            logger,
            config: {
                repositoryUrl: `git+https://github.com/${owner}/${repo}.git`
            }
        };

        const github = githubClient()
            .get(`/repos/${owner}/${repo}`)
            .times(3)
            .reply(404);

        return release(params)
            .should.be.rejectedWith(Error, /EMISSINGREPO/)
            .then(() => {
                expect(github.isDone()).to.be.true;
            });
    });

    it("should throw error if github URL is invalid", async () => {
        const params = {
            logger,
            config: {
                repositoryUrl: `git+https://github.com/invalid.git`
            }
        };

        return release(params).should.be.rejectedWith(Error, /EINVALIDGITHUBURL/);
    });

    it("should throw error if token does not have `push` permission", async () => {
        const owner = "repo-owner";
        const repo = "repo-name";

        process.env.GH_TOKEN = "github_token";

        const params = {
            logger,
            config: {
                repositoryUrl: `git+https://github.com/${owner}/${repo}.git`
            }
        };

        const github = githubClient()
            .get(`/repos/${owner}/${repo}`)
            .reply(200, { permissions: { push: false } });

        return release(params)
            .should.be.rejectedWith(Error, /EGHNOPERMISSION/)
            .then(() => {
                expect(github.isDone()).to.be.true;
            });
    });

    it("should throw error if token is invalid", async () => {
        const owner = "repo-owner";
        const repo = "repo-name";

        process.env.GH_TOKEN = "github_token";

        const params = {
            logger,
            config: {
                repositoryUrl: `git+https://github.com/${owner}/${repo}.git`
            }
        };

        const github = githubClient()
            .get(`/repos/${owner}/${repo}`)
            .reply(401);

        return release(params)
            .should.be.rejectedWith(Error, /EINVALIDGHTOKEN/)
            .then(() => {
                expect(github.isDone()).to.be.true;
            });
    });

    it("should throw error if token is not set", async () => {
        const owner = "repo-owner";
        const repo = "repo-name";

        const params = {
            logger,
            config: {
                repositoryUrl: `git+https://github.com/${owner}/${repo}.git`
            }
        };

        return release(params).should.be.rejectedWith(Error, /ENOGHTOKEN/);
    });

    it("should throw error if github returns any other error", async () => {
        const owner = "repo-owner";
        const repo = "repo-name";

        process.env.GH_TOKEN = "github_token";

        const github = githubClient()
            .get(`/repos/${owner}/${repo}`)
            .times(3)
            .reply(500);

        const params = {
            logger,
            config: {
                repositoryUrl: `git+https://github.com/${owner}/${repo}.git`
            }
        };

        return release(params)
            .should.be.rejectedWith(Error)
            .then(() => {
                expect(github.isDone()).to.be.true;
            });
    });
});
