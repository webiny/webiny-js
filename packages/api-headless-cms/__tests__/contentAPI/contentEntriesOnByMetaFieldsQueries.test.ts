import { useTestModelHandler } from "~tests/testHelpers/useTestModelHandler";
import { SecurityIdentity } from "@webiny/api-security/types";

const identityA: SecurityIdentity = { id: "a", type: "admin", displayName: "A" };
const identityB: SecurityIdentity = { id: "b", type: "admin", displayName: "B" };

describe("Content entries - Entry Meta Fields Queries", () => {
    const { manage: manageApiIdentityA, read: readApiIdentityA } = useTestModelHandler({
        identity: identityA
    });

    const { manage: manageApiIdentityB, read: readApiIdentityB } = useTestModelHandler({
        identity: identityB
    });

    const testEntries: Record<string, any>[] = [];

    beforeEach(async () => {
        await manageApiIdentityA.setup();

        testEntries.length = 0;
        for (let i = 1; i <= 4; i++) {
            // Use identity A for odd entries and identity B for even entries.
            const manager = i % 2 !== 0 ? manageApiIdentityA : manageApiIdentityB;
            const { data: testEntry } = await manager.createTestEntry({
                // Immediately publish so that we can do tests with READ API.
                data: { status: "published" }
            });
            testEntries.push(testEntry);
        }
    });

    test("should be able to sort by revision-level meta fields", async () => {
        const [testEntry1, testEntry2, testEntry3, testEntry4] = testEntries;

        // Sorting by `revisionCreatedOn` should return entries sorted by the `revisionCreatedOn` field.
        const matchObject1 = {
            data: [
                { id: testEntry4.id },
                { id: testEntry3.id },
                { id: testEntry2.id },
                { id: testEntry1.id }
            ]
        };

        const revisionCreatedOnDescVariables = { sort: ["revisionCreatedOn_DESC"] };

        const entriesListByCreatedOnDescManageApi = await manageApiIdentityA.listTestEntries(
            revisionCreatedOnDescVariables
        );

        const entriesListByCreatedOnDescReadApi = await readApiIdentityA.listTestEntries(
            revisionCreatedOnDescVariables
        );

        expect(entriesListByCreatedOnDescManageApi).toMatchObject(matchObject1);
        expect(entriesListByCreatedOnDescReadApi).toMatchObject(matchObject1);

        // Ascending order.
        const matchObject2 = {
            data: [
                { id: testEntry1.id },
                { id: testEntry2.id },
                { id: testEntry3.id },
                { id: testEntry4.id }
            ]
        };

        const revisionCreatedOnAscVariables = { sort: ["revisionCreatedOn_ASC"] };

        const entriesListByCreatedOnAscManageApi = await manageApiIdentityA.listTestEntries(
            revisionCreatedOnAscVariables
        );

        const entriesListByCreatedOnAscReadApi = await readApiIdentityA.listTestEntries(
            revisionCreatedOnAscVariables
        );

        expect(entriesListByCreatedOnAscManageApi).toMatchObject(matchObject2);
        expect(entriesListByCreatedOnAscReadApi).toMatchObject(matchObject2);
    });

    test("should be able to filter by revision-level meta fields", async () => {
        const [testEntry1, testEntry2, testEntry3, testEntry4] = testEntries;

        // Filter entries created by identity A.
        const matchObject1 = { data: [{ id: testEntry3.id }, { id: testEntry1.id }] };

        const revisionCreatedByIdentityAVariables = {
            where: {
                revisionCreatedBy: identityA.id
            }
        };

        const identityAEntriesManageApi = await manageApiIdentityA.listTestEntries(
            revisionCreatedByIdentityAVariables
        );

        const identityAEntriesReadApi = await readApiIdentityA.listTestEntries(
            revisionCreatedByIdentityAVariables
        );

        expect(identityAEntriesManageApi).toMatchObject(matchObject1);
        expect(identityAEntriesReadApi).toMatchObject(matchObject1);

        // Filter entries created by identity B.
        const matchObject2 = { data: [{ id: testEntry4.id }, { id: testEntry2.id }] };

        const revisionCreatedByIdentityBVariables = {
            where: {
                revisionCreatedBy: identityB.id
            }
        };

        const identityBEntriesManageApi = await manageApiIdentityB.listTestEntries(
            revisionCreatedByIdentityBVariables
        );

        const identityBEntriesReadApi = await readApiIdentityB.listTestEntries(
            revisionCreatedByIdentityBVariables
        );

        expect(identityBEntriesManageApi).toMatchObject(matchObject2);
        expect(identityBEntriesReadApi).toMatchObject(matchObject2);
    });
});
