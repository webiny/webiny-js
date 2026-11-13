import { describe, expect, it } from "vitest";
import { useGraphQLHandler } from "~tests/testHelpers/useGraphQLHandler";
import { exportedGroupsAndModels } from "./mocks/exportedGroupsAndModels";
import type { PermissionsArg } from "~tests/testHelpers/helpers";

const readOnlyPermissions: PermissionsArg[] = [
    { name: "cms.endpoint.manage" },
    { name: "cms.contentModelGroup", rwd: "r" },
    { name: "cms.contentModel", rwd: "r" },
    { name: "cms.contentEntry", rwd: "r" }
];

describe("import cms structure - security", () => {
    it("should not allow importing the structure without write access to groups and models", async () => {
        const { importCmsStructureMutation } = useGraphQLHandler({
            path: "manage",
            identity: { id: "read-only", type: "admin", displayName: "Read Only" },
            permissions: readOnlyPermissions
        });

        const [result] = await importCmsStructureMutation({
            data: exportedGroupsAndModels
        });

        expect(result).toEqual({
            data: {
                importStructure: {
                    data: null,
                    error: expect.objectContaining({
                        code: "NOT_AUTHORIZED",
                        message: "Not allowed to import content model groups and models."
                    })
                }
            }
        });
    });

    it("should not allow importing the structure without write access to models", async () => {
        const { importCmsStructureMutation, listContentModelGroupsQuery } = useGraphQLHandler({
            path: "manage",
            identity: { id: "groups-writer", type: "admin", displayName: "Groups Writer" },
            permissions: [
                { name: "cms.endpoint.manage" },
                { name: "cms.contentModelGroup", rwd: "rwd" },
                { name: "cms.contentModel", rwd: "r" },
                { name: "cms.contentEntry", rwd: "r" }
            ]
        });

        const [result] = await importCmsStructureMutation({
            data: exportedGroupsAndModels
        });

        expect(result.data.importStructure).toMatchObject({
            data: null,
            error: { code: "NOT_AUTHORIZED" }
        });

        // Nothing was imported.
        const [groups] = await listContentModelGroupsQuery();
        const importedGroupIds = exportedGroupsAndModels.groups.map(group => group.id);
        const existingGroupIds = (groups.data.listContentModelGroups.data || []).map(
            (group: { id: string }) => group.id
        );
        expect(existingGroupIds.filter((id: string) => importedGroupIds.includes(id))).toEqual([]);
    });
});
