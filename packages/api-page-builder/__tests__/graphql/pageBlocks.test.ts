import useGqlHandler from "./useGqlHandler";
import { defaultIdentity } from "../tenancySecurity";
import { ErrorOptions } from "@webiny/error";

jest.setTimeout(100000);

describe("Page Blocks Test", () => {
    const { createPageBlock, getPageBlock, listPageBlocks, createBlockCategory } = useGqlHandler();

    test("create, read page blocks", async () => {
        const ids = [];
        const prefixes = ["page-block-one-", "page-block-two-", "page-block-three-"];

        // Create block category
        await createBlockCategory({
            data: {
                slug: "block-category",
                name: "block-category-name"
            }
        });

        // Test creating, getting three page blocks.
        for (let i = 0; i < 3; i++) {
            const prefix = prefixes[i];
            const data = {
                name: `${prefix}name`,
                blockCategory: `block-category`,
                preview: { src: `https://test.com/${prefix}name/src.jpg` },
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

            ids.push(createPageBlockResponse.data.pageBuilder.createPageBlock.data.id);

            const [getPageBlockResponse] = await getPageBlock({ id: ids[i] });
            expect(getPageBlockResponse).toMatchObject({
                data: {
                    pageBuilder: {
                        getPageBlock: {
                            data,
                            error: null
                        }
                    }
                }
            });
        }

        // List should show three page blocks.
        const [listPageBlocksResponse] = await listPageBlocks();
        expect(listPageBlocksResponse).toMatchObject({
            data: {
                pageBuilder: {
                    listPageBlocks: {
                        data: [
                            {
                                blockCategory: "block-category",
                                content: {
                                    some: "page-block-one-content"
                                },
                                createdBy: defaultIdentity,
                                createdOn: /^20/,
                                id: ids[0],
                                name: "page-block-one-name",
                                preview: {
                                    src: "https://test.com/page-block-one-name/src.jpg"
                                }
                            },
                            {
                                blockCategory: "block-category",
                                content: {
                                    some: "page-block-two-content"
                                },
                                createdBy: defaultIdentity,
                                createdOn: /^20/,
                                id: ids[1],
                                name: "page-block-two-name",
                                preview: {
                                    src: "https://test.com/page-block-two-name/src.jpg"
                                }
                            },
                            {
                                blockCategory: "block-category",
                                content: {
                                    some: "page-block-three-content"
                                },
                                createdBy: defaultIdentity,
                                createdOn: /^20/,
                                id: ids[2],
                                name: "page-block-three-name",
                                preview: {
                                    src: "https://test.com/page-block-three-name/src.jpg"
                                }
                            }
                        ],
                        error: null
                    }
                }
            }
        });
    });

    test("cannot create page block with empty or missing block category", async () => {
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

    test("cannot get a page block by empty id", async () => {
        const [getPageBlockEmptyIdResponse] = await getPageBlock({ id: "" });
        expect(getPageBlockEmptyIdResponse).toMatchObject({
            data: {
                pageBuilder: {
                    getPageBlock: {
                        data: null,
                        error: {
                            code: "GET_PAGE_BLOCK_ERROR",
                            data: null,
                            message: "Could not load page block by empty id."
                        }
                    }
                }
            }
        });
    });
});
