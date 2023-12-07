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
    const managerIdentityB = useCategoryManageHandlerV2({
        path: "manage/en-US",
        identity: identityB
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

    test("updating a previous revision should update entry-level meta fields", async () => {
        let { data: revision1 } = await managerIdentityA.createCategory({
            data: {
                title: "Fruits",
                slug: "fruits"
            }
        });

        let { data: revision2 } = await managerIdentityA.createCategoryFrom({
            revision: revision1.id
        });

        let { data: revision3 } = await managerIdentityA.createCategoryFrom({
            revision: revision2.id
        });

        await managerIdentityB.updateCategory({
            revision: revision1.id,
            data: { title: "Fruits Update" }
        });

        // Refresh.
        ({ data: revision1 } = await managerIdentityA.getCategory({ revision: revision1.id }));
        ({ data: revision2 } = await managerIdentityA.getCategory({ revision: revision2.id }));
        ({ data: revision3 } = await managerIdentityA.getCategory({ revision: revision3.id }));

        // Revision 1 and 3's entry-level meta fields should be in sync.
        expect(revision1.entryCreatedOn).toBe(revision3.entryCreatedOn);
        expect(revision1.entryCreatedBy).toEqual(revision3.entryCreatedBy);

        expect(revision1.entryModifiedOn).toBe(revision3.entryModifiedOn);
        expect(revision1.entryModifiedBy).toEqual(revision3.entryModifiedBy);

        expect(revision1.entrySavedOn).toBe(revision3.entrySavedOn);
        expect(revision1.entrySavedBy).toEqual(revision3.entrySavedBy);

        // Except for createdOn/createdBy, revision 2's entry-level meta fields should
        // not be in sync. This is fine because we only care about latest revisions.
        expect(revision2.entryCreatedOn).toBe(revision3.entryCreatedOn);
        expect(revision2.entryCreatedBy).toEqual(revision3.entryCreatedBy);

        expect(revision2.entryModifiedOn).not.toBe(revision3.entryModifiedOn);
        expect(revision2.entryModifiedBy).not.toEqual(revision3.entryModifiedBy);

        expect(revision2.entrySavedOn).not.toBe(revision3.entrySavedOn);
        expect(revision2.entrySavedBy).not.toEqual(revision3.entrySavedBy);
    });

    test("deleting latest revision should cause the entry-level meta field values to be propagated to the new latest revision", async () => {
        let { data: revision1 } = await managerIdentityA.createCategory({
            data: {
                title: "Fruits",
                slug: "fruits"
            }
        });

        let { data: revision2 } = await managerIdentityA.createCategoryFrom({
            revision: revision1.id
        });

        const { data: revision3 } = await managerIdentityA.createCategoryFrom({
            revision: revision2.id
        });

        // Delete revision 3 and ensure that revision 2's entry-level meta fields are propagated.
        await managerIdentityB.deleteCategory({
            revision: revision3.id
        });

        // Refresh.
        ({ data: revision2 } = await managerIdentityA.getCategory({ revision: revision2.id }));

        expect(revision2.entryCreatedOn).toBe(revision3.entryCreatedOn);
        expect(revision2.entryCreatedBy).toEqual(revision3.entryCreatedBy);
        expect(revision2.entryModifiedOn).toBe(revision3.entryModifiedOn);
        expect(revision2.entryModifiedBy).toEqual(revision3.entryModifiedBy);
        expect(revision2.entrySavedOn).toBe(revision3.entrySavedOn);
        expect(revision2.entrySavedBy).toEqual(revision3.entrySavedBy);

        // Delete revision 2 and ensure that revision 1's entry-level meta fields are propagated.
        await managerIdentityB.deleteCategory({
            revision: revision2.id
        });

        // Refresh.
        ({ data: revision1 } = await managerIdentityA.getCategory({ revision: revision1.id }));

        expect(revision1.entryCreatedOn).toBe(revision2.entryCreatedOn);
        expect(revision1.entryCreatedBy).toEqual(revision2.entryCreatedBy);
        expect(revision1.entryModifiedOn).toBe(revision2.entryModifiedOn);
        expect(revision1.entryModifiedBy).toEqual(revision2.entryModifiedBy);
        expect(revision1.entrySavedOn).toBe(revision2.entrySavedOn);
        expect(revision1.entrySavedBy).toEqual(revision2.entrySavedBy);
    });
});
