import { useTestModelHandler } from "~tests/testHelpers/useTestModelHandler";
import { SecurityIdentity } from "@webiny/api-security/types";
import { CmsTestPermissions, expectNotAuthorized } from "../utils";

const identityA: SecurityIdentity = { id: "a", type: "admin", displayName: "A" };
const identityB: SecurityIdentity = { id: "b", type: "admin", displayName: "B" };
const identityC: SecurityIdentity = { id: "c", type: "admin", displayName: "C" };

describe("Delete Permissions Checks", () => {
    test("should allow deletion of entries only with sufficient permission", async () => {
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
            reason: 'Not allowed to access "testModel" entries.'
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
