import { stub } from "sinon";
import proxyquire from "proxyquire";
import clearModule from "clear-module";
import compose from "webiny-compose";
import Git from "../../src/utils/git";
import chai from "../utils/chai";

const { expect } = chai;

describe("[verifyEnvironment] plugin test", function() {
    const modulePath = "../../src/plugins/verifyEnvironment";

    let logger;

    beforeEach(() => {
        clearModule("../../src/plugins/verifyEnvironment");

        logger = {
            log: stub(),
            error: stub()
        };
    });

    it("should throw an error `ENOPACKAGES` if no packages are defined", async () => {
        const params = {
            config: {}
        };

        proxyquire(modulePath, {
            "env-ci": () => ({ isCi: false })
        });

        const { default: verifyEnvironmentFactory } = await import(modulePath);
        const release = compose([verifyEnvironmentFactory()]);

        return release(params).should.be.rejectedWith(Error, /ENOPACKAGES/);
    });

    it("should switch to `preview` mode if release is not run in a known CI and `config.ci=true`", async () => {
        const params = {
            packages: [],
            git: new Git(),
            logger,
            config: {
                ci: true,
                tagFormat: () => "v${version}"
            }
        };

        proxyquire(modulePath, {
            "env-ci": () => ({ isCi: false })
        });

        const { default: verifyEnvironmentFactory } = await import(modulePath);
        await compose([verifyEnvironmentFactory()])(params);
        expect(params.config.preview).to.be.true;
    });

    it("should gracefully abort the release process if run from a PR in a known CI and `config.ci=true`", async () => {
        const params = {
            packages: [],
            git: new Git(),
            logger,
            config: {
                ci: true,
                preview: true,
                tagFormat: () => "v${version}"
            }
        };

        proxyquire(modulePath, {
            "env-ci": () => ({ isCi: true, isPr: true })
        });

        const { default: verifyEnvironmentFactory } = await import(modulePath);
        await compose([verifyEnvironmentFactory()])(params);
        expect(logger.log.args[0]).to.deep.equal([
            "This run was triggered by a pull request and therefore a new version won't be published."
        ]);
    });

    it("should gracefully abort the release if current branch does not match `config.branch`", async () => {
        const params = {
            packages: [],
            git: new Git(),
            logger,
            config: {
                ci: true,
                preview: true,
                branch: "development",
                tagFormat: () => "v${version}"
            }
        };

        proxyquire(modulePath, {
            "env-ci": () => ({ isCi: true, isPr: false, branch: "master" })
        });

        const { default: verifyEnvironmentFactory } = await import(modulePath);
        await compose([verifyEnvironmentFactory()])(params);
        expect(logger.log.args[0]).to.deep.equal([
            "This run was triggered on %s branch, while `webiny-semantic-release` is configured to only publish from %s.",
            "master",
            "development"
        ]);
    });

    it("should throw an error `EINVALIDTAGFORMAT` if tag format is invalid", async () => {
        const params = {
            packages: [],
            git: new Git(),
            logger,
            config: {
                ci: true,
                preview: true,
                branch: "master",
                tagFormat: () => "tag/.${version}"
            }
        };

        proxyquire(modulePath, {
            "env-ci": () => ({ isCi: true, isPr: false, branch: "master" })
        });

        const { default: verifyEnvironmentFactory } = await import(modulePath);
        return compose([verifyEnvironmentFactory()])(params).should.be.rejectedWith(
            Error,
            /EINVALIDTAGFORMAT/
        );
    });

    it("should throw an error `ETAGNOVERSION` if tag format does not contain a `version` variable", async () => {
        const params = {
            packages: [],
            git: new Git(),
            logger,
            config: {
                ci: true,
                preview: true,
                branch: "master",
                tagFormat: () => "version"
            }
        };

        proxyquire(modulePath, {
            "env-ci": () => ({ isCi: true, isPr: false, branch: "master" })
        });

        const { default: verifyEnvironmentFactory } = await import(modulePath);
        return compose([verifyEnvironmentFactory()])(params).should.be.rejectedWith(
            Error,
            /ETAGNOVERSION/
        );
    });
});
