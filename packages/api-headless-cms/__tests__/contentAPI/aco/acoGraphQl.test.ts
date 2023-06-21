import { useGraphQLHandler } from "./setup/useGraphQLHandler";
import { ROOT_FOLDER } from "~/constants";

jest.retryTimes(0);

const entryId = `custom-entry-id`;
const id = `${entryId}#0001`;

const createExpectedListResponse = (folderId?: string) => {
    return {
        data: {
            entries: {
                data: [
                    {
                        id,
                        entryId,
                        title: "Test entry",
                        wbyAco_location: {
                            folderId: folderId || null
                        }
                    }
                ],
                error: null,
                meta: {
                    cursor: null,
                    hasMoreItems: false,
                    totalCount: 1
                }
            }
        }
    };
};

describe("extending the GraphQL", () => {
    it("should extend the model with a location field and update location via ACO method", async () => {
        const { getEntry, createEntry, updateEntryLocation } = useGraphQLHandler({
            path: "manage/en-US"
        });

        const [createResponse] = await createEntry({
            data: {
                id: entryId,
                title: "Test entry",
                wbyAco_location: {
                    folderId: ROOT_FOLDER
                }
            }
        });
        expect(createResponse).toEqual({
            data: {
                entry: {
                    data: {
                        id,
                        entryId,
                        title: "Test entry",
                        wbyAco_location: {
                            folderId: ROOT_FOLDER
                        }
                    },
                    error: null
                }
            }
        });

        const [updateLocationResponse] = await updateEntryLocation({
            id,
            folderId: "rootNew"
        });

        expect(updateLocationResponse).toMatchObject({
            data: {
                entry: {
                    data: {
                        wbyAco_location: {
                            folderId: "rootNew"
                        }
                    },
                    error: null
                }
            }
        });

        const [getEntryResponse] = await getEntry({
            revision: id
        });
        expect(getEntryResponse).toMatchObject({
            data: {
                entry: {
                    data: {
                        wbyAco_location: {
                            folderId: "rootNew"
                        }
                    },
                    error: null
                }
            }
        });
    });

    it("should list entries with location", async () => {
        const { createEntry, updateEntryLocation, listEntries } = useGraphQLHandler({
            path: "manage/en-US"
        });

        const [createResponse] = await createEntry({
            data: {
                id: entryId,
                title: "Test entry",
                wbyAco_location: {
                    folderId: "rootTestingFolder"
                }
            }
        });

        expect(createResponse).toMatchObject({
            data: {
                entry: {
                    data: {
                        wbyAco_location: {
                            folderId: "rootTestingFolder"
                        }
                    },
                    error: null
                }
            }
        });

        const [listRootResponse] = await listEntries({
            where: {
                wbyAco_location: {
                    folderId: "rootTestingFolder"
                }
            }
        });
        expect(listRootResponse).toEqual(createExpectedListResponse("rootTestingFolder"));

        const [listNonExistingResponse] = await listEntries({
            where: {
                wbyAco_location: {
                    folderId: "nonExisting"
                }
            }
        });
        expect(listNonExistingResponse).toEqual({
            data: {
                entries: {
                    data: [],
                    error: null,
                    meta: {
                        cursor: null,
                        hasMoreItems: false,
                        totalCount: 0
                    }
                }
            }
        });

        await updateEntryLocation({
            id,
            folderId: "newFolderId"
        });
        const [listNewFolderIdResponse] = await listEntries({
            where: {
                wbyAco_location: {
                    folderId: "newFolderId"
                }
            }
        });
        expect(listNewFolderIdResponse).toEqual(createExpectedListResponse("newFolderId"));

        const [listRootNonExistingResponse] = await listEntries({
            where: {
                wbyAco_location: {
                    folderId: ROOT_FOLDER
                }
            }
        });
        expect(listRootNonExistingResponse).toEqual({
            data: {
                entries: {
                    data: [],
                    error: null,
                    meta: {
                        cursor: null,
                        hasMoreItems: false,
                        totalCount: 0
                    }
                }
            }
        });

        await updateEntryLocation({
            id,
            folderId: "abcdef#0001"
        });
        const [listAbcdefResponse] = await listEntries({
            where: {
                wbyAco_location: {
                    folderId: "abcdef#0001"
                }
            }
        });
        expect(listAbcdefResponse).toEqual(createExpectedListResponse("abcdef#0001"));
    });
});
