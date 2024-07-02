import { useGraphQlHandler } from "./utils/useGraphQlHandler";
import { SecurityIdentity } from "@webiny/api-security/types";
import { expectNotAuthorized } from "./utils/expectNotAuthorized";

const identityA: SecurityIdentity = { id: "1", type: "admin", displayName: "A" };
const identityB: SecurityIdentity = { id: "2", type: "admin", displayName: "B" };
const identityC: SecurityIdentity = { id: "3", type: "admin", displayName: "C" };

describe("Folder Level Permissions - File Manager GraphQL API", () => {
    const gqlIdentityA = useGraphQlHandler({ identity: identityA });

    test.todo("as a user without FM permissions, I should not be able to CRUD content");

    test("as a full-access user, I should be able to CRUD content in root folder", async () => {
        const modelGroup = await gqlIdentityA.cms.createTestModelGroup();
        const model = await gqlIdentityA.cms.createBasicModel({ modelGroup: modelGroup.id });

        const entries = [];
        for (let i = 1; i <= 4; i++) {
            entries.push(
                await gqlIdentityA.cms
                    .createEntry(model, { data: { title: `Test-${i}` } })
                    .then(([response]) => {
                        return response.data.createBasicTestModel.data;
                    })
            );
        }

        await expect(
            gqlIdentityA.cms.listEntries(model).then(([response]) => {
                return response.data.listBasicTestModels.data;
            })
        ).resolves.toHaveLength(4);

        for (let i = 0; i < entries.length; i++) {
            const createdEntry = entries[i];
            await expect(
                gqlIdentityA.cms
                    .getEntry(model, { revision: createdEntry.id })
                    .then(([response]) => {
                        return response.data.getBasicTestModel.data;
                    })
            ).resolves.toEqual(entries[i]);
        }
    });

    test("as a non-full-access user, I should be able to CRUD content in root folder", async () => {
        const modelGroup = await gqlIdentityA.cms.createTestModelGroup();
        const model = await gqlIdentityA.cms.createBasicModel({ modelGroup: modelGroup.id });

        const entries = [];
        for (let i = 1; i <= 4; i++) {
            entries.push(
                await gqlIdentityA.cms
                    .createEntry(model, { data: { title: `Test-${i}` } })
                    .then(([response]) => {
                        return response.data.createBasicTestModel.data;
                    })
            );
        }

        await expect(
            gqlIdentityA.cms.listEntries(model).then(([response]) => {
                return response.data.listBasicTestModels.data;
            })
        ).resolves.toHaveLength(4);

        for (let i = 0; i < entries.length; i++) {
            const createdEntry = entries[i];
            await expect(
                gqlIdentityA.cms
                    .getEntry(model, { revision: createdEntry.id })
                    .then(([response]) => {
                        return response.data.getBasicTestModel.data;
                    })
            ).resolves.toEqual(entries[i]);
        }
    });

    test("as a user, I should not be able to CRUD content in an inaccessible folder", async () => {
        const gqlIdentityA = useGraphQlHandler({ identity: identityA });
        const gqlIdentityC = useGraphQlHandler({
            identity: identityC,
            permissions: [{ name: "cms.*" }]
        });
        const modelGroup = await gqlIdentityA.cms.createTestModelGroup();
        const model = await gqlIdentityA.cms.createBasicModel({ modelGroup: modelGroup.id });

        const folder = await gqlIdentityA.aco
            .createFolder({
                data: {
                    title: "Folder A",
                    slug: "folder-a",
                    type: `cms:${model.modelId}`
                }
            })
            .then(([response]) => {
                return response.data.aco.createFolder.data;
            });

        const entries = [];
        for (let i = 1; i <= 4; i++) {
            entries.push(
                await gqlIdentityA.cms
                    .createEntry(model, {
                        data: {
                            title: `Test-${i}`,
                            wbyAco_location: {
                                folderId: folder.id
                            }
                        }
                    })
                    .then(([response]) => {
                        return response.data.createBasicTestModel.data;
                    })
            );
        }

        // Only identity B (and identity A, the owner) can see the folder and its content.
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

        // Getting content in the folder should be forbidden for identity C.
        for (let i = 0; i < entries.length; i++) {
            const createdEntry = entries[i];
            await expectNotAuthorized(
                gqlIdentityC.cms
                    .getEntry(model, { revision: createdEntry.id })
                    .then(([response]) => {
                        return response.data.getBasicTestModel;
                    })
            );
        }

        // Listing content in the folder should be forbidden for identity C.
        await expect(
            gqlIdentityC.cms
                .listEntries(model, {
                    where: {
                        wbyAco_location: {
                            folderId: folder.id
                        }
                    }
                })
                .then(([response]) => {
                    return response.data.listBasicTestModels;
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

        // Creating content in the folder should be forbidden for identity C.
        await expectNotAuthorized(
            gqlIdentityC.cms
                .createEntry(model, {
                    data: {
                        title: `Test-5`,
                        wbyAco_location: {
                            folderId: folder.id
                        }
                    }
                })
                .then(([response]) => {
                    return response.data.createBasicTestModel;
                })
        );

        // Updating content in the folder should be forbidden for identity C.
        for (let i = 0; i < entries.length; i++) {
            const createdEntry = entries[i];
            await expectNotAuthorized(
                gqlIdentityC.cms
                    .updateEntry(model, {
                        revision: createdEntry.id,
                        data: { title: createdEntry.title + "-update" }
                    })
                    .then(([response]) => {
                        return response.data.updateBasicTestModel;
                    })
            );
        }

        // Deleting a file in the folder should be forbidden for identity C.
        for (let i = 0; i < entries.length; i++) {
            const createdEntry = entries[i];
            await expectNotAuthorized(
                gqlIdentityC.cms
                    .deleteEntry(model, { revision: createdEntry.id })
                    .then(([response]) => {
                        return response.data.deleteBasicTestModel;
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

        // Getting content in the folder should be forbidden for identity C.
        for (let i = 0; i < entries.length; i++) {
            const createdEntry = entries[i];
            await expect(
                gqlIdentityC.cms
                    .getEntry(model, { revision: createdEntry.id })
                    .then(([response]) => {
                        return response.data.getBasicTestModel;
                    })
            ).resolves.toMatchObject({
                data: { id: createdEntry.id },
                error: null
            });
        }

        // Listing content in the folder should be now allowed for identity C.
        await expect(
            gqlIdentityC.cms
                .listEntries(model, {
                    where: {
                        wbyAco_location: {
                            folderId: folder.id
                        }
                    }
                })
                .then(([response]) => {
                    return response.data.listBasicTestModels;
                })
        ).resolves.toMatchObject({
            data: [
                { id: entries[3].id },
                { id: entries[2].id },
                { id: entries[1].id },
                { id: entries[0].id }
            ],
            error: null,
            meta: {
                cursor: null,
                hasMoreItems: false,
                totalCount: 4
            }
        });

        // Creating content in the folder should be now allowed for identity C.
        await expect(
            gqlIdentityC.cms
                .createEntry(model, { data: { title: `Test-5` } })
                .then(([response]) => {
                    return response.data.createBasicTestModel;
                })
        ).resolves.toMatchObject({
            data: { id: expect.any(String) }
        });

        // Updating content in the folder should be now allowed for identity C.
        for (let i = 0; i < entries.length; i++) {
            const createdEntry = entries[i];
            await expect(
                gqlIdentityC.cms
                    .updateEntry(model, {
                        revision: createdEntry.id,
                        data: { title: createdEntry.title + "-update" }
                    })
                    .then(([response]) => {
                        return response.data.updateBasicTestModel;
                    })
            ).resolves.toMatchObject({
                data: { title: createdEntry.title + "-update" }
            });
        }

        // Deleting a file in the folder should be now allowed for identity C.
        for (let i = 0; i < entries.length; i++) {
            const createdEntry = entries[i];
            await expect(
                gqlIdentityC.cms
                    .deleteEntry(model, { revision: createdEntry.id })
                    .then(([response]) => {
                        return response.data.deleteBasicTestModel;
                    })
            ).resolves.toMatchObject({ data: true, error: null });
        }
    });

    it("as a user with 'viewer' access to a folder, I should not be able to create, update, or delete content in it", async () => {
        const gqlIdentityA = useGraphQlHandler({ identity: identityA });
        const gqlIdentityC = useGraphQlHandler({
            identity: identityC,
            permissions: [{ name: "cms.*" }]
        });

        const modelGroup = await gqlIdentityA.cms.createTestModelGroup();
        const model = await gqlIdentityA.cms.createBasicModel({ modelGroup: modelGroup.id });

        const folder = await gqlIdentityA.aco
            .createFolder({
                data: {
                    title: "Folder A",
                    slug: "folder-a",
                    type: `cms:${model.modelId}`
                }
            })
            .then(([response]) => {
                return response.data.aco.createFolder.data;
            });

        const createdEntry = await gqlIdentityA.cms
            .createEntry(model, {
                data: {
                    title: `Test entry`,
                    wbyAco_location: {
                        folderId: folder.id
                    }
                }
            })
            .then(([response]) => {
                return response.data.createBasicTestModel.data;
            });

        // Set identity B as viewer of the folder. No create, update, or delete operations should be allowed.
        await gqlIdentityA.aco.updateFolder({
            id: folder.id,
            data: {
                permissions: [
                    {
                        target: `admin:${identityC.id}`,
                        level: "viewer"
                    }
                ]
            }
        });

        // Getting content in the folder should be allowed for identity C.
        await expect(
            gqlIdentityC.cms.getEntry(model, { revision: createdEntry.id }).then(([response]) => {
                return response.data.getBasicTestModel;
            })
        ).resolves.toMatchObject({
            data: { id: createdEntry.id },
            error: null
        });

        // Listing content in the folder should be now allowed for identity C.
        await expect(
            gqlIdentityC.cms
                .listEntries(model, {
                    where: {
                        wbyAco_location: {
                            folderId: folder.id
                        }
                    }
                })
                .then(([response]) => {
                    return response.data.listBasicTestModels;
                })
        ).resolves.toMatchObject({
            data: [{ id: createdEntry.id }],
            error: null,
            meta: {
                cursor: null,
                hasMoreItems: false,
                totalCount: 1
            }
        });

        // Creating content in the folder should be forbidden for identity C.
        await expectNotAuthorized(
            gqlIdentityC.cms
                .createEntry(model, {
                    data: {
                        title: `Test-5`,
                        wbyAco_location: {
                            folderId: folder.id
                        }
                    }
                })
                .then(([response]) => {
                    return response.data.createBasicTestModel;
                })
        );

        // Updating content in the folder should be forbidden for identity C.
        await expectNotAuthorized(
            gqlIdentityC.cms
                .updateEntry(model, {
                    revision: createdEntry.id,
                    data: { title: createdEntry.title + "-update" }
                })
                .then(([response]) => {
                    return response.data.updateBasicTestModel;
                })
        );

        // Deleting a file in the folder should be forbidden for identity C.
        await expectNotAuthorized(
            gqlIdentityC.cms
                .deleteEntry(model, { revision: createdEntry.id })
                .then(([response]) => {
                    return response.data.deleteBasicTestModel;
                })
        );

        await expectNotAuthorized(
            gqlIdentityC.cms
                .deleteEntry(model, { revision: createdEntry.entryId })
                .then(([response]) => {
                    return response.data.deleteBasicTestModel;
                })
        );

        // Set identity C as owner of the folder. Create, update, and delete should now be allowed.
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

        // // Creating content in the folder should be now allowed for identity C.
        await expect(
            gqlIdentityC.cms
                .createEntry(model, { data: { title: `Test-5` } })
                .then(([response]) => {
                    return response.data.createBasicTestModel;
                })
        ).resolves.toMatchObject({
            data: { id: expect.any(String) }
        });

        // Updating content in the folder should be now allowed for identity C.
        await expect(
            gqlIdentityC.cms
                .updateEntry(model, {
                    revision: createdEntry.id,
                    data: { title: createdEntry.title + "-update" }
                })
                .then(([response]) => {
                    return response.data.updateBasicTestModel;
                })
        ).resolves.toMatchObject({
            data: { title: createdEntry.title + "-update" }
        });

        // Deleting a file in the folder should be now allowed for identity C.
        await expect(
            gqlIdentityC.cms
                .deleteEntry(model, { revision: createdEntry.entryId })
                .then(([response]) => {
                    return response.data.deleteBasicTestModel;
                })
        ).resolves.toMatchObject({ data: true, error: null });
    });

    test("as a user, I should not be able to delete folders that have content they cannot see", async () => {
        const gqlIdentityA = useGraphQlHandler({ identity: identityA });
        const gqlIdentityC = useGraphQlHandler({
            identity: identityC,
            permissions: [{ name: "cms.*" }]
        });

        const modelGroup = await gqlIdentityA.cms.createTestModelGroup();
        const model = await gqlIdentityA.cms.createBasicModel({ modelGroup: modelGroup.id });

        const folderA = await gqlIdentityA.aco
            .createFolder({
                data: {
                    title: "Folder A",
                    slug: "folder-a",
                    type: `cms:${model.modelId}`
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
                    type: `cms:${model.modelId}`
                }
            })
            .then(([response]) => {
                return response.data.aco.createFolder.data;
            });

        for (let i = 1; i <= 4; i++) {
            await gqlIdentityA.cms.createEntry(model, { data: { title: `Test-${i}` } });
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
