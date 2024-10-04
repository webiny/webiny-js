import { SecurityIdentity } from "@webiny/api-security/types";
import { createTestFolderLevelPermissions } from "./utils/createTestFolderLevelPermissions";
import { createTestTeam } from "./utils/createTestTeam";
import { createTestRole } from "~tests/utils/createTestRole";
import { FlpFolder } from "~/utils/FolderLevelPermissions";

const identity1: SecurityIdentity = { id: "1", type: "admin", displayName: "1" };

describe("FolderLevelPermissions Class Tests", () => {
    test("test123", async () => {
        const role = createTestRole({
            id: "r1",
            name: "Role 1",
            permissions: [{ name: "cms.*" }]
        });

        const team1 = createTestTeam({
            id: "t1",
            name: "Team 1",
            roles: [role.id]
        });

        const team2 = createTestTeam({
            id: "t2",
            name: "Team 2",
            roles: [role.id]
        });

        const rootFolder: FlpFolder = { id: "root", type: "test", title: "Root", parentId: null };
        const folder1: FlpFolder = {
            id: "1",
            type: "test",
            title: "1",
            parentId: "root",
            permissions: [{ target: "team:t1", level: "viewer" }]
        };
        const folder2: FlpFolder = {
            id: "2",
            type: "test",
            title: "2",
            parentId: "1",
            permissions: [{ target: "team:t2", level: "editor" }]
        };

        const flp = createTestFolderLevelPermissions({
            getIdentity: () => identity1,
            listIdentityTeams: async () => [team1, team2],
            listAllFolders: async () => [rootFolder, folder1, folder2],
            listPermissions: async () => role.permissions
        });

        const folders = await flp.listAllFolders("test");

        const folder1Permissions = await flp.getFolderPermissions({folder: folder1});
        const folder2Permissions = await flp.getFolderPermissions({folder: folder2});
        const kobica = 123;
    });
});
