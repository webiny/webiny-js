import { useGraphQlHandler } from "./utils/useGraphQlHandler";
import { SecurityIdentity } from "@webiny/api-security/types";

const FOLDER_TYPE = "test-folders";

const identityA: SecurityIdentity = { id: "1", type: "admin", displayName: "A" };
const identityB: SecurityIdentity = { id: "2", type: "admin", displayName: "B" };

describe("Folder Level Permissions - Security Checks", () => {
    const { aco: acoIdentityA } = useGraphQlHandler({ identity: identityA });
    const { aco: acoIdentityB } = useGraphQlHandler({
        identity: identityB,
        permissions: []
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
                id: createdFolders[0].id,
                parentId: null,
                permissions: [
                    {
                        inheritedFrom: "public",
                        level: "public",
                        target: "admin:2"
                    }
                ],
                canManageStructure: true,
                canManagePermissions: false,
                hasNonInheritedPermissions: false,
                slug: "folder-1"
            },
            {
                id: createdFolders[1].id,
                parentId: null,
                permissions: [
                    {
                        inheritedFrom: "public",
                        level: "public",
                        target: "admin:2"
                    }
                ],
                canManageStructure: true,
                canManagePermissions: false,
                hasNonInheritedPermissions: false,
                slug: "folder-2"
            },
            {
                id: createdFolders[2].id,
                parentId: null,
                permissions: [
                    {
                        inheritedFrom: "public",
                        level: "public",
                        target: "admin:2"
                    }
                ],
                canManageStructure: true,
                canManagePermissions: false,
                hasNonInheritedPermissions: false,
                slug: "folder-3"
            },
            {
                id: createdFolders[3].id,
                parentId: null,
                permissions: [
                    {
                        inheritedFrom: "public",
                        level: "public",
                        target: "admin:2"
                    }
                ],
                canManageStructure: true,
                canManagePermissions: false,
                hasNonInheritedPermissions: false,
                slug: "folder-4"
            }
        ]);
    });

    it("should not allow updating folder if a user is about to loose access", async () => {
        const folderA = await acoIdentityA
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

        await acoIdentityA.updateFolder({
            id: folderA.id,
            data: {
                permissions: [{ level: "owner", target: `admin:${identityB.id}` }]
            }
        });

        // Should be allowed because the user is not loosing access.
        await expect(
            acoIdentityB
                .updateFolder({
                    id: folderA.id,
                    data: {
                        permissions: [
                            { level: "owner", target: `admin:${identityB.id}` }, // Include previous permissions.
                            { level: "owner", target: `admin:random-id` } // Include new permissions.
                        ]
                    }
                })
                .then(([response]) => {
                    return response.data.aco.updateFolder.data;
                })
        ).resolves.toMatchObject({
            canManagePermissions: true,
            hasNonInheritedPermissions: true,
            id: folderA.id,
            parentId: null,
            permissions: [
                { inheritedFrom: null, level: "owner", target: "admin:2" },
                { inheritedFrom: null, level: "owner", target: "admin:random-id" }
            ]
        });

        // Should not be allowed because the user is loosing access.
        await expect(
            acoIdentityB
                .updateFolder({
                    id: folderA.id,
                    data: {
                        permissions: [
                            { level: "owner", target: `admin:${identityA.id}` } // Include previous permissions.
                        ]
                    }
                })
                .then(([response]) => {
                    return response.data.aco.updateFolder.error;
                })
        ).resolves.toEqual({
            code: "CANNOT_LOOSE_FOLDER_ACCESS",
            data: null,
            message: "Cannot continue because you would loose access to this folder."
        });
    });

    it(`should reset folder access level back to "public"`, async () => {
        const folderA = await acoIdentityA
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

        await acoIdentityA.updateFolder({
            id: folderA.id,
            data: {
                permissions: [{ level: "owner", target: `admin:${identityB.id}` }]
            }
        });

        // Should be allowed because the user is not loosing access.
        await expect(
            acoIdentityB
                .updateFolder({
                    id: folderA.id,
                    data: {
                        permissions: [
                            { level: "owner", target: `admin:${identityB.id}` }, // Include previous permissions.
                            { level: "owner", target: `admin:random-id` } // Include new permissions.
                        ]
                    }
                })
                .then(([response]) => {
                    return response.data.aco.updateFolder.data;
                })
        ).resolves.toMatchObject({
            canManagePermissions: true,
            hasNonInheritedPermissions: true,
            id: folderA.id,
            parentId: null,
            permissions: [
                { inheritedFrom: null, level: "owner", target: "admin:2" },
                { inheritedFrom: null, level: "owner", target: "admin:random-id" }
            ]
        });

        await expect(
            acoIdentityA
                .updateFolder({
                    id: folderA.id,
                    data: {
                        permissions: []
                    }
                })
                .then(([response]) => {
                    return response.data.aco.updateFolder.data;
                })
        ).resolves.toMatchObject({
            canManagePermissions: true,
            hasNonInheritedPermissions: false,
            id: folderA.id,
            parentId: null,
            permissions: [
                {
                    inheritedFrom: "role:full-access",
                    level: "owner",
                    target: "admin:1"
                }
            ]
        });

        // Should not be allowed because the user is loosing access.
        await expect(
            acoIdentityB.getFolder({ id: folderA.id }).then(([response]) => {
                return response.data.aco.getFolder.data;
            })
        ).resolves.toMatchObject({
            canManagePermissions: false,
            hasNonInheritedPermissions: false,
            id: folderA.id,
            parentId: null,
            permissions: [
                {
                    inheritedFrom: "public",
                    level: "public",
                    target: "admin:2"
                }
            ]
        });
    });

    it("should not allow moving a folder to an inaccessible folder", async () => {
        const folderA = await acoIdentityA
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

        const folderB = await acoIdentityA
            .createFolder({
                data: {
                    title: "Folder B",
                    slug: "folder-b",
                    type: FOLDER_TYPE
                }
            })
            .then(([response]) => {
                return response.data.aco.createFolder.data;
            });

        const folderC = await acoIdentityA
            .createFolder({
                data: { title: "Folder C", slug: "folder-c", type: FOLDER_TYPE }
            })
            .then(([response]) => {
                return response.data.aco.createFolder.data;
            });

        await acoIdentityA.updateFolder({
            id: folderA.id,
            data: {
                permissions: [{ level: "owner", target: `admin:${identityB.id}` }]
            }
        });

        await acoIdentityA.updateFolder({
            id: folderB.id,
            data: {
                permissions: [{ level: "owner", target: `admin:${identityB.id}` }]
            }
        });

        await acoIdentityA.updateFolder({
            id: folderC.id,
            data: {
                permissions: [{ level: "owner", target: `admin:not-b` }]
            }
        });

        // Should be allowed because the user is moving the folder into an accessible folder.
        await expect(
            acoIdentityB
                .updateFolder({
                    id: folderB.id,
                    data: { parentId: folderA.id }
                })
                .then(([response]) => {
                    return response.data.aco.updateFolder.data;
                })
        ).resolves.toMatchObject({ id: folderB.id, parentId: folderA.id });

        // Should not be allowed because the user is moving the folder into an inaccessible folder.
        await expect(
            acoIdentityB
                .updateFolder({
                    id: folderB.id,
                    data: { parentId: folderC.id }
                })
                .then(([response]) => {
                    return response.data.aco.updateFolder.error;
                })
        ).resolves.toEqual({
            code: "CANNOT_MOVE_FOLDER_TO_NEW_PARENT",
            data: null,
            message:
                "Cannot move folder to a new parent because you don't have access to the new parent."
        });
    });

    it("should not be able to access a folder if its parent is inaccessible", async () => {
        const folderA = await acoIdentityA
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

        const folderB = await acoIdentityA
            .createFolder({
                data: {
                    title: "Folder B",
                    slug: "folder-b",
                    type: FOLDER_TYPE
                }
            })
            .then(([response]) => {
                return response.data.aco.createFolder.data;
            });

        // User B should have access to folder C. No permissions will be set here.
        const folderC = await acoIdentityA
            .createFolder({
                data: {
                    title: "Folder C",
                    slug: "folder-c",
                    type: FOLDER_TYPE
                }
            })
            .then(([response]) => {
                return response.data.aco.createFolder.data;
            });

        await acoIdentityA.updateFolder({
            id: folderA.id,
            data: {
                permissions: [{ level: "owner", target: `admin:not-b` }]
            }
        });

        await acoIdentityA.updateFolder({
            id: folderB.id,
            data: {
                permissions: [{ level: "owner", target: `admin:${identityB.id}` }]
            }
        });

        // User B should have access to folder B.
        await expect(
            acoIdentityB.getFolder({ id: folderB.id }).then(([result]) => {
                return result.data.aco.getFolder.data;
            })
        ).resolves.toMatchObject({
            id: folderB.id
        });

        // Moving folder B to folder A, which is inaccessible to user B.
        // User B should lose access to folder B.
        await acoIdentityA.updateFolder({
            id: folderB.id,
            data: { parentId: folderA.id }
        });

        await expect(
            acoIdentityB.getFolder({ id: folderB.id }).then(([result]) => {
                return result.data.aco.getFolder.error;
            })
        ).resolves.toEqual({
            code: "SECURITY_NOT_AUTHORIZED",
            data: null,
            message: "Not authorized!"
        });

        await expect(
            acoIdentityB.listFolders({ where: { type: FOLDER_TYPE } }).then(([result]) => {
                return result.data.aco.listFolders.data;
            })
        ).resolves.toMatchObject([
            {
                canManagePermissions: false,
                hasNonInheritedPermissions: false,
                id: folderC.id,
                permissions: [
                    {
                        target: "admin:2",
                        level: "public",
                        inheritedFrom: "public"
                    }
                ]
            }
        ]);
    });
});
