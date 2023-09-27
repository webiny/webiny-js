import { useGraphQlHandler } from "./utils/useGraphQlHandler";

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
                    target: "user:12345678"
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
                    target: "user:12345678"
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
                    target: "user:12345678"
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
                    target: "user:12345678"
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
                    target: "user:12345678"
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
                    target: "user:12345678"
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
                        target: "user:12345678"
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
                        target: "user:12345678"
                    }
                ]
            }
        ]);
    });

    it('should not allow passing targets that don\'t start with "user:" or "team:" prefixes', async () => {
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
                        permissions: [{ level: "owner", target: "user:xyz", inheritedFrom: "xyz" }]
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
                        { target: "user:u1", level: "owner" },
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
                        { target: "user:u2", level: "editor" },
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
                        { target: "user:u3", level: "viewer" },
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
                        { target: "user:u4", level: "owner" },
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
                        target: "user:12345678"
                    },
                    { inheritedFrom: null, level: "owner", target: "user:u4" },
                    { inheritedFrom: null, level: "owner", target: "team:t4" },
                    { inheritedFrom: `parent:${folderC.id}`, level: "viewer", target: "user:u3" },
                    { inheritedFrom: `parent:${folderC.id}`, level: "viewer", target: "team:t3" },
                    { inheritedFrom: `parent:${folderC.id}`, level: "editor", target: "user:u2" },
                    { inheritedFrom: `parent:${folderC.id}`, level: "editor", target: "team:t2" },
                    { inheritedFrom: `parent:${folderC.id}`, level: "owner", target: "user:u1" },
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
                        target: "user:12345678"
                    },
                    { inheritedFrom: null, level: "viewer", target: "user:u3" },
                    { inheritedFrom: null, level: "viewer", target: "team:t3" },
                    { inheritedFrom: `parent:${folderB.id}`, level: "editor", target: "user:u2" },
                    { inheritedFrom: `parent:${folderB.id}`, level: "editor", target: "team:t2" },
                    { inheritedFrom: `parent:${folderB.id}`, level: "owner", target: "user:u1" },
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
                        target: "user:12345678"
                    },
                    { inheritedFrom: null, level: "editor", target: "user:u2" },
                    { inheritedFrom: null, level: "editor", target: "team:t2" },
                    { inheritedFrom: `parent:${folderA.id}`, level: "owner", target: "user:u1" },
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
                        target: "user:12345678"
                    },
                    {
                        inheritedFrom: null,
                        level: "owner",
                        target: "user:u1"
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
});
