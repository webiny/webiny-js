import { beforeEach, describe, expect, it } from "vitest";
import { useGraphQLHandler } from "../testHelpers/useGraphQLHandler";
import { useProductManageHandler } from "../testHelpers/useProductManageHandler";
import { useCategoryManageHandler } from "../testHelpers/useCategoryManageHandler";
import { useProductReadHandler } from "../testHelpers/useProductReadHandler";
import { setupGroupAndModels } from "~tests/testHelpers/setup.js";
import { richTextMock } from "./mocks/richTextValue.js";

describe("richTextField", () => {
    const manageOpts = { path: "manage" };
    const readOpts = { path: "read" };

    const mainManager = useGraphQLHandler(manageOpts);

    beforeEach(async () => {
        await setupGroupAndModels({
            manager: mainManager,
            models: ["category", "product", "review", "author"]
        });
    });

    const createCategory = async () => {
        const { createCategory, publishCategory } = useCategoryManageHandler({
            ...manageOpts
        });
        const [createCategoryResponse] = await createCategory({
            variables: {
                data: {
                    values: {
                        title: "Vegetables",
                        slug: "vegetables"
                    }
                }
            }
        });
        const category = createCategoryResponse.data.createCategory.data!;

        await publishCategory({
            variables: {
                revision: category.id
            }
        });

        return category;
    };

    it("should create a product with richText field populated", async () => {
        const category = await createCategory();

        const { createProduct, publishProduct } = useProductManageHandler({
            ...manageOpts
        });

        const { getProduct } = useProductReadHandler({
            ...readOpts
        });

        const [createProductResponse] = await createProduct({
            data: {
                values: {
                    title: "Potato",
                    price: 100,
                    availableOn: "2020-12-25",
                    color: "white",
                    availableSizes: ["s", "m"],
                    image: "file.jpg",
                    category: {
                        modelId: "category",
                        id: category.id
                    },
                    richText: richTextMock
                }
            }
        });

        expect(createProductResponse).toEqual({
            data: {
                createProduct: {
                    data: {
                        id: expect.any(String),
                        entryId: expect.any(String),
                        createdOn: expect.toBeDateString(),
                        modifiedOn: null,
                        savedOn: expect.toBeDateString(),
                        firstPublishedOn: null,
                        lastPublishedOn: null,
                        createdBy: {
                            id: "id-12345678",
                            displayName: "John Doe",
                            type: "admin"
                        },
                        values: {
                            title: "Potato",
                            price: 100,
                            image: "file.jpg",
                            availableOn: expect.toBeDateString(),
                            color: "white",
                            availableSizes: ["s", "m"],
                            category: {
                                modelId: "category",
                                id: category.id,
                                entryId: category.entryId
                            },
                            richText: richTextMock,
                            inStock: null,
                            itemsInStock: null,
                            variant: null
                        },
                        meta: {
                            locked: false,
                            modelId: "product",
                            revisions: [
                                {
                                    id: expect.any(String),
                                    values: {
                                        title: "Potato"
                                    }
                                }
                            ],
                            status: "draft",
                            title: "Potato",
                            version: 1
                        }
                    },
                    error: null
                }
            }
        });

        const product = createProductResponse.data.createProduct.data;

        const [publishedResult] = await publishProduct({
            revision: product.id
        });

        expect(publishedResult).toMatchObject({
            data: {
                publishProduct: {
                    data: {
                        id: product.id
                    },
                    error: null
                }
            }
        });

        const [response] = await getProduct({
            where: {
                id: product.id
            }
        });

        expect(response).toEqual({
            data: {
                getProduct: {
                    data: {
                        id: expect.any(String),
                        entryId: expect.any(String),
                        createdOn: expect.toBeDateString(),
                        modifiedOn: expect.toBeDateString(),
                        savedOn: expect.toBeDateString(),
                        firstPublishedOn: expect.toBeDateString(),
                        lastPublishedOn: expect.toBeDateString(),
                        values: {
                            title: "Potato",
                            image: "file.jpg",
                            price: 100,
                            availableOn: expect.toBeDateString(),
                            color: "white",
                            availableSizes: ["s", "m"],
                            category: {
                                id: expect.any(String),
                                values: {
                                    title: "Vegetables"
                                }
                            },
                            richText: richTextMock.html,
                            inStock: null,
                            itemsInStock: null,
                            variant: null
                        }
                    },
                    error: null
                }
            }
        });
    });

    it("should create a product with empty rich-text field and then update it with some value", async () => {
        const category = await createCategory();

        const { createProduct, updateProduct } = useProductManageHandler({
            ...manageOpts
        });

        const productData = {
            title: "Potato",
            price: 100,
            availableOn: "2020-12-25",
            color: "white",
            availableSizes: ["s", "m"],
            image: "file.jpg",
            category: {
                modelId: "category",
                id: category.id
            }
        };
        /**
         * First we create the product without the rich text populated.
         */
        const [createProductResponse] = await createProduct({
            data: {
                values: productData
            }
        });

        const expectedCreatedProduct = {
            id: expect.any(String),
            entryId: expect.any(String),
            createdOn: expect.toBeDateString(),
            modifiedOn: null,
            savedOn: expect.toBeDateString(),
            firstPublishedOn: null,
            lastPublishedOn: null,
            createdBy: {
                id: "id-12345678",
                displayName: "John Doe",
                type: "admin"
            },
            meta: {
                locked: false,
                modelId: "product",
                revisions: [
                    {
                        id: expect.any(String),
                        values: {
                            title: "Potato"
                        }
                    }
                ],
                status: "draft",
                title: "Potato",
                version: 1
            },
            values: {
                title: "Potato",
                price: 100,
                image: "file.jpg",
                availableOn: expect.toBeDateString(),
                color: "white",
                availableSizes: ["s", "m"],
                category: {
                    modelId: "category",
                    id: category.id,
                    entryId: category.entryId
                },
                richText: null,
                inStock: null,
                itemsInStock: null,
                variant: null
            }
        };
        /**
         * Make sure that the response is ok.
         */
        expect(createProductResponse).toEqual({
            data: {
                createProduct: {
                    data: expectedCreatedProduct,
                    error: null
                }
            }
        });
        /**
         * We now update the rich text field with some value.
         */
        const [updateProductResponse] = await updateProduct({
            revision: createProductResponse.data.createProduct.data.id,
            data: {
                values: {
                    ...productData,
                    richText: richTextMock
                }
            }
        });
        /**
         * And check that everything is ok.
         */
        expect(updateProductResponse).toEqual({
            data: {
                updateProduct: {
                    data: {
                        ...expectedCreatedProduct,
                        values: {
                            ...expectedCreatedProduct.values,
                            richText: richTextMock
                        },
                        modifiedOn: expect.toBeDateString()
                    },
                    error: null
                }
            }
        });
    });
});
