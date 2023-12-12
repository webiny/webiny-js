import { setupGroupAndModels } from "~tests/testHelpers/setup";
import { useCategoryManageHandlerV2 } from "~tests/testHelpers/useCategoryManageHandler";
import { SecurityIdentity } from "@webiny/api-security/types";

const expectIsoDate = expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);

const identityA: SecurityIdentity = { id: "a", type: "admin", displayName: "A" };
const identityB: SecurityIdentity = { id: "b", type: "admin", displayName: "B" };

describe("Content entries - Entry Meta Fields Overrides", () => {
    const managerIdentityA = useCategoryManageHandlerV2({
        path: "manage/en-US",
        identity: identityA
    });

    beforeEach(async () => {
        await setupGroupAndModels({
            manager: managerIdentityA,
            models: ["category"]
        });
    });

    test("create, createFrom, update, and publish mutations should allow overriding meta fields", async () => {
        // 1. Initially, all meta fields should be populated, except the "modified" ones.
        const testDate = new Date("2020-01-01T00:00:00.000Z");

        let { data: revision1 } = await managerIdentityA.createCategory({
            data: {
                title: "Fruits",
                slug: "fruits",
                revisionCreatedOn: testDate
            }
        });

        expect(revision1).toMatchObject({
            createdOn: expectIsoDate,
            createdBy: identityA,
            modifiedBy: null,
            ownedBy: identityA,
            savedOn: expectIsoDate,
            revisionCreatedOn: expectIsoDate,
            revisionSavedOn: expectIsoDate,
            revisionModifiedOn: null,
            revisionCreatedBy: identityA,
            revisionSavedBy: identityA,
            revisionModifiedBy: null,
            entryCreatedOn: expectIsoDate,
            entrySavedOn: expectIsoDate,
            entryModifiedOn: null,
            entryCreatedBy: identityA,
            entrySavedBy: identityA,
            entryModifiedBy: null
        });

        // 2. After the entry is updated, "modified" meta fields should be populated.
        ({ data: revision1 } = await managerIdentityA.updateCategory({
            revision: revision1.id,
            data: { title: "Fruits 2" }
        }));

        expect(revision1).toMatchObject({
            // Deprecated fields.
            createdBy: identityA,
            createdOn: revision1.createdOn,
            modifiedBy: identityA,
            ownedBy: identityA,
            savedOn: expectIsoDate,

            // New fields.
            entryCreatedBy: identityA,
            entryCreatedOn: revision1.entryCreatedOn,
            entryModifiedBy: identityA,
            entryModifiedOn: expectIsoDate,
            entrySavedBy: identityA,
            entrySavedOn: expectIsoDate,

            revisionCreatedBy: identityA,
            revisionCreatedOn: revision1.createdOn,
            revisionModifiedBy: identityA,
            revisionModifiedOn: expectIsoDate,
            revisionSavedBy: identityA,
            revisionSavedOn: expectIsoDate
        });

        // 3. A new revision should have updated revision-level meta
        // fields, while entry-level meta fields should remain the same.
        const { data: revision2 } = await managerIdentityA.createCategoryFrom({
            revision: revision1.id
        });

        expect(revision2).toMatchObject({
            createdOn: expectIsoDate,
            createdBy: identityA,
            modifiedBy: null,
            ownedBy: identityA,
            savedOn: expectIsoDate,
            revisionCreatedOn: expectIsoDate,
            revisionSavedOn: expectIsoDate,

            // Note that these are null, since, on a revision-level, an update has not been made yet.
            revisionModifiedOn: null,

            revisionCreatedBy: identityA,
            revisionSavedBy: identityA,

            // Note that these are null, since, on a revision-level, an update has not been made yet.
            revisionModifiedBy: null,

            entryCreatedOn: expectIsoDate,
            entrySavedOn: expectIsoDate,

            // Note that these are not null, since, on an entry-level, an update has been made.
            entryModifiedOn: expectIsoDate,

            entryCreatedBy: identityA,
            entrySavedBy: identityA,

            // Note that these are not null, since, on an entry-level, an update has been made.
            entryModifiedBy: identityA
        });

        // Refresh.
        ({ data: revision1 } = await managerIdentityA.getCategory({ revision: revision1.id }));

        // Revision-level meta fields should be updated.
        expect(revision2.revisionCreatedOn > revision1.revisionCreatedOn).toBe(true);

        // Entry-level `createdOn` meta field should remain the same.
        expect(revision2.entryCreatedOn).toBe(revision1.entryCreatedOn);

        // Entry-level `savedOn` and `modifiedOn` meta fields should change.
        // It is true that previous revision's entry-level fields are not updated, but that's
        // fine. When updating entry-level meta fields, we only care about latest revisions.
        expect(revision2.entrySavedOn > revision1.entrySavedOn).toBe(true);
        expect(revision2.entryModifiedOn > revision1.entryModifiedOn).toBe(true);
    });

    test("users should be able to create and immediately publish an entry with a custom publishing-related values", async () => {
        // 1. Initially, all meta fields should be populated, except the "modified" ones.
        const testDate = new Date("2020-01-01T00:00:00.000Z").toISOString();

        const { data: rev } = await managerIdentityA.createCategory({
            data: {
                title: "Fruits",
                slug: "fruits",
                status: 'published',
                revisionFirstPublishedOn: testDate,
                revisionLastPublishedOn: testDate,
                revisionFirstPublishedBy: identityB,
                revisionLastPublishedBy: identityB,
                entryFirstPublishedOn: testDate,
                entryLastPublishedOn: testDate,
                entryFirstPublishedBy: identityB,
                entryLastPublishedBy: identityB
            }
        });

        expect(rev).toMatchObject({
            createdOn: expectIsoDate,
            createdBy: identityA,
            modifiedBy: null,
            ownedBy: identityA,
            savedOn: expectIsoDate,
            revisionFirstPublishedOn: testDate,
            revisionLastPublishedOn: testDate,
            revisionFirstPublishedBy: identityB,
            revisionLastPublishedBy: identityB,
            entryFirstPublishedOn: testDate,
            entryLastPublishedOn: testDate,
            entryFirstPublishedBy: identityB,
            entryLastPublishedBy: identityB
        });
    });
});
