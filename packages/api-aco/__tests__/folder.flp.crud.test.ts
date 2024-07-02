import { useGraphQlHandler } from "./utils/useGraphQlHandler";
import { SecurityIdentity } from "@webiny/api-security/types";
import { expectNotAuthorized } from "./utils/expectNotAuthorized";

const FOLDER_TYPE = "test-folders";

describe("Folder Level Permissions", () => {
    const { aco, until } = useGraphQlHandler();

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

        const foldersList = await until(
            () => {
                return aco.listFolders({ where: { type: FOLDER_TYPE } }).then(([result]) => {
                    return result.data.aco.listFolders.data;
                });
            },
            (data: any) => {
                return data[0].id === folderA.id;
            }
        );

        expect(foldersList).toMatchObject([
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
            },
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

        const foldersList = await until(
            () => {
                return aco.listFolders({ where: { type: FOLDER_TYPE } }).then(([result]) => {
                    return result.data.aco.listFolders.data;
                });
            },
            (data: any) => {
                const lastItem = data[data.length - 1];
                return lastItem.permissions.length === 9;
            }
        );

        expect(foldersList).toMatchObject([
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
        const foldersList = await until(
            () => {
                return acoIdentityA
                    .listFolders({ where: { type: FOLDER_TYPE } })
                    .then(([result]) => {
                        return result.data.aco.listFolders.data;
                    });
            },
            (data: any[]) => {
                return data[0].id === folderA.id;
            }
        );

        expect(foldersList).toMatchObject([
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
            },
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
                id: folderA.id,
                parentId: null,
                permissions: [
                    {
                        target: "admin:2",
                        level: "public",
                        inheritedFrom: "public"
                    }
                ],
                hasNonInheritedPermissions: false,
                canManagePermissions: false
            },
            {
                id: folderB.id,
                parentId: folderA.id,
                permissions: [
                    {
                        target: "admin:2",
                        level: "public",
                        inheritedFrom: `parent:${folderA.id}`
                    }
                ],
                hasNonInheritedPermissions: false,
                canManagePermissions: false
            }
        ]);
    });

    test("when listing folders, meta should show correct information", async () => {
        const createdFolders: any[] = [];
        for (let i = 0; i < 20; i++) {
            const number = i > 9 ? i : `0${i}`;
            const folder = await aco
                .createFolder({
                    data: {
                        title: `Folder ${number}`,
                        slug: `folder-${number}`,
                        type: FOLDER_TYPE
                    }
                })
                .then(([response]) => response.data.aco.createFolder.data);

            createdFolders.push(folder);
        }

        const listFolders = async (params: Record<string, any> = {}) => {
            return aco.listFolders({ ...params, where: { type: FOLDER_TYPE } }).then(([result]) => {
                return result.data.aco.listFolders;
            });
        };

        const foldersList = await until(listFolders, (response: any) => {
            const firstItemExists = response.data[0].id === createdFolders[0].id;
            const lastItemExists = response.data[19].id === createdFolders[19].id;
            return firstItemExists && lastItemExists;
        });

        expect(foldersList).toMatchObject({
            meta: {
                cursor: null,
                hasMoreItems: false,
                totalCount: 20
            }
        });

        await expect(listFolders({ limit: 6 })).resolves.toMatchObject({
            meta: {
                cursor: createdFolders[5].id,
                hasMoreItems: true,
                totalCount: 20
            }
        });

        await expect(listFolders({ limit: 6, after: createdFolders[5].id })).resolves.toMatchObject(
            {
                meta: {
                    cursor: createdFolders[11].id,
                    hasMoreItems: true,
                    totalCount: 20
                }
            }
        );

        await expect(
            listFolders({ limit: 6, after: createdFolders[11].id })
        ).resolves.toMatchObject({
            meta: {
                cursor: createdFolders[17].id,
                hasMoreItems: true,
                totalCount: 20
            }
        });

        const lastPageResult = await listFolders({ limit: 6, after: createdFolders[17].id });

        expect(lastPageResult).toMatchObject({
            data: [{ slug: "folder-18" }, { slug: "folder-19" }],
            error: null,
            meta: {
                cursor: null,
                hasMoreItems: false,
                totalCount: 20
            }
        });
    });

    test("as a user, I should not be able to delete folders that have content they cannot see", async () => {
        const identityA: SecurityIdentity = { id: "1", type: "admin", displayName: "A" };
        const identityB: SecurityIdentity = { id: "2", type: "admin", displayName: "B" };
        const identityC: SecurityIdentity = { id: "3", type: "admin", displayName: "C" };

        const gqlIdentityA = useGraphQlHandler({ identity: identityA });
        const gqlIdentityC = useGraphQlHandler({ identity: identityC, permissions: [] });

        const folderA = await gqlIdentityA.aco
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

        const folderB = await gqlIdentityA.aco
            .createFolder({
                data: {
                    title: "Folder B",
                    slug: "folder-b",
                    parentId: folderA.id,
                    type: FOLDER_TYPE
                }
            })
            .then(([response]) => {
                return response.data.aco.createFolder.data;
            });

        // Deleting folderA should be forbidden because there is content in it. In this case,
        // user actually sees this content, so we expect a "delete all child folders and files"
        // error, not a "not authorized" error.
        await expect(
            gqlIdentityC.aco.deleteFolder({ id: folderA.id }).then(([response]) => {
                return response.data.aco.deleteFolder;
            })
        ).resolves.toMatchObject({
            data: null,
            error: {
                code: "DELETE_FOLDER_WITH_CHILDREN",
                data: {
                    folder: {
                        slug: "folder-a"
                    },
                    hasFolders: true,
                    hasContent: false
                },
                message: "Delete all child folders and files before proceeding."
            }
        });

        // Only identity B (and identity A, the owner) can see the folder B and its files.
        await gqlIdentityA.aco.updateFolder({
            id: folderB.id,
            data: {
                permissions: [
                    {
                        target: `admin:${identityB.id}`,
                        level: "owner"
                    }
                ]
            }
        });

        // Again, deleting folderA should be forbidden because there is content in it. In this
        // case, user doesn't see this content, so we expect a "not authorized" error.
        await expectNotAuthorized(
            gqlIdentityC.aco.deleteFolder({ id: folderA.id }).then(([response]) => {
                return response.data.aco.deleteFolder;
            }),
            {
                folder: { id: folderA.id },

                // There are no entries in the folder, but there is one invisible / inaccessible folder.
                hasContent: false,
                hasFolders: true
            }
        );
    });
});
