import { describe, expect, it } from "vitest";
import { useTestModelHandler } from "~tests/testHelpers/useTestModelHandler";
import { CmsTestPermissions, expectNotAuthorized } from "../utils";
import type { IdentityData } from "@webiny/api-core/features/IdentityContext";

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
            revision: testEntry.data.id
        });

        expectNotAuthorized(failedEntryDeletion, {
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
            revision: testEntry.data.id
        });

        expect(entryDeletion).toMatchObject({
            data: true,
            error: null
        });
    });
});
