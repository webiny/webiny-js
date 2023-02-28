import { recordMocks } from "./mocks/record.mock";
import { useGraphQlHandler } from "./utils/useGraphQlHandler";

describe("`search` CRUD", () => {
    const { search } = useGraphQlHandler();

    it("should be able to create, read, update and delete `records`", async () => {
        // Let's create some search records.
        const [responseA] = await search.createRecord({ data: recordMocks.recordA });
        const recordA = responseA.data.search.createRecord.data;
        expect(recordA).toEqual({ ...recordMocks.recordA, id: recordA.id });

        const [responseB] = await search.createRecord({ data: recordMocks.recordB });
        const recordB = responseB.data.search.createRecord.data;
        expect(recordB).toEqual({ ...recordMocks.recordB, id: recordB.id });

        const [responseC] = await search.createRecord({ data: recordMocks.recordC });
        const recordC = responseC.data.search.createRecord.data;
        expect(recordC).toEqual({ ...recordMocks.recordC, id: recordC.id });

        const [responseD] = await search.createRecord({ data: recordMocks.recordD });
        const recordD = responseD.data.search.createRecord.data;
        expect(recordD).toEqual({ ...recordMocks.recordD, id: recordD.id });

        const [responseE] = await search.createRecord({ data: recordMocks.recordE });
        const recordE = responseE.data.search.createRecord.data;
        expect(recordE).toEqual({ ...recordMocks.recordE, id: recordE.id });

        // Let's check whether both of the record exists, listing them by `type` and `location`.
        // List records -> type: "page" / folderId: "folder-1"
        const [listResponsePageFolder1] = await search.listRecords({
            where: { type: "page", location: { folderId: "folder-1" } },
            sort: ["createdOn_ASC"]
        });

        expect(listResponsePageFolder1.data.search.listRecords).toEqual(
            expect.objectContaining({
                data: expect.arrayContaining([
                    expect.objectContaining({ ...recordMocks.recordA, id: recordA.id }),
                    expect.objectContaining({ ...recordMocks.recordB, id: recordB.id })
                ]),
                error: null
            })
        );

        // List records -> type: "page" / folderId: "folder-2"
        const [listResponsePageFolder2] = await search.listRecords({
            where: { type: "page", location: { folderId: "folder-2" } },
            sort: ["createdOn_ASC"]
        });

        expect(listResponsePageFolder2.data.search.listRecords).toEqual(
            expect.objectContaining({
                data: expect.arrayContaining([
                    expect.objectContaining({ ...recordMocks.recordC, id: recordC.id })
                ]),
                error: null
            })
        );

        // List records -> type: "post" / folderId: "folder-1"
        const [listResponsePostFolder1] = await search.listRecords({
            where: { type: "post" },
            sort: ["createdOn_ASC"]
        });

        expect(listResponsePostFolder1.data.search.listRecords).toEqual(
            expect.objectContaining({
                data: expect.arrayContaining([
                    expect.objectContaining({ ...recordMocks.recordD, id: recordD.id }),
                    expect.objectContaining({ ...recordMocks.recordE, id: recordE.id })
                ]),
                error: null
            })
        );

        // Let's check cursor based pagination meta.
        const [listResponsePageWithLimit] = await search.listRecords({
            where: { type: "page" },
            sort: ["createdOn_ASC"],
            limit: 2
        });

        expect(listResponsePageWithLimit.data.search.listRecords.data.length).toEqual(2);
        expect(listResponsePageWithLimit.data.search.listRecords).toEqual(
            expect.objectContaining({
                data: expect.arrayContaining([
                    expect.objectContaining({ ...recordMocks.recordA, id: recordA.id }),
                    expect.objectContaining({ ...recordMocks.recordB, id: recordB.id })
                ]),
                meta: expect.objectContaining({
                    cursor: expect.any(String),
                    totalCount: 3,
                    hasMoreItems: true
                }),
                error: null
            })
        );

        // Let's use previously returned cursor to continue with pagination.
        const cursor = listResponsePageWithLimit.data.search.listRecords.meta.cursor;

        const [listResponsePageWithLimitAfter] = await search.listRecords({
            where: { type: "page" },
            sort: ["createdOn_ASC"],
            limit: 2,
            after: cursor
        });

        expect(listResponsePageWithLimitAfter.data.search.listRecords.data.length).toEqual(1);
        expect(listResponsePageWithLimitAfter.data.search.listRecords).toEqual(
            expect.objectContaining({
                data: expect.arrayContaining([
                    expect.objectContaining({ ...recordMocks.recordC, id: recordC.id })
                ]),
                meta: expect.objectContaining({
                    cursor: null,
                    totalCount: 3,
                    hasMoreItems: false
                }),
                error: null
            })
        );

        // Let's search for records.
        const [searchResponse] = await search.listRecords({
            where: { type: "page" },
            sort: ["createdOn_ASC"],
            search: "Lorem"
        });

        expect(searchResponse.data.search.listRecords).toEqual(
            expect.objectContaining({
                data: expect.arrayContaining([
                    expect.objectContaining({ ...recordMocks.recordB, id: recordB.id }),
                    expect.objectContaining({ ...recordMocks.recordC, id: recordC.id })
                ]),
                error: null
            })
        );

        console.log("recordB", recordB);

        // Let's update the "page-b" title.
        const updatedTitle = "Title updated";
        const [updateB] = await search.updateRecord({
            id: recordMocks.recordB.id,
            data: {
                title: updatedTitle
            }
        });

        expect(updateB).toEqual({
            data: {
                search: {
                    updateRecord: {
                        data: {
                            ...recordMocks.recordB,
                            id: recordB.id,
                            title: updatedTitle
                        },
                        error: null
                    }
                }
            }
        });

        // Let's delete "page-b".
        const [deleteB] = await search.deleteRecord({
            id: recordMocks.recordB.id
        });

        expect(deleteB).toEqual({
            data: {
                search: {
                    deleteRecord: {
                        data: true,
                        error: null
                    }
                }
            }
        });

        // Should not find "page-b".
        const [getB] = await search.getRecord({ id: recordMocks.recordB.id });

        expect(getB).toMatchObject({
            data: {
                search: {
                    getRecord: {
                        data: null,
                        error: {
                            code: "NOT_FOUND",
                            data: {
                                id: recordMocks.recordB.id
                            }
                        }
                    }
                }
            }
        });

        // Should find "page-a" by id.
        const [getA] = await search.getRecord({ id: recordMocks.recordA.id });

        expect(getA).toEqual({
            data: {
                search: {
                    getRecord: {
                        data: { ...recordMocks.recordA, id: recordA.id },
                        error: null
                    }
                }
            }
        });
    });

    it("should allow creating an `record` with same `id`", async () => {
        // Creating a record
        await search.createRecord({ data: recordMocks.recordA });

        // Creating a record with same "id"
        const [response] = await search.createRecord({ data: recordMocks.recordA });
        const record = response.data.search.createRecord.data;
        expect(record).toEqual({ ...recordMocks.recordA, id: record.id });
    });

    it("should not allow updating a non-existing `record`", async () => {
        const id = "any-id";
        const [result] = await search.updateRecord({
            id,
            data: {
                title: "Any title"
            }
        });

        expect(result.data.search.updateRecord).toEqual({
            data: null,
            error: {
                code: "NOT_FOUND",
                message: "Record not found.",
                data: {
                    id
                }
            }
        });
    });
});
