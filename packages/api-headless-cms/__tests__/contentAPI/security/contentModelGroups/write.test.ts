import { describe, expect, it } from "vitest";
import { useTestModelHandler } from "~tests/testHelpers/useTestModelHandler";
import { CmsTestPermissions, expectNotAuthorized } from "../utils";
import type { IdentityData } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { createIcon } from "~tests/__helpers/icon.js";

const identityA: IdentityData = { id: "a", type: "admin", displayName: "A" };
const identityB: IdentityData = { id: "b", type: "admin", displayName: "B" };
const identityC: IdentityData = { id: "c", type: "admin", displayName: "C" };

describe("Write Permissions Checks", () => {
    it("should allow creation of groups only with sufficient permission", async () => {
        const permissions = new CmsTestPermissions({
            groups: { rwd: "r" }
        });

        const { manage: manageApiA } = useTestModelHandler({
            identity: identityA,
            permissions: permissions.getPermissions()
        });

        const [modelGroup] = await manageApiA.createContentModelGroupMutation({
            data: { name: "Group 1", icon: createIcon("x") }
        });

        expectNotAuthorized(modelGroup.data.createContentModelGroup, {
            code: "Cms/ModelGroup/NotAuthorized",
            message: "Not allowed to access content model groups."
        });

        permissions.setPermissions({
            groups: { rwd: "rw" }
        });

        const { manage: manageApiB } = useTestModelHandler({
            identity: identityB,
            permissions: permissions.getPermissions()
        });

        const [modelGroupWithPermissions] = await manageApiB.createContentModelGroupMutation({
            data: { name: "Group 1", icon: createIcon("x") }
        });

        expect(modelGroupWithPermissions).toMatchObject({
            data: {
                createContentModelGroup: {
                    data: {
                        name: "Group 1",
                        icon: createIcon("x")
                    },
                    error: null
                }
            }
        });
    });

    it("should allow update of groups only with sufficient permission", async () => {
        const { manage: manageApiA } = useTestModelHandler({ identity: identityA });
        const [modelGroup] = await manageApiA.createContentModelGroupMutation({
            data: { name: "Group 1", icon: createIcon("x") }
        });

        const permissions = new CmsTestPermissions({
            groups: { rwd: "r" }
        });

        const { manage: manageApiB } = useTestModelHandler({
            identity: identityB,
            permissions: permissions.getPermissions()
        });

        const [notUpdatedModelGroup] = await manageApiB.updateContentModelGroupMutation({
            id: modelGroup.data.createContentModelGroup.data.id,
            data: { name: "Group 1 - UPDATE", icon: createIcon("x") }
        });

        expectNotAuthorized(notUpdatedModelGroup.data.updateContentModelGroup, {
            code: "Cms/ModelGroup/NotAuthorized",
            message: "Not allowed to access content model groups."
        });

        permissions.setPermissions({
            groups: { rwd: "rw" }
        });
        const { manage: manageApiC } = useTestModelHandler({
            identity: identityC,
            permissions: permissions.getPermissions()
        });

        const [updatedModelGroup] = await manageApiC.updateContentModelGroupMutation({
            id: modelGroup.data.createContentModelGroup.data.id,
            data: { name: "Group 1 - UPDATE", icon: createIcon("x") }
        });

        expect(updatedModelGroup).toMatchObject({
            data: {
                updateContentModelGroup: {
                    data: {
                        name: "Group 1 - UPDATE",
                        icon: createIcon("x")
                    },
                    error: null
                }
            }
        });
    });
});
