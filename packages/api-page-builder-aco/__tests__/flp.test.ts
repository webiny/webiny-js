import { useGraphQlHandler } from "./utils/useGraphQlHandler";
import { SecurityIdentity } from "@webiny/api-security/types";
import { until } from "@webiny/project-utils/testing/helpers/until";

const FOLDER_TYPE = "PbPage";

const identityA: SecurityIdentity = { id: "1", type: "admin", displayName: "A" };
const identityB: SecurityIdentity = { id: "2", type: "admin", displayName: "B" };
const identityC: SecurityIdentity = { id: "3", type: "admin", displayName: "C" };

const expectNotAuthorized = async (promise: Promise<any>) => {
    await expect(promise).resolves.toEqual({
        data: null,
        error: {
            code: "SECURITY_NOT_AUTHORIZED",
            data: null,
            message: "Not authorized!"
        }
    });
};

describe("Folder Level Permissions - Page Manager GraphQL API", () => {
    const gqlIdentityA = useGraphQlHandler({ identity: identityA });
    const gqlIdentityB = useGraphQlHandler({
        identity: identityB,
        permissions: [{ name: "pb.*" }]
    });
    const gqlIdentityC = useGraphQlHandler({
        identity: identityC,
        permissions: [{ name: "pb.*" }]
    });

    beforeEach(async () => {
        await gqlIdentityA.pageBuilder.createCategory({
            data: {
                slug: "static",
                name: `Static`,
                url: `/static/`,
                layout: `layout`
            }
        });
    });

    test.todo("as a user without PB permissions, I should not be able to CRUD pages");

    test("as a full-access user, I should be able to CRUD pages in root folder", async () => {
        const createdPages = [];
        for (let i = 1; i <= 4; i++) {
            createdPages.push(
                await gqlIdentityA.pageBuilder
                    .createPage({ category: "static" })
                    .then(([response]) => {
                        return response.data.pageBuilder.createPage.data;
                    })
            );
        }

        await until(gqlIdentityA.pageBuilder.listPages, ([response]) => {
            return response.data.pageBuilder.listPages.data.length === 4;
        });

        await expect(
            gqlIdentityA.pageBuilder.listPages().then(([response]) => {
                return response.data.pageBuilder.listPages.data;
            })
        ).resolves.toHaveLength(4);

        for (let i = 0; i < createdPages.length; i++) {
            const createdPage = createdPages[i];
            await expect(
                gqlIdentityA.pageBuilder.getPage({ id: createdPage.id }).then(([response]) => {
                    return response.data.pageBuilder.getPage.data;
                })
            ).resolves.toEqual(createdPages[i]);
        }
    });

    test("as a non-full-access user, I should be able to CRUD pages in root folder", async () => {
        const createdPages = [];
        for (let i = 1; i <= 4; i++) {
            createdPages.push(
                await gqlIdentityB.pageBuilder
                    .createPage({ category: "static", meta: { location: "root" } })
                    .then(([response]) => {
                        return response.data.pageBuilder.createPage.data;
                    })
            );
        }

        await until(gqlIdentityB.pageBuilder.listPages, ([response]) => {
            return response.data.pageBuilder.listPages.data.length === 4;
        });

        await expect(
            gqlIdentityB.pageBuilder.listPages().then(([response]) => {
                return response.data.pageBuilder.listPages.data;
            })
        ).resolves.toHaveLength(4);

        for (let i = 0; i < createdPages.length; i++) {
            const createdPage = createdPages[i];
            await expect(
                gqlIdentityB.pageBuilder.getPage({ id: createdPage.id }).then(([response]) => {
                    return response.data.pageBuilder.getPage.data;
                })
            ).resolves.toEqual(createdPages[i]);
        }
    });

    test("as a user, I should not be able to CRUD pages in an inaccessible folder", async () => {
        const folder = await gqlIdentityA.folders
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

        const createdPages = [];
        for (let i = 1; i <= 4; i++) {
            createdPages.push(
                await gqlIdentityA.pageBuilder
                    .createPage({
                        category: "static",
                        meta: { location: { folderId: folder.id } }
                    })
                    .then(([response]) => {
                        return response.data.pageBuilder.createPage.data;
                    })
            );
        }

        // Only identity B (and identity A, the owner) can see the folder and its pages.
        await gqlIdentityA.folders.updateFolder({
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

        // Listing ACO records in the folder should be forbidden for identity C.
        const [emptySearchRecordsList] = await gqlIdentityC.search.listRecords({
            where: {
                location: {
                    folderId: folder.id
                }
            }
        });

        expect(emptySearchRecordsList).toEqual({
            data: {
                search: {
                    listRecords: {
                        data: [],
                        error: null,
                        meta: {
                            hasMoreItems: false,
                            totalCount: 0,
                            cursor: null
                        }
                    }
                }
            }
        });

        // Getting pages in the folder should be forbidden for identity C.
        for (let i = 0; i < createdPages.length; i++) {
            const createdPage = createdPages[i];
            await expectNotAuthorized(
                gqlIdentityC.pageBuilder.getPage({ id: createdPage.id }).then(([response]) => {
                    return response.data.pageBuilder.getPage;
                })
            );
        }

        // TODO: Listing pages in the folder should be forbidden for identity C. ATM this is not
        // TODO: the case. In the future, using Headless CMS as the storage layer will fix this.
        // await expect(
        //     gqlIdentityC.pageBuilder.listPages().then(([response]) => {
        //         return response.data.pageBuilder.listPages;
        //     })
        // ).resolves.toEqual({
        //     data: [],
        //     error: null,
        //     meta: {
        //         cursor: null,
        //         hasMoreItems: false,
        //         totalCount: 0
        //     }
        // });

        // Creating a page in the folder should be forbidden for identity C.
        await expectNotAuthorized(
            gqlIdentityC.pageBuilder
                .createPage({
                    category: "static",
                    meta: { location: { folderId: folder.id } }
                })
                .then(([response]) => {
                    return response.data.pageBuilder.createPage;
                })
        );

        // Updating a page in the folder should be forbidden for identity C.
        for (let i = 0; i < createdPages.length; i++) {
            const createdPage = createdPages[i];
            await expectNotAuthorized(
                gqlIdentityC.pageBuilder
                    .updatePage({
                        id: createdPage.id,
                        data: { title: createdPage.title + "-update" }
                    })
                    .then(([response]) => {
                        return response.data.pageBuilder.updatePage;
                    })
            );
        }

        // Deleting a page in the folder should be forbidden for identity C.
        for (let i = 0; i < createdPages.length; i++) {
            const createdPage = createdPages[i];
            await expectNotAuthorized(
                gqlIdentityC.pageBuilder
                    .deletePage({
                        id: createdPage.id
                    })
                    .then(([response]) => {
                        return response.data.pageBuilder.deletePage;
                    })
            );
        }

        // Set identity C as owner of the folder. CRUD should now be allowed.
        await gqlIdentityA.folders.updateFolder({
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

        // Getting pages in the folder should be now allowed for identity C.
        for (let i = 0; i < createdPages.length; i++) {
            const createdPage = createdPages[i];
            await expect(
                gqlIdentityC.pageBuilder.getPage({ id: createdPage.id }).then(([response]) => {
                    return response.data.pageBuilder.getPage;
                })
            ).resolves.toMatchObject({
                data: { id: createdPage.id },
                error: null
            });
        }

        // TODO: This is always allowed, even if the user doesn't have access to the folder.
        // TODO: In the future, using Headless CMS as the storage layer will fix this.
        // Listing pages in the folder should be now allowed for identity C.
        await expect(
            gqlIdentityC.pageBuilder.listPages().then(([response]) => {
                return response.data.pageBuilder.listPages;
            })
        ).resolves.toMatchObject({
            data: [
                { id: createdPages[3].id },
                { id: createdPages[2].id },
                { id: createdPages[1].id },
                { id: createdPages[0].id }
            ],
            error: null,
            meta: {
                cursor: null,
                hasMoreItems: false,
                totalCount: 4
            }
        });

        // Creating a page in the folder should be now allowed for identity C.
        await expect(
            gqlIdentityC.pageBuilder
                .createPage({
                    category: "static",
                    meta: { location: { folderId: folder.id } }
                })
                .then(([response]) => {
                    return response.data.pageBuilder.createPage;
                })
        ).resolves.toMatchObject({
            data: { id: expect.any(String) }
        });

        // Updating a page in the folder should be now allowed for identity C.
        for (let i = 0; i < createdPages.length; i++) {
            const createdPage = createdPages[i];
            await expect(
                gqlIdentityC.pageBuilder
                    .updatePage({
                        id: createdPage.id,
                        data: { title: createdPage.name + "-update" }
                    })
                    .then(([response]) => {
                        return response.data.pageBuilder.updatePage;
                    })
            ).resolves.toMatchObject({
                data: { title: createdPage.name + "-update" }
            });
        }

        // Deleting a page in the folder should be now allowed for identity C.
        for (let i = 0; i < createdPages.length; i++) {
            const createdPage = createdPages[i];
            await expect(
                gqlIdentityC.pageBuilder.deletePage({ id: createdPage.id }).then(([response]) => {
                    return response.data.pageBuilder.deletePage;
                })
            ).resolves.toMatchObject({ data: { page: { id: expect.any(String) } }, error: null });
        }

        // Listing pages in the folder should be now allowed for identity C.
        await until(gqlIdentityC.pageBuilder.listPages, ([response]) => {
            return response.data.pageBuilder.listPages.meta.totalCount === 1;
        });

        await expect(
            gqlIdentityC.pageBuilder.listPages().then(([response]) => {
                return response.data.pageBuilder.listPages;
            })
        ).resolves.toMatchObject({
            error: null,
            meta: {
                cursor: null,
                hasMoreItems: false,
                totalCount: 1
            }
        });
    });
});
