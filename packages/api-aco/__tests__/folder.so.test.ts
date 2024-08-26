import { mdbid } from "@webiny/utils";
import { folderMocks } from "./mocks/folder.mock";
import { useGraphQlHandler } from "./utils/useGraphQlHandler";
import { userMock } from "~tests/mocks/user.mock";

const createSampleFileData = (overrides: Record<string, any> = {}) => {
    const id = mdbid();
    return {
        id,
        type: "image/jpeg",
        name: "image-48.jpg",
        size: 269965,
        key: `${id}/image.jpg`,
        tags: [],
        location: {
            folderId: ""
        },
        ...overrides
    };
};

describe("`folder` CRUD", () => {
    let folder1: Record<string, any>;
    let folder2: Record<string, any>;
    let aco: ReturnType<typeof useGraphQlHandler>["aco"];
    let fm: ReturnType<typeof useGraphQlHandler>["fm"];
    let cms: ReturnType<typeof useGraphQlHandler>["cms"];

    beforeEach(async () => {
        const handler = useGraphQlHandler({});

        folder1 = await handler.aco
            .createFolder({
                data: {
                    title: "Folder 1",
                    slug: "folder-1",
                    type: "xyz"
                }
            })
            .then(([response]) => {
                return response.data.aco.createFolder.data;
            });

        folder2 = await handler.aco
            .createFolder({
                data: {
                    title: "Folder 2",
                    slug: "folder-2",
                    type: "xyz"
                }
            })
            .then(([response]) => {
                return response.data.aco.createFolder.data;
            });

        aco = handler.aco;
        fm = handler.fm;
        cms = handler.cms;
    });

    it("should be able to create, read, update and delete `folders`", async () => {
        const [responseA] = await aco.createFolder({ data: folderMocks.folderA });
        const folderA = responseA.data.aco.createFolder.data;

        expect(folderA).toMatchObject({
            id: folderA.id,
            parentId: null,
            createdBy: userMock,
            ...folderMocks.folderA
        });

        const [responseB] = await aco.createFolder({
            data: { ...folderMocks.folderB, parentId: folder1.id }
        });

        const folderB = responseB.data.aco.createFolder.data;
        expect(folderB).toMatchObject({
            id: folderB.id,
            createdBy: userMock,
            ...folderMocks.folderB,
            parentId: folder1.id
        });

        const [responseC] = await aco.createFolder({ data: folderMocks.folderC });
        const folderC = responseC.data.aco.createFolder.data;
        expect(folderC).toMatchObject({
            id: folderC.id,
            parentId: null,
            createdBy: userMock,
            ...folderMocks.folderC
        });

        const [responseD] = await aco.createFolder({
            data: { ...folderMocks.folderD, parentId: folder2.id }
        });
        const folderD = responseD.data.aco.createFolder.data;
        expect(folderD).toMatchObject({
            id: folderD.id,
            createdBy: userMock,
            ...folderMocks.folderD,
            parentId: folder2.id
        });

        // Let's check whether both of the folder exists, listing them by `type`.
        const [listResponse] = await aco.listFolders({ where: { type: "page" } });
        expect(listResponse.data.aco.listFolders).toMatchObject({
            data: [
                {
                    parentId: null,
                    slug: "folder-a",
                    type: "page"
                },
                {
                    parentId: folder1.id,
                    slug: "folder-b",
                    type: "page"
                },
                {
                    parentId: null,
                    slug: "folder-c",
                    type: "page"
                }
            ],
            error: null,
            meta: {
                cursor: null,
                hasMoreItems: false,
                totalCount: 3
            }
        });

        const [listFoldersResponse] = await aco.listFolders({ where: { type: "cms" } });
        expect(listFoldersResponse.data.aco.listFolders).toMatchObject({
            data: [
                {
                    parentId: folder2.id,
                    slug: "folder-d",
                    title: "Folder D",
                    type: "cms"
                }
            ],
            error: null,
            meta: {
                cursor: null,
                hasMoreItems: false,
                totalCount: 1
            }
        });

        // Let's filter records using `createdBy`
        const [existingUserResponse] = await aco.listFolders({
            where: { type: "page", createdBy: userMock.id }
        });

        expect(existingUserResponse.data.aco.listFolders.data.length).toEqual(3);
        expect(existingUserResponse.data.aco.listFolders.error).toBeNull();

        // TODO: enable this back once we've found the best way to support this.
        // const [nonExistingUserResponse] = await aco.listFolders({
        //     where: { type: "page", createdBy: "any-id" }
        // });
        //
        // expect(nonExistingUserResponse.data.aco.listFolders).toEqual(
        //     expect.objectContaining({
        //         data: [],
        //         error: null
        //     })
        // );

        // Let's update the "folder-b".
        const update = {
            title: "Folder B - updated",
            slug: "folder-b-updated",
            parentId: folder2.id
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
                            ...folderB,
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
                            ...folderA,
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
                            message: "Delete all child folders and entries before proceeding."
                        })
                    }
                }
            }
        });
    });

    it("should NOT delete `FmFile` folder in case has child file", async () => {
        // Let's create a folder.
        const [folderResponse] = await aco.createFolder({
            data: { ...folderMocks.folderA, type: "FmFile" }
        });
        const folder = folderResponse.data.aco.createFolder.data;

        // Let's create a file within the folder.
        const [fileResponse] = await fm.createFile({
            data: {
                ...createSampleFileData(),
                location: {
                    folderId: folder.id
                }
            }
        });

        const file = fileResponse.data.fileManager.createFile.data;

        // Let's try to delete the folder.
        const [failedResponse] = await aco.deleteFolder({ id: folder.id });

        expect(failedResponse).toEqual({
            data: {
                aco: {
                    deleteFolder: {
                        data: null,
                        error: expect.objectContaining({
                            code: "DELETE_FOLDER_WITH_CHILDREN",
                            message: "Delete all child folders and entries before proceeding."
                        })
                    }
                }
            }
        });

        // Let's delete the file.
        await fm.deleteFile({
            id: file.id
        });

        const [succesfullResponse] = await aco.deleteFolder({ id: folder.id });

        expect(succesfullResponse).toEqual({
            data: {
                aco: {
                    deleteFolder: {
                        data: true,
                        error: null
                    }
                }
            }
        });

        // Let's list folders.
        const [listFolderResponse] = await aco.listFolders({ where: { type: "FmFile" } });

        expect(listFolderResponse).toEqual({
            data: {
                aco: {
                    listFolders: {
                        data: [],
                        error: null,
                        meta: {
                            cursor: null,
                            hasMoreItems: false,
                            totalCount: 0
                        }
                    }
                }
            }
        });
    });

    it("should NOT delete `HCMS` folder in case has child entry", async () => {
        // Let's create model and group.
        const modelGroup = await cms.createTestModelGroup();
        const model = await cms.createBasicModel({ modelGroup: modelGroup.id });

        // Let's create a folder.
        const [folderResponse] = await aco.createFolder({
            data: { ...folderMocks.folderA, type: `cms:${model.modelId}` }
        });
        const folder = folderResponse.data.aco.createFolder.data;

        // Let's create an entry within the folder.
        const [entryResponse] = await cms.createEntry(model, {
            data: {
                title: "Test entry",
                wbyAco_location: {
                    folderId: folder.id
                }
            }
        });

        const entry = entryResponse.data.createBasicTestModel.data;

        // Let's try to delete the folder.
        const [failedResponse] = await aco.deleteFolder({ id: folder.id });

        expect(failedResponse).toEqual({
            data: {
                aco: {
                    deleteFolder: {
                        data: null,
                        error: expect.objectContaining({
                            code: "DELETE_FOLDER_WITH_CHILDREN",
                            message: "Delete all child folders and entries before proceeding."
                        })
                    }
                }
            }
        });

        // Let's delete the entry.
        await cms.deleteEntry(model, {
            revision: entry.id
        });

        const [succesfullResponse] = await aco.deleteFolder({ id: folder.id });

        expect(succesfullResponse).toEqual({
            data: {
                aco: {
                    deleteFolder: {
                        data: true,
                        error: null
                    }
                }
            }
        });

        // Let's list folders.
        const [listFolderResponse] = await aco.listFolders({ where: { type: "basicTestModel" } });

        expect(listFolderResponse).toEqual({
            data: {
                aco: {
                    listFolders: {
                        data: [],
                        error: null,
                        meta: {
                            cursor: null,
                            hasMoreItems: false,
                            totalCount: 0
                        }
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

    it("should not allow creating a `folder` with no `title` provided", async () => {
        const [response] = await aco.createFolder({
            data: {
                ...folderMocks.folderA,
                title: ""
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
                                    error: "Value is required.",
                                    fieldId: "title",
                                    storageId: "text@title",
                                    id: "title",
                                    parents: []
                                }
                            ]
                        }
                    }
                }
            }
        });
    });

    it("should not allow creating a `folder` with no `slug` provided", async () => {
        const [response] = await aco.createFolder({
            data: {
                ...folderMocks.folderA,
                slug: ""
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
                                    error: "Value is required.",
                                    fieldId: "slug",
                                    storageId: "text@slug",
                                    id: "slug",
                                    parents: []
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
                                    storageId: "text@slug",
                                    id: "slug",
                                    parents: []
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
            data: { ...folderMocks.folderA, parentId: folder1.id }
        });

        const folder = response.data.aco.createFolder.data;
        expect(folder).toMatchObject({
            id: folder.id,
            parentId: folder1.id,
            createdBy: userMock,
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
        const [responseB] = await aco.createFolder({
            data: { ...folderMocks.folderB, parentId: folder1.id }
        });
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

    it("should enforce security rules", async () => {
        const { aco: anonymousAco } = useGraphQlHandler({ identity: null });
        const { aco } = useGraphQlHandler();

        const notAuthorizedResponse = {
            data: null,
            error: {
                code: "SECURITY_NOT_AUTHORIZED",
                message: "Not authorized!",
                data: null
            }
        };

        // Create with anonymous identity
        {
            const [responseA] = await anonymousAco.createFolder({ data: folderMocks.folderA });
            const folderA = responseA.data.aco.createFolder;
            expect(folderA).toEqual(notAuthorizedResponse);
        }

        // Let's create some a dummy folder
        const [responseA] = await aco.createFolder({ data: folderMocks.folderA });
        const folderA = responseA.data.aco.createFolder.data;
        expect(folderA).toMatchObject({
            id: folderA.id,
            parentId: null,
            createdBy: userMock,
            ...folderMocks.folderA
        });

        // List with anonymous identity
        {
            const [listResponse] = await anonymousAco.listFolders({ where: { type: "page" } });
            expect(listResponse.data.aco.listFolders).toEqual(
                expect.objectContaining(notAuthorizedResponse)
            );
        }

        // Get with anonymous identity
        {
            const [getResponse] = await anonymousAco.getFolder({ id: folderA.id });
            expect(getResponse.data.aco.getFolder).toEqual(
                expect.objectContaining(notAuthorizedResponse)
            );
        }

        // Update with anonymous identity
        {
            const [updateResponse] = await anonymousAco.updateFolder({
                id: folderA.id,
                data: { title: `${folderA.title} + update` }
            });
            expect(updateResponse.data.aco.updateFolder).toEqual(
                expect.objectContaining(notAuthorizedResponse)
            );
        }

        // Delete with anonymous identity
        {
            const [deleteResponse] = await anonymousAco.deleteFolder({
                id: folderA.id
            });
            expect(deleteResponse.data.aco.deleteFolder).toEqual(
                expect.objectContaining(notAuthorizedResponse)
            );
        }
    });
});
