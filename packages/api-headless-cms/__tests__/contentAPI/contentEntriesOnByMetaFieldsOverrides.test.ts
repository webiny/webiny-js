import { useTestModelHandler } from "~tests/testHelpers/useTestModelHandler";
import { identityA, identityB, identityC, identityD } from "./security/utils";

describe("Content entries - Entry Meta Fields Overrides", () => {
    const { read: readIdentityA, manage: manageIdentityA } = useTestModelHandler({
        identity: identityA
    });

    beforeEach(async () => {
        await manageIdentityA.setup();
    });

    test("users should be able to create and immediately publish an entry with custom publishing-related values", async () => {
        // 1. Initially, all meta fields should be populated, except the "modified" ones.
        const testDate = new Date("2020-01-01T00:00:00.000Z").toISOString();

        const { data: rev } = await manageIdentityA.createTestEntry({
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

        const { data: rev } = await manageIdentityA.createTestEntry({
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
            await manageIdentityA.createTestEntryFrom({
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

        const { data: publishedRevWithAllCustomValues } = await manageIdentityA.createTestEntryFrom(
            {
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
            }
        );

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

        // Ensure that the new published revision is the one that is returned when listing or getting the entry.

        // 1. Manage API.
        const { data: getEntryManage } = await manageIdentityA.getTestEntry({
            entryId: rev.entryId
        });

        expect(getEntryManage).toMatchObject({
            meta: {
                status: "published",
                version: 3
            }
        });

        const { data: listEntriesManage } = await manageIdentityA.listTestEntries();

        expect(listEntriesManage).toMatchObject([
            {
                meta: {
                    status: "published",
                    version: 3
                }
            }
        ]);

        // 2. Read API (here we can't get versions directly, so we're just inspecting the revision ID).
        const { data: getEntryRead } = await readIdentityA.getTestEntry({
            where: { entryId: rev.entryId }
        });
        expect(getEntryRead.id).toEndWith("#0003");

        const { data: listEntriesRead } = await readIdentityA.listTestEntries();
        expect(listEntriesRead[0].id).toEndWith("#0003");

        // Extra check - ensure the previous revision is no longer published.
        const { data: firstPublishedRevision } = await manageIdentityA.getTestEntry({
            revision: `${rev.entryId}#0001`
        });

        const { data: secondPublishedRevision } = await manageIdentityA.getTestEntry({
            revision: `${rev.entryId}#0002`
        });

        expect(firstPublishedRevision.meta.status).toBe("unpublished");
        expect(secondPublishedRevision.meta.status).toBe("unpublished");
    });
});
