import type { IdentityData } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { beforeEach, describe, expect, it } from "vitest";
import { useTestModelHandler } from "~tests/testHelpers/useTestModelHandler";
import type { IManageListTestEntryVariables } from "~tests/testHelpers/useTestModelHandler/manageGql.js";

const identityA: IdentityData = { id: "a", type: "admin", displayName: "A" };
const identityB: IdentityData = { id: "b", type: "admin", displayName: "B" };

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
                variables: {
                    data: {
                        status: "published",
                        values: {
                            title: `Test Entry ${i}`,
                            slug: `test-entry-${i}`
                        }
                    }
                }
            });
            testEntries.push(testEntry);
        }
    });

    it("should be able to sort by revision-level meta fields", async () => {
        const [testEntry1, testEntry2, testEntry3, testEntry4] = testEntries;

        // Sorting by `revisionCreatedOn` should return entries sorted by the `revisionCreatedOn` field.
        const matchObject1 = {
            data: [
                {
                    id: testEntry4.id
                },
                {
                    id: testEntry3.id
                },
                {
                    id: testEntry2.id
                },
                {
                    id: testEntry1.id
                }
            ]
        };

        const revisionCreatedOnDescVariables: IManageListTestEntryVariables = {
            sort: ["revisionCreatedOn_DESC"]
        };

        const entriesListByCreatedOnDescManageApi = await manageApiIdentityA.listTestEntries({
            variables: revisionCreatedOnDescVariables
        });

        const entriesListByCreatedOnDescReadApi = await readApiIdentityA.listTestEntries({
            variables: revisionCreatedOnDescVariables
        });

        expect(entriesListByCreatedOnDescManageApi).toMatchObject(matchObject1);
        expect(entriesListByCreatedOnDescReadApi).toMatchObject(matchObject1);

        // Ascending order.
        const matchObject2 = {
            data: [
                {
                    id: testEntry1.id
                },
                {
                    id: testEntry2.id
                },
                {
                    id: testEntry3.id
                },
                {
                    id: testEntry4.id
                }
            ]
        };

        const revisionCreatedOnAscVariables: IManageListTestEntryVariables = {
            sort: ["revisionCreatedOn_ASC"]
        };

        const entriesListByCreatedOnAscManageApi = await manageApiIdentityA.listTestEntries({
            variables: revisionCreatedOnAscVariables
        });

        const entriesListByCreatedOnAscReadApi = await readApiIdentityA.listTestEntries({
            variables: revisionCreatedOnAscVariables
        });

        expect(entriesListByCreatedOnAscManageApi).toMatchObject(matchObject2);
        expect(entriesListByCreatedOnAscReadApi).toMatchObject(matchObject2);
    });

    it("should be able to filter by revision-level meta fields", async () => {
        const [testEntry1, testEntry2, testEntry3, testEntry4] = testEntries;

        // Filter entries created by identity A.
        const matchObject1 = { data: [{ id: testEntry3.id }, { id: testEntry1.id }] };

        const revisionCreatedByIdentityAVariables: IManageListTestEntryVariables = {
            where: {
                revisionCreatedBy: identityA.id
            }
        };

        const identityAEntriesManageApi = await manageApiIdentityA.listTestEntries({
            variables: revisionCreatedByIdentityAVariables
        });

        const identityAEntriesReadApi = await readApiIdentityA.listTestEntries({
            variables: revisionCreatedByIdentityAVariables
        });

        expect(identityAEntriesManageApi).toMatchObject(matchObject1);
        expect(identityAEntriesReadApi).toMatchObject(matchObject1);

        // Filter entries created by identity B.
        const matchObject2 = {
            data: [
                {
                    id: testEntry4.id
                },
                {
                    id: testEntry2.id
                }
            ]
        };

        const revisionCreatedByIdentityBVariables: IManageListTestEntryVariables = {
            where: {
                revisionCreatedBy: identityB.id
            }
        };

        const identityBEntriesManageApi = await manageApiIdentityB.listTestEntries({
            variables: revisionCreatedByIdentityBVariables
        });

        const identityBEntriesReadApi = await readApiIdentityB.listTestEntries({
            variables: revisionCreatedByIdentityBVariables
        });

        expect(identityBEntriesManageApi).toMatchObject(matchObject2);
        expect(identityBEntriesReadApi).toMatchObject(matchObject2);
    });
});
