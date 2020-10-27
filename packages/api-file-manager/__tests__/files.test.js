import useGqlHandler from "./useGqlHandler";

const LONGEST_WORD = "pneumonoultramicroscopicsilicovolcanoconiosis";

describe("Files CRUD test", () => {
    const {
        createFile,
        updateFile,
        createFiles,
        getFile,
        listFiles,
        install,
        isInstalled,
        getSettings,
        updateSettings
    } = useGqlHandler();

    test("install File manager", async () => {
        let [response] = await isInstalled({});
        expect(response).toEqual({
            data: {
                files: {
                    isInstalled: {
                        data: false,
                        error: null
                    }
                }
            }
        });

        [response] = await install({
            srcPrefix: "https://0c6fb883-webiny-latest-files.s3.amazonaws.com/"
        });
        expect(response).toEqual({
            data: {
                files: {
                    install: {
                        data: true,
                        error: null
                    }
                }
            }
        });

        [response] = await isInstalled({});
        expect(response).toEqual({
            data: {
                files: {
                    isInstalled: {
                        data: true,
                        error: null
                    }
                }
            }
        });
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
                tags: [...data.tags, LONGEST_WORD + LONGEST_WORD]
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
                                        message: `Tag ${LONGEST_WORD +
                                            LONGEST_WORD} is more than 50 characters long.`
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

    test("File manager settings", async () => {
        let [response] = await getSettings();
        expect(response).toEqual({
            data: {
                files: {
                    getSettings: {
                        data: {
                            uploadMinFileSize: 0,
                            uploadMaxFileSize: 26214401
                        },
                        error: null
                    }
                }
            }
        });

        [response] = await updateSettings({ data: { uploadMinFileSize: -1111 } });
        expect(response).toEqual({
            data: {
                files: {
                    updateSettings: {
                        data: null,
                        error: {
                            code: "VALIDATION_FAILED_INVALID_FIELDS",
                            message: "Validation failed.",
                            data: {
                                invalidFields: {
                                    uploadMinFileSize: {
                                        code: "VALIDATION_FAILED_INVALID_FIELD",
                                        data: null,
                                        message: "Value needs to be greater than or equal to 0."
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        [response] = await updateSettings({
            data: { uploadMinFileSize: 1024 }
        });
        expect(response).toEqual({
            data: {
                files: {
                    updateSettings: {
                        data: {
                            uploadMinFileSize: 1024,
                            uploadMaxFileSize: 26214401
                        },
                        error: null
                    }
                }
            }
        });

        [response] = await getSettings({});
        expect(response).toEqual({
            data: {
                files: {
                    getSettings: {
                        data: {
                            uploadMinFileSize: 1024,
                            uploadMaxFileSize: 26214401
                        },
                        error: null
                    }
                }
            }
        });
    });
});
