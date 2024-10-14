import useGqlHandler from "./useGqlHandler";
import { defaultIdentity } from "../tenancySecurity";
import { ErrorOptions } from "@webiny/error";
import { expectCompressed } from "~tests/graphql/utils/expectCompressed";

jest.setTimeout(100000);

describe("Page Blocks Test", () => {
    const {
        createPageBlock,
        getPageBlock,
        updatePageBlock,
        listPageBlocks,
        deletePageBlock,
        createBlockCategory
    } = useGqlHandler();

    test("create, read, update and delete page blocks", async () => {
        const ids = [];
        const prefixes = ["page-block-one-", "page-block-two-", "page-block-three-"];

        // Create block category
        await createBlockCategory({
            data: {
                slug: "block-category",
                name: "block-category-name",
                icon: {
                    type: "emoji",
                    name: "block-category-icon",
                    value: "👍"
                },
                description: "block-category-description"
            }
        });

        // Test creating, getting and updating three page blocks.
        for (let i = 0; i < 3; i++) {
            const prefix = prefixes[i];
            const data = {
                name: `${prefix}name`,
                blockCategory: `block-category`,
                content: { some: `${prefix}content` }
            };

            const [createPageBlockResponse] = await createPageBlock({ data });
            expect(createPageBlockResponse).toMatchObject({
                data: {
                    pageBuilder: {
                        createPageBlock: {
                            data: {
                                ...data,
                                content: expectCompressed(data.content),
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
                            data: {
                                ...data,
                                content: expectCompressed(data.content)
                            },
                            error: null
                        }
                    }
                }
            });

            const updateData = {
                name: `${prefix}name-UPDATED`,
                blockCategory: `block-category`,
                content: { some: `${prefix}content-UPDATED` }
            };

            const [updatePageBlockResponse] = await updatePageBlock({
                id: ids[i],
                data: updateData
            });
            expect(updatePageBlockResponse).toMatchObject({
                data: {
                    pageBuilder: {
                        updatePageBlock: {
                            data: {
                                ...updateData,
                                content: expectCompressed(updateData.content),
                                createdBy: defaultIdentity,
                                createdOn: /^20/
                            },
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
                                content: expectCompressed({
                                    some: "page-block-one-content-UPDATED"
                                }),
                                createdBy: defaultIdentity,
                                createdOn: /^20/,
                                id: ids[0],
                                name: "page-block-one-name-UPDATED"
                            },
                            {
                                blockCategory: "block-category",
                                content: expectCompressed({
                                    some: "page-block-two-content-UPDATED"
                                }),
                                createdBy: defaultIdentity,
                                createdOn: /^20/,
                                id: ids[1],
                                name: "page-block-two-name-UPDATED"
                            },
                            {
                                blockCategory: "block-category",
                                content: expectCompressed({
                                    some: "page-block-three-content-UPDATED"
                                }),
                                createdBy: defaultIdentity,
                                createdOn: /^20/,
                                id: ids[2],
                                name: "page-block-three-name-UPDATED"
                            }
                        ],
                        error: null
                    }
                }
            }
        });

        // After deleting all page blocks, list should be empty.
        for (let i = 0; i < 3; i++) {
            const [deletePageBlockResponse] = await deletePageBlock({ id: ids[i] });
            expect(deletePageBlockResponse).toMatchObject({
                data: {
                    pageBuilder: {
                        deletePageBlock: {
                            data: true,
                            error: null
                        }
                    }
                }
            });
        }

        // List should show zero page blocks.
        const [listPageBlocksAfterDeleteResponse] = await listPageBlocks();
        expect(listPageBlocksAfterDeleteResponse).toMatchObject({
            data: {
                pageBuilder: {
                    listPageBlocks: {
                        data: [],
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
                                        code: "custom",
                                        data: {
                                            path: ["blockCategory"]
                                        },
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
                content: { some: "content" }
            }
        });

        const error: ErrorOptions = {
            code: "NOT_FOUND",
            data: null,
            message: "Block category not found!"
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

    test("cannot update page block with empty or missing block category", async () => {
        await createBlockCategory({
            data: {
                slug: "block-category",
                name: "block-category-name",
                icon: {
                    type: "emoji",
                    name: "block-category-icon",
                    value: "👍"
                },
                description: "block-category-description"
            }
        });

        const [createPageBlockResponse] = await createPageBlock({
            data: {
                name: "name",
                blockCategory: "block-category",
                content: { some: "content" }
            }
        });

        const category = createPageBlockResponse.data.pageBuilder.createPageBlock.data;

        const [updatePageBlockEmptyCategoryResponse] = await updatePageBlock({
            id: category.id,
            data: {
                name: "name",
                blockCategory: "",
                content: { some: "content" }
            }
        });

        expect(updatePageBlockEmptyCategoryResponse).toMatchObject({
            data: {
                pageBuilder: {
                    updatePageBlock: {
                        data: {
                            name: "name",
                            blockCategory: "block-category",
                            content: expectCompressed({ some: "content" })
                        },
                        error: null
                    }
                }
            }
        });

        const [updatePageBlockInvalidCategoryResponse] = await updatePageBlock({
            id: category.id,
            data: {
                name: "name",
                blockCategory: "invalid-block-category",
                content: { some: "content" }
            }
        });

        expect(updatePageBlockInvalidCategoryResponse).toEqual({
            data: {
                pageBuilder: {
                    updatePageBlock: {
                        data: null,
                        error: {
                            code: "NOT_FOUND",
                            data: null,
                            message: "Requested page block category doesn't exist."
                        }
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

    test(`should able to filter "Page Blocks" list by "blockCategory"`, async () => {
        // Create two block categories and two page blocks
        await createBlockCategory({
            data: {
                slug: "block-category-one",
                name: "block-category-one-name",
                icon: {
                    type: "emoji",
                    name: "block-category-one-icon",
                    value: "👍"
                },
                description: "block-category-one-description"
            }
        });

        await createBlockCategory({
            data: {
                slug: "block-category-two",
                name: "block-category-two-name",
                icon: {
                    type: "emoji",
                    name: "block-category-two-icon",
                    value: "👍"
                },
                description: "block-category-two-description"
            }
        });

        const [createPageBlockOneResponse] = await createPageBlock({
            data: {
                name: `page-block-one-name`,
                blockCategory: `block-category-one`,
                content: { some: `page-block-one-content` }
            }
        });
        const pageBlockOneId = createPageBlockOneResponse.data.pageBuilder.createPageBlock.data.id;

        const [createPageBlockTwoResponse] = await createPageBlock({
            data: {
                name: `page-block-two-name`,
                blockCategory: `block-category-two`,
                content: { some: `page-block-two-content` }
            }
        });
        const pageBlockTwoId = createPageBlockTwoResponse.data.pageBuilder.createPageBlock.data.id;

        //Should list all page blocks from first block category
        const [listFirstCategoryPageBlocksResponse] = await listPageBlocks({
            where: {
                blockCategory: "block-category-one"
            }
        });
        expect(listFirstCategoryPageBlocksResponse).toMatchObject({
            data: {
                pageBuilder: {
                    listPageBlocks: {
                        data: [
                            {
                                blockCategory: "block-category-one",
                                content: expectCompressed({
                                    some: "page-block-one-content"
                                }),
                                createdBy: defaultIdentity,
                                createdOn: /^20/,
                                id: pageBlockOneId,
                                name: "page-block-one-name"
                            }
                        ],
                        error: null
                    }
                }
            }
        });

        //Should list all page blocks from second block category
        const [listSecondCategoryPageBlocksResponse] = await listPageBlocks({
            where: {
                blockCategory: "block-category-two"
            }
        });
        expect(listSecondCategoryPageBlocksResponse).toMatchObject({
            data: {
                pageBuilder: {
                    listPageBlocks: {
                        data: [
                            {
                                blockCategory: "block-category-two",
                                content: expectCompressed({
                                    some: "page-block-two-content"
                                }),
                                createdBy: defaultIdentity,
                                createdOn: /^20/,
                                id: pageBlockTwoId,
                                name: "page-block-two-name"
                            }
                        ],
                        error: null
                    }
                }
            }
        });
    });

    test(`cannot filter "Page Blocks" list by missing "blockCategory"`, async () => {
        const [listPageBlocksResponse] = await listPageBlocks({
            where: {
                blockCategory: "missing-slug"
            }
        });
        expect(listPageBlocksResponse).toMatchObject({
            data: {
                pageBuilder: {
                    listPageBlocks: {
                        data: null,
                        error: {
                            code: "NOT_FOUND",
                            data: null,
                            message: "Block Category not found."
                        }
                    }
                }
            }
        });
    });
});
