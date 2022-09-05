import useGqlHandler from "./useGqlHandler";
import mocks from "./mocks/entries";

describe("`entries` CRUD", () => {
    const { entries } = useGqlHandler();

    it("should be able to create, read, update and delete `entries`", async () => {
        // Let's create some entries.
        const [responseA] = await entries.create({ data: mocks.entryA });
        const entryA = responseA.data.folders.createEntry.data;
        expect(entryA).toEqual({ eId: entryA.eId, ...mocks.entryA });

        const [responseB] = await entries.create({ data: mocks.entryB });
        const entryB = responseB.data.folders.createEntry.data;
        expect(entryB).toEqual({ eId: entryB.eId, ...mocks.entryB });

        const [responseC] = await entries.create({ data: mocks.entryC });
        const entryC = responseC.data.folders.createEntry.data;
        expect(entryC).toEqual({ eId: entryC.eId, ...mocks.entryC });

        // Let's check whether both of the entry exists, listing them by `folderId`.
        const [listResponse] = await entries.list({ where: { folderId: "folder-1" } });
        expect(listResponse.data.folders.listEntries).toEqual(
            expect.objectContaining({
                data: expect.arrayContaining([
                    {
                        id: expect.stringMatching(/entry-a|entry-b/),
                        eId: expect.any(String),
                        folderId: expect.stringMatching("folder-1")
                    }
                ]),
                error: null
            })
        );

        const [listEntriesResponse] = await entries.list({ where: { folderId: "folder-2" } });
        expect(listEntriesResponse.data.folders.listEntries).toEqual(
            expect.objectContaining({
                data: expect.arrayContaining([
                    {
                        id: expect.stringMatching("entry-c"),
                        eId: expect.any(String),
                        folderId: expect.stringMatching("folder-2")
                    }
                ]),
                error: null
            })
        );

        // Let's update the "entry-b" folderId.
        const updatedFolderId = "folder-2-updated";
        const [updateB] = await entries.update({
            id: entryB.id,
            data: {
                folderId: updatedFolderId
            }
        });

        expect(updateB).toEqual({
            data: {
                folders: {
                    updateEntry: {
                        data: {
                            ...mocks.entryB,
                            eId: expect.any(String),
                            folderId: updatedFolderId
                        },
                        error: null
                    }
                }
            }
        });

        // Let's delete "entry-b"
        const [deleteB] = await entries.delete({
            id: entryB.id
        });

        expect(deleteB).toEqual({
            data: {
                folders: {
                    deleteEntry: {
                        data: true,
                        error: null
                    }
                }
            }
        });

        // Should not find "entry-b"
        const [getB] = await entries.get({ id: entryB.id });

        expect(getB).toMatchObject({
            data: {
                folders: {
                    getEntry: {
                        data: null,
                        error: {
                            code: "NOT_FOUND",
                            data: null
                        }
                    }
                }
            }
        });

        // Should find "entry-a" by id
        const [getA] = await entries.get({ id: entryA.id });

        expect(getA).toEqual({
            data: {
                folders: {
                    getEntry: {
                        data: {
                            ...mocks.entryA,
                            eId: entryA.eId
                        },
                        error: null
                    }
                }
            }
        });
    });

    it("should not allow creating an `entry` with same `slug`", async () => {
        // Creating a folder
        await entries.create({ data: mocks.entryA });

        // Creating a folder with same "slug" should not be allowed
        const [response] = await entries.create({ data: mocks.entryA });

        expect(response).toEqual({
            data: {
                folders: {
                    createEntry: {
                        data: null,
                        error: {
                            code: "ENTRY_EXISTS",
                            message: `Entry with id "${mocks.entryA.id}" already exists.`,
                            data: null
                        }
                    }
                }
            }
        });
    });

    it("should not allow updating a non-existing `entry`", async () => {
        const id = "any-id";
        const [result] = await entries.update({
            id,
            data: {
                folderId: "any-folder-id"
            }
        });

        expect(result.data.folders.updateEntry).toEqual({
            data: null,
            error: {
                code: "NOT_FOUND",
                message: `Entry "${id}" was not found!`,
                data: null
            }
        });
    });
});
