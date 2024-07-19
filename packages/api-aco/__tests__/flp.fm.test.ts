import { useGraphQlHandler } from "./utils/useGraphQlHandler";
import { expectNotAuthorized } from "./utils/expectNotAuthorized";
import { SecurityIdentity } from "@webiny/api-security/types";
import { mdbid } from "@webiny/utils";

jest.setTimeout(100_000);

const FOLDER_TYPE = "FmFile";

const identityA: SecurityIdentity = { id: "1", type: "admin", displayName: "A" };
const identityB: SecurityIdentity = { id: "2", type: "admin", displayName: "B" };
const identityC: SecurityIdentity = { id: "3", type: "admin", displayName: "C" };

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

describe("Folder Level Permissions - File Manager GraphQL API", () => {
    const gqlIdentityA = useGraphQlHandler({ identity: identityA });
    const gqlIdentityB = useGraphQlHandler({
        identity: identityB,
        permissions: [{ name: "fm.*" }]
    });
    const gqlIdentityC = useGraphQlHandler({
        identity: identityC,
        permissions: [{ name: "fm.*" }]
    });

    test.todo("as a user without FM permissions, I should not be able to CRUD files");

    test("as a full-access user, I should be able to CRUD files in root folder", async () => {
        const createdFiles = [];
        for (let i = 1; i <= 4; i++) {
            createdFiles.push(
                await gqlIdentityA.fm
                    .createFile({ data: createSampleFileData() })
                    .then(([response]) => {
                        return response.data.fileManager.createFile.data;
                    })
            );
        }

        await expect(
            gqlIdentityA.fm.listFiles().then(([response]) => {
                return response.data.fileManager.listFiles.data;
            })
        ).resolves.toHaveLength(4);

        for (let i = 0; i < createdFiles.length; i++) {
            const createdFile = createdFiles[i];
            await expect(
                gqlIdentityA.fm.getFile({ id: createdFile.id }).then(([response]) => {
                    return response.data.fileManager.getFile.data;
                })
            ).resolves.toEqual(createdFiles[i]);
        }
    });

    test("as a non-full-access user, I should be able to CRUD files in root folder", async () => {
        const createdFiles = [];
        for (let i = 1; i <= 4; i++) {
            createdFiles.push(
                await gqlIdentityB.fm
                    .createFile({ data: createSampleFileData() })
                    .then(([response]) => {
                        return response.data.fileManager.createFile.data;
                    })
            );
        }

        await expect(
            gqlIdentityB.fm.listFiles().then(([response]) => {
                return response.data.fileManager.listFiles.data;
            })
        ).resolves.toHaveLength(4);

        for (let i = 0; i < createdFiles.length; i++) {
            const createdFile = createdFiles[i];
            await expect(
                gqlIdentityB.fm.getFile({ id: createdFile.id }).then(([response]) => {
                    return response.data.fileManager.getFile.data;
                })
            ).resolves.toEqual(createdFiles[i]);
        }
    });

    test("as a user, I should not be able to CRUD files in an inaccessible folder", async () => {
        const folder = await gqlIdentityA.aco
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

        const createdFiles = [];
        for (let i = 1; i <= 4; i++) {
            createdFiles.push(
                await gqlIdentityA.fm
                    .createFile({
                        data: createSampleFileData({
                            location: { folderId: folder.id }
                        })
                    })
                    .then(([response]) => {
                        return response.data.fileManager.createFile.data;
                    })
            );
        }

        // Only identity B (and identity A, the owner) can see the folder and its files.
        await gqlIdentityA.aco.updateFolder({
            id: folder.id,
            data: {
                permissions: [
                    {
                        target: `admin:${identityB.id}`,
                        level: "owner"
                    }
                ]
            }
        });

        // Getting files in the folder should be forbidden for identity C.
        for (let i = 0; i < createdFiles.length; i++) {
            const createdFile = createdFiles[i];
            await expectNotAuthorized(
                gqlIdentityC.fm.getFile({ id: createdFile.id }).then(([response]) => {
                    return response.data.fileManager.getFile;
                })
            );
        }

        // Listing files in the folder should be forbidden for identity C.
        await expect(
            gqlIdentityC.fm.listFiles().then(([response]) => {
                return response.data.fileManager.listFiles;
            })
        ).resolves.toEqual({
            data: [],
            error: null,
            meta: {
                cursor: null,
                hasMoreItems: false,
                totalCount: 0
            }
        });

        // Creating a file in the folder should be forbidden for identity C.
        await expectNotAuthorized(
            gqlIdentityC.fm
                .createFile({
                    data: createSampleFileData({
                        location: { folderId: folder.id }
                    })
                })
                .then(([response]) => {
                    return response.data.fileManager.createFile;
                })
        );

        // Updating a file in the folder should be forbidden for identity C.
        for (let i = 0; i < createdFiles.length; i++) {
            const createdFile = createdFiles[i];
            await expectNotAuthorized(
                gqlIdentityC.fm
                    .updateFile({
                        id: createdFile.id,
                        data: { name: createdFile.name + "-update" }
                    })
                    .then(([response]) => {
                        return response.data.fileManager.updateFile;
                    })
            );
        }

        // Deleting a file in the folder should be forbidden for identity C.
        for (let i = 0; i < createdFiles.length; i++) {
            const createdFile = createdFiles[i];
            await expectNotAuthorized(
                gqlIdentityC.fm.deleteFile({ id: createdFile.id }).then(([response]) => {
                    return response.data.fileManager.deleteFile;
                })
            );
        }

        // Set identity C as owner of the folder. CRUD should now be allowed.
        await gqlIdentityA.aco.updateFolder({
            id: folder.id,
            data: {
                permissions: [
                    {
                        target: `admin:${identityC.id}`,
                        level: "owner"
                    }
                ]
            }
        });

        // Getting files in the folder should be now allowed for identity C.
        for (let i = 0; i < createdFiles.length; i++) {
            const createdFile = createdFiles[i];
            await expect(
                gqlIdentityC.fm.getFile({ id: createdFile.id }).then(([response]) => {
                    return response.data.fileManager.getFile;
                })
            ).resolves.toMatchObject({
                data: { id: createdFile.id },
                error: null
            });
        }

        // Listing files in the folder should be now allowed for identity C.
        await expect(
            gqlIdentityC.fm.listFiles().then(([response]) => {
                return response.data.fileManager.listFiles;
            })
        ).resolves.toMatchObject({
            data: [
                { id: createdFiles[3].id },
                { id: createdFiles[2].id },
                { id: createdFiles[1].id },
                { id: createdFiles[0].id }
            ],
            error: null,
            meta: {
                cursor: null,
                hasMoreItems: false,
                totalCount: 4
            }
        });

        // Creating a file in the folder should be now allowed for identity C.
        await expect(
            gqlIdentityC.fm
                .createFile({
                    data: createSampleFileData({
                        location: { folderId: folder.id }
                    })
                })
                .then(([response]) => {
                    return response.data.fileManager.createFile;
                })
        ).resolves.toMatchObject({
            data: { id: expect.any(String) }
        });

        // Updating a file in the folder should be now allowed for identity C.
        for (let i = 0; i < createdFiles.length; i++) {
            const createdFile = createdFiles[i];
            await expect(
                gqlIdentityC.fm
                    .updateFile({
                        id: createdFile.id,
                        data: { name: createdFile.name + "-update" }
                    })
                    .then(([response]) => {
                        return response.data.fileManager.updateFile;
                    })
            ).resolves.toMatchObject({
                data: { name: createdFile.name + "-update" }
            });
        }

        // Deleting a file in the folder should be now allowed for identity C.
        for (let i = 0; i < createdFiles.length; i++) {
            const createdFile = createdFiles[i];
            await expect(
                gqlIdentityC.fm.deleteFile({ id: createdFile.id }).then(([response]) => {
                    return response.data.fileManager.deleteFile;
                })
            ).resolves.toMatchObject({ data: true, error: null });
        }
    });

    test("as a user, I should not be able to delete folders that have content they cannot see", async () => {
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

        for (let i = 1; i <= 4; i++) {
            await gqlIdentityA.fm.createFile({
                data: createSampleFileData({
                    location: { folderId: folderB.id }
                })
            });
        }

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
                message: "Delete all child folders and entries before proceeding."
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
