import { describe, expect, it } from "vitest";
import { useTestModelHandler } from "~tests/testHelpers/useTestModelHandler";
import type { IdentityData } from "@webiny/api-core/features/IdentityContext";
import { CmsTestPermissions, expectNotAuthorized } from "../utils";

const identityA: IdentityData = { id: "a", type: "admin", displayName: "A" };
const identityB: IdentityData = { id: "b", type: "admin", displayName: "B" };

describe("Delete Permissions Checks", () => {
    it("should allow deletion of models only with sufficient permission", async () => {
        // Without the "d" permission, the deletion should not be allowed.
        const permissions = new CmsTestPermissions({
            groups: { rwd: "rwd" },
            models: { rwd: "rw" }
        });

        const { manage: manageApiA } = useTestModelHandler({
            identity: identityA,
            permissions: permissions.getPermissions()
        });

        const [modelGroup] = await manageApiA.createContentModelGroupMutation({
            data: { name: "Group 1", icon: "x" }
        });

        const [model] = await manageApiA.createContentModelMutation({
            data: {
                name: "Test",
                modelId: "test",
                singularApiName: "Test",
                pluralApiName: "Tests",
                group: modelGroup.data.createContentModelGroup.data.id,
                icon: "fa/fas"
            }
        });

        const [modelDeletion] = await manageApiA.deleteContentModelMutation({
            modelId: model.data.createContentModel.data.modelId
        });

        expectNotAuthorized(modelDeletion.data.deleteContentModel, {
            code: "Cms/Model/NotAuthorized",
            message: "Not allowed to access content models."
        });

        // Adding the "d" permission to the identityB should allow the deletion of the group.
        permissions.setPermissions({
            groups: { rwd: "rwd" },
            models: { rwd: "rwd" }
        });

        const { manage: manageApiB } = useTestModelHandler({
            identity: identityB,
            permissions: permissions.getPermissions()
        });

        const [modelGroupWithPermissions] = await manageApiB.deleteContentModelMutation({
            modelId: model.data.createContentModel.data.modelId
        });

        expect(modelGroupWithPermissions).toMatchObject({
            data: {
                deleteContentModel: {
                    data: true,
                    error: null
                }
            }
        });
    });
});
