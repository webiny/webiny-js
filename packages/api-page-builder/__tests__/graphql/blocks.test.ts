import useGqlHandler from "./useGqlHandler";
import { defaultIdentity } from "../tenancySecurity";
import { ErrorOptions } from "@webiny/error";

jest.setTimeout(100000);

describe("Blocks Test", () => {
    const { createBlock, createBlockCategory } = useGqlHandler();

    test("create blocks", async () => {
        // Create block category
        await createBlockCategory({
            data: {
                slug: "block-category",
                name: "block-category-name"
            }
        });

        for (let i = 0; i < 3; i++) {
            const prefix = `block-${i}-`;
            const data = {
                name: `${prefix}name`,
                type: "element",
                blockCategory: "block-category",
                preview: { src: `https://test.com/${prefix}/src.jpg` },
                content: { some: `${prefix}content` }
            };

            const [createBlockResponse] = await createBlock({ data });
            expect(createBlockResponse).toMatchObject({
                data: {
                    pageBuilder: {
                        createBlock: {
                            data: {
                                ...data,
                                createdBy: defaultIdentity,
                                createdOn: /^20/
                            },
                            error: null
                        }
                    }
                }
            });
        }
    });

    test("cannot create block if no such block category", async () => {
        const [createBlockEmptyCategoryResponse] = await createBlock({
            data: {
                name: "name",
                type: "block",
                blockCategory: "",
                preview: { src: "https://test.com/src.jpg" },
                content: { some: "content" }
            }
        });

        expect(createBlockEmptyCategoryResponse).toEqual({
            data: {
                pageBuilder: {
                    createBlock: {
                        data: null,
                        error: {
                            code: "VALIDATION_FAILED_INVALID_FIELDS",
                            message: "Validation failed.",
                            data: {
                                invalidFields: {
                                    blockCategory: {
                                        code: "VALIDATION_FAILED_INVALID_FIELD",
                                        data: null,
                                        message: "Value is required."
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        const [createBlockInvalidCategoryResponse] = await createBlock({
            data: {
                name: "name",
                type: "element",
                blockCategory: "invalid-block-category",
                preview: { src: "https://test.com/src.jpg" },
                content: { some: "content" }
            }
        });

        const error: ErrorOptions = {
            code: "NOT_FOUND",
            data: null,
            message: "Cannot create block because failed to find such block category."
        };

        expect(createBlockInvalidCategoryResponse).toEqual({
            data: {
                pageBuilder: {
                    createBlock: {
                        data: null,
                        error
                    }
                }
            }
        });
    });
});
