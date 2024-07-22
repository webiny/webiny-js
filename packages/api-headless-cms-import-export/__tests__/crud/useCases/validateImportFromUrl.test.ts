import { ValidateImportFromUrlUseCase } from "~/crud/useCases/validateImportFromUrl";

describe("validateImportFromUrl", () => {
    it("should fail on invalid data", async () => {
        expect.assertions(1);
        const useCase = new ValidateImportFromUrlUseCase();

        const params = {
            data: "data"
        };

        try {
            await useCase.execute(params);
        } catch (ex) {
            expect(ex.message).toBe("Invalid JSON data provided.");
        }
    });

    it("should fail on no files found", async () => {
        expect.assertions(1);
        const useCase = new ValidateImportFromUrlUseCase();

        try {
            await useCase.execute({
                data: JSON.stringify({
                    files: []
                })
            });
        } catch (ex) {
            expect(ex.message).toBe("No files found in the provided data.");
        }
    });

    it("should fail on invalid file", async () => {
        expect.assertions(2);
        const useCase = new ValidateImportFromUrlUseCase();
        try {
            await useCase.execute({
                data: JSON.stringify({
                    files: [
                        {
                            get: "",
                            head: "",
                            type: "assets"
                        }
                    ]
                })
            });
        } catch (ex) {
            expect(ex.message).toBe("Validation failed.");
            expect(ex.data).toEqual({
                invalidFields: {
                    "files.0.get": {
                        code: "invalid_string",
                        data: {
                            fatal: undefined,
                            path: ["files", 0, "get"]
                        },
                        message: "Invalid url"
                    },
                    "files.0.head": {
                        code: "invalid_string",
                        data: {
                            fatal: undefined,
                            path: ["files", 0, "head"]
                        },
                        message: "Invalid url"
                    }
                }
            });
        }
    });

    it("should fail if no entries file", async () => {
        expect.assertions(1);
        const useCase = new ValidateImportFromUrlUseCase();

        try {
            await useCase.execute({
                data: JSON.stringify({
                    files: [
                        {
                            get: "https://some-url.com/file.zip",
                            head: "https://some-url.com/file.zip",
                            type: "assets"
                        }
                    ]
                })
            });
        } catch (ex) {
            expect(ex.message).toBe("No entries file found in the provided data.");
        }
    });

    it("should validate files properly", async () => {
        expect.assertions(1);
        const useCase = new ValidateImportFromUrlUseCase();

        const result = await useCase.execute({
            data: JSON.stringify({
                files: [
                    {
                        get: "https://some-url.com/entries.zip",
                        head: "https://some-url.com/entries.zip",
                        type: "entries"
                    },
                    {
                        get: "https://some-url.com/assets.zip",
                        head: "https://some-url.com/assets.zip",
                        type: "assets"
                    }
                ]
            })
        });
        expect(result).toEqual({
            files: [
                {
                    get: "https://some-url.com/entries.zip",
                    head: "https://some-url.com/entries.zip",
                    type: "entries",
                    error: {
                        data: {
                            pathname: "/entries.zip",
                            type: "zip"
                        },
                        message: "File type not supported."
                    }
                },
                {
                    get: "https://some-url.com/assets.zip",
                    head: "https://some-url.com/assets.zip",
                    type: "assets",
                    error: {
                        data: {
                            pathname: "/assets.zip",
                            type: "zip"
                        },
                        message: "File type not supported."
                    }
                }
            ]
        });
    });
});
