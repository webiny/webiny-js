import { beforeEach, describe, expect, it } from "vitest";
import { useTestModelHandler } from "~tests/testHelpers/useTestModelHandler";
import { IdentityData } from "@webiny/api-core/features/security/IdentityContext/index.js";

/**
 * Publishing, unpublishing and republishing only change the publishing state of an entry.
 * They are not content modifications, so they must not touch the saved/modified meta fields,
 * neither on the revision being (un)published nor on the latest revision.
 *
 * Identity A creates and edits entries, identity B (un)publishes them. That way, a publishing
 * action that incorrectly bumps the saved/modified fields shows up as identity B and a newer date.
 */
const identityA: IdentityData = { id: "a", type: "admin", displayName: "A" };
const identityB: IdentityData = { id: "b", type: "admin", displayName: "B" };

type Entry = Record<string, any>;

const pickEntryLevelSavedFields = (entry: Entry) => ({
    savedOn: entry.savedOn,
    savedBy: entry.savedBy,
    modifiedOn: entry.modifiedOn,
    modifiedBy: entry.modifiedBy
});

const pickRevisionLevelSavedFields = (entry: Entry) => ({
    revisionSavedOn: entry.revisionSavedOn,
    revisionSavedBy: entry.revisionSavedBy,
    revisionModifiedOn: entry.revisionModifiedOn,
    revisionModifiedBy: entry.revisionModifiedBy
});

describe("Content Entries - Publishing does not change saved/modified meta fields", () => {
    const { manage: manageA } = useTestModelHandler({ identity: identityA });
    const { manage: manageB } = useTestModelHandler({ identity: identityB });

    beforeEach(async () => {
        await manageA.setup();
    });

    const getRevision = async (id: string): Promise<Entry> => {
        const { data, error } = await manageA.getTestEntry({ variables: { revision: id } });
        expect(error).toBeNull();
        return data;
    };

    const getLatestFromList = async (entryId: string): Promise<Entry> => {
        const { data } = await manageA.listTestEntries();
        const entry = data.find((item: Entry) => item.entryId === entryId);
        expect(entry).toBeDefined();
        return entry;
    };

    const createEditedEntry = async (): Promise<Entry> => {
        const { data: created } = await manageA.createTestEntry();
        const { data: updated, error } = await manageA.updateTestEntry({
            variables: {
                revision: created.id,
                data: { values: { title: "Edited", slug: created.values.slug } }
            }
        });
        expect(error).toBeNull();
        return updated;
    };

    const createEditedRevisionFrom = async (revisionId: string): Promise<Entry> => {
        const { data: created, error: createError } = await manageA.createTestEntryFrom({
            variables: { revision: revisionId }
        });
        expect(createError).toBeNull();
        const { data: updated, error } = await manageA.updateTestEntry({
            variables: {
                revision: created.id,
                data: { values: { title: "Edited again", slug: created.values.slug } }
            }
        });
        expect(error).toBeNull();
        return updated;
    };

    /**
     * Asserts that both the revision itself (via get) and the entry in the list (latest revision)
     * still carry the given saved/modified values.
     */
    const expectLatestUnchanged = async (latestBefore: Entry) => {
        const latestAfter = await getRevision(latestBefore.id);
        const listedAfter = await getLatestFromList(latestBefore.entryId);

        expect(pickEntryLevelSavedFields(latestAfter)).toEqual(
            pickEntryLevelSavedFields(latestBefore)
        );
        expect(pickRevisionLevelSavedFields(latestAfter)).toEqual(
            pickRevisionLevelSavedFields(latestBefore)
        );
        expect(listedAfter.id).toBe(latestBefore.id);
        expect(pickEntryLevelSavedFields(listedAfter)).toEqual(
            pickEntryLevelSavedFields(latestBefore)
        );
    };

    describe("publish", () => {
        it("should not change saved/modified fields when publishing the latest revision", async () => {
            const before = await createEditedEntry();
            expect(before.modifiedOn).toBeDateString();

            const { data: published, error } = await manageB.publishTestEntry({
                variables: { revision: before.id }
            });
            expect(error).toBeNull();

            // The mutation response reflects the stored entry.
            expect(pickEntryLevelSavedFields(published)).toEqual(pickEntryLevelSavedFields(before));
            expect(pickRevisionLevelSavedFields(published)).toEqual(
                pickRevisionLevelSavedFields(before)
            );

            await expectLatestUnchanged(before);

            // Publishing fields are still set as before.
            expect(published).toMatchObject({
                lastPublishedOn: expect.toBeDateString(),
                lastPublishedBy: identityB,
                revisionLastPublishedOn: expect.toBeDateString(),
                revisionLastPublishedBy: identityB
            });
        });

        it("should keep modified fields empty when publishing a never-edited entry", async () => {
            const { data: created } = await manageA.createTestEntry();
            expect(created.modifiedOn).toBeNull();

            const { data: published, error } = await manageB.publishTestEntry({
                variables: { revision: created.id }
            });
            expect(error).toBeNull();

            expect(published).toMatchObject({
                modifiedOn: null,
                modifiedBy: null,
                revisionModifiedOn: null,
                revisionModifiedBy: null,
                savedOn: created.savedOn,
                savedBy: identityA
            });
        });

        it("should not move the latest revision's saved/modified fields back when publishing an older revision", async () => {
            const rev1 = await createEditedEntry();
            const rev2 = await createEditedRevisionFrom(rev1.id);

            // The latest revision was edited after revision 1, so its entry-level values are newer.
            expect(rev2.savedOn > rev1.savedOn).toBe(true);

            const { error } = await manageB.publishTestEntry({
                variables: { revision: rev1.id }
            });
            expect(error).toBeNull();

            await expectLatestUnchanged(rev2);

            // Revision 1 keeps its own revision-level values...
            const rev1After = await getRevision(rev1.id);
            expect(pickRevisionLevelSavedFields(rev1After)).toEqual(
                pickRevisionLevelSavedFields(rev1)
            );
            // ...and carries the entry-level values of the entry, which come from the latest revision.
            expect(pickEntryLevelSavedFields(rev1After)).toEqual(pickEntryLevelSavedFields(rev2));
        });
    });

    describe("unpublish", () => {
        it("should not change saved/modified fields when unpublishing the latest revision", async () => {
            const before = await createEditedEntry();
            const { error: publishError } = await manageB.publishTestEntry({
                variables: { revision: before.id }
            });
            expect(publishError).toBeNull();

            const { data: unpublished, error } = await manageB.unpublishTestEntry({
                variables: { revision: before.id }
            });
            expect(error).toBeNull();

            expect(pickEntryLevelSavedFields(unpublished)).toEqual(
                pickEntryLevelSavedFields(before)
            );
            expect(pickRevisionLevelSavedFields(unpublished)).toEqual(
                pickRevisionLevelSavedFields(before)
            );

            await expectLatestUnchanged(before);
        });

        it("should not move the latest revision's saved/modified fields back when unpublishing an older revision", async () => {
            const rev1 = await createEditedEntry();
            const { error: publishError } = await manageB.publishTestEntry({
                variables: { revision: rev1.id }
            });
            expect(publishError).toBeNull();

            const rev2 = await createEditedRevisionFrom(rev1.id);
            expect(rev2.savedOn > rev1.savedOn).toBe(true);

            const { error } = await manageB.unpublishTestEntry({
                variables: { revision: rev1.id }
            });
            expect(error).toBeNull();

            await expectLatestUnchanged(rev2);

            const rev1After = await getRevision(rev1.id);
            expect(pickRevisionLevelSavedFields(rev1After)).toEqual(
                pickRevisionLevelSavedFields(rev1)
            );
        });
    });

    describe("republish", () => {
        it("should not change saved/modified fields when republishing the latest revision", async () => {
            const before = await createEditedEntry();
            const { error: publishError } = await manageB.publishTestEntry({
                variables: { revision: before.id }
            });
            expect(publishError).toBeNull();

            const { data: republished, error } = await manageB.republishTestEntry({
                variables: { revision: before.id }
            });
            expect(error).toBeNull();

            expect(pickEntryLevelSavedFields(republished)).toEqual(
                pickEntryLevelSavedFields(before)
            );
            expect(pickRevisionLevelSavedFields(republished)).toEqual(
                pickRevisionLevelSavedFields(before)
            );

            await expectLatestUnchanged(before);
        });

        it("should not move the latest revision's saved/modified fields back when republishing an older revision", async () => {
            const rev1 = await createEditedEntry();
            const { error: publishError } = await manageB.publishTestEntry({
                variables: { revision: rev1.id }
            });
            expect(publishError).toBeNull();

            const rev2 = await createEditedRevisionFrom(rev1.id);
            expect(rev2.savedOn > rev1.savedOn).toBe(true);

            const { error } = await manageB.republishTestEntry({
                variables: { revision: rev1.id }
            });
            expect(error).toBeNull();

            await expectLatestUnchanged(rev2);

            const rev1After = await getRevision(rev1.id);
            expect(rev1After.meta.status).toBe("published");
            expect(pickRevisionLevelSavedFields(rev1After)).toEqual(
                pickRevisionLevelSavedFields(rev1)
            );
        });
    });

    /**
     * Saving without changing the content (e.g. clicking "Save" in the entry form, which always
     * sends all values) is not a modification either.
     */
    const waitForClockTick = () => new Promise(resolve => setTimeout(resolve, 5));

    const expectBumpedBy = (entry: Entry, before: Entry, identity: IdentityData) => {
        expect(entry.savedOn > before.savedOn).toBe(true);
        expect(entry.modifiedOn > (before.modifiedOn || "")).toBe(true);
        expect(entry.savedBy).toEqual(identity);
        expect(entry.modifiedBy).toEqual(identity);
    };

    describe("update", () => {
        it("should not change saved/modified fields when saving identical values", async () => {
            const before = await createEditedEntry();
            await waitForClockTick();

            const { data: updated, error } = await manageB.updateTestEntry({
                variables: {
                    revision: before.id,
                    data: { values: { title: before.values.title, slug: before.values.slug } }
                }
            });
            expect(error).toBeNull();

            expect(pickEntryLevelSavedFields(updated)).toEqual(pickEntryLevelSavedFields(before));
            expect(pickRevisionLevelSavedFields(updated)).toEqual(
                pickRevisionLevelSavedFields(before)
            );
            await expectLatestUnchanged(before);
        });

        it("should update saved/modified fields when a value changes", async () => {
            const before = await createEditedEntry();
            await waitForClockTick();

            const { data: updated, error } = await manageB.updateTestEntry({
                variables: {
                    revision: before.id,
                    data: { values: { title: "Changed", slug: before.values.slug } }
                }
            });
            expect(error).toBeNull();

            expectBumpedBy(updated, before, identityB);
            expect(updated.revisionSavedOn > before.revisionSavedOn).toBe(true);
            expect(updated.revisionModifiedBy).toEqual(identityB);
        });

        it("should not change saved/modified fields when only the folder changes", async () => {
            const before = await createEditedEntry();
            await waitForClockTick();

            const { data: updated, error } = await manageB.updateTestEntry({
                variables: {
                    revision: before.id,
                    data: {
                        values: { title: before.values.title, slug: before.values.slug },
                        wbyAco_location: { folderId: "another-folder" }
                    } as any
                }
            });
            expect(error).toBeNull();

            // Moving to another folder is not a content change, same as the dedicated move operation.
            expect(updated.wbyAco_location.folderId).toBe("another-folder");
            expect(pickEntryLevelSavedFields(updated)).toEqual(pickEntryLevelSavedFields(before));
            expect(pickRevisionLevelSavedFields(updated)).toEqual(
                pickRevisionLevelSavedFields(before)
            );
        });

        it("should not move the latest revision's saved/modified fields back when saving an older draft without changes", async () => {
            const rev1 = await createEditedEntry();
            const rev2 = await createEditedRevisionFrom(rev1.id);
            await waitForClockTick();

            const { error } = await manageB.updateTestEntry({
                variables: {
                    revision: rev1.id,
                    data: { values: { title: rev1.values.title, slug: rev1.values.slug } }
                }
            });
            expect(error).toBeNull();

            await expectLatestUnchanged(rev2);

            const rev1After = await getRevision(rev1.id);
            expect(pickRevisionLevelSavedFields(rev1After)).toEqual(
                pickRevisionLevelSavedFields(rev1)
            );
        });
    });

    describe("create revision from", () => {
        it("should not change entry-level saved/modified fields when no data is passed", async () => {
            const before = await createEditedEntry();
            await waitForClockTick();

            const { data: rev2, error } = await manageB.createTestEntryFrom({
                variables: { revision: before.id }
            });
            expect(error).toBeNull();

            expect(pickEntryLevelSavedFields(rev2)).toEqual(pickEntryLevelSavedFields(before));
            // The new revision itself is created now, by identity B.
            expect(rev2.revisionCreatedOn > before.revisionSavedOn).toBe(true);
            expect(rev2.revisionCreatedBy).toEqual(identityB);
            expect(rev2.revisionModifiedOn).toBeNull();

            const listed = await getLatestFromList(before.entryId);
            expect(listed.id).toBe(rev2.id);
            expect(pickEntryLevelSavedFields(listed)).toEqual(pickEntryLevelSavedFields(before));
        });

        it("should not change entry-level saved/modified fields when identical values are passed", async () => {
            const before = await createEditedEntry();
            await waitForClockTick();

            const { data: rev2, error } = await manageB.createTestEntryFrom({
                variables: {
                    revision: before.id,
                    data: { values: { title: before.values.title, slug: before.values.slug } }
                }
            });
            expect(error).toBeNull();

            expect(pickEntryLevelSavedFields(rev2)).toEqual(pickEntryLevelSavedFields(before));
        });

        it("should update entry-level saved/modified fields when a value changes", async () => {
            const before = await createEditedEntry();
            await waitForClockTick();

            const { data: rev2, error } = await manageB.createTestEntryFrom({
                variables: {
                    revision: before.id,
                    data: { values: { title: "Changed", slug: before.values.slug } }
                }
            });
            expect(error).toBeNull();

            expectBumpedBy(rev2, before, identityB);
        });

        it("should update entry-level saved/modified fields when reverting to an older revision", async () => {
            const rev1 = await createEditedEntry();
            const rev2 = await createEditedRevisionFrom(rev1.id);
            await waitForClockTick();

            // Revision 1 has different values than the latest revision 2, so this changes the content.
            const { data: rev3, error } = await manageB.createTestEntryFrom({
                variables: { revision: rev1.id }
            });
            expect(error).toBeNull();

            expect(rev3.values.title).toBe(rev1.values.title);
            expectBumpedBy(rev3, rev2, identityB);
        });
    });
});
