/**
 * This test determines that a user can send a custom ID when creating a content entry.
 * The rest of the functionality and limitations remain the same.
 */
import { beforeEach, describe, expect, it } from "vitest";
import { useCategoryManageHandler } from "~tests/testHelpers/useCategoryManageHandler";
import { useProductManageHandler } from "~tests/testHelpers/useProductManageHandler";
import type { ICategoryInput } from "~tests/testHelpers/category/manage/types.js";
import { setupGroupAndModels } from "~tests/testHelpers/setup.js";


const createCategory = (input?: Partial<ICategoryInput>): Required<ICategoryInput> => {
    return {
        id: "61b48412-d616-4f36-babd-4c6a67d7bd03",
        values: {
            title: "Category with defined ID",
            slug: "category-with-defined-id",
            ...input?.values
        },
        ...input
    };
};

describe("Content entry with user defined ID", () => {
    const categoryManageHandler = useCategoryManageHandler({
        path: "manage"
    });
    const productManageHandler = useProductManageHandler({
        path: "manage"
    });

    beforeEach(async () => {
        await setupGroupAndModels({
            manager: categoryManageHandler,
            models: ["category", "product"]
        });
    });

    it("should create, update, publish, unpublish and delete an entry with the given user defined ID", async () => {
        const category = createCategory();

        /**
         * Create entry and check that it really is created.
         */
        const [createResponse] = await categoryManageHandler.createCategory({
            variables: {
                data: {
                    ...category
                }
            }
        });

        const id = `${category.id}#0001`;
        expect(createResponse).toMatchObject({
            data: {
                createCategory: {
                    data: {
                        ...category,
                        entryId: category.id,
                        id
                    },
                    error: null
                }
            }
        });

        const [getAfterCreateResponse] = await categoryManageHandler.getCategory({
            variables: {
                revision: id
            }
        });
        expect(getAfterCreateResponse).toMatchObject({
            data: {
                getCategory: {
                    data: {
                        ...category,
                        entryId: category.id,
                        id,
                        meta: {
                            version: 1,
                            status: "draft"
                        }
                    },
                    error: null
                }
            }
        });

        /**
         * Update entry and check that it really is updated.
         */
        const updatedTitle = "Updated category with defined ID";
        const [updateResponse] = await categoryManageHandler.updateCategory({
            variables: {
                revision: id,
                data: {
                    values: {
                        title: updatedTitle,
                        slug: category.values.slug
                    }
                }
            }
        });
        expect(updateResponse).toMatchObject({
            data: {
                updateCategory: {
                    data: {
                        ...category,
                        values: {
                            ...category.values,
                            title: updatedTitle
                        },
                        entryId: category.id,
                        id,
                        meta: {
                            version: 1,
                            status: "draft"
                        }
                    },
                    error: null
                }
            }
        });

        const [getAfterUpdateResponse] = await categoryManageHandler.getCategory({
            variables: {
                revision: id
            }
        });
        expect(getAfterUpdateResponse).toMatchObject({
            data: {
                getCategory: {
                    data: {
                        ...category,
                        values: {
                            ...category.values,
                            title: updatedTitle
                        },
                        entryId: category.id,
                        id,
                        meta: {
                            version: 1,
                            status: "draft"
                        }
                    },
                    error: null
                }
            }
        });

        /**
         * Publish entry and check that it really is published.
         */
        const [publishResponse] = await categoryManageHandler.publishCategory({
            variables: {
                revision: id
            }
        });
        expect(publishResponse).toMatchObject({
            data: {
                publishCategory: {
                    data: {
                        ...category,
                        values: {
                            ...category.values,
                            title: updatedTitle
                        },
                        id,
                        entryId: category.id,
                        meta: {
                            version: 1,
                            status: "published"
                        }
                    },
                    error: null
                }
            }
        });

        const [getAfterPublishResponse] = await categoryManageHandler.getCategory({
            variables: {
                revision: id
            }
        });
        expect(getAfterPublishResponse).toMatchObject({
            data: {
                getCategory: {
                    data: {
                        ...category,
                        values: {
                            ...category.values,
                            title: updatedTitle
                        },
                        entryId: category.id,
                        id,
                        meta: {
                            version: 1,
                            status: "published"
                        }
                    },
                    error: null
                }
            }
        });
        /**
         * After publishing, we should not be able to update the entry.
         */
        const [updateAfterPublishResponse] = await categoryManageHandler.updateCategory({
            variables: {
                revision: id,
                data: {
                    values: {
                        title: "This should not work",
                        slug: "this-should-not-work"
                    }
                }
            }
        });
        expect(updateAfterPublishResponse).toMatchObject({
            data: {
                updateCategory: {
                    data: null,
                    error: {
                        code: "Cms/Entry/Locked",
                        message: "Cannot update entry because it's locked.",
                        data: null
                    }
                }
            }
        });

        /**
         * Unpublish the entry and check that it really is unpublished.
         */
        const [unpublishResponse] = await categoryManageHandler.unpublishCategory({
            variables: {
                revision: id
            }
        });
        expect(unpublishResponse).toMatchObject({
            data: {
                unpublishCategory: {
                    data: {
                        ...category,
                        values: {
                            ...category.values,
                            title: updatedTitle
                        },
                        id,
                        entryId: category.id,
                        meta: {
                            version: 1,
                            status: "unpublished"
                        }
                    },
                    error: null
                }
            }
        });

        const [getAfterUnpublishResponse] = await categoryManageHandler.getCategory({
            variables: {
                revision: id
            }
        });
        expect(getAfterUnpublishResponse).toMatchObject({
            data: {
                getCategory: {
                    data: {
                        ...category,
                        values: {
                            ...category.values,
                            title: updatedTitle
                        },
                        entryId: category.id,
                        id,
                        meta: {
                            version: 1,
                            status: "unpublished"
                        }
                    },
                    error: null
                }
            }
        });
        /**
         * After unpublishing, we should not be able to update the entry.
         */
        const [updateAfterUnpublishResponse] = await categoryManageHandler.updateCategory({
            variables: {
                revision: id,
                data: {
                    values: {
                        title: "This should not work",
                        slug: "this-should-not-work"
                    }
                }
            }
        });
        expect(updateAfterUnpublishResponse).toMatchObject({
            data: {
                updateCategory: {
                    data: null,
                    error: {
                        code: "Cms/Entry/Locked",
                        message: "Cannot update entry because it's locked.",
                        data: null
                    }
                }
            }
        });
    });

    const malformedIds: [string][] = [
        ["-malformed-id"],
        ["malformed-id-"],
        ["-malformed-id-"],
        ["malformed-id-č"],
        ["malformed-id-ć"],
        ["malformed-id-š"],
        ["malformed-id-đ"],
        ["malformed-id-ž"],
        ["malformed-id-Č"],
        ["malformed-id-Ć"],
        ["malformed-id-Š"],
        ["malformed-id-Đ"],
        ["malformed-id-Ž"],
        ["malformed-id-!"],
        ["malformed-id-@"],
        ["malformed-id-#"],
        ["malformed-id-$"],
        ["malformed-id-%"],
        ["malformed-id-^"],
        ["malformed-id-&"],
        ["malformed-id-*"],
        ["malformed-id-("],
        ["malformed-id-)"],
        ["malformed-id-+"],
        ["malformed-id-="],
        ["malformed-id-{"],
        ["malformed-id-}"],
        ["malformed-id-["],
        ["malformed-id-]"],
        ["malformed-id-:"],
        ["malformed-id-;"],
        ["malformed-id-<"],
        ["malformed-id->"],
        ["malformed-id-,"],
        ["malformed-id-."],
        ["malformed-id-?"],
        ["malformed-id-|"],
        ["malformed-id-`"],
        ["malformed-id-~"],
        ["malformed-id- "],
        ["malfo rmed id"]
    ];

    it.each(malformedIds)(
        "should not allow to create an entry with malformed ID - %s",
        async id => {
            const category = createCategory({
                id
            });

            const [response] = await categoryManageHandler.createCategory({
                variables: {
                    data: {
                        ...category
                    }
                }
            });
            expect(response).toMatchObject({
                data: {
                    createCategory: {
                        data: null,
                        error: {
                            code: "INVALID_ID",
                            data: {
                                id
                            },
                            message:
                                "The provided ID is not valid. It must be a string which can be A-Z, a-z, 0-9, - and it cannot start or end with a -."
                        }
                    }
                }
            });
        }
    );

    it("should allow an entry with custom ID to be referenced in a new entry", async () => {
        const category = createCategory();
        await categoryManageHandler.createCategory({
            variables: {
                data: {
                    ...category
                }
            }
        });
        const id = `${category.id}#0001`;

        const productCategory = {
            id,
            modelId: "category"
        };
        const product = {
            title: "Server",
            price: 37591,
            inStock: false,
            availableOn: "2021-01-01",
            color: "red",
            availableSizes: ["l", "m", "s"],
            image: "server.jpg",
            category: productCategory,
            variant: {
                category: productCategory,
                options: [
                    {
                        category: productCategory,
                        categories: [productCategory]
                    }
                ]
            }
        };
        const [createProductResponse] = await productManageHandler.createProduct({
            data: {
                values: product
            }
        });
        expect(createProductResponse).toMatchObject({
            data: {
                createProduct: {
                    data: {
                        values: {
                            ...product,
                            category: {
                                ...product.category,
                                entryId: category.id
                            },
                            variant: {
                                category: {
                                    ...product.category,
                                    entryId: category.id
                                },
                                options: [
                                    {
                                        category: {
                                            ...product.category,
                                            entryId: category.id
                                        },
                                        categories: [
                                            {
                                                ...product.category,
                                                entryId: category.id
                                            }
                                        ]
                                    }
                                ]
                            }
                        },
                        id: expect.stringMatching(/^([a-zA-Z0-9]+)#0001$/)
                    },
                    error: null
                }
            }
        });
    });
});
