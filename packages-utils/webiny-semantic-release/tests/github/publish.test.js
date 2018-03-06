import chai from "./../utils/chai";
import nock from "nock";
import { stub } from "sinon";
import compose from "webiny-compose";
import githubPublishFactory from "../../src/plugins/github/publish";
import githubClient from "./utils/githubClient";
import Git from "../../src/utils/git";

const { expect } = chai;

const envVars = { ...process.env };

describe("[github publish] plugin test", () => {
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
            githubPublishFactory({
                githubClient: {
                    retry: { retries: 3, factor: 1, minTimeout: 1, maxTimeout: 1 },
                    limit: { core: 1 },
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

    ["GH_TOKEN", "GITHUB_TOKEN"].map(token => {
        it(`should publish a release using ${token}`, async () => {
            const owner = "user";
            const repo = "repo";

            process.env[token] = "github_token";

            const nextRelease = {
                version: "1.0.0",
                gitHead: "165987a96549879",
                gitTag: "v1.0.0",
                notes: "Release notes"
            };
            const releaseUrl = `https://github.com/${owner}/${repo}/releases/${
                nextRelease.version
            }`;
            const uploadUri = `/api/uploads/repos/${owner}/${repo}/releases/1/assets`;
            const uploadUrl = `https://github.com${uploadUri}{?name,label}`;

            const params = {
                packages: [{ name: "package-1", nextRelease }],
                logger,
                git: new Git(),
                config: {
                    repositoryUrl: `git+https://github.com/${owner}/${repo}.git`,
                    branch: "master",
                    tagFormat: () => "v${version}"
                }
            };

            const github = githubClient()
                .post(`/repos/${owner}/${repo}/releases`, {
                    tag_name: nextRelease.gitTag,
                    target_commitish: "master",
                    name: nextRelease.gitTag,
                    body: nextRelease.notes
                })
                .reply(200, { upload_url: uploadUrl, html_url: releaseUrl });

            await release(params);

            expect(params.packages[0].githubRelease.html_url).to.equal(releaseUrl);
            expect(logger.log.args[0]).to.deep.equal(["Published GitHub release: %s", releaseUrl]);
            expect(github.isDone()).to.be.true;
        });
    });

    it("should output preview data if release is in `preview` mode", async () => {
        const owner = "user";
        const repo = "repo";

        process.env.GH_TOKEN = "github_token";

        const nextRelease = {
            version: "1.0.0",
            gitHead: "165987a96549879",
            gitTag: "v1.0.0",
            notes: "Release notes"
        };

        const gitRelease = {
            owner,
            repo,
            tag_name: nextRelease.gitTag,
            name: nextRelease.gitTag,
            target_commitish: "master",
            body: nextRelease.notes
        };

        const pkg = { name: "package-1", nextRelease };

        const params = {
            packages: [pkg],
            logger,
            git: new Git(),
            config: {
                preview: true,
                repositoryUrl: `git+https://github.com/${owner}/${repo}.git`,
                branch: "master",
                tagFormat: () => "v${version}"
            }
        };

        await release(params);

        expect(logger.log.args[0]).to.deep.equal([
            "GitHub release data for %s:\n%s",
            pkg.name,
            JSON.stringify(gitRelease, null, 2)
        ]);
    });

    it("should skip the package if `nextRelease` is not set", async () => {
        const owner = "user";
        const repo = "repo";
        process.env.GH_TOKEN = "github_token";

        const pkg = { name: "package-1" };
        const params = {
            packages: [pkg],
            logger,
            config: {
                repositoryUrl: `git+https://github.com/${owner}/${repo}.git`,
                branch: "master",
                tagFormat: () => "v${version}"
            }
        };

        const release = compose([githubPublishFactory()]);

        await release(params);

        expect(pkg.githubRelease).to.be.undefined;
    });

    it("should store an error in `githubRelease.error` if publishing failed", async () => {
        const owner = "user";
        const repo = "repo";
        process.env.GH_TOKEN = "github_token";

        const nextRelease = {
            version: "1.0.0",
            gitHead: "165987a96549879",
            gitTag: "v1.0.0",
            notes: "Release notes"
        };

        const params = {
            packages: [{ name: "package-1", nextRelease }],
            logger,
            git: new Git(),
            config: {
                repositoryUrl: `git+https://github.com/${owner}/${repo}.git`,
                branch: "master",
                tagFormat: () => "v${version}"
            }
        };

        const github = githubClient()
            .post(`/repos/${owner}/${repo}/releases`, {
                tag_name: nextRelease.gitTag,
                target_commitish: "master",
                name: nextRelease.gitTag,
                body: nextRelease.notes
            })
            .reply(400, "Something went wrong");

        return release(params).should.be.fulfilled.then(() => {
            const { packages } = params;
            expect(packages[0].githubRelease.error).to.be.instanceof(Error);
            expect(logger.error.args[0]).to.deep.equal([
                "Failed to publish %s\n%s",
                "package-1",
                "Something went wrong"
            ]);
            expect(github.isDone()).to.be.true;
        });
    });

    it("should not abort release process if one of the packages fails to publish", async () => {
        const owner = "user";
        const repo = "repo";
        process.env.GH_TOKEN = "github_token";

        const pkg1Next = {
            version: "2.0.0",
            gitHead: "165987a96549879",
            gitTag: "v2.0.0",
            notes: "Release notes"
        };
        const pkg2Next = {
            version: "1.6.0",
            gitHead: "645987a9654359879",
            gitTag: "v1.6.0",
            notes: "Release notes"
        };

        const releaseUrl = `https://github.com/${owner}/${repo}/releases/${pkg2Next.version}`;
        const uploadUri = `/api/uploads/repos/${owner}/${repo}/releases/1/assets`;
        const uploadUrl = `https://github.com${uploadUri}{?name,label}`;

        const params = {
            packages: [
                { name: "package-1", nextRelease: pkg1Next },
                { name: "package-2", nextRelease: pkg2Next }
            ],
            logger,
            git: new Git(),
            config: {
                repositoryUrl: `git+https://github.com/${owner}/${repo}.git`,
                branch: "master",
                tagFormat: pkg => pkg.name + "@v${version}"
            }
        };

        const github = githubClient()
            .post(`/repos/${owner}/${repo}/releases`, {
                tag_name: pkg1Next.gitTag,
                target_commitish: "master",
                name: pkg1Next.gitTag,
                body: pkg1Next.notes
            })
            .reply(400, "Something went wrong")
            .post(`/repos/${owner}/${repo}/releases`, {
                tag_name: pkg2Next.gitTag,
                target_commitish: "master",
                name: pkg2Next.gitTag,
                body: pkg2Next.notes
            })
            .reply(200, { upload_url: uploadUrl, html_url: releaseUrl });

        return release(params).should.be.fulfilled.then(() => {
            const { packages } = params;
            // First package must have an error
            expect(packages[0].githubRelease.error).to.be.instanceof(Error);
            expect(logger.error.args[0]).to.deep.equal([
                "Failed to publish %s\n%s",
                "package-1",
                "Something went wrong"
            ]);
            // Second package must be published
            expect(packages[1].githubRelease.error).to.be.undefined;
            expect(packages[1].githubRelease.html_url).to.equal(releaseUrl);
            expect(logger.log.args[0]).to.deep.equal(["Published GitHub release: %s", releaseUrl]);
            expect(github.isDone()).to.be.true;
        });
    });
});
