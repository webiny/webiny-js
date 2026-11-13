import { describe, expect, it } from "vitest";
import { useTestModelHandler } from "~tests/testHelpers/useTestModelHandler";
import { CmsTestPermissions, expectNotAuthorized } from "../utils";
import type { IdentityData } from "@webiny/api-core/features/security/IdentityContext/index.js";

const identityA: IdentityData = { id: "a", type: "admin", displayName: "A" };
const identityB: IdentityData = { id: "b", type: "admin", displayName: "B" };
const identityC: IdentityData = { id: "c", type: "admin", displayName: "C" };

describe("Delete Permissions Checks", () => {
    it("should allow deletion of entries only with sufficient permission", async () => {
        const { manage: manageApiA } = useTestModelHandler({
            identity: identityA
        });

        await manageApiA.setup();

        const testEntry = await manageApiA.createTestEntry();

        const permissions = new CmsTestPermissions({
            groups: { rwd: "rwd" },
            models: { rwd: "rwd" },
            entries: { rwd: "rw" }
        });

        // Without the "d" permission, the deletion should not be allowed.
        const { manage: manageApiB } = useTestModelHandler({
            identity: identityB,
            permissions: permissions.getPermissions()
        });

        const failedEntryDeletion = await manageApiB.deleteTestEntry({
            variables: {
                revision: testEntry.data.id
            }
        });

        expectNotAuthorized(failedEntryDeletion, {
            code: "Cms/Entry/NotAuthorized",
            message: 'Not allowed to access "testModel" entries.'
        });

        // Adding the "d" permission to the identityC should allow the deletion of the group.
        permissions.setPermissions({
            groups: { rwd: "rwd" },
            models: { rwd: "rwd" },
            entries: { rwd: "rwd" }
        });

        const { manage: manageApiC } = useTestModelHandler({
            identity: identityC,
            permissions: permissions.getPermissions()
        });

        const entryDeletion = await manageApiC.deleteTestEntry({
            variables: {
                revision: testEntry.data.id
            }
        });

        expect(entryDeletion).toMatchObject({
            data: true,
            error: null
        });
    });
    it("should not bulk delete entries of others with a read-all role and a delete-own role", async () => {
        const { manage: manageApiA } = useTestModelHandler({ identity: identityA });
        await manageApiA.setup();

        const entryOfA = await manageApiA.createTestEntry();

        // One role allows reading all entries, the other one allows deleting only own entries.
        const readAll = new CmsTestPermissions({
            groups: { rwd: "r" },
            models: { rwd: "r" },
            entries: { rwd: "r" }
        });
        const deleteOwn = new CmsTestPermissions({
            groups: { rwd: "r" },
            models: { rwd: "r" },
            entries: { rwd: "rwd", own: true }
        });

        const { manage: manageApiB } = useTestModelHandler({
            identity: identityB,
            permissions: [...readAll.getPermissions(), ...deleteOwn.getPermissions()]
        });

        const entryOfB = await manageApiB.createTestEntry();
        expect(entryOfB.error).toBeNull();

        // Bulk delete removes the published record of each entry as well, so publish both.
        for (const entry of [entryOfA, entryOfB]) {
            const published = await manageApiA.publishTestEntry({
                variables: { revision: entry.data.id }
            });
            expect(published.error).toBeNull();
        }

        const [response] = await manageApiB.invoke({
            body: {
                query: /* GraphQL */ `
                    mutation DeleteTestEntries($entries: [ID!]!) {
                        deleteMultipleTestEntries(entries: $entries) {
                            data {
                                id
                            }
                            error {
                                code
                                message
                            }
                        }
                    }
                `,
                variables: { entries: [entryOfA.data.entryId, entryOfB.data.entryId] }
            }
        });

        expect(response.errors).toBeUndefined();
        expect(response.data.deleteMultipleTestEntries.error).toBeNull();

        // Only the own entry is deleted.
        const remaining = await manageApiA.listTestEntries();
        const remainingIds = remaining.data.map(entry => entry.entryId);

        expect(remainingIds).toEqual([entryOfA.data.entryId]);
    });
});
