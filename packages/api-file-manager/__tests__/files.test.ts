import useGqlHandler from "./useGqlHandler";
import { SecurityIdentity } from "@webiny/api-security";
import testFiles from "./data";

const identityA = new SecurityIdentity({
    id: "a",
    login: "a",
    type: "test",
    displayName: "Aa"
});

const LONG_STRING = "pneumonoultramicroscopicsilicovolcanoconiosispneumonoultramicroscopi";
const fileAData = {
    key: "/files/filenameA.png",
    name: "filenameA.png",
    size: 123456,
    type: "image/png",
    tags: ["sketch"]
};
const fileBData = {
    key: "/files/filenameB.png",
    name: "filenameB.png",
    size: 123456,
    type: "image/png",
    tags: ["art"]
};

describe("Files CRUD test", () => {
    const {
        tenant,
        elasticSearch,
        until,
        createFile,
        updateFile,
        createFiles,
        getFile,
        listFiles
    } = useGqlHandler({
        permissions: [{ name: "*" }],
        identity: identityA
    });

    beforeEach(async () => {
        try {
            await elasticSearch.indices.create({
                index: tenant.id + "-file-manager"
            });
        } catch (e) {}
    });

    afterEach(async () => {
        try {
            await elasticSearch.indices.delete({
                index: tenant.id + "-file-manager"
            });
        } catch (e) {}
    });

    test("should create, read, update and delete files", async () => {
        const [create] = await createFile({ data: fileAData });
        expect(create).toEqual({
            data: {
                fileManager: {
                    createFile: {
                        data: { ...fileAData, id: create.data.fileManager.createFile.data.id },
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
                                }
                            }
                        }
                    }
                }
            }
        });

        // Let's update File tags.
        const [update2] = await updateFile({
            id: fileAId,
            data: { tags: [...fileAData.tags, "design"] }
        });
        expect(update2).toEqual({
            data: {
                fileManager: {
                    updateFile: {
                        data: { ...fileAData, tags: [...fileAData.tags, "design"] },
                        error: null
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
                        data: fileAData,
                        error: null
                    }
                }
            }
        });

        await until(
            () => listFiles().then(([data]) => data),
            ({ data }) =>
                Array.isArray(data.fileManager.listFiles.data) &&
                data.fileManager.listFiles.data.length === 1 &&
                data.fileManager.listFiles.data[0].tags.length === 1,
            {
                tries: 10
            }
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
                        data: fileAData,
                        error: null
                    }
                }
            }
        });

        await until(
            () => listFiles().then(([data]) => data),
            ({ data }) =>
                Array.isArray(data.fileManager.listFiles.data) &&
                data.fileManager.listFiles.data.length === 2
        );

        // Let's get a all files
        const [list2] = await listFiles();
        expect(list2).toEqual({
            data: {
                fileManager: {
                    listFiles: {
                        data: [
                            // Files are sorted by `id` in descending order
                            { ...fileBData, id: fileBId },
                            { ...fileAData, id: fileAId }
                        ],
                        meta: {
                            cursor: expect.any(String),
                            totalCount: expect.any(Number)
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
            () => listFiles({ limit: testFiles.length }).then(([response]) => response),
            ({ data }) =>
                Array.isArray(data.fileManager.listFiles.data) &&
                data.fileManager.listFiles.meta.totalCount === testFiles.length
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
});
