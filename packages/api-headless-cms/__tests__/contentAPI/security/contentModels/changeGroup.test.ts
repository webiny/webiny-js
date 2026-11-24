import { describe, expect, it } from "vitest";
import { useTestModelHandler } from "~tests/testHelpers/useTestModelHandler";
import type { PermissionsArg } from "~tests/testHelpers/helpers";
import { identityA, identityB } from "../utils";

/**
 * Models in the given group can be read (rwd "r") or also written (rwd "rw").
 */
const createGroupScopedPermissions = (group: string, modelsRwd: string): PermissionsArg[] => {
    const _src = `role:${group}`;
    return [
        { _src, name: "cms.endpoint.manage" },
        { _src, name: "cms.contentModelGroup", rwd: "r", groups: [group] },
        { _src, name: "cms.contentModel", rwd: modelsRwd },
        { _src, name: "cms.contentEntry", rwd: "r" }
    ];
};

describe("Content model - changing the group", () => {
    const setup = async () => {
        const { manage: manageApiA } = useTestModelHandler({ identity: identityA });

        const [readOnlyGroupResponse] = await manageApiA.createContentModelGroupMutation({
            data: { name: "Read Only Group", icon: "x" }
        });
        const readOnlyGroup = readOnlyGroupResponse.data.createContentModelGroup.data;

        const [writableGroupResponse] = await manageApiA.createContentModelGroupMutation({
            data: { name: "Writable Group", icon: "x" }
        });
        const writableGroup = writableGroupResponse.data.createContentModelGroup.data;

        const [modelResponse] = await manageApiA.createContentModelMutation({
            data: {
                name: "Test",
                modelId: "test",
                singularApiName: "Test",
                pluralApiName: "Tests",
                group: readOnlyGroup.id,
                icon: "fa/fas"
            }
        });
        const model = modelResponse.data.createContentModel.data;
        expect(model.modelId).toEqual("test");

        return { manageApiA, readOnlyGroup, writableGroup, model };
    };

    it("should not allow moving a model out of a group in which models can only be read", async () => {
        const { manageApiA, readOnlyGroup, writableGroup, model } = await setup();

        const { manage: manageApiB } = useTestModelHandler({
            identity: identityB,
            permissions: [
                ...createGroupScopedPermissions(readOnlyGroup.id, "r"),
                ...createGroupScopedPermissions(writableGroup.id, "rw")
            ]
        });

        const [result] = await manageApiB.updateContentModelMutation({
            modelId: model.modelId,
            data: {
                group: writableGroup.id,
                layout: [],
                fields: []
            }
        });

        expect(result.data.updateContentModel.data).toBeNull();
        expect(result.data.updateContentModel.error).toMatchObject({
            code: "Cms/Model/NotAuthorized"
        });

        const [getResult] = await manageApiA.getContentModelQuery({ modelId: model.modelId });
        expect(getResult.data.getContentModel.data.group).toEqual(readOnlyGroup.id);
    });

    it("should not allow moving a model to a group which does not exist", async () => {
        const { manageApiA, model } = await setup();

        const [result] = await manageApiA.updateContentModelMutation({
            modelId: model.modelId,
            data: {
                group: "nonExistingGroup",
                layout: [],
                fields: []
            }
        });

        expect(result.data.updateContentModel.data).toBeNull();
        expect(result.data.updateContentModel.error).toMatchObject({
            code: "Cms/ModelGroup/NotFound"
        });
    });

    it("should allow moving a model to another existing group with sufficient permissions", async () => {
        const { manageApiA, writableGroup, model } = await setup();

        const [result] = await manageApiA.updateContentModelMutation({
            modelId: model.modelId,
            data: {
                group: writableGroup.id,
                layout: [],
                fields: []
            }
        });

        expect(result.data.updateContentModel.error).toBeNull();
        expect(result.data.updateContentModel.data.group).toEqual(writableGroup.id);
    });
});
