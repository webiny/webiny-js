import { recordMocks } from "./mocks/record.mock";
import { userMock } from "~tests/mocks/user.mock";
import { useGraphQlHandler } from "./utils/useGraphQlHandler";
import { createMockAcoApp } from "~tests/mocks/app";

jest.retryTimes(0);
jest.setTimeout(100000);

describe("`search` CRUD", () => {
    const { search } = useGraphQlHandler({
        plugins: [
            createMockAcoApp({
                name: "Webiny",
                apiName: "Webiny"
            })
        ]
    });

    const insertTestRecords = async (numberOfRecords = 10, type = "test", numberOfTags = 1) => {
        for (let index = 0; index < numberOfRecords; index++) {
            const data = {
                id: `record-${index}`,
                type,
                title: `Record ${index}`,
                content: `Content ${index}`,
                location: {
                    folderId: "folderId"
                },
                data: {
                    someText: `Testing some text ${index}`
                },
                tags: Array(numberOfTags)
                    .fill(null)
                    .map((_, i) => `tag-${i}`)
            };

            const [result] = await search.createRecord({ data });

            if (!result.data?.search?.createRecord?.data) {
                console.log(
                    JSON.stringify(result.data?.search?.createRecord?.error || result?.errors || {})
                );
                throw new Error(`Could not create record ${index}.`);
            }
        }
    };

    it("should be able to create, read, update and delete `records`", async () => {
        // Let's create some search records.
        const [responseA] = await search.createRecord({ data: recordMocks.recordA });
        const recordA = responseA.data.search.createRecord.data;
        expect(recordA).toEqual({ ...recordMocks.recordA, id: recordA.id, createdBy: userMock });

        const [recordAResponse] = await search.getRecord({ id: recordA.id });
        expect(recordAResponse).toEqual({
            data: {
                search: {
                    getRecord: {
                        data: {
                            ...recordMocks.recordA,
                            createdBy: userMock,
                            id: recordA.id
                        },
                        error: null
                    }
                }
            }
        });

        const [responseB] = await search.createRecord({ data: recordMocks.recordB });
        const recordB = responseB.data.search.createRecord.data;
        expect(recordB).toEqual({ ...recordMocks.recordB, id: recordB.id, createdBy: userMock });

        const [responseC] = await search.createRecord({ data: recordMocks.recordC });
        const recordC = responseC.data.search.createRecord.data;
        expect(recordC).toEqual({ ...recordMocks.recordC, id: recordC.id, createdBy: userMock });

        const [responseD] = await search.createRecord({ data: recordMocks.recordD });
        const recordD = responseD.data.search.createRecord.data;
        expect(recordD).toEqual({ ...recordMocks.recordD, id: recordD.id, createdBy: userMock });

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
            tags: [],
            createdBy: userMock
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
                            {
                                ...recordMocks.recordA,
                                createdBy: userMock,
                                id: recordA.id
                            },
                            {
                                ...recordMocks.recordB,
                                createdBy: userMock,
                                id: recordB.id
                            }
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
                            {
                                ...recordMocks.recordD,
                                createdBy: userMock,
                                id: recordD.id
                            },
                            {
                                ...recordMocks.recordE,
                                id: recordE.id,
                                content: null,
                                createdBy: userMock,
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
                        data: [
                            {
                                ...recordMocks.recordA,
                                createdBy: userMock,
                                id: recordA.id
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
            }
        });

        // Let's filter records using `tags_not_startsWith`
        const [tagsNotStartsWithResponse] = await search.listRecords({
            where: { type: "page", tags_not_startsWith: "scope:" }
        });

        expect(tagsNotStartsWithResponse.data.search.listRecords).toEqual(
            expect.objectContaining({
                data: expect.arrayContaining([
                    expect.objectContaining({
                        ...recordMocks.recordB,
                        id: recordB.id
                    })
                ]),
                error: null
            })
        );

        // Let's filter records using `createdBy`
        const [existingUserResponse] = await search.listRecords({
            where: { type: "page", createdBy: userMock.id }
        });

        expect(existingUserResponse.data.search.listRecords.data.length).toEqual(3);
        expect(existingUserResponse.data.search.listRecords.error).toBeNull();

        const [nonExistingUserResponse] = await search.listRecords({
            where: { type: "page", createdBy: "any-id" }
        });

        expect(nonExistingUserResponse.data.search.listRecords).toEqual(
            expect.objectContaining({
                data: [],
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
                            title: updatedTitle,
                            createdBy: userMock
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
                        data: { ...recordMocks.recordA, id: recordA.id, createdBy: userMock },
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
        expect(record).toEqual({ ...recordMocks.recordA, id: record.id, createdBy: userMock });
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

    it("should list existing tags sorted alphabetically attached to search records", async () => {
        // Let's create some search records.
        await search.createRecord({ data: recordMocks.recordA });
        await search.createRecord({ data: recordMocks.recordB });
        await search.createRecord({ data: recordMocks.recordC });
        await search.createRecord({ data: recordMocks.recordD });
        await search.createRecord({ data: recordMocks.recordE });

        // Let's search for tags.
        const [response] = await search.listTags();

        expect(response).toEqual({
            data: {
                search: {
                    listTags: {
                        data: [
                            { tag: "page-tag1", count: 2 },
                            { tag: "page-tag2", count: 1 },
                            { tag: "page-tag3", count: 1 },
                            { tag: "post-tag1", count: 1 },
                            { tag: "post-tag2", count: 1 },
                            { tag: "scope:page", count: 1 },
                            { tag: "scope:post", count: 1 }
                        ],
                        meta: {
                            cursor: null,
                            totalCount: 7,
                            hasMoreItems: false
                        },
                        error: null
                    }
                }
            }
        });
    });

    it("should list existing tags, filtered by search record `type`", async () => {
        // Let's create some search records.
        await search.createRecord({ data: recordMocks.recordA });
        await search.createRecord({ data: recordMocks.recordB });
        await search.createRecord({ data: recordMocks.recordC });
        await search.createRecord({ data: recordMocks.recordD });
        await search.createRecord({ data: recordMocks.recordE });

        // Let's search for tags.
        const [response] = await search.listTags();

        expect(response).toEqual({
            data: {
                search: {
                    listTags: {
                        data: [
                            {
                                count: 2,
                                tag: "page-tag1"
                            },
                            {
                                count: 1,
                                tag: "page-tag2"
                            },
                            {
                                count: 1,
                                tag: "page-tag3"
                            },
                            {
                                count: 1,
                                tag: "post-tag1"
                            },
                            {
                                count: 1,
                                tag: "post-tag2"
                            },
                            {
                                count: 1,
                                tag: "scope:page"
                            },
                            {
                                count: 1,
                                tag: "scope:post"
                            }
                        ],
                        meta: {
                            cursor: null,
                            totalCount: 7,
                            hasMoreItems: false
                        },
                        error: null
                    }
                }
            }
        });
    });

    it("should list existing tags, filtered by `tags_in` param", async () => {
        // Let's create some search records.
        await search.createRecord({ data: recordMocks.recordA });
        await search.createRecord({ data: recordMocks.recordB });
        await search.createRecord({ data: recordMocks.recordC });
        await search.createRecord({ data: recordMocks.recordD });
        await search.createRecord({ data: recordMocks.recordE });

        // Let's search for tags.
        const [response] = await search.listTags({
            where: {
                tags_in: "scope:page"
            }
        });

        expect(response.data.search.listTags).toEqual(
            expect.objectContaining({
                data: [
                    { tag: "page-tag1", count: 1 },
                    { tag: "page-tag2", count: 1 },
                    { tag: "scope:page", count: 1 }
                ],
                meta: expect.objectContaining({
                    cursor: null,
                    totalCount: 3,
                    hasMoreItems: false
                }),
                error: null
            })
        );
    });

    it("should list existing tags, filtered by `tags_startsWith` param", async () => {
        // Let's create some search records.
        await search.createRecord({ data: recordMocks.recordA });
        await search.createRecord({ data: recordMocks.recordB });
        await search.createRecord({ data: recordMocks.recordC });
        await search.createRecord({ data: recordMocks.recordD });
        await search.createRecord({ data: recordMocks.recordE });

        // Let's search for tags.
        const [response] = await search.listTags({
            where: {
                tags_startsWith: "scope:"
            }
        });

        expect(response.data.search.listTags).toEqual(
            expect.objectContaining({
                data: [
                    { tag: "page-tag1", count: 1 },
                    { tag: "page-tag2", count: 1 },
                    { tag: "post-tag1", count: 1 },
                    { tag: "post-tag2", count: 1 },
                    { tag: "scope:page", count: 1 },
                    { tag: "scope:post", count: 1 }
                ],
                meta: expect.objectContaining({
                    cursor: null,
                    totalCount: 6,
                    hasMoreItems: false
                }),
                error: null
            })
        );
    });

    it("should list existing tags, filtered by `tags_not_startsWith` param", async () => {
        // Let's create some search records.
        await search.createRecord({ data: recordMocks.recordA });
        await search.createRecord({ data: recordMocks.recordB });
        await search.createRecord({ data: recordMocks.recordC });
        await search.createRecord({ data: recordMocks.recordD });
        await search.createRecord({ data: recordMocks.recordE });

        // Let's search for tags.
        const [response] = await search.listTags({
            where: {
                tags_not_startsWith: "scope:"
            }
        });

        expect(response.data.search.listTags).toEqual(
            expect.objectContaining({
                data: [
                    { tag: "page-tag1", count: 1 },
                    { tag: "page-tag3", count: 1 }
                ],
                meta: expect.objectContaining({
                    cursor: null,
                    totalCount: 2,
                    hasMoreItems: false
                }),
                error: null
            })
        );
    });

    it("should list existing tags for large amount of records", async () => {
        const type = "test";
        const numberOfTags = 50;

        // Let's create some search records.
        await insertTestRecords(1000, type, 50);

        // Let's search for tags.
        const [response] = await search.listTags();

        expect(response).toEqual({
            data: {
                search: {
                    listTags: {
                        data: expect.any(Array),
                        meta: {
                            cursor: null,
                            totalCount: numberOfTags,
                            hasMoreItems: false
                        },
                        error: null
                    }
                }
            }
        });
    });

    it("should list an empty array in case of not found tags", async () => {
        // Let's create some search records.
        await search.createRecord({ data: recordMocks.recordE });

        // Let's search for tags.
        const [response] = await search.listTags();

        expect(response).toEqual({
            data: {
                search: {
                    listTags: {
                        data: [],
                        meta: expect.objectContaining({
                            cursor: null,
                            totalCount: 0,
                            hasMoreItems: false
                        }),
                        error: null
                    }
                }
            }
        });
    });

    it("should enforce security rules", async () => {
        const { search: anonymousSearch } = useGraphQlHandler({
            identity: null,
            plugins: [
                createMockAcoApp({
                    name: "Webiny",
                    apiName: "Webiny"
                })
            ]
        });
        const { search } = useGraphQlHandler({
            plugins: [
                createMockAcoApp({
                    name: "Webiny",
                    apiName: "Webiny"
                })
            ]
        });

        const notAuthorizedResponse = {
            data: null,
            error: {
                code: "SECURITY_NOT_AUTHORIZED",
                message: "Not authorized!",
                data: null
            }
        };

        // Create with anonymous identity
        {
            const [responseA] = await anonymousSearch.createRecord({ data: recordMocks.recordA });
            const recordA = responseA.data.search.createRecord;
            expect(recordA).toEqual(notAuthorizedResponse);
        }

        // Let's create some a dummy record
        const [responseA] = await search.createRecord({ data: recordMocks.recordA });
        const recordA = responseA.data.search.createRecord.data;
        expect(recordA).toEqual({ ...recordMocks.recordA, id: recordA.id, createdBy: userMock });

        // List with anonymous identity
        {
            const [listResponse] = await anonymousSearch.listRecords({
                where: { type: "page", location: { folderId: "folder-1" } }
            });
            expect(listResponse.data.search.listRecords).toEqual(
                expect.objectContaining(notAuthorizedResponse)
            );
        }

        // Get with anonymous identity
        {
            const [getResponse] = await anonymousSearch.getRecord({
                id: recordA.id
            });
            expect(getResponse.data.search.getRecord).toEqual(
                expect.objectContaining(notAuthorizedResponse)
            );
        }

        // Update with anonymous identity
        {
            const [updateResponse] = await anonymousSearch.updateRecord({
                id: recordA.id,
                data: { title: `${recordA.title} + update` }
            });
            expect(updateResponse.data.search.updateRecord).toEqual(
                expect.objectContaining(notAuthorizedResponse)
            );
        }

        // Delete with anonymous identity
        {
            const [deleteResponse] = await anonymousSearch.deleteRecord({
                id: recordA.id
            });
            expect(deleteResponse.data.search.deleteRecord).toEqual(
                expect.objectContaining(notAuthorizedResponse)
            );
        }

        // ListTags with anonymous identity
        {
            const [listTags] = await anonymousSearch.listTags();
            expect(listTags.data.search.listTags).toEqual(
                expect.objectContaining(notAuthorizedResponse)
            );
        }
    });
});
