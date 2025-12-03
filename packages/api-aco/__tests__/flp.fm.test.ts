import { describe, test, expect } from "vitest";
import { useGraphQlHandler } from "./utils/useGraphQlHandler";
import { expectNotAuthorized, expectFileNotAuthorized } from "./utils/expectNotAuthorized.js";
import { mdbid } from "@webiny/utils";
import { AuthenticatedIdentity } from "@webiny/api-core/features/security/IdentityContext/index.js";

const FOLDER_TYPE = "FmFile";

const identityA = new AuthenticatedIdentity({ id: "1", type: "admin", displayName: "A" });
const identityB = new AuthenticatedIdentity({ id: "2", type: "admin", displayName: "B" });
const identityC = new AuthenticatedIdentity({ id: "3", type: "admin", displayName: "C" });

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

const testOptions = { timeout: 100_000 };

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

    test(
        "as a full-access user, I should be able to CRUD files in root folder",
        testOptions,
        async () => {
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
        }
    );

    test(
        "as a non-full-access user, I should be able to CRUD files in root folder",
        testOptions,
        async () => {
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
        }
    );

    test(
        "as a user, I should not be able to CRUD files in an inaccessible folder",
        testOptions,
        async () => {
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
                await expectFileNotAuthorized(
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
            await expectFileNotAuthorized(
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
                await expectFileNotAuthorized(
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
                await expectFileNotAuthorized(
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
        }
    );

    test(
        "as a user, I should not be able to CRUD files in an inaccessible folder (no-access level)",
        testOptions,
        async () => {
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

            // Let's update the folder: identity A assigns `no-access` level to identity B
            await gqlIdentityA.aco.updateFolder({
                id: folder.id,
                data: {
                    permissions: [
                        {
                            target: `admin:${identityB.id}`,
                            level: "no-access"
                        }
                    ]
                }
            });

            // Getting files in the folder should be forbidden for identity B.
            for (let i = 0; i < createdFiles.length; i++) {
                const createdFile = createdFiles[i];
                await expectFileNotAuthorized(
                    gqlIdentityB.fm.getFile({ id: createdFile.id }).then(([response]) => {
                        return response.data.fileManager.getFile;
                    })
                );
            }

            // Listing files in the folder should be forbidden for identity B.
            await expect(
                gqlIdentityB.fm.listFiles().then(([response]) => {
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

            // Creating a file in the folder should be forbidden for identity B.
            await expectFileNotAuthorized(
                gqlIdentityB.fm
                    .createFile({
                        data: createSampleFileData({
                            location: { folderId: folder.id }
                        })
                    })
                    .then(([response]) => {
                        return response.data.fileManager.createFile;
                    })
            );

            // Updating a file in the folder should be forbidden for identity B.
            for (let i = 0; i < createdFiles.length; i++) {
                const createdFile = createdFiles[i];
                await expectFileNotAuthorized(
                    gqlIdentityB.fm
                        .updateFile({
                            id: createdFile.id,
                            data: { name: createdFile.name + "-update" }
                        })
                        .then(([response]) => {
                            return response.data.fileManager.updateFile;
                        })
                );
            }

            // Deleting a file in the folder should be forbidden for identity B.
            for (let i = 0; i < createdFiles.length; i++) {
                const createdFile = createdFiles[i];
                await expectFileNotAuthorized(
                    gqlIdentityB.fm.deleteFile({ id: createdFile.id }).then(([response]) => {
                        return response.data.fileManager.deleteFile;
                    })
                );
            }
        }
    );

    test(
        "as a user, I should not be able to delete folders that have content they cannot see",
        testOptions,
        async () => {
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
                    code: "Aco/Folder/NotEmpty",
                    data: null,
                    message: "Folder is not empty."
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
                })
            );
        }
    );
});
