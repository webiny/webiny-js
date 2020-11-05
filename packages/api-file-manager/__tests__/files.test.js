import useGqlHandler from "./useGqlHandler";
import { SecurityIdentity } from "@webiny/api-security";

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
    const { createFile, updateFile, createFiles, getFile, listFiles } = useGqlHandler({
        permissions: [{ name: "*" }],
        identity: identityA
    });

    test("create, read, update and delete files", async () => {
        let fileAId, fileBId;

        let [response] = await createFile({ data: fileAData });
        expect(response).toEqual({
            data: {
                files: {
                    createFile: {
                        data: { ...fileAData, id: response.data.files.createFile.data.id },
                        error: null
                    }
                }
            }
        });
        fileAId = response.data.files.createFile.data.id;

        // Let's update File tags with too long tag.
        [response] = await updateFile({
            id: fileAId,
            data: {
                ...fileAData,
                tags: [...fileAData.tags, LONG_STRING]
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
            id: fileAId,
            data: { tags: [...fileAData.tags, "design"] }
        });
        expect(response).toEqual({
            data: {
                files: {
                    updateFile: {
                        data: { ...fileAData, tags: [...fileAData.tags, "design"] },
                        error: null
                    }
                }
            }
        });
        // Only update "tags"
        [response] = await updateFile({
            id: fileAId,
            data: { tags: ["sketch"] }
        });
        expect(response).toEqual({
            data: {
                files: {
                    updateFile: {
                        data: fileAData,
                        error: null
                    }
                }
            }
        });

        // Let's create multiple files
        [response] = await createFiles({
            data: [fileBData]
        });

        fileBId = response.data.files.createFiles.data[0].id;
        expect(response).toEqual({
            data: {
                files: {
                    createFiles: {
                        data: [{ ...fileBData, id: fileBId }],
                        error: null
                    }
                }
            }
        });

        // Let's get a file by ID
        [response] = await getFile({
            id: fileAId
        });
        expect(response).toEqual({
            data: {
                files: {
                    getFile: {
                        data: fileAData,
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
                        data: [
                            { ...fileAData, id: fileAId },
                            { ...fileBData, id: fileBId }
                        ],
                        error: null
                    }
                }
            }
        });
    });
});
