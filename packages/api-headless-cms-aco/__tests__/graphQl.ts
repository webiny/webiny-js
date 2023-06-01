import { useGraphQLHandler } from "~tests/setup/useGraphQLHandler";
import { createHeadlessCmsAco } from "~/index";

jest.retryTimes(0);

describe("extending the GraphQL", () => {
    it("should extend the model meta with a location field", async () => {
        const { getEntry, createEntry, updateEntryLocation } = useGraphQLHandler({
            plugins: [createHeadlessCmsAco()],
            path: "manage/en-US"
        });

        const entryId = `custom-entry-id`;
        const id = `${entryId}#0001`;

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
});
