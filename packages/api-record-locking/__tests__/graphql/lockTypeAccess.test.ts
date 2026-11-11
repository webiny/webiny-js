import { describe, it, expect } from "vitest";
import { useGraphQLHandler } from "~tests/helpers/useGraphQLHandler";
import { createIdentity } from "~tests/helpers/identity";
import type { PermissionsArg } from "~tests/helpers/permissions";
import { AUTHOR_MODEL_ID, SECRET_MODEL_ID } from "~tests/helpers/models";

/**
 * Read access to the entries of the author model only.
 */
const authorOnlyPermissions: PermissionsArg[] = [
    { _src: "role", name: "cms.endpoint.manage" },
    { _src: "role", name: "cms.contentModelGroup", rwd: "r" },
    { _src: "role", name: "cms.contentModel", rwd: "r", models: [AUTHOR_MODEL_ID] },
    { _src: "role", name: "cms.contentEntry", rwd: "r" }
];

describe("lock record type access", () => {
    const owner = useGraphQLHandler();

    const restricted = useGraphQLHandler({
        identity: createIdentity({
            id: "restrictedUserId",
            displayName: "Restricted User",
            type: "admin"
        }),
        permissions: authorOnlyPermissions
    });

    it("should lock entries of readable models, by model id or by `cms#` prefixed model id", async () => {
        const [byModelId] = await restricted.lockEntryMutation({
            id: "authorEntry1#0001",
            type: AUTHOR_MODEL_ID
        });
        expect(byModelId.data.recordLocking.lockEntry.error).toBeNull();
        expect(byModelId.data.recordLocking.lockEntry.data).toMatchObject({ id: "authorEntry1" });

        const [byPrefixedModelId] = await restricted.lockEntryMutation({
            id: "authorEntry2#0001",
            type: `cms#${AUTHOR_MODEL_ID}`
        });
        expect(byPrefixedModelId.data.recordLocking.lockEntry.error).toBeNull();
        expect(byPrefixedModelId.data.recordLocking.lockEntry.data).toMatchObject({
            id: "authorEntry2"
        });
    });

    it.each([
        ["a model the user can't read", SECRET_MODEL_ID],
        ["a prefixed model the user can't read", `cms#${SECRET_MODEL_ID}`],
        ["a type that is not a model", "aTestType"]
    ])("should refuse to lock an entry of %s", async (_, type) => {
        const [result] = await restricted.lockEntryMutation({
            id: "secretEntry#0001",
            type
        });
        expect(result.data.recordLocking.lockEntry.data).toBeNull();
        expect(result.data.recordLocking.lockEntry.error.code).toBe("NOT_AUTHORIZED");
    });

    it("should refuse to update a lock or request an unlock of a model the user can't read", async () => {
        const [lockResult] = await owner.lockEntryMutation({
            id: "secretEntry#0001",
            type: SECRET_MODEL_ID
        });
        expect(lockResult.data.recordLocking.lockEntry.error).toBeNull();

        const [updateResult] = await restricted.updateEntryLockMutation({
            id: "secretEntry#0001",
            type: SECRET_MODEL_ID
        });
        expect(updateResult.data.recordLocking.updateEntryLock.data).toBeNull();
        expect(updateResult.data.recordLocking.updateEntryLock.error.code).toBe("NOT_AUTHORIZED");

        const [requestResult] = await restricted.unlockEntryRequestMutation({
            id: "secretEntry#0001",
            type: SECRET_MODEL_ID
        });
        expect(requestResult.data.recordLocking.unlockEntryRequest.data).toBeNull();
        expect(requestResult.data.recordLocking.unlockEntryRequest.error.code).toBe(
            "NOT_AUTHORIZED"
        );
    });

    it("should list only locks of models the user can read", async () => {
        await owner.lockEntryMutation({ id: "listAuthorEntry#0001", type: AUTHOR_MODEL_ID });
        await owner.lockEntryMutation({
            id: "listAuthorEntry2#0001",
            type: `cms#${AUTHOR_MODEL_ID}`
        });
        await owner.lockEntryMutation({ id: "listSecretEntry#0001", type: SECRET_MODEL_ID });

        const [restrictedList] = await restricted.listLockRecordsQuery();
        expect(restrictedList.data.recordLocking.listLockRecords.error).toBeNull();
        const restrictedIds = restrictedList.data.recordLocking.listLockRecords.data.map(
            (item: { id: string }) => item.id
        );
        expect(restrictedIds).toContain("listAuthorEntry");
        expect(restrictedIds).toContain("listAuthorEntry2");
        expect(restrictedIds).not.toContain("listSecretEntry");

        const fullAccess = useGraphQLHandler({
            identity: createIdentity({
                id: "fullAccessUserId",
                displayName: "Full Access User",
                type: "admin"
            }),
            permissions: [{ name: "*" }]
        });
        const [fullList] = await fullAccess.listLockRecordsQuery();
        const fullIds = fullList.data.recordLocking.listLockRecords.data.map(
            (item: { id: string }) => item.id
        );
        expect(fullIds).toContain("listSecretEntry");
    });
});
