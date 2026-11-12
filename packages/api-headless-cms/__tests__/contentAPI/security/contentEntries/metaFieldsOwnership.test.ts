import { describe, expect, it } from "vitest";
import { useTestModelHandler } from "~tests/testHelpers/useTestModelHandler";
import { CmsTestPermissions, identityA, identityB } from "../utils";

/**
 * Read all entries, but write only own entries (two roles).
 */
const createReadAllWriteOwnPermissions = () => {
    const readAll = new CmsTestPermissions({
        groups: { rwd: "r" },
        models: { rwd: "r" },
        entries: { rwd: "r" }
    });
    const writeOwn = new CmsTestPermissions({
        groups: { rwd: "r" },
        models: { rwd: "r" },
        entries: { rwd: "rw", own: true, pw: "pu" }
    });
    return [...readAll.getPermissions(), ...writeOwn.getPermissions()];
};

describe("Entry meta fields and ownership", () => {
    const setup = async () => {
        const { manage: manageApiA } = useTestModelHandler({ identity: identityA });
        await manageApiA.setup();

        const { manage: manageApiB } = useTestModelHandler({
            identity: identityB,
            permissions: createReadAllWriteOwnPermissions()
        });

        const entryA = await manageApiA.createTestEntry();
        expect(entryA.error).toBeNull();

        return { manageApiA, manageApiB, entryA: entryA.data };
    };

    it("should not allow taking over an entry of another user by updating createdBy", async () => {
        const { manageApiA, manageApiB, entryA } = await setup();

        const result = await manageApiB.updateTestEntry({
            variables: {
                revision: entryA.id,
                data: {
                    createdBy: identityB,
                    values: { title: "Taken over" }
                }
            }
        });
        expect(result.data).toBeNull();
        expect(result.error).toMatchObject({ code: "Cms/Entry/NotAuthorized" });

        const entry = await manageApiA.getTestEntry({ variables: { revision: entryA.id } });
        expect(entry.data.createdBy).toMatchObject({ id: identityA.id });
        expect(entry.data.values.title).not.toEqual("Taken over");
    });

    it("should not allow taking over an entry of another user by creating a revision with createdBy", async () => {
        const { manageApiA, manageApiB, entryA } = await setup();

        const result = await manageApiB.createTestEntryFrom({
            variables: {
                revision: entryA.id,
                data: {
                    createdBy: identityB,
                    values: { title: entryA.title }
                }
            }
        });
        expect(result.data).toBeNull();
        expect(result.error).toMatchObject({ code: "Cms/Entry/NotAuthorized" });

        const entry = await manageApiA.getTestEntry({ variables: { entryId: entryA.entryId } });
        expect(entry.data.id).toEqual(entryA.id);
        expect(entry.data.createdBy).toMatchObject({ id: identityA.id });
    });

    it("should ignore meta field overrides from an identity limited to its own entries", async () => {
        const { manageApiB } = await setup();

        const testDate = new Date("2020-01-01T00:00:00.000Z").toISOString();

        const entryB = await manageApiB.createTestEntry();
        expect(entryB.error).toBeNull();

        const updated = await manageApiB.updateTestEntry({
            variables: {
                revision: entryB.data.id,
                data: {
                    createdBy: identityA,
                    savedBy: identityA,
                    modifiedBy: identityA,
                    createdOn: testDate,
                    values: { title: "Own update" }
                }
            }
        });
        expect(updated.error).toBeNull();
        expect(updated.data).toMatchObject({
            values: { title: "Own update" },
            createdBy: { id: identityB.id },
            savedBy: { id: identityB.id },
            modifiedBy: { id: identityB.id }
        });
        expect(updated.data.createdOn).not.toEqual(testDate);

        const revision = await manageApiB.createTestEntryFrom({
            variables: {
                revision: entryB.data.id,
                data: {
                    createdBy: identityA,
                    revisionCreatedBy: identityA,
                    values: { title: "Own revision" }
                }
            }
        });
        expect(revision.error).toBeNull();
        expect(revision.data).toMatchObject({
            createdBy: { id: identityB.id },
            revisionCreatedBy: { id: identityB.id }
        });
    });

    it("should still allow meta field overrides for an identity which can write all entries", async () => {
        const { manageApiA, entryA } = await setup();

        const updated = await manageApiA.updateTestEntry({
            variables: {
                revision: entryA.id,
                data: {
                    createdBy: identityB,
                    values: { title: "Handed over" }
                }
            }
        });
        expect(updated.error).toBeNull();
        expect(updated.data.createdBy).toMatchObject({ id: identityB.id });
    });
});
