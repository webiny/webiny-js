import { recordMocks } from "./mocks/record.mock";
import { useGraphQlHandler } from "./utils/useGraphQlHandler";
import { createMockAcoApp } from "~tests/mocks/app";

describe("`search` CRUD", () => {
    const { search } = useGraphQlHandler({
        plugins: [
            createMockAcoApp({
                name: "Webiny",
                apiName: "Webiny"
            })
        ]
    });

    it("should be able to create, read, update and delete `records`", async () => {
        // Let's create some search records.
        const [responseA] = await search.createRecord({ data: recordMocks.recordA });
        const recordA = responseA.data.search.createRecord.data;
        expect(recordA).toEqual({ ...recordMocks.recordA, id: recordA.id });

        const [recordAResponse] = await search.getRecord({ id: recordA.id });
        expect(recordAResponse).toEqual({
            data: {
                search: {
                    getRecord: {
                        data: {
                            ...recordMocks.recordA,
                            id: recordA.id
                        },
                        error: null
                    }
                }
            }
        });

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
        expect(recordE).toEqual({
            ...recordMocks.recordE,
            id: recordE.id,
            content: null,
            data: {
                customCreatedOn: null,
                customLocked: null,
                customVersion: null,
                someText: null,
                identity: null
            },
            tags: []
        });

        // Let's check whether both of the record exists, listing them by `type` and `location`.
        // List records -> type: "page" / folderId: "folder-1"
        const [listResponsePageFolder1] = await search.listRecords({
            where: { type: "page", location: { folderId: "folder-1" } },
            sort: ["createdOn_ASC"]
        });

        expect(listResponsePageFolder1).toEqual({
            data: {
                search: {
                    listRecords: {
                        data: [
                            { ...recordMocks.recordA, id: recordA.id },
                            { ...recordMocks.recordB, id: recordB.id }
                        ],
                        meta: {
                            cursor: null,
                            hasMoreItems: false,
                            totalCount: 2
                        },
                        error: null
                    }
                }
            }
        });

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
        const [listResponsePost] = await search.listRecords({
            where: { type: "post" },
            sort: ["createdOn_ASC"]
        });

        expect(listResponsePost).toEqual({
            data: {
                search: {
                    listRecords: {
                        data: [
                            { ...recordMocks.recordD, id: recordD.id },
                            {
                                ...recordMocks.recordE,
                                id: recordE.id,
                                content: null,
                                data: {
                                    customCreatedOn: null,
                                    customLocked: null,
                                    customVersion: null,
                                    identity: null,
                                    someText: null
                                },
                                tags: []
                            }
                        ],
                        error: null,
                        meta: {
                            cursor: null,
                            hasMoreItems: false,
                            totalCount: 2
                        }
                    }
                }
            }
        });

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

        // Let's filter records using `tags_in`
        const [tagsInResponse] = await search.listRecords({
            where: { type: "page", tags_in: ["page-tag1"] }
        });

        expect(tagsInResponse.data.search.listRecords).toEqual(
            expect.objectContaining({
                data: expect.arrayContaining([
                    expect.objectContaining({ ...recordMocks.recordA, id: recordA.id }),
                    expect.objectContaining({ ...recordMocks.recordB, id: recordB.id })
                ]),
                error: null
            })
        );

        // Let's filter records using `tags_startsWith`
        const [tagsStartsWithResponse] = await search.listRecords({
            where: { type: "page", tags_startsWith: "scope:" }
        });

        expect(tagsStartsWithResponse).toEqual({
            data: {
                search: {
                    listRecords: {
                        data: [{ ...recordMocks.recordA, id: recordA.id }],
                        error: null,
                        meta: {
                            cursor: null,
                            hasMoreItems: false,
                            totalCount: 1
                        }
                    }
                }
            }
        });

        // Let's filter records using `tags_not_startsWith`
        const [tagsNotStartsWithResponse] = await search.listRecords({
            where: { type: "page", tags_not_startsWith: "scope:" }
        });

        expect(tagsNotStartsWithResponse.data.search.listRecords).toEqual(
            expect.objectContaining({
                data: expect.arrayContaining([
                    expect.objectContaining({ ...recordMocks.recordB, id: recordB.id })
                ]),
                error: null
            })
        );

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
