import { describe, expect, it } from "vitest";
import { useTestModelHandler } from "~tests/testHelpers/useTestModelHandler";
import { CmsTestPermissions, expectNotAuthorized } from "../utils";
import { IdentityData } from "@webiny/api-core/features/IdentityContext";

const identityA: IdentityData = { id: "a", type: "admin", displayName: "A" };
const identityB: IdentityData = { id: "b", type: "admin", displayName: "B" };
const identityC: IdentityData = { id: "c", type: "admin", displayName: "C" };

describe("Write Permissions Checks", () => {
    it("should allow creation of models only with sufficient permission", async () => {
        const permissions = new CmsTestPermissions({
            groups: { rwd: "rwd" },
            models: { rwd: "r" }
        });

        const { manage: manageApiA } = useTestModelHandler({
            identity: identityA,
            permissions: permissions.getPermissions()
        });

        const [modelGroup] = await manageApiA.createContentModelGroupMutation({
            data: { name: "Group 1", icon: "x" }
        });

        const [notCreatedModel] = await manageApiA.createContentModelMutation({
            data: {
                name: "Test",
                modelId: "test",
                singularApiName: "Test",
                pluralApiName: "Tests",
                group: modelGroup.data.createContentModelGroup.data.id,
                icon: "fa/fas"
            }
        });

        expectNotAuthorized(notCreatedModel.data.createContentModel, {
            code: "Cms/Model/NotAuthorized",
            message: "Not allowed to access content models."
        });

        permissions.setPermissions({
            groups: { rwd: "rwd" },
            models: { rwd: "rw" }
        });

        const { manage: manageApiB } = useTestModelHandler({
            identity: identityB,
            permissions: permissions.getPermissions()
        });

        const [createdModel] = await manageApiB.createContentModelMutation({
            data: {
                name: "Test",
                modelId: "test",
                singularApiName: "Test",
                pluralApiName: "Tests",
                group: modelGroup.data.createContentModelGroup.data.id,
                icon: "fa/fas"
            }
        });

        expect(createdModel).toMatchObject({
            data: {
                createContentModel: {
                    data: {
                        modelId: "test"
                    },
                    error: null
                }
            }
        });
    });

    it("should allow update of groups only with sufficient permission", async () => {
        const { manage: manageApiA } = useTestModelHandler({ identity: identityA });
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

        const permissions = new CmsTestPermissions({
            groups: { rwd: "rwd" },
            models: { rwd: "r" }
        });

        const { manage: manageApiB } = useTestModelHandler({
            identity: identityB,
            permissions: permissions.getPermissions()
        });

        const [notUpdatedModel] = await manageApiB.updateContentModelMutation({
            modelId: model.data.createContentModel.data.modelId,
            data: {
                name: "Test - UPDATE",
                layout: [],
                fields: []
            }
        });

        expectNotAuthorized(notUpdatedModel.data.updateContentModel, {
            code: "Cms/Model/NotAuthorized",
            message: "Not allowed to access content models."
        });

        permissions.setPermissions({
            groups: { rwd: "rwd" },
            models: { rwd: "rw" }
        });

        const { manage: manageApiC } = useTestModelHandler({
            identity: identityC,
            permissions: permissions.getPermissions()
        });

        const [updatedModel] = await manageApiC.updateContentModelMutation({
            modelId: model.data.createContentModel.data.modelId,
            data: {
                name: "Test - UPDATE",
                layout: [],
                fields: []
            }
        });

        expect(updatedModel).toMatchObject({
            data: {
                updateContentModel: {
                    data: {
                        name: "Test - UPDATE"
                    },
                    error: null
                }
            }
        });
    });
});
