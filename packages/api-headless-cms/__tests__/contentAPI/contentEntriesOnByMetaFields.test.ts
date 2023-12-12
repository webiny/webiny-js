import { setupGroupAndModels } from "~tests/testHelpers/setup";
import { useCategoryManageHandlerV2 } from "~tests/testHelpers/useCategoryManageHandler";
import { SecurityIdentity } from "@webiny/api-security/types";

const expectIsoDate = expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);

const identityA: SecurityIdentity = { id: "a", type: "admin", displayName: "A" };
const identityB: SecurityIdentity = { id: "b", type: "admin", displayName: "B" };

describe("Content entries - Entry Meta Fields", () => {
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

    test("created entries should have xOn/xBy meta fields populated correctly", async () => {
        // 1. Initially, all meta fields should be populated, except the "modified" ones.
        //    We must see the same change when listing entries.
        let { data: revision1 } = await managerIdentityA.createCategory({
            data: {
                title: "Fruits",
                slug: "fruits"
            }
        });

        let { data: entriesList } = await managerIdentityA.listCategories();

        const matchObject1 = {
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
        };

        expect(revision1).toMatchObject(matchObject1);
        expect(entriesList[0]).toMatchObject(matchObject1);

        // 2. After the entry is updated, "modified" meta fields should be populated.
        //    We must see the same change when listing entries.
        ({ data: revision1 } = await managerIdentityA.updateCategory({
            revision: revision1.id,
            data: { title: "Fruits 2" }
        }));

        ({ data: entriesList } = await managerIdentityA.listCategories());

        const matchObject2 = {
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
        };

        expect(revision1).toMatchObject(matchObject2);
        expect(entriesList[0]).toMatchObject(matchObject2);

        // 3. A new revision should have updated revision-level meta
        // fields, while entry-level meta fields should remain the same.
        let { data: revision2 } = await managerIdentityA.createCategoryFrom({
            revision: revision1.id
        });

        ({ data: entriesList } = await managerIdentityA.listCategories());

        const matchObject3 = {
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
        };

        expect(revision2).toMatchObject(matchObject3);
        expect(entriesList[0]).toMatchObject(matchObject3);

        // Refresh.
        ({ data: revision1 } = await managerIdentityA.getCategory({ revision: revision1.id }));
        ({ data: revision2 } = await managerIdentityA.getCategory({ revision: revision2.id }));
        ({ data: entriesList } = await managerIdentityA.listCategories());

        // Revision-level meta fields should be updated.
        expect(revision2.revisionCreatedOn > revision1.revisionCreatedOn).toBe(true);
        expect(entriesList[0].revisionCreatedOn > revision1.revisionCreatedOn).toBe(true);

        // Entry-level `createdOn` meta field should remain the same.
        expect(revision2.entryCreatedOn).toBe(revision1.entryCreatedOn);
        expect(entriesList[0].entryCreatedOn).toBe(revision1.entryCreatedOn);

        // Entry-level `savedOn` and `modifiedOn` meta fields should change.
        // It is true that previous revision's entry-level fields are not updated, but that's
        // fine. When updating entry-level meta fields, we only care about latest revisions.
        expect(revision2.entrySavedOn > revision1.entrySavedOn).toBe(true);
        expect(revision2.entryModifiedOn > revision1.entryModifiedOn).toBe(true);
        expect(entriesList[0].entrySavedOn > revision1.entrySavedOn).toBe(true);
        expect(entriesList[0].entryModifiedOn > revision1.entryModifiedOn).toBe(true);
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

        const { data: entriesList } = await managerIdentityA.listCategories();

        // Revision 1 and 3's entry-level meta fields should be in sync.
        // Since listing entries uses the "latest record", we must see the same change there.
        expect(revision1.entryCreatedOn).toBe(revision3.entryCreatedOn);
        expect(revision1.entryCreatedBy).toEqual(revision3.entryCreatedBy);
        expect(revision1.entryCreatedOn).toEqual(entriesList[0].entryCreatedOn);
        expect(revision1.entryCreatedBy).toEqual(entriesList[0].entryCreatedBy);

        expect(revision1.entryModifiedOn).toBe(revision3.entryModifiedOn);
        expect(revision1.entryModifiedBy).toEqual(revision3.entryModifiedBy);
        expect(revision1.entryModifiedOn).toBe(entriesList[0].entryModifiedOn);
        expect(revision1.entryModifiedBy).toEqual(entriesList[0].entryModifiedBy);

        expect(revision1.entrySavedOn).toBe(revision3.entrySavedOn);
        expect(revision1.entrySavedBy).toEqual(revision3.entrySavedBy);
        expect(revision1.entrySavedOn).toBe(entriesList[0].entrySavedOn);
        expect(revision1.entrySavedBy).toEqual(entriesList[0].entrySavedBy);

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
        let { data: entriesList } = await managerIdentityA.listCategories();

        expect(revision2.entryCreatedOn).toBe(revision3.entryCreatedOn);
        expect(revision2.entryCreatedBy).toEqual(revision3.entryCreatedBy);
        expect(revision2.entryModifiedOn).toBe(revision3.entryModifiedOn);
        expect(revision2.entryModifiedBy).toEqual(revision3.entryModifiedBy);
        expect(revision2.entrySavedOn).toBe(revision3.entrySavedOn);
        expect(revision2.entrySavedBy).toEqual(revision3.entrySavedBy);

        expect(revision2.entryCreatedOn).toBe(entriesList[0].entryCreatedOn);
        expect(revision2.entryCreatedBy).toEqual(entriesList[0].entryCreatedBy);
        expect(revision2.entryModifiedOn).toBe(entriesList[0].entryModifiedOn);
        expect(revision2.entryModifiedBy).toEqual(entriesList[0].entryModifiedBy);
        expect(revision2.entrySavedOn).toBe(entriesList[0].entrySavedOn);
        expect(revision2.entrySavedBy).toEqual(entriesList[0].entrySavedBy);

        // Delete revision 2 and ensure that revision 1's entry-level meta fields are propagated.
        await managerIdentityB.deleteCategory({
            revision: revision2.id
        });

        // Refresh.
        ({ data: revision1 } = await managerIdentityA.getCategory({ revision: revision1.id }));
        ({ data: entriesList } = await managerIdentityA.listCategories());

        expect(revision1.entryCreatedOn).toBe(revision2.entryCreatedOn);
        expect(revision1.entryCreatedBy).toEqual(revision2.entryCreatedBy);
        expect(revision1.entryModifiedOn).toBe(revision2.entryModifiedOn);
        expect(revision1.entryModifiedBy).toEqual(revision2.entryModifiedBy);
        expect(revision1.entrySavedOn).toBe(revision2.entrySavedOn);
        expect(revision1.entrySavedBy).toEqual(revision2.entrySavedBy);

        expect(revision1.entryCreatedOn).toBe(entriesList[0].entryCreatedOn);
        expect(revision1.entryCreatedBy).toEqual(entriesList[0].entryCreatedBy);
        expect(revision1.entryModifiedOn).toBe(entriesList[0].entryModifiedOn);
        expect(revision1.entryModifiedBy).toEqual(entriesList[0].entryModifiedBy);
        expect(revision1.entrySavedOn).toBe(entriesList[0].entrySavedOn);
        expect(revision1.entrySavedBy).toEqual(entriesList[0].entrySavedBy);
    });
});
