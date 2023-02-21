import { folderMocks } from "./mocks/folder.mock";
import { useGraphQlHandler } from "./utils/useGraphQlHandler";

describe("`folder` CRUD", () => {
    const { aco } = useGraphQlHandler();

    it("should be able to create, read, update and delete `folders`", async () => {
        // Let's create some folders.
        const [responseA] = await aco.createFolder({ data: folderMocks.folderA });
        const folderA = responseA.data.aco.createFolder.data;
        expect(folderA).toEqual({ id: folderA.id, parentId: null, ...folderMocks.folderA });

        const [responseB] = await aco.createFolder({ data: folderMocks.folderB });
        const folderB = responseB.data.aco.createFolder.data;
        expect(folderB).toEqual({ id: folderB.id, ...folderMocks.folderB });

        const [responseC] = await aco.createFolder({ data: folderMocks.folderC });
        const folderC = responseC.data.aco.createFolder.data;
        expect(folderC).toEqual({ id: folderC.id, parentId: null, ...folderMocks.folderC });

        const [responseD] = await aco.createFolder({ data: folderMocks.folderD });
        const folderD = responseD.data.aco.createFolder.data;
        expect(folderD).toEqual({ id: folderD.id, ...folderMocks.folderD });

        // Let's check whether both of the folder exists, listing them by `type`.
        const [listResponse] = await aco.listFolders({ where: { type: "page" } });
        expect(listResponse.data.aco.listFolders).toEqual(
            expect.objectContaining({
                data: expect.arrayContaining([
                    expect.objectContaining({
                        title: "Folder A",
                        slug: "folder-a",
                        type: "page",
                        parentId: null
                    }),
                    expect.objectContaining({
                        title: "Folder B",
                        slug: "folder-b",
                        type: "page",
                        parentId: "parent-folder-a"
                    }),
                    expect.objectContaining({
                        title: "Folder C",
                        slug: "folder-c",
                        type: "page",
                        parentId: null
                    })
                ]),
                error: null
            })
        );

        const [listFoldersResponse] = await aco.listFolders({ where: { type: "cms" } });
        expect(listFoldersResponse.data.aco.listFolders).toEqual(
            expect.objectContaining({
                data: expect.arrayContaining([
                    expect.objectContaining({
                        title: "Folder D",
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
            title: "Folder B - updated",
            slug: "folder-b-updated",
            parentId: "parent-folder-a-updated"
        };

        const [updateB] = await aco.updateFolder({
            id: folderB.id,
            data: update
        });

        expect(updateB).toEqual({
            data: {
                aco: {
                    updateFolder: {
                        data: {
                            ...folderMocks.folderB,
                            ...update
                        },
                        error: null
                    }
                }
            }
        });

        // Let's delete "folder-b"
        const [deleteB] = await aco.deleteFolder({
            id: folderB.id
        });

        expect(deleteB).toEqual({
            data: {
                aco: {
                    deleteFolder: {
                        data: true,
                        error: null
                    }
                }
            }
        });

        // Should not find "folder-b"
        const [getB] = await aco.getFolder({ id: folderB.id });

        expect(getB).toMatchObject({
            data: {
                aco: {
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
        const [getA] = await aco.getFolder({ id: folderA.id });

        expect(getA).toEqual({
            data: {
                aco: {
                    getFolder: {
                        data: {
                            ...folderMocks.folderA,
                            parentId: null
                        },
                        error: null
                    }
                }
            }
        });
    });

    it("should NOT delete folder in case has child folders", async () => {
        // Let's create a parent folders.
        const [parentResponse] = await aco.createFolder({ data: folderMocks.folderA });
        const parentFolder = parentResponse.data.aco.createFolder.data;

        // Let's create some children folders.
        const [childResponse1] = await aco.createFolder({
            data: { ...folderMocks.folderB, parentId: parentFolder.id }
        });
        const childFolder1 = childResponse1.data.aco.createFolder.data;

        expect(childFolder1).toMatchObject({
            parentId: parentFolder.id
        });

        const [childResponse2] = await aco.createFolder({
            data: { ...folderMocks.folderC, parentId: parentFolder.id }
        });
        const childFolder2 = childResponse2.data.aco.createFolder.data;

        expect(childFolder2).toMatchObject({
            parentId: parentFolder.id
        });

        // Let's delete parent folder.
        const [deleteParent] = await aco.deleteFolder({
            id: parentFolder.id
        });

        expect(deleteParent).toEqual({
            data: {
                aco: {
                    deleteFolder: {
                        data: null,
                        error: expect.objectContaining({
                            code: "DELETE_FOLDER_WITH_CHILDREN",
                            message:
                                "Error: delete all child folders and entries before proceeding."
                        })
                    }
                }
            }
        });
    });

    it("should not allow creating a `folder` with same `slug`", async () => {
        // Creating a folder
        await aco.createFolder({ data: folderMocks.folderA });

        // Creating a folder with same "slug" should not be allowed
        const [response] = await aco.createFolder({ data: folderMocks.folderA });

        expect(response).toEqual({
            data: {
                aco: {
                    createFolder: {
                        data: null,
                        error: {
                            code: "FOLDER_ALREADY_EXISTS",
                            message: `Folder with slug "${folderMocks.folderA.slug}" already exists at this level.`,
                            data: {
                                params: {
                                    slug: "folder-a",
                                    type: "page"
                                }
                            }
                        }
                    }
                }
            }
        });
    });

    it("should not allow creating a `folder` with `title` too short (min. 3 chars)", async () => {
        const [response] = await aco.createFolder({
            data: {
                ...folderMocks.folderA,
                title: "a"
            }
        });

        expect(response).toEqual({
            data: {
                aco: {
                    createFolder: {
                        data: null,
                        error: {
                            code: "VALIDATION_FAILED",
                            message: "Validation failed.",
                            data: [
                                {
                                    error: "Value is too short.",
                                    fieldId: "title",
                                    storageId: "title"
                                }
                            ]
                        }
                    }
                }
            }
        });
    });

    it("should not allow creating a `folder` with `slug` too short (min. 3 chars)", async () => {
        const [response] = await aco.createFolder({
            data: {
                ...folderMocks.folderA,
                slug: "a"
            }
        });

        expect(response).toEqual({
            data: {
                aco: {
                    createFolder: {
                        data: null,
                        error: {
                            code: "VALIDATION_FAILED",
                            message: "Validation failed.",
                            data: [
                                {
                                    error: "Value is too short.",
                                    fieldId: "slug",
                                    storageId: "slug"
                                }
                            ]
                        }
                    }
                }
            }
        });
    });

    it("should not allow creating a `folder` with `slug` too long (max. 100 chars)", async () => {
        const [response] = await aco.createFolder({
            data: {
                ...folderMocks.folderA,
                slug: "GpfyMLeacJyRzF5SmXhK9ytFf0UVtkzB0IORUwiPbqnXLyXBZX88tfy92vsnOEF87IVW0DnYDQLLlCl09hN3tcdKGAaO0oLh2bJrE"
            }
        });

        expect(response).toEqual({
            data: {
                aco: {
                    createFolder: {
                        data: null,
                        error: {
                            code: "VALIDATION_FAILED",
                            message: "Validation failed.",
                            data: [
                                {
                                    error: "Value is too long.",
                                    fieldId: "slug",
                                    storageId: "slug"
                                }
                            ]
                        }
                    }
                }
            }
        });
    });

    it("should not allow creating a `folder` with `slug` with wrong pattern", async () => {
        const [response] = await aco.createFolder({
            data: {
                ...folderMocks.folderA,
                slug: "wrong pattern"
            }
        });

        expect(response).toEqual({
            data: {
                aco: {
                    createFolder: {
                        data: null,
                        error: {
                            code: "VALIDATION_FAILED",
                            message: "Validation failed.",
                            data: [
                                {
                                    error: "Value must consist of only 'a-z', '0-9' and '-'.",
                                    fieldId: "slug",
                                    storageId: "slug"
                                }
                            ]
                        }
                    }
                }
            }
        });
    });

    it("should allow creating a `folder` with same `slug` but different `parentId`", async () => {
        // Creating a folder
        await aco.createFolder({ data: folderMocks.folderA });

        // Creating a folder with same "slug" should not be allowed
        const [response] = await aco.createFolder({
            data: { ...folderMocks.folderA, parentId: "parent-folder-a" }
        });

        const folder = response.data.aco.createFolder.data;
        expect(folder).toEqual({
            id: folder.id,
            parentId: folder.parentId,
            ...folderMocks.folderA
        });
    });

    it("should not allow updating a non-existing `folder`", async () => {
        const id = "any-id";
        const [result] = await aco.updateFolder({
            id,
            data: {
                title: "Any name"
            }
        });

        expect(result.data.aco.updateFolder).toEqual({
            data: null,
            error: {
                code: "NOT_FOUND",
                message: `Entry by ID "${id}" not found.`,
                data: null
            }
        });
    });

    it("should not allow updating in case a folder with same `slug` at the same level (a.k.a. `parentId`) already exists.", async () => {
        // Creating "Folder A"
        const [responseA] = await aco.createFolder({ data: folderMocks.folderA });
        const folderA = responseA.data.aco.createFolder.data;

        // Creating "Folder B"
        const [responseB] = await aco.createFolder({ data: folderMocks.folderB });
        const folderB = responseB.data.aco.createFolder.data;

        // Updating "Folder B" with same "slug" of "Folder A" should not be allowed
        const [update] = await aco.updateFolder({
            id: folderB.id,
            data: { slug: folderA.slug, parentId: null }
        });

        expect(update).toEqual({
            data: {
                aco: {
                    updateFolder: {
                        data: null,
                        error: expect.objectContaining({
                            code: "FOLDER_ALREADY_EXISTS",
                            message: `Folder with slug "${folderMocks.folderA.slug}" already exists at this level.`
                        })
                    }
                }
            }
        });
    });
});
