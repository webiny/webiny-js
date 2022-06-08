import useGqlHandler from "./useGqlHandler";
import { defaultIdentity } from "../tenancySecurity";
import { ErrorOptions } from "@webiny/error";

jest.setTimeout(100000);

describe("Page Blocks Test", () => {
    const { createPageBlock, createBlockCategory } = useGqlHandler();

    test("create page blocks", async () => {
        // Create block category
        await createBlockCategory({
            data: {
                slug: "block-category",
                name: "block-category-name"
            }
        });

        for (let i = 0; i < 3; i++) {
            const prefix = `page-block-${i}-`;
            const data = {
                name: `${prefix}name`,
                blockCategory: "block-category",
                preview: { src: `https://test.com/${prefix}/src.jpg` },
                content: { some: `${prefix}content` }
            };

            const [createPageBlockResponse] = await createPageBlock({ data });
            expect(createPageBlockResponse).toMatchObject({
                data: {
                    pageBuilder: {
                        createPageBlock: {
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

    test("cannot create page block if no such block category", async () => {
        const [createPageBlockEmptyCategoryResponse] = await createPageBlock({
            data: {
                name: "name",
                blockCategory: "",
                preview: { src: "https://test.com/src.jpg" },
                content: { some: "content" }
            }
        });

        expect(createPageBlockEmptyCategoryResponse).toEqual({
            data: {
                pageBuilder: {
                    createPageBlock: {
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

        const [createPageBlockInvalidCategoryResponse] = await createPageBlock({
            data: {
                name: "name",
                blockCategory: "invalid-block-category",
                preview: { src: "https://test.com/src.jpg" },
                content: { some: "content" }
            }
        });

        const error: ErrorOptions = {
            code: "NOT_FOUND",
            data: null,
            message: "Cannot create page block because failed to find such block category."
        };

        expect(createPageBlockInvalidCategoryResponse).toEqual({
            data: {
                pageBuilder: {
                    createPageBlock: {
                        data: null,
                        error
                    }
                }
            }
        });
    });
});
