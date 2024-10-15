import { SecurityIdentity } from "@webiny/api-security/types";
import { useTestModelHandler } from "~tests/testHelpers/useTestModelHandler";

const identityA: SecurityIdentity = { id: "a", type: "admin", displayName: "A" };
const identityB: SecurityIdentity = { id: "b", type: "admin", displayName: "B" };

describe("Content entries - Entry Meta Fields", () => {
    const { manage: manageApiIdentityA } = useTestModelHandler({
        identity: identityA
    });
    const { manage: manageApiIdentityB } = useTestModelHandler({
        identity: identityB
    });

    beforeEach(async () => {
        await manageApiIdentityA.setup();
    });

    test("created entries should have xOn/xBy meta fields populated correctly", async () => {
        // 1. Initially, all meta fields should be populated, except the "modified" ones.
        //    We must see the same change when listing entries.
        let { data: revision1 } = await manageApiIdentityA.createTestEntry();

        let { data: entriesList } = await manageApiIdentityA.listTestEntries();

        const matchObject1 = {
            revisionCreatedOn: expect.toBeDateString(),
            revisionSavedOn: expect.toBeDateString(),
            revisionModifiedOn: null,
            revisionCreatedBy: identityA,
            revisionSavedBy: identityA,
            revisionModifiedBy: null,
            createdOn: expect.toBeDateString(),
            savedOn: expect.toBeDateString(),
            modifiedOn: null,
            createdBy: identityA,
            savedBy: identityA,
            modifiedBy: null
        };

        expect(revision1).toMatchObject(matchObject1);
        expect(entriesList[0]).toMatchObject(matchObject1);

        // 2. After the entry is updated, "modified" meta fields should be populated.
        //    We must see the same change when listing entries.
        ({ data: revision1 } = await manageApiIdentityA.updateTestEntry({
            revision: revision1.id,
            data: { title: "Fruits 2" }
        }));

        ({ data: entriesList } = await manageApiIdentityA.listTestEntries());

        const matchObject2 = {
            // New fields.
            createdBy: identityA,
            createdOn: revision1.createdOn,
            modifiedBy: identityA,
            modifiedOn: expect.toBeDateString(),
            savedBy: identityA,
            savedOn: expect.toBeDateString(),

            revisionCreatedBy: identityA,
            revisionCreatedOn: revision1.createdOn,
            revisionModifiedBy: identityA,
            revisionModifiedOn: expect.toBeDateString(),
            revisionSavedBy: identityA,
            revisionSavedOn: expect.toBeDateString()
        };

        expect(revision1).toMatchObject(matchObject2);
        expect(entriesList[0]).toMatchObject(matchObject2);

        // 3. A new revision should have updated revision-level meta
        // fields, while entry-level meta fields should remain the same.
        let { data: revision2 } = await manageApiIdentityA.createTestEntryFrom({
            revision: revision1.id
        });

        ({ data: entriesList } = await manageApiIdentityA.listTestEntries());

        const matchObject3 = {
            revisionCreatedOn: expect.toBeDateString(),
            revisionSavedOn: expect.toBeDateString(),

            // Note that these are null, since, on a revision-level, an update has not been made yet.
            revisionModifiedOn: null,

            revisionCreatedBy: identityA,
            revisionSavedBy: identityA,

            // Note that these are null, since, on a revision-level, an update has not been made yet.
            revisionModifiedBy: null,

            createdOn: expect.toBeDateString(),
            savedOn: expect.toBeDateString(),

            // Note that these are not null, since, on an entry-level, an update has been made.
            modifiedOn: expect.toBeDateString(),

            createdBy: identityA,
            savedBy: identityA,

            // Note that these are not null, since, on an entry-level, an update has been made.
            modifiedBy: identityA
        };

        expect(revision2).toMatchObject(matchObject3);
        expect(entriesList[0]).toMatchObject(matchObject3);

        // Refresh.
        ({ data: revision1 } = await manageApiIdentityA.getTestEntry({ revision: revision1.id }));
        ({ data: revision2 } = await manageApiIdentityA.getTestEntry({ revision: revision2.id }));
        ({ data: entriesList } = await manageApiIdentityA.listTestEntries());

        // Revision-level meta fields should be updated.
        expect(revision2.revisionCreatedOn > revision1.revisionCreatedOn).toBe(true);
        expect(entriesList[0].revisionCreatedOn > revision1.revisionCreatedOn).toBe(true);

        // Entry-level `createdOn` meta field should remain the same.
        expect(revision2.createdOn).toBe(revision1.createdOn);
        expect(entriesList[0].createdOn).toBe(revision1.createdOn);

        // Entry-level `savedOn` and `modifiedOn` meta fields should change.
        // It is true that previous revision's entry-level fields are not updated, but that's
        // fine. When updating entry-level meta fields, we only care about latest revisions.
        expect(revision2.savedOn > revision1.savedOn).toBe(true);
        expect(revision2.modifiedOn > revision1.modifiedOn).toBe(true);
        expect(entriesList[0].savedOn > revision1.savedOn).toBe(true);
        expect(entriesList[0].modifiedOn > revision1.modifiedOn).toBe(true);
    });

    test("updating a previous revision should update entry-level meta fields", async () => {
        let { data: revision1 } = await manageApiIdentityA.createTestEntry();

        let { data: revision2 } = await manageApiIdentityA.createTestEntryFrom({
            revision: revision1.id
        });

        let { data: revision3 } = await manageApiIdentityA.createTestEntryFrom({
            revision: revision2.id
        });

        await manageApiIdentityB.updateTestEntry({
            revision: revision1.id,
            data: { title: "Fruits Update" }
        });

        // Refresh.
        ({ data: revision1 } = await manageApiIdentityA.getTestEntry({ revision: revision1.id }));
        ({ data: revision2 } = await manageApiIdentityA.getTestEntry({ revision: revision2.id }));
        ({ data: revision3 } = await manageApiIdentityA.getTestEntry({ revision: revision3.id }));

        const { data: entriesList } = await manageApiIdentityA.listTestEntries();

        // Revision 1 and 3's entry-level meta fields should be in sync.
        // Since listing entries uses the "latest record", we must see the same change there.
        expect(revision1.createdOn).toBe(revision3.createdOn);
        expect(revision1.createdBy).toEqual(revision3.createdBy);
        expect(revision1.createdOn).toEqual(entriesList[0].createdOn);
        expect(revision1.createdBy).toEqual(entriesList[0].createdBy);

        expect(revision1.modifiedOn).toBe(revision3.modifiedOn);
        expect(revision1.modifiedBy).toEqual(revision3.modifiedBy);
        expect(revision1.modifiedOn).toBe(entriesList[0].modifiedOn);
        expect(revision1.modifiedBy).toEqual(entriesList[0].modifiedBy);

        expect(revision1.savedOn).toBe(revision3.savedOn);
        expect(revision1.savedBy).toEqual(revision3.savedBy);
        expect(revision1.savedOn).toBe(entriesList[0].savedOn);
        expect(revision1.savedBy).toEqual(entriesList[0].savedBy);

        // Except for createdOn/createdBy, revision 2's entry-level meta fields should
        // not be in sync. This is fine because we only care about latest revisions.
        expect(revision2.createdOn).toBe(revision3.createdOn);
        expect(revision2.createdBy).toEqual(revision3.createdBy);

        expect(revision2.modifiedOn).not.toBe(revision3.modifiedOn);
        expect(revision2.modifiedBy).not.toEqual(revision3.modifiedBy);

        expect(revision2.savedOn).not.toBe(revision3.savedOn);
        expect(revision2.savedBy).not.toEqual(revision3.savedBy);
    });

    test("deleting latest revision should cause the entry-level meta field values to be propagated to the new latest revision", async () => {
        let { data: revision1 } = await manageApiIdentityA.createTestEntry();

        const { title, slug } = revision1;

        let { data: revision2 } = await manageApiIdentityA.createTestEntryFrom({
            revision: revision1.id
        });

        const { data: revision3 } = await manageApiIdentityA.createTestEntryFrom({
            revision: revision2.id
        });

        // Delete revision 3 and ensure that revision 2's entry-level meta fields are propagated.
        await manageApiIdentityB.deleteTestEntry({
            revision: revision3.id
        });

        // Refresh.
        ({ data: revision2 } = await manageApiIdentityA.getTestEntry({ revision: revision2.id }));
        let { data: entriesList } = await manageApiIdentityA.listTestEntries();

        expect(revision2.createdOn).toBe(revision3.createdOn);
        expect(revision2.createdBy).toEqual(revision3.createdBy);
        expect(revision2.modifiedOn).toBe(revision3.modifiedOn);
        expect(revision2.modifiedBy).toEqual(revision3.modifiedBy);
        expect(revision2.savedOn).toBe(revision3.savedOn);
        expect(revision2.savedBy).toEqual(revision3.savedBy);

        expect(revision2.createdOn).toBe(entriesList[0].createdOn);
        expect(revision2.createdBy).toEqual(entriesList[0].createdBy);
        expect(revision2.modifiedOn).toBe(entriesList[0].modifiedOn);
        expect(revision2.modifiedBy).toEqual(entriesList[0].modifiedBy);
        expect(revision2.savedOn).toBe(entriesList[0].savedOn);
        expect(revision2.savedBy).toEqual(entriesList[0].savedBy);

        expect(revision2.title).toBe(title);
        expect(revision2.slug).toBe(slug);

        // Delete revision 2 and ensure that revision 1's entry-level meta fields are propagated.
        await manageApiIdentityB.deleteTestEntry({
            revision: revision2.id
        });

        // Refresh.
        ({ data: revision1 } = await manageApiIdentityA.getTestEntry({ revision: revision1.id }));
        ({ data: entriesList } = await manageApiIdentityA.listTestEntries());

        expect(revision1.createdOn).toBe(revision2.createdOn);
        expect(revision1.createdBy).toEqual(revision2.createdBy);
        expect(revision1.modifiedOn).toBe(revision2.modifiedOn);
        expect(revision1.modifiedBy).toEqual(revision2.modifiedBy);
        expect(revision1.savedOn).toBe(revision2.savedOn);
        expect(revision1.savedBy).toEqual(revision2.savedBy);

        expect(revision1.createdOn).toBe(entriesList[0].createdOn);
        expect(revision1.createdBy).toEqual(entriesList[0].createdBy);
        expect(revision1.modifiedOn).toBe(entriesList[0].modifiedOn);
        expect(revision1.modifiedBy).toEqual(entriesList[0].modifiedBy);
        expect(revision1.savedOn).toBe(entriesList[0].savedOn);
        expect(revision1.savedBy).toEqual(entriesList[0].savedBy);

        expect(revision1.title).toBe(title);
        expect(revision1.slug).toBe(slug);
    });
});
