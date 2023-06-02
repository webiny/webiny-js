import { useGraphQLHandler } from "~tests/setup/useGraphQLHandler";
import { createHeadlessCmsAco } from "~/index";

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
                        meta: {
                            location: {
                                folderId: folderId || null
                            }
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
    it("should extend the model meta with a location field", async () => {
        const { getEntry, createEntry, updateEntryLocation } = useGraphQLHandler({
            plugins: [createHeadlessCmsAco()],
            path: "manage/en-US"
        });

        const [createResponse] = await createEntry({
            data: {
                id: entryId,
                title: "Test entry"
            }
        });
        expect(createResponse).toEqual({
            data: {
                entry: {
                    data: {
                        id,
                        entryId,
                        title: "Test entry",
                        meta: {
                            location: null
                        }
                    },
                    error: null
                }
            }
        });

        const [updateLocationResponse] = await updateEntryLocation({
            id,
            folderId: "root"
        });

        expect(updateLocationResponse).toMatchObject({
            data: {
                entry: {
                    data: {
                        meta: {
                            location: {
                                folderId: "root"
                            }
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
                        meta: {
                            location: {
                                folderId: "root"
                            }
                        }
                    },
                    error: null
                }
            }
        });
    });

    it("should list entries with location", async () => {
        const { createEntry, updateEntryLocation, listEntries } = useGraphQLHandler({
            plugins: [createHeadlessCmsAco()],
            path: "manage/en-US"
        });

        await createEntry({
            data: {
                id: entryId,
                title: "Test entry"
            }
        });

        await updateEntryLocation({
            id,
            folderId: "root"
        });

        const [listRootResponse] = await listEntries({
            where: {
                meta: {
                    location: {
                        folderId: "root"
                    }
                }
            }
        });
        expect(listRootResponse).toEqual(createExpectedListResponse("root"));

        const [listNonExistingResponse] = await listEntries({
            where: {
                meta: {
                    location: {
                        folderId: "nonExisting"
                    }
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
                meta: {
                    location: {
                        folderId: "newFolderId"
                    }
                }
            }
        });
        expect(listNewFolderIdResponse).toEqual(createExpectedListResponse("newFolderId"));

        const [listRootNonExistingResponse] = await listEntries({
            where: {
                meta: {
                    location: {
                        folderId: "root"
                    }
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
    });
});
