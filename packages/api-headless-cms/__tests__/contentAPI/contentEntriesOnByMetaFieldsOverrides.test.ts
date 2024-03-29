import { useTestModelHandler } from "~tests/testHelpers/useTestModelHandler";
import { identityA, identityB, identityC, identityD } from "./security/utils";

describe("Content entries - Entry Meta Fields Overrides", () => {
    const { manage: managerIdentityA } = useTestModelHandler({
        identity: identityA
    });

    beforeEach(async () => {
        await managerIdentityA.setup();
    });

    test("users should be able to create and immediately publish an entry with custom publishing-related values", async () => {
        // 1. Initially, all meta fields should be populated, except the "modified" ones.
        const testDate = new Date("2020-01-01T00:00:00.000Z").toISOString();

        const { data: rev } = await managerIdentityA.createTestEntry({
            data: {
                status: "published",
                revisionFirstPublishedOn: testDate,
                revisionLastPublishedOn: testDate,
                revisionFirstPublishedBy: identityB,
                revisionLastPublishedBy: identityB,
                firstPublishedOn: testDate,
                lastPublishedOn: testDate,
                firstPublishedBy: identityB,
                lastPublishedBy: identityB
            }
        });

        expect(rev).toMatchObject({
            createdOn: expect.toBeDateString(),
            createdBy: identityA,
            modifiedBy: null,
            savedOn: expect.toBeDateString(),
            revisionFirstPublishedOn: testDate,
            revisionLastPublishedOn: testDate,
            revisionFirstPublishedBy: identityB,
            revisionLastPublishedBy: identityB,
            firstPublishedOn: testDate,
            lastPublishedOn: testDate,
            firstPublishedBy: identityB,
            lastPublishedBy: identityB
        });
    });

    test("users should be able to create a new revision from an existing revision and immediately publish it with custom publishing-related values", async () => {
        // 1. Initially, all meta fields should be populated, except the "modified" ones.
        const testDate1 = new Date("2020-01-01T00:00:00.000Z").toISOString();
        const testDate2 = new Date("2021-01-01T00:00:00.000Z").toISOString();
        const testDate3 = new Date("2022-01-01T00:00:00.000Z").toISOString();

        const { data: rev } = await managerIdentityA.createTestEntry({
            data: {
                status: "published",
                revisionFirstPublishedOn: testDate1,
                revisionLastPublishedOn: testDate1,
                revisionFirstPublishedBy: identityB,
                revisionLastPublishedBy: identityB,
                firstPublishedOn: testDate1,
                lastPublishedOn: testDate1,
                firstPublishedBy: identityB,
                lastPublishedBy: identityB
            }
        });

        const { data: publishedRevWithCustomLastPublishedValues } =
            await managerIdentityA.createTestEntryFrom({
                revision: rev.id,
                data: {
                    status: "published",
                    revisionLastPublishedOn: testDate2,
                    revisionLastPublishedBy: identityC,
                    lastPublishedOn: testDate2,
                    lastPublishedBy: identityC
                }
            });

        // Should not see changes in firstPublished-related fields.
        expect(publishedRevWithCustomLastPublishedValues).toMatchObject({
            createdOn: rev.createdOn,
            createdBy: rev.createdBy,
            modifiedBy: identityA,
            savedOn: expect.toBeDateString(),
            revisionFirstPublishedOn: expect.toBeDateString(),
            revisionLastPublishedOn: testDate2,
            revisionFirstPublishedBy: identityA,
            revisionLastPublishedBy: identityC,
            firstPublishedOn: testDate1,
            lastPublishedOn: testDate2,
            firstPublishedBy: identityB,
            lastPublishedBy: identityC
        });

        expect(publishedRevWithCustomLastPublishedValues.savedOn > rev.savedOn).toBeTrue();
        expect(
            publishedRevWithCustomLastPublishedValues.revisionFirstPublishedOn >
                rev.revisionFirstPublishedOn
        ).toBeTrue();

        const { data: publishedRevWithAllCustomValues } =
            await managerIdentityA.createTestEntryFrom({
                revision: publishedRevWithCustomLastPublishedValues.id,
                data: {
                    status: "published",
                    revisionFirstPublishedOn: testDate3,
                    revisionLastPublishedOn: testDate3,
                    revisionFirstPublishedBy: identityD,
                    revisionLastPublishedBy: identityD,
                    firstPublishedOn: testDate3,
                    lastPublishedOn: testDate3,
                    firstPublishedBy: identityD,
                    lastPublishedBy: identityD
                }
            });

        expect(publishedRevWithAllCustomValues).toMatchObject({
            createdOn: expect.toBeDateString(),
            createdBy: identityA,
            modifiedBy: identityA,
            savedOn: expect.toBeDateString(),
            revisionFirstPublishedOn: testDate3,
            revisionLastPublishedOn: testDate3,
            revisionFirstPublishedBy: identityD,
            revisionLastPublishedBy: identityD,
            firstPublishedOn: testDate3,
            lastPublishedOn: testDate3,
            firstPublishedBy: identityD,
            lastPublishedBy: identityD
        });
    });
});
