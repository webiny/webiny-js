import useGqlHandler from "./useGqlHandler";
import { defaultIdentity } from "../tenancySecurity";

jest.setTimeout(100000);

describe("Block Categories CRUD Test", () => {
    const {
        createBlockCategory,
        deleteBlockCategory,
        listBlockCategories,
        getBlockCategory,
        updateBlockCategory
    } = useGqlHandler();

    test("create, read, update and delete block categories", async () => {
        // Test creating, getting and updating three block categories.
        const prefixes = ["block-category-one-", "block-category-two-", "block-category-three-"];
        for (let i = 0; i < 3; i++) {
            const prefix = prefixes[i];
            let data = {
                slug: `${prefix}slug`,
                name: `${prefix}name`
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
                name: data.name + "-UPDATED"
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
                                createdOn: /^20/,
                                createdBy: defaultIdentity
                            },
                            {
                                slug: "block-category-two-slug",
                                name: "block-category-two-name-UPDATED",
                                createdOn: /^20/,
                                createdBy: defaultIdentity
                            },
                            {
                                slug: "block-category-three-slug",
                                name: "block-category-three-name-UPDATED",
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
                name: `${prefix}name-UPDATED`
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
                name: `empty-slug-category`
            }
        });

        const emptySlugError: ErrorOptions = {
            code: "VALIDATION_FAILED_INVALID_FIELDS",
            message: "Validation failed.",
            data: {
                invalidFields: {
                    slug: {
                        code: "VALIDATION_FAILED_INVALID_FIELD",
                        data: null,
                        message: "Value is required."
                    }
                }
            }
        };

        expect(emptySlugErrorResponse).toEqual({
            data: {
                pageBuilder: {
                    createBlockCategory: {
                        data: null,
                        error: emptySlugError
                    }
                }
            }
        });

        const [invalidSlugErrorResponse] = await createBlockCategory({
            data: {
                slug: `invalid--slug--category`,
                name: `invalid--slug--category`
            }
        });

        const invalidSlugError: ErrorOptions = {
            code: "VALIDATION_FAILED_INVALID_FIELDS",
            message: "Validation failed.",
            data: {
                invalidFields: {
                    slug: {
                        code: "VALIDATION_FAILED_INVALID_FIELD",
                        data: null,
                        message:
                            "Slug must consist of only 'a-z' and '-' and be max 100 characters long (for example: 'some-entry-slug')"
                    }
                }
            }
        };

        expect(invalidSlugErrorResponse).toEqual({
            data: {
                pageBuilder: {
                    createBlockCategory: {
                        data: null,
                        error: invalidSlugError
                    }
                }
            }
        });
    });

    test("cannot get a block category by empty slug", async () => {
        const [errorResponse] = await getBlockCategory({ slug: `` });

        const error: ErrorOptions = {
            code: "GET_BLOCK_CATEGORY_ERROR",
            data: null,
            message: "Could not load block category by empty slug."
        };

        expect(errorResponse).toEqual({
            data: {
                pageBuilder: {
                    getBlockCategory: {
                        data: null,
                        error
                    }
                }
            }
        });
    });

    test("cannot update a block category by empty slug", async () => {
        const [errorResponse] = await updateBlockCategory({
            slug: ``,
            data: { slug: ``, name: `empty-slug-category` }
        });

        const error: ErrorOptions = {
            code: "GET_BLOCK_CATEGORY_ERROR",
            data: null,
            message: "Could not load block category by empty slug."
        };

        expect(errorResponse).toEqual({
            data: {
                pageBuilder: {
                    updateBlockCategory: {
                        data: null,
                        error
                    }
                }
            }
        });
    });
});
