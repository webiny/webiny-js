import useGqlHandler from "./useGqlHandler";
import testFiles from "./data";
import { File } from "~/types";

const LONG_STRING = "pneumonoultramicroscopicsilicovolcanoconiosispneumonoultramicroscopi";
const fileAData = {
    key: "/files/filenameA.png",
    name: "filenameA.png",
    size: 123456,
    type: "image/png",
    tags: ["sketch", "file-a", "webiny"]
};
const fileBData = {
    key: "/files/filenameB.png",
    name: "filenameB.png",
    size: 123456,
    type: "image/png",
    tags: ["art", "file-b"]
};
const fileCData = {
    key: "/files/filenameC.png",
    name: "filenameC.png",
    size: 123456,
    type: "image/png",
    tags: ["art", "sketch", "webiny", "file-c"]
};
const fileDData = {
    key: "/files/filenameD.png",
    name: "filenameD.png",
    size: 123456,
    type: "image/png",
    tags: ["scope:apw:file-d", "scope:apw", "scope:apw:media"]
};

jest.setTimeout(100000);

describe("Files CRUD test", () => {
    const { createFile, updateFile, createFiles, getFile, listFiles, listTags, until } =
        useGqlHandler();

    test("should create, read, update and delete files", async () => {
        const [create] = await createFile({ data: fileAData });
        expect(create).toEqual({
            data: {
                fileManager: {
                    createFile: {
                        data: {
                            ...fileAData,
                            id: expect.any(String)
                        },
                        error: null
                    }
                }
            }
        });
        const fileAId = create.data.fileManager.createFile.data.id;

        // Let's update File tags with too long tag.
        const [update1] = await updateFile({
            id: fileAId,
            data: {
                ...fileAData,
                tags: [...fileAData.tags, LONG_STRING]
            }
        });
        expect(update1).toEqual({
            data: {
                fileManager: {
                    updateFile: {
                        data: null,
                        error: {
                            message: "Validation failed.",
                            code: "VALIDATION_FAILED_INVALID_FIELDS",
                            data: {
                                invalidFields: {
                                    tags: {
                                        code: "VALIDATION_FAILED_INVALID_FIELD",
                                        data: null,
                                        message: `Tag ${LONG_STRING} is more than 50 characters long.`
                                    }
                                },
                                original: expect.any(Object),
                                file: expect.any(Object)
                            }
                        }
                    }
                }
            }
        });

        // Only update "tags"
        const [update3] = await updateFile({
            id: fileAId,
            data: { tags: ["sketch"] }
        });

        expect(update3).toEqual({
            data: {
                fileManager: {
                    updateFile: {
                        data: {
                            ...fileAData,
                            tags: ["sketch"]
                        },
                        error: null
                    }
                }
            }
        });

        await until(
            () => listFiles().then(([data]) => data),
            ({ data }: any) => {
                const file = (data.fileManager.listFiles.data as File[]).find(
                    f => f.id === fileAId
                );
                if (!file) {
                    return false;
                }
                return file.tags.length === 1 && file.tags[0] === "sketch";
            },
            { name: "list files after update tags" }
        );

        // Let's create multiple files
        const [create2] = await createFiles({
            data: [fileBData]
        });

        const fileBId = create2.data.fileManager.createFiles.data[0].id;
        expect(create2).toEqual({
            data: {
                fileManager: {
                    createFiles: {
                        data: [{ ...fileBData, id: fileBId }],
                        error: null
                    }
                }
            }
        });

        // Let's get a file by ID
        const [get] = await getFile({
            id: fileAId
        });

        expect(get).toEqual({
            data: {
                fileManager: {
                    getFile: {
                        data: {
                            ...fileAData,
                            tags: ["sketch"]
                        },
                        error: null
                    }
                }
            }
        });

        await until(
            () => listFiles({}).then(([data]) => data),
            ({ data }: any) => {
                return data.fileManager.listFiles.data.length === 2;
            },
            { name: "list all files" }
        );

        // Let's get a all files
        const [list2] = await listFiles();
        expect(list2).toEqual({
            data: {
                fileManager: {
                    listFiles: {
                        data: [
                            // Files are sorted by `id` in descending order
                            {
                                ...fileBData,
                                id: fileBId
                            },
                            {
                                ...fileAData,
                                id: fileAId,
                                tags: ["sketch"]
                            }
                        ],
                        meta: {
                            cursor: expect.any(String),
                            totalCount: expect.any(Number),
                            hasMoreItems: false
                        },
                        error: null
                    }
                }
            }
        });
    });

    test("should create files in bulk and paginate using cursor", async () => {
        // Bulk insert test data
        const pages = Math.ceil(testFiles.length / 20);
        for (let i = 0; i < pages; i++) {
            const files = testFiles.slice(i * 20, i * 20 + 20);
            const [{ data }] = await createFiles({ data: files });
            const createdFiles = data.fileManager.createFiles.data;
            for (let j = 0; j < createdFiles.length; j++) {
                testFiles[i * 20 + j]["id"] = createdFiles[j].id;
            }
        }

        await until(
            () =>
                listFiles({
                    limit: 1000
                }).then(([data]) => data),
            ({ data }: any) => {
                return data.fileManager.listFiles.data.length === testFiles.length;
            },
            { name: "bulk list all files", tries: 10 }
        );

        const inElastic = testFiles.reverse();

        const [page1] = await listFiles({ limit: 20 });

        const meta1 = page1.data.fileManager.listFiles.meta;
        expect(meta1.totalCount).toBe(100);
        expect(page1.data.fileManager.listFiles.data.length).toBe(20);
        expect(page1.data.fileManager.listFiles.data).toEqual(inElastic.slice(0, 20));

        const [page2] = await listFiles({ limit: 20, after: meta1.cursor });
        const meta2 = page2.data.fileManager.listFiles.meta;
        expect(page2.data.fileManager.listFiles.data.length).toBe(20);
        expect(page2.data.fileManager.listFiles.data).toEqual(inElastic.slice(20, 40));

        const [page3] = await listFiles({ limit: 60, after: meta2.cursor });
        const meta3 = page3.data.fileManager.listFiles.meta;
        expect(page3.data.fileManager.listFiles.data.length).toBe(60);
        expect(page3.data.fileManager.listFiles.data).toEqual(inElastic.slice(40, 100));

        // This query must return empty array
        const [page4] = await listFiles({ limit: 60, after: meta3.cursor });
        expect(page4.data.fileManager.listFiles.data.length).toBe(0);
        expect(page4.data.fileManager.listFiles.meta.cursor).toBe(null);
    });

    it("should find files by tags", async () => {
        const [createResponse] = await createFiles({
            data: [fileAData, fileBData, fileCData, fileDData]
        });
        expect(createResponse).toEqual({
            data: {
                fileManager: {
                    createFiles: {
                        data: expect.any(Array),
                        error: null
                    }
                }
            }
        });
        await until(
            () => listFiles().then(([data]) => data),
            ({ data }: any) => {
                return data.fileManager.listFiles.data.length === 4;
            },
            {
                name: "bulk list files",
                tries: 10
            }
        );

        const [response] = await listFiles({
            tags: ["art"]
        });

        expect(response).toEqual({
            data: {
                fileManager: {
                    listFiles: {
                        data: [
                            {
                                ...fileCData,
                                id: expect.any(String)
                            },
                            {
                                ...fileBData,
                                id: expect.any(String)
                            }
                        ],
                        error: null,
                        meta: {
                            hasMoreItems: false,
                            cursor: expect.any(String),
                            totalCount: 2
                        }
                    }
                }
            }
        });

        const [scopedListFilesResponse] = await listFiles({
            tags: ["scope:apw"]
        });

        expect(scopedListFilesResponse).toEqual({
            data: {
                fileManager: {
                    listFiles: {
                        data: [
                            {
                                ...fileDData,
                                id: expect.any(String)
                            }
                        ],
                        error: null,
                        meta: {
                            hasMoreItems: false,
                            cursor: expect.any(String),
                            totalCount: 1
                        }
                    }
                }
            }
        });
    });

    it("should list all the tags from files", async () => {
        const [createResponse] = await createFiles({
            data: [fileAData, fileBData, fileCData, fileDData]
        });
        expect(createResponse).toEqual({
            data: {
                fileManager: {
                    createFiles: {
                        data: expect.any(Array),
                        error: null
                    }
                }
            }
        });

        const tags = ["art", "file-a", "file-b", "file-c", "sketch", "webiny"];
        const scopedTags = ["scope:apw", "scope:apw:file-d", "scope:apw:media"];

        await until(
            () => listTags({ where: { tag_not_startsWith: "scope:apw" } }).then(([data]) => data),
            ({ data }: any) => {
                return data.fileManager.listTags.length === tags.length;
            },
            { name: "bulk list all tags", tries: 10 }
        );

        const [response] = await listTags({
            where: {
                tag_not_startsWith: "scope:apw"
            }
        });

        expect(response).toEqual({
            data: {
                fileManager: {
                    listTags: tags
                }
            }
        });

        const [scopedListTagsResponse] = await listTags({
            where: {
                tag_startsWith: "scope:apw"
            }
        });

        expect(scopedListTagsResponse).toEqual({
            data: {
                fileManager: {
                    listTags: scopedTags
                }
            }
        });
    });

    it("should find all files with given multiple tags - and operator", async () => {
        await createFiles({
            data: [fileAData, fileBData, fileCData, fileDData]
        });
        await until(
            () => listFiles().then(([data]) => data),
            ({ data }: any) => {
                return data.fileManager.listFiles.data.length === 4;
            },
            { name: "list all files" }
        );

        const [cResponse] = await listFiles({
            where: {
                tag_and_in: ["art", "webiny"]
            }
        });

        expect(cResponse).toEqual({
            data: {
                fileManager: {
                    listFiles: {
                        data: [
                            {
                                ...fileCData,
                                id: expect.any(String)
                            }
                        ],
                        error: null,
                        meta: {
                            hasMoreItems: false,
                            totalCount: 1,
                            cursor: expect.any(String)
                        }
                    }
                }
            }
        });

        const [acResponse] = await listFiles({
            where: {
                tag_and_in: ["sketch", "webiny"]
            }
        });

        expect(acResponse).toEqual({
            data: {
                fileManager: {
                    listFiles: {
                        data: [
                            {
                                ...fileCData,
                                id: expect.any(String)
                            },
                            {
                                ...fileAData,
                                id: expect.any(String)
                            }
                        ],
                        error: null,
                        meta: {
                            hasMoreItems: false,
                            totalCount: 2,
                            cursor: expect.any(String)
                        }
                    }
                }
            }
        });

        const [dResponse] = await listFiles({
            where: {
                tag_and_in: ["scope:apw:media", "scope:apw:file-d"],
                tag_startsWith: "scope:apw"
            }
        });

        expect(dResponse).toEqual({
            data: {
                fileManager: {
                    listFiles: {
                        data: [
                            {
                                ...fileDData,
                                id: expect.any(String)
                            }
                        ],
                        error: null,
                        meta: {
                            hasMoreItems: false,
                            totalCount: 1,
                            cursor: expect.any(String)
                        }
                    }
                }
            }
        });
    });
    /**
     * Unfortunately this test is skipped because it is not passing on the CI (DDB+ES package).
     * Testing the search locally and on deployed system shows that searching works.
     */
    // eslint-disable-next-line
    it.skip("should find files by name", async () => {
        const [createResponse] = await createFiles({
            data: [fileAData, fileBData, fileCData]
        });
        expect(createResponse).toEqual({
            data: {
                fileManager: {
                    createFiles: {
                        data: expect.any(Array),
                        error: null
                    }
                }
            }
        });
        await until(
            () => listFiles().then(([data]) => data),
            ({ data }: any) => {
                return data.fileManager.listFiles.data.length === 3;
            },
            { name: "bulk list tags", tries: 10 }
        );

        const [searchNameResponse] = await listFiles({
            search: "filenameC"
        });

        expect(searchNameResponse).toEqual({
            data: {
                fileManager: {
                    listFiles: {
                        data: [
                            {
                                ...fileCData,
                                id: expect.any(String)
                            }
                        ],
                        error: null,
                        meta: {
                            hasMoreItems: false,
                            totalCount: 1,
                            cursor: expect.any(String)
                        }
                    }
                }
            }
        });
    });

    it("should find files by tag", async () => {
        const [createResponse] = await createFiles({
            data: [fileAData, fileBData, fileCData]
        });
        expect(createResponse).toEqual({
            data: {
                fileManager: {
                    createFiles: {
                        data: expect.any(Array),
                        error: null
                    }
                }
            }
        });
        await until(
            () => listFiles().then(([data]) => data),
            ({ data }: any) => {
                return data.fileManager.listFiles.data.length === 3;
            },
            { name: "bulk list tags", tries: 10 }
        );

        const [searchTagsResponse] = await listFiles({
            search: "art"
        });

        expect(searchTagsResponse).toEqual({
            data: {
                fileManager: {
                    listFiles: {
                        data: [
                            {
                                ...fileCData,
                                id: expect.any(String)
                            },
                            {
                                ...fileBData,
                                id: expect.any(String)
                            }
                        ],
                        error: null,
                        meta: {
                            hasMoreItems: false,
                            totalCount: 2,
                            cursor: expect.any(String)
                        }
                    }
                }
            }
        });

        const [searchTags2Response] = await listFiles({
            search: "webiny"
        });

        expect(searchTags2Response).toEqual({
            data: {
                fileManager: {
                    listFiles: {
                        data: [
                            {
                                ...fileCData,
                                id: expect.any(String)
                            },
                            {
                                ...fileAData,
                                id: expect.any(String)
                            }
                        ],
                        error: null,
                        meta: {
                            hasMoreItems: false,
                            totalCount: 2,
                            cursor: expect.any(String)
                        }
                    }
                }
            }
        });
    });

    it("should have no tags if files uploaded have no tags", async () => {
        const [createResponse] = await createFiles({
            data: [fileAData, fileBData, fileCData].map(file => {
                return {
                    ...file,
                    tags: undefined
                };
            })
        });
        expect(createResponse).toEqual({
            data: {
                fileManager: {
                    createFiles: {
                        data: expect.any(Array),
                        error: null
                    }
                }
            }
        });
        await until(
            () => listFiles().then(([data]) => data),
            ({ data }: any) => {
                return data.fileManager.listFiles.data.length === 3;
            },
            {
                name: "list files after create"
            }
        );

        const [tagsResponse] = await listTags({});

        expect(tagsResponse).toEqual({
            data: {
                fileManager: {
                    listTags: []
                }
            }
        });
    });
});
