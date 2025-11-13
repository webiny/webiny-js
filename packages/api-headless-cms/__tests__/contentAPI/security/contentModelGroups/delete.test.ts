import { describe, expect, it } from "vitest";
import { useTestModelHandler } from "~tests/testHelpers/useTestModelHandler";
import { CmsTestPermissions, expectNotAuthorized } from "../utils";
import type { IdentityData } from "@webiny/api-core/features/security/IdentityContext/index.js";

const identityA: IdentityData = { id: "a", type: "admin", displayName: "A" };
const identityB: IdentityData = { id: "b", type: "admin", displayName: "B" };

describe("Delete Permissions Checks", () => {
    it("should allow deletion of groups only with sufficient permission", async () => {
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
            code: "Cms/ModelGroup/NotAuthorized",
            message: "Not allowed to access content model groups."
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
