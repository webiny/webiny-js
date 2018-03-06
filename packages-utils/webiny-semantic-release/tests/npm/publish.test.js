import { stub } from "sinon";
import proxyquire from "proxyquire";
import clearModule from "clear-module";
import compose from "webiny-compose";
import tempy from "tempy";
import fs from "fs";
import { expect } from "chai";

const cwd = process.cwd();

const fileExists = path => {
    try {
        fs.openSync(path, "r");
        return true;
    } catch (err) {
        return false;
    }
};

describe("[npm publish] plugin test", function() {
    let logger;

    before(() => {
        stub(process.stdout, "write").callsFake(() => {});
    });

    after(() => {
        process.stdout.write.restore();
    });

    beforeEach(async () => {
        clearModule("../../src/plugins/npm/publish");

        process.chdir(cwd);

        logger = {
            log: stub(),
            error: stub()
        };
    });

    it("should write package.json to disk and publish to `npm`", async () => {
        const dir = tempy.directory();
        process.chdir(dir);

        const pkg = {
            name: "package-1",
            location: dir,
            packageJSON: {
                name: "package-1",
                version: "1.0.0"
            },
            nextRelease: {
                version: "1.0.0"
            }
        };

        const params = {
            packages: [pkg],
            logger,
            config: {}
        };

        let packageWritten = false;
        proxyquire("../../src/plugins/npm/publish", {
            execa: () => {
                packageWritten = fileExists(dir + "/package.json");
                return { stdout: pkg.packageJSON.name + "@" + pkg.packageJSON.version };
            }
        });

        const { default: npmPublishFactory } = await import("../../src/plugins/npm/publish");
        const release = compose([npmPublishFactory()]);
        await release(params);

        expect(packageWritten).to.be.true;
        expect(pkg.npmPublish.stdout).to.contain(pkg.packageJSON.name);
        expect(pkg.npmPublish.stdout).to.contain(pkg.packageJSON.version);
    });

    it("should continue publishing packages even if one of the packages fails", async () => {
        const dir1 = tempy.directory();
        const dir2 = tempy.directory();

        const pkg1 = {
            name: "package-1",
            location: dir1,
            packageJSON: {
                name: "package-1",
                version: "1.0.0"
            },
            nextRelease: {
                version: "1.0.0"
            }
        };

        const pkg2 = {
            name: "package-2",
            location: dir2,
            packageJSON: {
                name: "package-2",
                version: "1.2.0"
            },
            nextRelease: {
                version: "1.2.0"
            }
        };

        const params = {
            packages: [pkg1, pkg2],
            logger,
            config: {}
        };

        proxyquire("../../src/plugins/npm/publish", {
            execa: stub()
                .onFirstCall()
                .throws(() => new Error("Invalid package"))
                .onSecondCall()
                .returns({ stdout: pkg2.packageJSON.name + "@" + pkg2.packageJSON.version })
        });

        const { default: npmPublishFactory } = await import("../../src/plugins/npm/publish");
        const release = compose([npmPublishFactory()]);
        await release(params);

        expect(pkg1.npmPublish.error.message).to.equal("Invalid package");
        expect(pkg2.npmPublish.stdout).to.contain(pkg2.packageJSON.version);
    });

    it("should skip publishing if `nextRelease` is not set", async () => {
        const pkg = {
            name: "package-1"
        };

        const params = {
            packages: [pkg],
            logger,
            config: {}
        };

        const { default: npmPublishFactory } = await import("../../src/plugins/npm/publish");
        const release = compose([npmPublishFactory()]);
        await release(params);

        expect(pkg.npmPublish).to.be.undefined;
    });

    it("should output preview data if release is run in `preview` mode", async () => {
        const pkg = {
            name: "package-1",
            location: "/dummy/location",
            packageJSON: {
                name: "package-1",
                version: "1.0.0"
            },
            nextRelease: {
                version: "1.0.0"
            }
        };

        const params = {
            packages: [pkg],
            logger,
            config: {
                preview: true
            }
        };

        proxyquire("../../src/plugins/npm/publish", {
            execa: () => ({})
        });

        const { default: npmPublishFactory } = await import("../../src/plugins/npm/publish");
        const release = compose([npmPublishFactory()]);
        await release(params);

        expect(logger.log.args[1]).to.deep.equal(["DRY: %s", "npm publish " + pkg.location]);
        expect(logger.log.args[2]).to.deep.equal([
            `DRY: package.json\n%s`,
            JSON.stringify(pkg.packageJSON, null, 2)
        ]);
    });
});
