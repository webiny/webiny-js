import useGqlHandler from "./useGqlHandler";
import { defaultIdentity } from "../tenancySecurity";

jest.setTimeout(100000);

const emptySlugError = {
    code: "GET_BLOCK_CATEGORY_EMPTY_SLUG",
    data: null,
    message: "Block category slug cannot be empty!"
};

const cannotDeletePageBlockError = {
    code: "BLOCK_CATEGORY_HAS_LINKED_BLOCKS",
    data: null,
    message: "Cannot delete block category because some page blocks are linked to it."
};

describe("Block Categories CRUD Test", () => {
    const {
        createBlockCategory,
        deleteBlockCategory,
        listBlockCategories,
        getBlockCategory,
        updateBlockCategory,
        createPageBlock,
        listPageBlocks,
        deletePageBlock,
        until
    } = useGqlHandler();

    test("create, read, update and delete block categories", async () => {
        // Test creating, getting and updating three block categories.
        const prefixes = ["block-category-one-", "block-category-two-", "block-category-three-"];
        for (let i = 0; i < 3; i++) {
            const prefix = prefixes[i];
            let data = {
                slug: `${prefix}slug`,
                name: `${prefix}name`,
                icon: { type: `emoji`, name: `${prefix}icon`, value: `👍` },
                description: `${prefix}description`
            };

            let [response] = await createBlockCategory({ data });
            expect(response).toMatchObject({
                data: {
                    pageBuilder: {
                        createBlockCategory: {
                            data: {
                                ...data,
                                createdOn: /^20/,
                                createdBy: defaultIdentity
                            },
                            error: null
                        }
                    }
                }
            });

            [response] = await getBlockCategory({ slug: data.slug });
            expect(response).toMatchObject({
                data: {
                    pageBuilder: {
                        getBlockCategory: {
                            data: {
                                ...data,
                                createdOn: /^20/,
                                createdBy: defaultIdentity
                            },
                            error: null
                        }
                    }
                }
            });

            data = {
                slug: data.slug, // Slug cannot be changed.
                name: data.name + "-UPDATED",
                icon: { ...data.icon, name: data.icon.name + "-UPDATED" },
                description: data.description + "-UPDATED"
            };

            [response] = await updateBlockCategory({ slug: data.slug, data });
            expect(response).toMatchObject({
                data: {
                    pageBuilder: {
                        updateBlockCategory: {
                            data: {
                                ...data,
                                createdOn: /^20/,
                                createdBy: defaultIdentity
                            },
                            error: null
                        }
                    }
                }
            });
        }

        // List should show three block categories.
        let [response] = await listBlockCategories();
        expect(response).toMatchObject({
            data: {
                pageBuilder: {
                    listBlockCategories: {
                        data: [
                            {
                                slug: "block-category-one-slug",
                                name: "block-category-one-name-UPDATED",
                                icon: {
                                    type: "emoji",
                                    name: "block-category-one-icon-UPDATED",
                                    value: "👍"
                                },
                                description: "block-category-one-description-UPDATED",
                                createdOn: /^20/,
                                createdBy: defaultIdentity
                            },
                            {
                                slug: "block-category-two-slug",
                                name: "block-category-two-name-UPDATED",
                                icon: {
                                    type: "emoji",
                                    name: "block-category-two-icon-UPDATED",
                                    value: "👍"
                                },
                                description: "block-category-two-description-UPDATED",
                                createdOn: /^20/,
                                createdBy: defaultIdentity
                            },
                            {
                                slug: "block-category-three-slug",
                                name: "block-category-three-name-UPDATED",
                                icon: {
                                    type: "emoji",
                                    name: "block-category-three-icon-UPDATED",
                                    value: "👍"
                                },
                                description: "block-category-three-description-UPDATED",
                                createdOn: /^20/,
                                createdBy: defaultIdentity
                            }
                        ],
                        error: null
                    }
                }
            }
        });

        // After deleting all block categories, list should be empty.
        for (let i = 0; i < 3; i++) {
            const prefix = prefixes[i];
            const data = {
                slug: `${prefix}slug`,
                name: `${prefix}name-UPDATED`,
                icon: {
                    type: `emoji`,
                    name: `${prefix}icon-UPDATED`,
                    value: `👍`
                },
                description: `${prefix}description-UPDATED`
            };

            const [response] = await deleteBlockCategory({ slug: data.slug });
            expect(response).toMatchObject({
                data: {
                    pageBuilder: {
                        deleteBlockCategory: {
                            data: {
                                ...data,
                                createdOn: /^20/,
                                createdBy: defaultIdentity
                            },
                            error: null
                        }
                    }
                }
            });
        }

        // List should show zero categories.
        [response] = await listBlockCategories();
        expect(response).toEqual({
            data: {
                pageBuilder: {
                    listBlockCategories: {
                        data: [],
                        error: null
                    }
                }
            }
        });
    });

    test("cannot create a block category with empty or invalid slug", async () => {
        const [emptySlugErrorResponse] = await createBlockCategory({
            data: {
                slug: ``,
                name: `empty-slug-category-name`,
                icon: {
                    type: `emoji`,
                    name: `empty-slug-category-icon`,
                    value: `👍`
                },
                description: `empty-slug-category-description`
            }
        });

        expect(emptySlugErrorResponse).toEqual({
            data: {
                pageBuilder: {
                    createBlockCategory: {
                        data: null,
                        error: {
                            code: "VALIDATION_FAILED_INVALID_FIELDS",
                            message: "Validation failed.",
                            data: {
                                invalidFields: {
                                    slug: {
                                        code: "custom",
                                        data: {
                                            path: ["slug"]
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

        const [invalidSlugErrorResponse] = await createBlockCategory({
            data: {
                slug: `invalid--slug--category`,
                name: `invalid--slug--category--name`,
                icon: {
                    type: `emoji`,
                    name: `invalid--slug--category--icon`,
                    value: `👍`
                },
                description: `invalid--slug--category--description`
            }
        });

        expect(invalidSlugErrorResponse).toEqual({
            data: {
                pageBuilder: {
                    createBlockCategory: {
                        data: null,
                        error: {
                            code: "VALIDATION_FAILED_INVALID_FIELDS",
                            message: "Validation failed.",
                            data: {
                                invalidFields: {
                                    slug: {
                                        code: "custom",
                                        data: {
                                            path: ["slug"]
                                        },
                                        message:
                                            "Slug must consist of only 'a-z', '0-9' and '-' and be max 100 characters long (for example: 'some-slug' or 'some-slug-2')"
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });
    });

    test("cannot get a block category by empty slug", async () => {
        const [errorResponse] = await getBlockCategory({ slug: `` });

        expect(errorResponse).toEqual({
            data: {
                pageBuilder: {
                    getBlockCategory: {
                        data: null,
                        error: emptySlugError
                    }
                }
            }
        });
    });

    test("cannot update a block category by empty slug", async () => {
        const [errorResponse] = await updateBlockCategory({
            slug: ``,
            data: {
                slug: ``,
                name: `empty-slug-category-name`,
                icon: {
                    type: `emoji`,
                    name: `empty-slug-category-icon`,
                    value: `👍`
                },
                description: `empty-slug-category-description`
            }
        });

        expect(errorResponse).toEqual({
            data: {
                pageBuilder: {
                    updateBlockCategory: {
                        data: null,
                        error: emptySlugError
                    }
                }
            }
        });
    });

    test("cannot delete block category if in use by at least one page block", async () => {
        await createBlockCategory({
            data: {
                slug: `delete-block-cat`,
                name: `name`,
                icon: {
                    type: `emoji`,
                    name: `icon`,
                    value: `👍`
                },
                description: `description`
            }
        });

        const b1 = await createPageBlock({
            data: {
                name: `page-block-one-name`,
                blockCategory: `delete-block-cat`,
                content: { some: `page-block-one-content` }
            }
        }).then(([res]) => res.data.pageBuilder.createPageBlock.data);
        const b2 = await createPageBlock({
            data: {
                name: `page-block-two-name`,
                blockCategory: `delete-block-cat`,
                content: { some: `page-block-two-content` }
            }
        }).then(([res]) => res.data.pageBuilder.createPageBlock.data);
        const b3 = await createPageBlock({
            data: {
                name: `page-block-three-name`,
                blockCategory: `delete-block-cat`,
                content: { some: `page-block-three-content` }
            }
        }).then(([res]) => res.data.pageBuilder.createPageBlock.data);

        await until(
            listPageBlocks,
            ([res]: any) => res.data.pageBuilder.listPageBlocks.data.length === 3,
            {
                tries: 10,
                name: "list page blocks before delete"
            }
        );

        const [deleteBlockCategoryResult] = await deleteBlockCategory({ slug: "delete-block-cat" });

        expect(deleteBlockCategoryResult).toEqual({
            data: {
                pageBuilder: {
                    deleteBlockCategory: {
                        data: null,
                        error: cannotDeletePageBlockError
                    }
                }
            }
        });

        await deletePageBlock({ id: b1.id });

        const [deleteBlockCategoryAfterDeletePageBlock1Result] = await deleteBlockCategory({
            slug: "delete-block-cat"
        });

        expect(deleteBlockCategoryAfterDeletePageBlock1Result).toEqual({
            data: {
                pageBuilder: {
                    deleteBlockCategory: {
                        data: null,
                        error: cannotDeletePageBlockError
                    }
                }
            }
        });

        await deletePageBlock({ id: b2.id });

        const [deleteBlockCategoryAfterDeletePageBlock2Result] = await deleteBlockCategory({
            slug: "delete-block-cat"
        });

        expect(deleteBlockCategoryAfterDeletePageBlock2Result).toEqual({
            data: {
                pageBuilder: {
                    deleteBlockCategory: {
                        data: null,
                        error: cannotDeletePageBlockError
                    }
                }
            }
        });

        const [deletePageBlockResponse] = await deletePageBlock({ id: b3.id });

        expect(deletePageBlockResponse).toEqual({
            data: {
                pageBuilder: {
                    deletePageBlock: {
                        data: true,
                        error: null
                    }
                }
            }
        });

        await until(
            listPageBlocks,
            ([res]: any) => {
                return res.data.pageBuilder.listPageBlocks.data.length === 0;
            },
            {
                tries: 10,
                name: "list page blocks after delete"
            }
        );

        await deleteBlockCategory({ slug: "delete-block-cat" }).then(([res]) =>
            expect(res.data.pageBuilder.deleteBlockCategory).toMatchObject({
                data: {
                    createdBy: defaultIdentity,
                    slug: `delete-block-cat`,
                    name: `name`,
                    icon: {
                        type: `emoji`,
                        name: `icon`,
                        value: `👍`
                    },
                    description: `description`
                },
                error: null
            })
        );
    });
});
