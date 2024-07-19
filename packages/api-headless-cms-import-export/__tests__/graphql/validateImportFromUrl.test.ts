import { useHandler } from "~tests/helpers/useHandler";

describe("validate import from url - graphql", () => {
    it("should run validation and fail - parse string as json", async () => {
        const { validateImportFromUrl } = useHandler();

        const [result1] = await validateImportFromUrl({
            data: ""
        });

        expect(result1).toEqual({
            data: {
                validateImportFromUrl: {
                    data: null,
                    error: {
                        message: "Invalid JSON data provided.",
                        code: "INVALID_JSON_DATA",
                        data: null
                    }
                }
            }
        });

        const [result2] = await validateImportFromUrl({
            data: "{bla}"
        });

        expect(result2).toEqual({
            data: {
                validateImportFromUrl: {
                    data: null,
                    error: {
                        message: "Invalid JSON data provided.",
                        code: "INVALID_JSON_DATA",
                        data: null
                    }
                }
            }
        });

        const [result3] = await validateImportFromUrl({
            data: "{[]}"
        });

        expect(result3).toEqual({
            data: {
                validateImportFromUrl: {
                    data: null,
                    error: {
                        message: "Invalid JSON data provided.",
                        code: "INVALID_JSON_DATA",
                        data: null
                    }
                }
            }
        });

        const [result4] = await validateImportFromUrl({
            data: "invalid data"
        });

        expect(result4).toEqual({
            data: {
                validateImportFromUrl: {
                    data: null,
                    error: {
                        message: "Invalid JSON data provided.",
                        code: "INVALID_JSON_DATA",
                        data: null
                    }
                }
            }
        });
    });

    it("should run validation and fail - no files found", async () => {
        const { validateImportFromUrl } = useHandler();

        const [result] = await validateImportFromUrl({
            data: JSON.stringify({
                files: []
            })
        });

        expect(result).toEqual({
            data: {
                validateImportFromUrl: {
                    data: null,
                    error: {
                        message: "No files found in the provided data.",
                        code: "NO_FILES_FOUND",
                        data: null
                    }
                }
            }
        });
    });

    it("should run validation and fail - invalid files", async () => {
        const { validateImportFromUrl } = useHandler();

        const [result] = await validateImportFromUrl({
            data: JSON.stringify({
                files: [
                    {
                        get: "invalid-url",
                        head: "invalid-url",
                        type: "invalid-type"
                    }
                ]
            })
        });

        expect(result).toEqual({
            data: {
                validateImportFromUrl: {
                    data: null,
                    error: {
                        code: "VALIDATION_FAILED_INVALID_FIELDS",
                        data: {
                            invalidFields: {
                                "files.0.get": {
                                    code: "invalid_string",
                                    data: {
                                        path: ["files", 0, "get"]
                                    },
                                    message: "Invalid url"
                                },
                                "files.0.head": {
                                    code: "invalid_string",
                                    data: {
                                        path: ["files", 0, "head"]
                                    },
                                    message: "Invalid url"
                                },
                                "files.0.type": {
                                    code: "invalid_enum_value",
                                    data: {
                                        path: ["files", 0, "type"]
                                    },
                                    message:
                                        "Invalid enum value. Expected 'entries' | 'assets', received 'invalid-type'"
                                }
                            }
                        },
                        message: "Validation failed."
                    }
                }
            }
        });
    });

    it("should run validation and fail - missing entries field", async () => {
        const { validateImportFromUrl } = useHandler();

        const [result] = await validateImportFromUrl({
            data: JSON.stringify({
                files: [
                    {
                        get: "https://get-url.com",
                        head: "https://head-url.com",
                        type: "assets"
                    }
                ]
            })
        });

        expect(result).toEqual({
            data: {
                validateImportFromUrl: {
                    data: null,
                    error: {
                        message: "No entries file found in the provided data.",
                        code: "NO_ENTRIES_FILE",
                        data: null
                    }
                }
            }
        });
    });

    it("should run the validation and pass", async () => {
        const { validateImportFromUrl } = useHandler();

        const [result] = await validateImportFromUrl({
            data: JSON.stringify({
                files: [
                    {
                        get: "https://get-url.com",
                        head: "https://head-url.com",
                        type: "entries"
                    }
                ]
            })
        });

        expect(result).toEqual({
            data: {
                validateImportFromUrl: {
                    data: {
                        files: [
                            {
                                get: "https://get-url.com",
                                head: "https://head-url.com",
                                type: "entries"
                            }
                        ]
                    }
                }
            }
        });
    });
});
