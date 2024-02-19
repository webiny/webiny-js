import { useTestModelHandler } from "~tests/testHelpers/useTestModelHandler";
import { SecurityIdentity } from "@webiny/api-security/types";
import { CmsTestPermissions, expectNotAuthorized } from "../utils";

const identityA: SecurityIdentity = { id: "a", type: "admin", displayName: "A" };
const identityB: SecurityIdentity = { id: "b", type: "admin", displayName: "B" };
const identityC: SecurityIdentity = { id: "c", type: "admin", displayName: "C" };

describe("Write Permissions Checks", () => {
    test("should allow creation of groups only with sufficient permission", async () => {
        const permissions = new CmsTestPermissions({
            groups: { rwd: "r" }
        });

        const { manage: manageApiA } = useTestModelHandler({
            identity: identityA,
            permissions: permissions.getPermissions()
        });

        const [modelGroup] = await manageApiA.createContentModelGroupMutation({
            data: { name: "Group 1", icon: "x" }
        });

        expectNotAuthorized(modelGroup.data.createContentModelGroup, {
            reason: "Not allowed to access content model groups."
        });

        permissions.setPermissions({
            groups: { rwd: "rw" }
        });

        const { manage: manageApiB } = useTestModelHandler({
            identity: identityB,
            permissions: permissions.getPermissions()
        });

        const [modelGroupWithPermissions] = await manageApiB.createContentModelGroupMutation({
            data: { name: "Group 1", icon: "x" }
        });

        expect(modelGroupWithPermissions).toMatchObject({
            data: {
                createContentModelGroup: {
                    data: {
                        name: "Group 1",
                        icon: "x"
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

        const permissions = new CmsTestPermissions({
            groups: { rwd: "r" }
        });

        const { manage: manageApiB } = useTestModelHandler({
            identity: identityB,
            permissions: permissions.getPermissions()
        });

        const [notUpdatedModelGroup] = await manageApiB.updateContentModelGroupMutation({
            id: modelGroup.data.createContentModelGroup.data.id,
            data: { name: "Group 1 - UPDATE", icon: "x" }
        });

        expectNotAuthorized(notUpdatedModelGroup.data.updateContentModelGroup, {
            reason: "Not allowed to access content model groups."
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
            data: { name: "Group 1 - UPDATE", icon: "x" }
        });

        expect(updatedModelGroup).toMatchObject({
            data: {
                updateContentModelGroup: {
                    data: {
                        name: "Group 1 - UPDATE",
                        icon: "x"
                    },
                    error: null
                }
            }
        });
    });
});
