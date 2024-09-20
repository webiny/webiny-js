import { ValidateImportFromUrlUseCase } from "~/crud/useCases/validateImportFromUrl";
import { categoryModel } from "~tests/helpers/models";
import { Context } from "~/types";
import { useHandler } from "~tests/helpers/useHandler";
import { NotFoundError } from "@webiny/handler-graphql";
import { CmsModel } from "@webiny/api-headless-cms/types";

describe("validateImportFromUrl", () => {
    const { createContext } = useHandler();
    let context: Context;
    const getModel = (modelId: string) => {
        return context.cms.getModel(modelId);
    };
    const getModelToAstConverter = () => {
        return context.cms.getModelToAstConverter();
    };
    beforeEach(async () => {
        context = await createContext();
    });

    it("should fail on invalid data", async () => {
        expect.assertions(1);
        const useCase = new ValidateImportFromUrlUseCase({
            getModelToAstConverter,
            getModel
        });

        const params = {
            data: "data"
        };

        try {
            await useCase.execute(params);
        } catch (ex) {
            expect(ex.message).toBe("Invalid input data provided.");
        }
    });

    it("should fail on no files found", async () => {
        expect.assertions(1);
        const useCase = new ValidateImportFromUrlUseCase({
            getModelToAstConverter,
            getModel
        });

        try {
            await useCase.execute({
                data: JSON.stringify({
                    model: categoryModel,
                    files: []
                })
            });
        } catch (ex) {
            expect(ex.message).toBe("No files found in the provided data.");
        }
    });

    it("should fail on invalid file", async () => {
        expect.assertions(2);
        const useCase = new ValidateImportFromUrlUseCase({
            getModelToAstConverter,
            getModel
        });
        try {
            await useCase.execute({
                data: JSON.stringify({
                    model: categoryModel,
                    files: [
                        {
                            get: "",
                            head: "",
                            checksum: "",
                            key: "",
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
        const useCase = new ValidateImportFromUrlUseCase({
            getModelToAstConverter,
            getModel
        });

        try {
            await useCase.execute({
                data: JSON.stringify({
                    model: categoryModel,
                    files: [
                        {
                            get: "https://some-url.com/file.zip",
                            head: "https://some-url.com/file.zip",
                            type: "assets",
                            checksum: "checksum",
                            key: "key"
                        }
                    ]
                })
            });
        } catch (ex) {
            expect(ex.message).toBe("No entries file found in the provided data.");
        }
    });

    it("should fail if model not found", async () => {
        expect.assertions(1);
        const useCase = new ValidateImportFromUrlUseCase({
            getModelToAstConverter,
            getModel: () => {
                throw new NotFoundError("Model not found.");
            }
        });

        try {
            await useCase.execute({
                data: JSON.stringify({
                    model: categoryModel,
                    files: [
                        {
                            get: "https://some-url.com/entries.zip",
                            head: "https://some-url.com/entries.zip",
                            type: "entries",
                            checksum: "checksum",
                            key: "key"
                        }
                    ]
                })
            });
        } catch (ex) {
            expect(ex.message).toEqual(`Model provided in the JSON data, "category", not found.`);
        }
    });

    it("should fail if model getter fails for some reason", async () => {
        expect.assertions(1);
        const useCase = new ValidateImportFromUrlUseCase({
            getModelToAstConverter,
            getModel: () => {
                throw new Error("Unspecified.");
            }
        });

        try {
            await useCase.execute({
                data: JSON.stringify({
                    model: categoryModel,
                    files: [
                        {
                            get: "https://some-url.com/entries.zip",
                            head: "https://some-url.com/entries.zip",
                            type: "entries",
                            checksum: "checksum",
                            key: "key"
                        }
                    ]
                })
            });
        } catch (ex) {
            expect(ex.message).toEqual(`Unspecified.`);
        }
    });

    it("should fail to match models - database model missing fields", async () => {
        expect.assertions(1);
        const useCase = new ValidateImportFromUrlUseCase({
            getModelToAstConverter,
            getModel: async () => {
                return {
                    ...categoryModel,
                    fields: categoryModel.fields.slice(1)
                } as unknown as CmsModel;
            }
        });

        try {
            await useCase.execute({
                data: JSON.stringify({
                    model: categoryModel,
                    files: [
                        {
                            get: "https://some-url.com/entries.we.zip",
                            head: "https://some-url.com/entries.we.zip",
                            type: "entries",
                            checksum: "checksum",
                            key: "key"
                        }
                    ]
                })
            });
        } catch (ex) {
            expect(ex.message).toEqual(`Field "title" not found in the model from the database.`);
        }
    });

    it("should fail to match models - exported model missing fields", async () => {
        expect.assertions(1);
        const useCase = new ValidateImportFromUrlUseCase({
            getModelToAstConverter,
            getModel: async () => {
                return {
                    ...categoryModel
                } as unknown as CmsModel;
            }
        });

        try {
            await useCase.execute({
                data: JSON.stringify({
                    model: {
                        ...categoryModel,
                        fields: categoryModel.fields.slice(0, 1)
                    },
                    files: [
                        {
                            get: "https://some-url.com/entries.we.zip",
                            head: "https://some-url.com/entries.we.zip",
                            type: "entries",
                            checksum: "checksum",
                            key: "key"
                        }
                    ]
                })
            });
        } catch (ex) {
            expect(ex.message).toEqual(
                `Field "slug" not found in the model provided via the JSON data.`
            );
        }
    });

    it("should validate files properly", async () => {
        expect.assertions(1);
        const useCase = new ValidateImportFromUrlUseCase({
            getModelToAstConverter,
            getModel
        });

        const result = await useCase.execute({
            data: JSON.stringify({
                model: categoryModel,
                files: [
                    {
                        get: "https://some-url.com/entries.zip",
                        head: "https://some-url.com/entries.zip",
                        type: "entries",
                        checksum: "checksum",
                        key: "key"
                    },
                    {
                        get: "https://some-url.com/assets.zip",
                        head: "https://some-url.com/assets.zip",
                        type: "assets",
                        checksum: "checksum",
                        key: "key"
                    }
                ]
            })
        });
        expect(result).toEqual({
            model: expect.objectContaining({
                modelId: categoryModel.modelId
            }),
            files: [
                {
                    get: "https://some-url.com/entries.zip",
                    head: "https://some-url.com/entries.zip",
                    type: "entries",
                    checksum: "checksum",
                    key: "key",
                    error: {
                        data: {
                            pathname: "/entries.zip",
                            type: "zip"
                        },
                        code: "FILE_TYPE_NOT_SUPPORTED",
                        message: "File type not supported."
                    }
                },
                {
                    get: "https://some-url.com/assets.zip",
                    head: "https://some-url.com/assets.zip",
                    type: "assets",
                    checksum: "checksum",
                    key: "key",
                    error: {
                        data: {
                            pathname: "/assets.zip",
                            type: "zip"
                        },
                        code: "FILE_TYPE_NOT_SUPPORTED",
                        message: "File type not supported."
                    }
                }
            ]
        });
    });
});
