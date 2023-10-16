import { useGraphQlHandler } from "./utils/useGraphQlHandler";
import { SecurityIdentity } from "@webiny/api-security/types";
import { useCmsGraphQlHandler } from "./utils/useCmsGraphQlHandler";

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

describe("Folder Level Permissions - File Manager GraphQL API", () => {
    const gqlIdentityA = useGraphQlHandler({ identity: identityA });

    test.todo("as a user without FM permissions, I should not be able to CRUD content");

    test("as a full-access user, I should be able to CRUD content in root folder", async () => {
        const cmsGqlIdentityA = useCmsGraphQlHandler({ identity: identityA });
        const modelGroup = await cmsGqlIdentityA.createTestModelGroup();
        const model = await cmsGqlIdentityA.createBasicModel({ modelGroup: modelGroup.id });

        const entries = [];
        for (let i = 1; i <= 4; i++) {
            entries.push(
                await cmsGqlIdentityA
                    .createEntry(model, { data: { title: `Test-${i}` } })
                    .then(([response]) => {
                        return response.data.createBasicTestModel.data;
                    })
            );
        }

        await expect(
            cmsGqlIdentityA.listEntries(model).then(([response]) => {
                return response.data.listBasicTestModels.data;
            })
        ).resolves.toHaveLength(4);

        for (let i = 0; i < entries.length; i++) {
            const createdEntry = entries[i];
            await expect(
                cmsGqlIdentityA
                    .getEntry(model, { revision: createdEntry.id })
                    .then(([response]) => {
                        return response.data.getBasicTestModel.data;
                    })
            ).resolves.toEqual(entries[i]);
        }
    });

    test("as a non-full-access user, I should be able to CRUD content in root folder", async () => {
        const cmsGqlIdentityA = useCmsGraphQlHandler({ identity: identityB });
        const modelGroup = await cmsGqlIdentityA.createTestModelGroup();
        const model = await cmsGqlIdentityA.createBasicModel({ modelGroup: modelGroup.id });

        const entries = [];
        for (let i = 1; i <= 4; i++) {
            entries.push(
                await cmsGqlIdentityA
                    .createEntry(model, { data: { title: `Test-${i}` } })
                    .then(([response]) => {
                        return response.data.createBasicTestModel.data;
                    })
            );
        }

        await expect(
            cmsGqlIdentityA.listEntries(model).then(([response]) => {
                return response.data.listBasicTestModels.data;
            })
        ).resolves.toHaveLength(4);

        for (let i = 0; i < entries.length; i++) {
            const createdEntry = entries[i];
            await expect(
                cmsGqlIdentityA
                    .getEntry(model, { revision: createdEntry.id })
                    .then(([response]) => {
                        return response.data.getBasicTestModel.data;
                    })
            ).resolves.toEqual(entries[i]);
        }
    });

    test("as a user, I should not be able to CRUD content in an inaccessible folder", async () => {
        const cmsGqlIdentityA = useCmsGraphQlHandler({ identity: identityA });
        const cmsGqlIdentityC = useCmsGraphQlHandler({
            identity: identityC,
            permissions: [{ name: "cms.*" }]
        });
        const modelGroup = await cmsGqlIdentityA.createTestModelGroup();
        const model = await cmsGqlIdentityA.createBasicModel({ modelGroup: modelGroup.id });

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
                await cmsGqlIdentityA
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
                cmsGqlIdentityC
                    .getEntry(model, { revision: createdEntry.id })
                    .then(([response]) => {
                        return response.data.getBasicTestModel;
                    })
            );
        }

        // Listing content in the folder should be forbidden for identity C.
        await expect(
            cmsGqlIdentityC
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
            cmsGqlIdentityC
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
                cmsGqlIdentityC
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
                cmsGqlIdentityC
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
                cmsGqlIdentityC
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
            cmsGqlIdentityC
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
            cmsGqlIdentityC.createEntry(model, { data: { title: `Test-5` } }).then(([response]) => {
                return response.data.createBasicTestModel;
            })
        ).resolves.toMatchObject({
            data: { id: expect.any(String) }
        });

        // Updating content in the folder should be now allowed for identity C.
        for (let i = 0; i < entries.length; i++) {
            const createdEntry = entries[i];
            await expect(
                cmsGqlIdentityC
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
                cmsGqlIdentityC
                    .deleteEntry(model, { revision: createdEntry.id })
                    .then(([response]) => {
                        return response.data.deleteBasicTestModel;
                    })
            ).resolves.toMatchObject({ data: true, error: null });
        }
    });
});
