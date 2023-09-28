import { useGraphQlHandler } from "./utils/useGraphQlHandler";
import { SecurityIdentity } from "@webiny/api-security/types";

const FOLDER_TYPE = "test-folders";

const identityA: SecurityIdentity = { id: "1", type: "admin", displayName: "A" };
const identityB: SecurityIdentity = { id: "2", type: "admin", displayName: "B" };

describe("Folder Level Permissions", () => {
    const { aco: acoIdentityA } = useGraphQlHandler({ identity: identityA });
    const { aco: acoIdentityB } = useGraphQlHandler({
        identity: identityB,
        permissions: [{ name: "cms.*" }]
    });

    test("as a full-access user, I should be able to create folders anywhere in the folder tree", async () => {
        const folder = await acoIdentityA
            .createFolder({
                data: {
                    title: "Folder A",
                    slug: "folder-a",
                    type: FOLDER_TYPE
                }
            })
            .then(([response]) => {
                return response.data.aco.createFolder.data;
            });

        expect(folder.id).toBeTruthy();

        await expect(
            acoIdentityA
                .updateFolder({
                    id: folder.id,
                    data: { title: "Folder A - Updated" }
                })
                .then(([response]) => {
                    return response.data.aco.updateFolder.data;
                })
        ).resolves.toMatchObject({
            title: "Folder A - Updated"
        });
    });

    test("as a non-full-access user, I should have access folders that don't have FLP set", async () => {
        const createdFolders = [];
        for (let i = 1; i <= 4; i++) {
            createdFolders.push(
                await acoIdentityA
                    .createFolder({
                        data: {
                            title: `Folder ${i}`,
                            slug: `folder-${i}`,
                            type: FOLDER_TYPE
                        }
                    })
                    .then(([response]) => {
                        return response.data.aco.createFolder.data;
                    })
            );
        }

        await expect(
            acoIdentityB.listFolders({ where: { type: FOLDER_TYPE } }).then(([result]) => {
                return result.data.aco.listFolders.data;
            })
        ).resolves.toMatchObject([
            {
                id: createdFolders[3].id,
                parentId: null,
                permissions: [],
                slug: "folder-4"
            },
            {
                id: createdFolders[2].id,
                parentId: null,
                permissions: [],
                slug: "folder-3"
            },
            {
                id: createdFolders[1].id,
                parentId: null,
                permissions: [],
                slug: "folder-2"
            },
            {
                id: createdFolders[0].id,
                parentId: null,
                permissions: [],
                slug: "folder-1"
            }
        ]);
    });
});
