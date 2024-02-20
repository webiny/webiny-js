import { useTestModelHandler } from "~tests/testHelpers/useTestModelHandler";
import { SecurityIdentity } from "@webiny/api-security/types";
import { CmsTestPermissions, expectNotAuthorized } from "../utils";

const identityA: SecurityIdentity = { id: "a", type: "admin", displayName: "A" };
const identityB: SecurityIdentity = { id: "b", type: "admin", displayName: "B" };

describe("Delete Permissions Checks", () => {
    test("should allow deletion of groups only with sufficient permission", async () => {
        const permissions = new CmsTestPermissions({
            groups: { rwd: "rw" }
        });

        // Without the "d" permission, the deletion should not be allowed.
        const { manage: manageApiA } = useTestModelHandler({
            identity: identityA,
            permissions: permissions.getPermissions()
        });

        const [modelGroup] = await manageApiA.createContentModelGroupMutation({
            data: { name: "Group 1", icon: "x" }
        });

        const [modelGroupDeletion] = await manageApiA.deleteContentModelGroupMutation({
            id: modelGroup.data.createContentModelGroup.data.id
        });

        expectNotAuthorized(modelGroupDeletion.data.deleteContentModelGroup, {
            reason: "Not allowed to access content model groups."
        });

        // Adding the "d" permission to the identityB should allow the deletion of the group.

        permissions.setPermissions({
            groups: { rwd: "rwd" }
        });

        const { manage: manageApiB } = useTestModelHandler({
            identity: identityB,
            permissions: permissions.getPermissions()
        });

        const [modelGroupWithPermissions] = await manageApiB.deleteContentModelGroupMutation({
            id: modelGroup.data.createContentModelGroup.data.id
        });

        expect(modelGroupWithPermissions).toMatchObject({
            data: {
                deleteContentModelGroup: {
                    data: true,
                    error: null
                }
            }
        });
    });
});
