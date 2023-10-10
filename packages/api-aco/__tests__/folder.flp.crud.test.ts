import { useGraphQlHandler } from "./utils/useGraphQlHandler";
import { SecurityIdentity } from "@webiny/api-security/types";

const FOLDER_TYPE = "test-folders";

describe("Folder Level Permissions", () => {
    const { aco } = useGraphQlHandler();

    it("should return folders with permissions when creating folders", async () => {
        const folderA = await aco
            .createFolder({
                data: {
                    title: "Folder A",
                    slug: "folder-a",
                    type: FOLDER_TYPE
                }
            })
            .then(([response]) => response.data.aco.createFolder.data);

        const folderB = await aco
            .createFolder({
                data: {
                    title: "Folder B",
                    slug: "folder-b",
                    type: FOLDER_TYPE,
                    parentId: folderA.id
                }
            })
            .then(([response]) => response.data.aco.createFolder.data);

        expect(folderA).toMatchObject({
            id: folderA.id,
            parentId: null,
            permissions: [
                {
                    inheritedFrom: "role:full-access",
                    level: "owner",
                    target: "admin:12345678"
                }
            ],
            slug: "folder-a"
        });

        expect(folderB).toMatchObject({
            id: folderB.id,
            parentId: folderA.id,
            permissions: [
                {
                    inheritedFrom: `parent:${folderA.id}`,
                    level: "owner",
                    target: "admin:12345678"
                }
            ],
            slug: "folder-b"
        });
    });

    it("should return folders with permissions when getting folders", async () => {
        const folderA = await aco
            .createFolder({
                data: {
                    title: "Folder A",
                    slug: "folder-a",
                    type: FOLDER_TYPE
                }
            })
            .then(([response]) => response.data.aco.createFolder.data);

        const folderB = await aco
            .createFolder({
                data: {
                    title: "Folder B",
                    slug: "folder-b",
                    type: FOLDER_TYPE,
                    parentId: folderA.id
                }
            })
            .then(([response]) => response.data.aco.createFolder.data);

        await expect(
            aco.getFolder({ id: folderA.id }).then(([result]) => {
                return result.data.aco.getFolder.data;
            })
        ).resolves.toMatchObject({
            id: folderA.id,
            parentId: null,
            permissions: [
                {
                    inheritedFrom: "role:full-access",
                    level: "owner",
                    target: "admin:12345678"
                }
            ]
        });

        await expect(
            aco.getFolder({ id: folderB.id }).then(([result]) => {
                return result.data.aco.getFolder.data;
            })
        ).resolves.toMatchObject({
            id: folderB.id,
            parentId: folderA.id,
            permissions: [
                {
                    inheritedFrom: `parent:${folderA.id}`,
                    level: "owner",
                    target: "admin:12345678"
                }
            ]
        });
    });

    it("should return folders with permissions when updating folders", async () => {
        const folderA = await aco
            .createFolder({
                data: {
                    title: "Folder A",
                    slug: "folder-a",
                    type: FOLDER_TYPE
                }
            })
            .then(([response]) => response.data.aco.createFolder.data);

        const folderB = await aco
            .createFolder({
                data: {
                    title: "Folder B",
                    slug: "folder-b",
                    type: FOLDER_TYPE,
                    parentId: folderA.id
                }
            })
            .then(([response]) => response.data.aco.createFolder.data);

        await expect(
            aco
                .updateFolder({ id: folderA.id, data: { title: "Folder A - Updated" } })
                .then(([result]) => {
                    return result.data.aco.updateFolder.data;
                })
        ).resolves.toMatchObject({
            id: folderA.id,
            parentId: null,
            permissions: [
                {
                    inheritedFrom: "role:full-access",
                    level: "owner",
                    target: "admin:12345678"
                }
            ]
        });

        await expect(
            aco
                .updateFolder({ id: folderB.id, data: { title: "Folder B - Updated" } })
                .then(([result]) => {
                    return result.data.aco.updateFolder.data;
                })
        ).resolves.toMatchObject({
            id: folderB.id,
            parentId: folderA.id,
            permissions: [
                {
                    inheritedFrom: `parent:${folderA.id}`,
                    level: "owner",
                    target: "admin:12345678"
                }
            ]
        });
    });

    it("should return a list of folders with permissions", async () => {
        const folderA = await aco
            .createFolder({
                data: {
                    title: "Folder A",
                    slug: "folder-a",
                    type: FOLDER_TYPE
                }
            })
            .then(([response]) => response.data.aco.createFolder.data);

        const folderB = await aco
            .createFolder({
                data: {
                    title: "Folder B",
                    slug: "folder-b",
                    type: FOLDER_TYPE,
                    parentId: folderA.id
                }
            })
            .then(([response]) => response.data.aco.createFolder.data);

        await expect(
            aco.listFolders({ where: { type: FOLDER_TYPE } }).then(([result]) => {
                return result.data.aco.listFolders.data;
            })
        ).resolves.toMatchObject([
            {
                id: folderB.id,
                parentId: folderA.id,
                permissions: [
                    {
                        inheritedFrom: `parent:${folderA.id}`,
                        level: "owner",
                        target: "admin:12345678"
                    }
                ]
            },
            {
                id: folderA.id,
                parentId: null,
                permissions: [
                    {
                        inheritedFrom: "role:full-access",
                        level: "owner",
                        target: "admin:12345678"
                    }
                ]
            }
        ]);
    });

    it('should not allow passing targets that don\'t start with "admin:" or "team:" prefixes', async () => {
        const folderA = await aco
            .createFolder({
                data: {
                    title: "Folder A",
                    slug: "folder-a",
                    type: FOLDER_TYPE
                }
            })
            .then(([response]) => response.data.aco.createFolder.data);

        await expect(
            aco
                .updateFolder({
                    id: folderA.id,
                    data: {
                        title: "Folder A - Updated",
                        permissions: [{ level: "owner", target: "my-target:xyz" }]
                    }
                })
                .then(([results]) => results.data.aco.updateFolder.error)
        ).resolves.toEqual({
            code: "",
            data: null,
            message: 'Permission target "my-target:xyz" is not valid.'
        });
    });

    it("should not allow passing inherited permissions", async () => {
        const folderA = await aco
            .createFolder({
                data: {
                    title: "Folder A",
                    slug: "folder-a",
                    type: FOLDER_TYPE
                }
            })
            .then(([response]) => response.data.aco.createFolder.data);

        await expect(
            aco
                .updateFolder({
                    id: folderA.id,
                    data: {
                        title: "Folder A - Updated",
                        permissions: [{ level: "owner", target: "admin:xyz", inheritedFrom: "xyz" }]
                    }
                })
                .then(([results]) => results.data.aco.updateFolder.error)
        ).resolves.toEqual({
            code: "",
            data: null,
            message: 'Permission "inheritedFrom" cannot be set manually.'
        });
    });

    it("should allow setting permissions on a child folder", async () => {
        const folderA = await aco
            .createFolder({
                data: {
                    title: "Folder A",
                    slug: "folder-a",
                    type: FOLDER_TYPE,
                    permissions: [
                        { target: "admin:u1", level: "owner" },
                        { target: "team:t1", level: "owner" }
                    ]
                }
            })
            .then(([response]) => {
                return response.data.aco.createFolder.data;
            });

        const folderB = await aco
            .createFolder({
                data: {
                    title: "Folder B",
                    slug: "folder-b",
                    type: FOLDER_TYPE,
                    parentId: folderA.id,
                    permissions: [
                        { target: "admin:u2", level: "editor" },
                        { target: "team:t2", level: "editor" }
                    ]
                }
            })
            .then(([response]) => {
                return response.data.aco.createFolder.data;
            });

        const folderC = await aco
            .createFolder({
                data: {
                    title: "Folder C",
                    slug: "folder-c",
                    type: FOLDER_TYPE,
                    parentId: folderB.id,
                    permissions: [
                        { target: "admin:u3", level: "viewer" },
                        { target: "team:t3", level: "viewer" }
                    ]
                }
            })
            .then(([response]) => {
                return response.data.aco.createFolder.data;
            });

        const folderD = await aco
            .createFolder({
                data: {
                    title: "Folder D",
                    slug: "folder-d",
                    type: FOLDER_TYPE,
                    parentId: folderC.id,
                    permissions: [
                        { target: "admin:u4", level: "owner" },
                        { target: "team:t4", level: "owner" }
                    ]
                }
            })
            .then(([response]) => {
                return response.data.aco.createFolder.data;
            });

        await expect(
            aco.listFolders({ where: { type: FOLDER_TYPE } }).then(([result]) => {
                return result.data.aco.listFolders.data;
            })
        ).resolves.toMatchObject([
            {
                id: folderD.id,
                parentId: folderC.id,
                permissions: [
                    {
                        inheritedFrom: `parent:${folderC.id}`,
                        level: "owner",
                        target: "admin:12345678"
                    },
                    { inheritedFrom: null, level: "owner", target: "admin:u4" },
                    { inheritedFrom: null, level: "owner", target: "team:t4" },
                    { inheritedFrom: `parent:${folderC.id}`, level: "viewer", target: "admin:u3" },
                    { inheritedFrom: `parent:${folderC.id}`, level: "viewer", target: "team:t3" },
                    { inheritedFrom: `parent:${folderC.id}`, level: "editor", target: "admin:u2" },
                    { inheritedFrom: `parent:${folderC.id}`, level: "editor", target: "team:t2" },
                    { inheritedFrom: `parent:${folderC.id}`, level: "owner", target: "admin:u1" },
                    { inheritedFrom: `parent:${folderC.id}`, level: "owner", target: "team:t1" }
                ]
            },
            {
                id: folderC.id,
                parentId: folderB.id,
                permissions: [
                    {
                        inheritedFrom: `parent:${folderB.id}`,
                        level: "owner",
                        target: "admin:12345678"
                    },
                    { inheritedFrom: null, level: "viewer", target: "admin:u3" },
                    { inheritedFrom: null, level: "viewer", target: "team:t3" },
                    { inheritedFrom: `parent:${folderB.id}`, level: "editor", target: "admin:u2" },
                    { inheritedFrom: `parent:${folderB.id}`, level: "editor", target: "team:t2" },
                    { inheritedFrom: `parent:${folderB.id}`, level: "owner", target: "admin:u1" },
                    { inheritedFrom: `parent:${folderB.id}`, level: "owner", target: "team:t1" }
                ]
            },
            {
                id: folderB.id,
                parentId: folderA.id,
                permissions: [
                    {
                        inheritedFrom: `parent:${folderA.id}`,
                        level: "owner",
                        target: "admin:12345678"
                    },
                    { inheritedFrom: null, level: "editor", target: "admin:u2" },
                    { inheritedFrom: null, level: "editor", target: "team:t2" },
                    { inheritedFrom: `parent:${folderA.id}`, level: "owner", target: "admin:u1" },
                    { inheritedFrom: `parent:${folderA.id}`, level: "owner", target: "team:t1" }
                ]
            },
            {
                id: folderA.id,
                parentId: null,
                permissions: [
                    {
                        inheritedFrom: "role:full-access",
                        level: "owner",
                        target: "admin:12345678"
                    },
                    {
                        inheritedFrom: null,
                        level: "owner",
                        target: "admin:u1"
                    },
                    {
                        inheritedFrom: null,
                        level: "owner",
                        target: "team:t1"
                    }
                ]
            }
        ]);
    });

    test("hasNonInheritedPermissions and canManagePermissions GraphQL field must show correct values", async () => {
        const identityA: SecurityIdentity = { id: "1", type: "admin", displayName: "A" };
        const identityB: SecurityIdentity = { id: "2", type: "admin", displayName: "B" };

        const { aco: acoIdentityA } = useGraphQlHandler({ identity: identityA });
        const { aco: acoIdentityB } = useGraphQlHandler({ identity: identityB, permissions: [] });

        const folderA = await aco
            .createFolder({
                data: {
                    title: "Folder A",
                    slug: "folder-a",
                    type: FOLDER_TYPE
                }
            })
            .then(([response]) => response.data.aco.createFolder.data);

        const folderB = await aco
            .createFolder({
                data: {
                    title: "Folder B",
                    slug: "folder-b",
                    type: FOLDER_TYPE,
                    parentId: folderA.id
                }
            })
            .then(([response]) => response.data.aco.createFolder.data);

        // 1. `hasNonInheritedPermissions` must show false for both folders. `canManagePermissions` must show true
        //    for both folders because the user has full-access security role attached.
        await expect(
            acoIdentityA.listFolders({ where: { type: FOLDER_TYPE } }).then(([result]) => {
                return result.data.aco.listFolders.data;
            })
        ).resolves.toMatchObject([
            {
                id: folderB.id,
                parentId: folderA.id,
                permissions: [
                    {
                        inheritedFrom: `parent:${folderA.id}`,
                        level: "owner",
                        target: `admin:${identityA.id}`
                    }
                ],
                hasNonInheritedPermissions: false,
                canManagePermissions: true
            },
            {
                id: folderA.id,
                parentId: null,
                permissions: [
                    {
                        inheritedFrom: "role:full-access",
                        level: "owner",
                        target: `admin:${identityA.id}`
                    }
                ],
                hasNonInheritedPermissions: false,
                canManagePermissions: true
            }
        ]);

        // 2. `hasNonInheritedPermissions` must show false for both folders. `canManagePermissions` must show false
        //    for both folders because the user doesn't have full-access security role attached.
        await expect(
            acoIdentityB.listFolders({ where: { type: FOLDER_TYPE } }).then(([result]) => {
                return result.data.aco.listFolders.data;
            })
        ).resolves.toMatchObject([
            {
                id: folderB.id,
                parentId: folderA.id,
                permissions: [],
                hasNonInheritedPermissions: false,
                canManagePermissions: false
            },
            {
                id: folderA.id,
                parentId: null,
                permissions: [],
                hasNonInheritedPermissions: false,
                canManagePermissions: false
            }
        ]);
    });

    it("should not allow updating folder if a user is about to loose access", async () => {
        const identityA: SecurityIdentity = { id: "1", type: "admin", displayName: "A" };
        const identityB: SecurityIdentity = { id: "2", type: "admin", displayName: "B" };

        const { aco: acoIdentityA } = useGraphQlHandler({ identity: identityA });
        const { aco: acoIdentityB } = useGraphQlHandler({ identity: identityB, permissions: [] });

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
                    data: { permissions: [] }
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

    it("should not allow moving a folder to an inaccessible folder", async () => {
        const identityA: SecurityIdentity = { id: "1", type: "admin", displayName: "A" };
        const identityB: SecurityIdentity = { id: "2", type: "admin", displayName: "B" };

        const { aco: acoIdentityA } = useGraphQlHandler({ identity: identityA });
        const { aco: acoIdentityB } = useGraphQlHandler({ identity: identityB, permissions: [] });

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
});
