import { expect } from "chai";
import { stub } from "sinon";
import commits from "./utils/commits";
import releaseNotesFactory from "../src/plugins/releaseNotes";
import compose from "webiny-compose";

const cwd = process.cwd();

describe("releaseNotes plugin test", () => {
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

    // Test releaseNotes generation for the first release
    const pkg1 = {
        name: "package-1",
        commits,
        nextRelease: {
            version: "1.0.0",
            gitTag: "v1.0.0"
        }
    };

    // Test releaseNotes generation for subsequent release
    const pkg2 = {
        name: "package-2",
        commits,
        lastRelease: {
            version: "1.0.0"
        },
        nextRelease: {
            version: "2.0.0",
            gitTag: "v2.0.0"
        }
    };

    [pkg1, pkg2].map(pkg => {
        it(`should generate release notes for ${pkg.name}`, async () => {
            const params = {
                packages: [pkg],
                logger,
                config: {
                    repositoryUrl: ""
                }
            };

            const release = compose([releaseNotesFactory()]);
            await release(params);
            expect(pkg.nextRelease.notes).to.be.a.string;
            expect(pkg.nextRelease.notes).to.contain(pkg.nextRelease.version);
            expect(pkg.nextRelease.notes).to.contain("### Bug Fixes");
            expect(pkg.nextRelease.notes).to.contain("### Features");
            expect(pkg.nextRelease.notes).to.contain(commits[0].commit.short);
            expect(pkg.nextRelease.notes).to.contain(commits[1].commit.short);
        });
    });

    it("should not generate release notes if package does not have `nextRelease`", async () => {
        const pkg = {
            name: "package-1"
        };

        const params = {
            packages: [pkg],
            logger,
            config: {
                repositoryUrl: ""
            }
        };

        const release = compose([releaseNotesFactory()]);
        await release(params);
        expect(pkg.nextRelease).to.be.undefined;
    });
});
