/**
 * This test determines that a user can send a custom ID when creating a content entry.
 * The rest of functionality and limitations remain the same.
 */
import { setupContentModelGroup, setupContentModels } from "~tests/testHelpers/setup";
import { useCategoryManageHandler } from "~tests/testHelpers/useCategoryManageHandler";
import { useProductManageHandler } from "~tests/testHelpers/useProductManageHandler";

interface Category {
    id: string;
    title: string;
    slug: string;
}
const createCategory = (input?: Partial<Category>): Category => {
    return {
        id: "61b48412-d616-4f36-babd-4c6a67d7bd03",
        title: "Category with defined ID",
        slug: "category-with-defined-id",
        ...input
    };
};

describe("Content entry with user defined ID", () => {
    const categoryManageHandler = useCategoryManageHandler({
        path: "manage/en-US"
    });
    const productManageHandler = useProductManageHandler({
        path: "manage/en-US"
    });

    beforeEach(async () => {
        const group = await setupContentModelGroup(categoryManageHandler);
        await setupContentModels(categoryManageHandler, group, ["category", "product"]);
    });

    it("should create, update, publish, unpublish and delete an entry with the given user defined ID", async () => {
        const category = createCategory();

        /**
         * Create entry and check that it really is created.
         */
        const [createResponse] = await categoryManageHandler.createCategory({
            data: category
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
            revision: id
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
            revision: id,
            data: {
                title: updatedTitle,
                slug: category.slug
            }
        });
        expect(updateResponse).toMatchObject({
            data: {
                updateCategory: {
                    data: {
                        ...category,
                        entryId: category.id,
                        id,
                        title: updatedTitle,
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
            revision: id
        });
        expect(getAfterUpdateResponse).toMatchObject({
            data: {
                getCategory: {
                    data: {
                        ...category,
                        title: updatedTitle,
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
            revision: id
        });
        expect(publishResponse).toMatchObject({
            data: {
                publishCategory: {
                    data: {
                        ...category,
                        title: updatedTitle,
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
            revision: id
        });
        expect(getAfterPublishResponse).toMatchObject({
            data: {
                getCategory: {
                    data: {
                        ...category,
                        title: updatedTitle,
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
            revision: id,
            data: {
                title: "This should not work",
                slug: "this-should-not-work"
            }
        });
        expect(updateAfterPublishResponse).toEqual({
            data: {
                updateCategory: {
                    data: null,
                    error: {
                        code: "CONTENT_ENTRY_UPDATE_ERROR",
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
            revision: id
        });
        expect(unpublishResponse).toMatchObject({
            data: {
                unpublishCategory: {
                    data: {
                        ...category,
                        title: updatedTitle,
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
            revision: id
        });
        expect(getAfterUnpublishResponse).toMatchObject({
            data: {
                getCategory: {
                    data: {
                        ...category,
                        title: updatedTitle,
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
            revision: id,
            data: {
                title: "This should not work",
                slug: "this-should-not-work"
            }
        });
        expect(updateAfterUnpublishResponse).toEqual({
            data: {
                updateCategory: {
                    data: null,
                    error: {
                        code: "CONTENT_ENTRY_UPDATE_ERROR",
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
                data: {
                    ...category
                }
            });
            expect(response).toEqual({
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
            data: {
                ...category
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
            data: product
        });
        expect(createProductResponse).toMatchObject({
            data: {
                createProduct: {
                    data: {
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
                        },
                        id: expect.stringMatching(/^([a-zA-Z0-9]+)#0001$/)
                    },
                    error: null
                }
            }
        });
    });
});
