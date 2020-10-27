import useGqlHandler from "./useGqlHandler";
import { SecurityIdentity } from "@webiny/api-security";

const identityA = new SecurityIdentity({
    id: "a",
    login: "a",
    type: "test",
    displayName: "Aa"
});

const LONG_STRING = "pneumonoultramicroscopicsilicovolcanoconiosispneumonoultramicroscopi";

describe("Files CRUD test", () => {
    const { createFile, updateFile, createFiles, getFile, listFiles } = useGqlHandler({
        permissions: [{ name: "*" }],
        identity: identityA
    });

    test("create, read, update and delete files", async () => {
        const data = {
            id: "1iHCWANdxpy3cu5ES7GzjVMoVMu",
            key: "/files/filename.png",
            name: "filename.png",
            size: 123456,
            type: "image/png",
            tags: ["sketch"]
        };

        let [response] = await createFile({ data });
        expect(response).toEqual({
            data: {
                files: {
                    createFile: {
                        data,
                        error: null
                    }
                }
            }
        });

        // Let's update File tags with too long tag.
        [response] = await updateFile({
            id: data.id,
            data: {
                ...data,
                tags: [...data.tags, LONG_STRING]
            }
        });
        expect(response).toEqual({
            data: {
                files: {
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
        [response] = await updateFile({
            id: data.id,
            data: { ...data, tags: [...data.tags, "design"] }
        });
        expect(response).toEqual({
            data: {
                files: {
                    updateFile: {
                        data: { ...data, tags: [...data.tags, "design"] },
                        error: null
                    }
                }
            }
        });

        // Let's create multiple files
        [response] = await createFiles({
            id: data.id,
            data: [data]
        });
        expect(response).toEqual({
            data: {
                files: {
                    createFiles: {
                        data: [data],
                        error: null
                    }
                }
            }
        });

        // Let's get a file by ID
        [response] = await getFile({
            id: data.id
        });
        expect(response).toEqual({
            data: {
                files: {
                    getFile: {
                        data: data,
                        error: null
                    }
                }
            }
        });

        // Let's get a all files
        [response] = await listFiles({});
        expect(response).toEqual({
            data: {
                files: {
                    listFiles: {
                        data: [data],
                        error: null
                    }
                }
            }
        });
    });
});
