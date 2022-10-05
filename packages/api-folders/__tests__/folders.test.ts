import useGqlHandler from "./useGqlHandler";
import mocks from "./mocks/folders";

describe("`folders` CRUD", () => {
    const { folders } = useGqlHandler();

    it("should be able to create, read, update and delete `folders`", async () => {
        // Let's create some folders.
        const [responseA] = await folders.create({ data: mocks.folderA });
        const folderA = responseA.data.folders.createFolder.data;
        expect(folderA).toEqual({ id: folderA.id, parentId: null, ...mocks.folderA });

        const [responseB] = await folders.create({ data: mocks.folderB });
        const folderB = responseB.data.folders.createFolder.data;
        expect(folderB).toEqual({ id: folderB.id, ...mocks.folderB });

        const [responseC] = await folders.create({ data: mocks.folderC });
        const folderC = responseC.data.folders.createFolder.data;
        expect(folderC).toEqual({ id: folderC.id, parentId: null, ...mocks.folderC });

        const [responseD] = await folders.create({ data: mocks.folderD });
        const folderD = responseD.data.folders.createFolder.data;
        expect(folderD).toEqual({ id: folderD.id, ...mocks.folderD });

        // Let's check whether both of the folder exists, listing them by `type`.
        const [listResponse] = await folders.list({ where: { type: "page" } });
        expect(listResponse.data.folders.listFolders).toEqual(
            expect.objectContaining({
                data: expect.arrayContaining([
                    expect.objectContaining({
                        name: "Folder A",
                        slug: "folder-a",
                        type: "page",
                        parentId: null
                    }),
                    expect.objectContaining({
                        name: "Folder B",
                        slug: "folder-b",
                        type: "page",
                        parentId: "parent-folder-a"
                    }),
                    expect.objectContaining({
                        name: "Folder C",
                        slug: "folder-c",
                        type: "page",
                        parentId: null
                    })
                ]),
                error: null
            })
        );

        const [listFoldersResponse] = await folders.list({ where: { type: "cms" } });
        expect(listFoldersResponse.data.folders.listFolders).toEqual(
            expect.objectContaining({
                data: expect.arrayContaining([
                    expect.objectContaining({
                        name: "Folder D",
                        slug: "folder-d",
                        type: "cms",
                        parentId: "parent-folder-b"
                    })
                ]),
                error: null
            })
        );

        // Let's update the "folder-b".
        const update = {
            name: "Folder B - updated",
            slug: "folder-b-updated",
            parentId: "parent-folder-a-updated"
        };

        const [updateB] = await folders.update({
            id: folderB.id,
            data: update
        });

        expect(updateB).toEqual({
            data: {
                folders: {
                    updateFolder: {
                        data: {
                            ...mocks.folderB,
                            ...update
                        },
                        error: null
                    }
                }
            }
        });

        // Let's delete "folder-b"
        const [deleteB] = await folders.delete({
            id: folderB.id
        });

        expect(deleteB).toEqual({
            data: {
                folders: {
                    deleteFolder: {
                        data: true,
                        error: null
                    }
                }
            }
        });

        // Should not find "folder-b"
        const [getB] = await folders.get({ id: folderB.id });

        expect(getB).toMatchObject({
            data: {
                folders: {
                    getFolder: {
                        data: null,
                        error: {
                            code: "NOT_FOUND",
                            data: null
                        }
                    }
                }
            }
        });

        // Should find "folder-a" by id
        const [getA] = await folders.get({ id: folderA.id });

        expect(getA).toEqual({
            data: {
                folders: {
                    getFolder: {
                        data: {
                            ...mocks.folderA,
                            parentId: null
                        },
                        error: null
                    }
                }
            }
        });
    });

    it("should delete both parent and children folders", async () => {
        // Let's create a parent folders.
        const [parentResponse] = await folders.create({ data: mocks.folderA });
        const parentFolder = parentResponse.data.folders.createFolder.data;

        // Let's create some children folders.
        const [childResponse1] = await folders.create({
            data: { ...mocks.folderB, parentId: parentFolder.id }
        });
        const childFolder1 = childResponse1.data.folders.createFolder.data;

        expect(childFolder1).toMatchObject({
            parentId: parentFolder.id
        });

        const [childResponse2] = await folders.create({
            data: { ...mocks.folderC, parentId: parentFolder.id }
        });
        const childFolder2 = childResponse2.data.folders.createFolder.data;

        expect(childFolder2).toMatchObject({
            parentId: parentFolder.id
        });

        // Let's delete parent folder.
        const [deleteParent] = await folders.delete({
            id: parentFolder.id
        });

        expect(deleteParent).toEqual({
            data: {
                folders: {
                    deleteFolder: {
                        data: true,
                        error: null
                    }
                }
            }
        });

        // Should not find parent folder.
        const [getParentFolder] = await folders.get({ id: parentFolder.id });

        expect(getParentFolder).toMatchObject({
            data: {
                folders: {
                    getFolder: {
                        data: null,
                        error: {
                            code: "NOT_FOUND",
                            data: null
                        }
                    }
                }
            }
        });

        // Should not find children folders.
        const [getChildFolder1] = await folders.get({ id: childFolder1.id });
        expect(getChildFolder1).toMatchObject({
            data: {
                folders: {
                    getFolder: {
                        data: null,
                        error: {
                            code: "NOT_FOUND",
                            data: null
                        }
                    }
                }
            }
        });

        const [getChildFolder2] = await folders.get({ id: childFolder2.id });
        expect(getChildFolder2).toMatchObject({
            data: {
                folders: {
                    getFolder: {
                        data: null,
                        error: {
                            code: "NOT_FOUND",
                            data: null
                        }
                    }
                }
            }
        });
    });

    it("should not allow creating a `folder` with same `slug`", async () => {
        // Creating a folder
        await folders.create({ data: mocks.folderA });

        // Creating a folder with same "slug" should not be allowed
        const [response] = await folders.create({ data: mocks.folderA });

        expect(response).toEqual({
            data: {
                folders: {
                    createFolder: {
                        data: null,
                        error: {
                            code: "FOLDER_EXISTS",
                            message: `Folder with slug "${mocks.folderA.slug}" already exists.`,
                            data: null
                        }
                    }
                }
            }
        });
    });

    it("should allow creating a `folder` with same `slug` but different `parentId`", async () => {
        // Creating a folder
        await folders.create({ data: mocks.folderA });

        // Creating a folder with same "slug" should not be allowed
        const [response] = await folders.create({
            data: { ...mocks.folderA, parentId: "parent-folder-a" }
        });

        const folder = response.data.folders.createFolder.data;
        expect(folder).toEqual({ id: folder.id, parentId: folder.parentId, ...mocks.folderA });
    });

    it("should not allow updating a non-existing `folder`", async () => {
        const id = "any-id";
        const [result] = await folders.update({
            id,
            data: {
                name: "Any name"
            }
        });

        expect(result.data.folders.updateFolder).toEqual({
            data: null,
            error: {
                code: "NOT_FOUND",
                message: `Folder "${id}" was not found!`,
                data: null
            }
        });
    });
});
