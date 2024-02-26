import { useTestModelHandler } from "~tests/testHelpers/useTestModelHandler";
import { SecurityIdentity } from "@webiny/api-security/types";
import { CmsTestPermissions, expectNotAuthorized } from "../utils";

const identityA: SecurityIdentity = { id: "a", type: "admin", displayName: "A" };
const identityB: SecurityIdentity = { id: "b", type: "admin", displayName: "B" };
const identityC: SecurityIdentity = { id: "c", type: "admin", displayName: "C" };

describe("Write Permissions Checks", () => {
    test("should allow creation of models only with sufficient permission", async () => {
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
            reason: "Not allowed to access content models."
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

    test("should allow update of groups only with sufficient permission", async () => {
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
            reason: "Not allowed to access content models."
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
