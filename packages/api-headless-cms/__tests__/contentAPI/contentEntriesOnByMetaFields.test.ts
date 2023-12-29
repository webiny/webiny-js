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
            createdOn: expect.toBeDateString(),
            createdBy: identityA,
            modifiedBy: null,
            ownedBy: identityA,
            savedOn: expect.toBeDateString(),
            meta: {
                revisionCreatedOn: expect.toBeDateString(),
                revisionSavedOn: expect.toBeDateString(),
                revisionModifiedOn: null,
                revisionCreatedBy: identityA,
                revisionSavedBy: identityA,
                revisionModifiedBy: null,
                entryCreatedOn: expect.toBeDateString(),
                entrySavedOn: expect.toBeDateString(),
                entryModifiedOn: null,
                entryCreatedBy: identityA,
                entrySavedBy: identityA,
                entryModifiedBy: null
            }
        };

        expect(revision1).toMatchObject(matchObject1);
        expect(entriesList[0]).toMatchObject(matchObject1);

        // 2. After the entry is updated, "modified" meta fields should be populated.
        //    We must see the same change when listing entries.
        ({ data: revision1 } = await manageApiIdentityA.updateTestEntry({
            revision: revision1.id,
            data: { title: "UPDATE" }
        }));

        ({ data: entriesList } = await manageApiIdentityA.listTestEntries());

        const matchObject2 = {
            // Deprecated fields.
            createdBy: identityA,
            createdOn: revision1.createdOn,
            modifiedBy: identityA,
            ownedBy: identityA,
            savedOn: expect.toBeDateString(),

            // New fields.
            meta: {
                entryCreatedBy: identityA,
                entryCreatedOn: revision1.meta.entryCreatedOn,
                entryModifiedBy: identityA,
                entryModifiedOn: expect.toBeDateString(),
                entrySavedBy: identityA,
                entrySavedOn: expect.toBeDateString(),

                revisionCreatedBy: identityA,
                revisionCreatedOn: revision1.meta.revisionCreatedOn,
                revisionModifiedBy: identityA,
                revisionModifiedOn: expect.toBeDateString(),
                revisionSavedBy: identityA,
                revisionSavedOn: expect.toBeDateString()
            }
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
            createdOn: expect.toBeDateString(),
            createdBy: identityA,
            modifiedBy: null,
            ownedBy: identityA,
            savedOn: expect.toBeDateString(),
            meta: {
                revisionCreatedOn: expect.toBeDateString(),
                revisionSavedOn: expect.toBeDateString(),

                // Note that these are null, since, on a revision-level, an update has not been made yet.
                revisionModifiedOn: null,

                revisionCreatedBy: identityA,
                revisionSavedBy: identityA,

                // Note that these are null, since, on a revision-level, an update has not been made yet.
                revisionModifiedBy: null,

                entryCreatedOn: expect.toBeDateString(),
                entrySavedOn: expect.toBeDateString(),

                // Note that these are not null, since, on an entry-level, an update has been made.
                entryModifiedOn: expect.toBeDateString(),

                entryCreatedBy: identityA,
                entrySavedBy: identityA,

                // Note that these are not null, since, on an entry-level, an update has been made.
                entryModifiedBy: identityA
            }
        };

        expect(revision2).toMatchObject(matchObject3);
        expect(entriesList[0]).toMatchObject(matchObject3);

        // Refresh.
        ({ data: revision1 } = await manageApiIdentityA.getTestEntry({ revision: revision1.id }));
        ({ data: revision2 } = await manageApiIdentityA.getTestEntry({ revision: revision2.id }));
        ({ data: entriesList } = await manageApiIdentityA.listTestEntries());

        // Revision-level meta fields should be updated.
        expect(revision2.meta.revisionCreatedOn > revision1.meta.revisionCreatedOn).toBe(true);
        expect(entriesList[0].meta.revisionCreatedOn > revision1.meta.revisionCreatedOn).toBe(true);

        // Entry-level `createdOn` meta field should remain the same.
        expect(revision2.meta.entryCreatedOn).toBe(revision1.meta.entryCreatedOn);
        expect(entriesList[0].meta.entryCreatedOn).toBe(revision1.meta.entryCreatedOn);

        // Entry-level `savedOn` and `modifiedOn` meta fields should change.
        // It is true that previous revision's entry-level fields are not updated, but that's
        // fine. When updating entry-level meta fields, we only care about latest revisions.
        expect(revision2.meta.entrySavedOn > revision1.meta.entrySavedOn).toBe(true);
        expect(revision2.meta.entryModifiedOn > revision1.meta.entryModifiedOn).toBe(true);
        expect(entriesList[0].meta.entrySavedOn > revision1.meta.entrySavedOn).toBe(true);
        expect(entriesList[0].meta.entryModifiedOn > revision1.meta.entryModifiedOn).toBe(true);
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
            data: { title: "UPDATE" }
        });

        // Refresh.
        ({ data: revision1 } = await manageApiIdentityA.getTestEntry({ revision: revision1.id }));
        ({ data: revision2 } = await manageApiIdentityA.getTestEntry({ revision: revision2.id }));
        ({ data: revision3 } = await manageApiIdentityA.getTestEntry({ revision: revision3.id }));

        const { data: entriesList } = await manageApiIdentityA.listTestEntries();

        // Revision 1 and 3's entry-level meta fields should be in sync.
        // Since listing entries uses the "latest record", we must see the same change there.
        expect(revision1.meta.entryCreatedOn).toBe(revision3.meta.entryCreatedOn);
        expect(revision1.meta.entryCreatedBy).toEqual(revision3.meta.entryCreatedBy);
        expect(revision1.meta.entryCreatedOn).toEqual(entriesList[0].meta.entryCreatedOn);
        expect(revision1.meta.entryCreatedBy).toEqual(entriesList[0].meta.entryCreatedBy);

        expect(revision1.meta.entryModifiedOn).toBe(revision3.meta.entryModifiedOn);
        expect(revision1.meta.entryModifiedBy).toEqual(revision3.meta.entryModifiedBy);
        expect(revision1.meta.entryModifiedOn).toBe(entriesList[0].meta.entryModifiedOn);
        expect(revision1.meta.entryModifiedBy).toEqual(entriesList[0].meta.entryModifiedBy);

        expect(revision1.meta.entrySavedOn).toBe(revision3.meta.entrySavedOn);
        expect(revision1.meta.entrySavedBy).toEqual(revision3.meta.entrySavedBy);
        expect(revision1.meta.entrySavedOn).toBe(entriesList[0].meta.entrySavedOn);
        expect(revision1.meta.entrySavedBy).toEqual(entriesList[0].meta.entrySavedBy);

        // Except for createdOn/createdBy, revision 2's entry-level meta fields should
        // not be in sync. This is fine because we only care about latest revisions.
        expect(revision2.meta.entryCreatedOn).toBe(revision3.meta.entryCreatedOn);
        expect(revision2.meta.entryCreatedBy).toEqual(revision3.meta.entryCreatedBy);

        expect(revision2.meta.entryModifiedOn).not.toBe(revision3.meta.entryModifiedOn);
        expect(revision2.meta.entryModifiedBy).not.toEqual(revision3.meta.entryModifiedBy);

        expect(revision2.meta.entrySavedOn).not.toBe(revision3.meta.entrySavedOn);
        expect(revision2.meta.entrySavedBy).not.toEqual(revision3.meta.entrySavedBy);
    });

    test("deleting latest revision should cause the entry-level meta field values to be propagated to the new latest revision", async () => {
        let { data: revision1 } = await manageApiIdentityA.createTestEntry();

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

        expect(revision2.meta.entryCreatedOn).toBe(revision3.meta.entryCreatedOn);
        expect(revision2.meta.entryCreatedBy).toEqual(revision3.meta.entryCreatedBy);
        expect(revision2.meta.entryModifiedOn).toBe(revision3.meta.entryModifiedOn);
        expect(revision2.meta.entryModifiedBy).toEqual(revision3.meta.entryModifiedBy);
        expect(revision2.meta.entrySavedOn).toBe(revision3.meta.entrySavedOn);
        expect(revision2.meta.entrySavedBy).toEqual(revision3.meta.entrySavedBy);

        expect(revision2.meta.entryCreatedOn).toBe(entriesList[0].meta.entryCreatedOn);
        expect(revision2.meta.entryCreatedBy).toEqual(entriesList[0].meta.entryCreatedBy);
        expect(revision2.meta.entryModifiedOn).toBe(entriesList[0].meta.entryModifiedOn);
        expect(revision2.meta.entryModifiedBy).toEqual(entriesList[0].meta.entryModifiedBy);
        expect(revision2.meta.entrySavedOn).toBe(entriesList[0].meta.entrySavedOn);
        expect(revision2.meta.entrySavedBy).toEqual(entriesList[0].meta.entrySavedBy);

        // Delete revision 2 and ensure that revision 1's entry-level meta fields are propagated.
        await manageApiIdentityB.deleteTestEntry({
            revision: revision2.id
        });

        // Refresh.
        ({ data: revision1 } = await manageApiIdentityA.getTestEntry({ revision: revision1.id }));
        ({ data: entriesList } = await manageApiIdentityA.listTestEntries());

        expect(revision1.meta.entryCreatedOn).toBe(revision2.meta.entryCreatedOn);
        expect(revision1.meta.entryCreatedBy).toEqual(revision2.meta.entryCreatedBy);
        expect(revision1.meta.entryModifiedOn).toBe(revision2.meta.entryModifiedOn);
        expect(revision1.meta.entryModifiedBy).toEqual(revision2.meta.entryModifiedBy);
        expect(revision1.meta.entrySavedOn).toBe(revision2.meta.entrySavedOn);
        expect(revision1.meta.entrySavedBy).toEqual(revision2.meta.entrySavedBy);

        expect(revision1.meta.entryCreatedOn).toBe(entriesList[0].meta.entryCreatedOn);
        expect(revision1.meta.entryCreatedBy).toEqual(entriesList[0].meta.entryCreatedBy);
        expect(revision1.meta.entryModifiedOn).toBe(entriesList[0].meta.entryModifiedOn);
        expect(revision1.meta.entryModifiedBy).toEqual(entriesList[0].meta.entryModifiedBy);
        expect(revision1.meta.entrySavedOn).toBe(entriesList[0].meta.entrySavedOn);
        expect(revision1.meta.entrySavedBy).toEqual(entriesList[0].meta.entrySavedBy);
    });
});
