import { useGraphQLHandler } from "../utils/useGraphQLHandler";
import { CmsEntry, CmsGroup } from "~/types";
import models from "./mocks/contentModels";
import { useProductManageHandler } from "../utils/useProductManageHandler";
import { useCategoryManageHandler } from "../utils/useCategoryManageHandler";
import { useProductReadHandler } from "../utils/useProductReadHandler";

const richTextMock = [
    {
        tag: "h1",
        content: "Testing H1 tags"
    },
    {
        tag: "p",
        content: "Some small piece of text to test P tags"
    },
    {
        tag: "div",
        content: [
            {
                tag: "p",
                text: "Text inside the div > p"
            },
            {
                tag: "a",
                href: "https://www.webiny.com",
                text: "Webiny"
            }
        ]
    }
];

describe("richTextField", () => {
    const manageOpts = { path: "manage/en-US" };
    const readOpts = { path: "read/en-US" };

    const {
        createContentModelMutation,
        updateContentModelMutation,
        createContentModelGroupMutation
    } = useGraphQLHandler(manageOpts);

    // This function is not directly within `beforeEach` as we don't always setup the same content model.
    // We call this function manually at the beginning of each test, where needed.
    const setupContentModelGroup = async (): Promise<CmsGroup> => {
        const [createCMG] = await createContentModelGroupMutation({
            data: {
                name: "Group",
                slug: "group",
                icon: "ico/ico",
                description: "description"
            }
        });
        return createCMG.data.createContentModelGroup.data;
    };

    const setupContentModel = async (contentModelGroup: CmsGroup, name: string) => {
        const model = models.find(m => m.modelId === name);
        if (!model) {
            throw new Error(`Could not find model "${name}".`);
        }
        // Create initial record
        const [create] = await createContentModelMutation({
            data: {
                name: model.name,
                modelId: model.modelId,
                group: contentModelGroup.id
            }
        });

        if (create.errors) {
            console.error(`[beforeEach] ${create.errors[0].message}`);
            process.exit(1);
        }

        const [update] = await updateContentModelMutation({
            modelId: create.data.createContentModel.data.modelId,
            data: {
                fields: model.fields,
                layout: model.layout
            }
        });
        return update.data.updateContentModel.data;
    };
    const setupContentModels = async (contentModelGroup: CmsGroup) => {
        const models: Record<string, any> = {
            category: null,
            product: null,
            review: null,
            author: null
        };
        for (const name in models) {
            models[name] = await setupContentModel(contentModelGroup, name);
        }
        return models;
    };

    const createCategory = async () => {
        const { createCategory, publishCategory } = useCategoryManageHandler({
            ...manageOpts
        });
        const [createCategoryResponse] = await createCategory({
            data: {
                title: "Vegetables",
                slug: "vegetables"
            }
        });
        const category = createCategoryResponse.data.createCategory.data as CmsEntry;

        await publishCategory({
            revision: category.id
        });

        return category;
    };

    test("should create a product with richText field populated", async () => {
        const contentModelGroup = await setupContentModelGroup();
        await setupContentModels(contentModelGroup);

        const category = await createCategory();

        const { createProduct, publishProduct } = useProductManageHandler({
            ...manageOpts
        });

        const { until, getProduct } = useProductReadHandler({
            ...readOpts
        });

        const [createProductResponse] = await createProduct({
            data: {
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
        });

        expect(createProductResponse).toEqual({
            data: {
                createProduct: {
                    data: {
                        id: expect.any(String),
                        entryId: expect.any(String),
                        createdOn: expect.stringMatching(/^20/),
                        createdBy: {
                            id: "12345678",
                            displayName: "John Doe",
                            type: "admin"
                        },
                        savedOn: expect.stringMatching(/^20/),
                        title: "Potato",
                        price: 100,
                        availableOn: expect.stringMatching(/^20/),
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
                        variant: null,
                        meta: {
                            locked: false,
                            modelId: "product",
                            publishedOn: null,
                            revisions: [
                                {
                                    id: expect.any(String),
                                    title: "Potato"
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

        await publishProduct({
            revision: product.id
        });

        // If this `until` resolves successfully, we know entry is accessible via the "read" API
        await until(
            () =>
                getProduct({
                    where: {
                        id: product.id
                    }
                }).then(([data]) => data),
            ({ data }: any) => data.getProduct.data.id === product.id,
            { name: "get created product" }
        );

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
                        createdOn: expect.stringMatching(/^20/),
                        savedOn: expect.stringMatching(/^20/),
                        title: "Potato",
                        price: 100,
                        availableOn: expect.stringMatching(/^20/),
                        color: "white",
                        availableSizes: ["s", "m"],
                        category: {
                            id: expect.any(String),
                            title: "Vegetables"
                        },
                        richText: richTextMock,
                        inStock: null,
                        itemsInStock: null,
                        variant: null
                    },
                    error: null
                }
            }
        });
    });

    test("should create a product with empty rich-text field and then update it with some value", async () => {
        const contentModelGroup = await setupContentModelGroup();
        await setupContentModels(contentModelGroup);

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
            data: productData
        });

        const expectedCreatedProduct = {
            id: expect.any(String),
            entryId: expect.any(String),
            createdOn: expect.stringMatching(/^20/),
            createdBy: {
                id: "12345678",
                displayName: "John Doe",
                type: "admin"
            },
            savedOn: expect.stringMatching(/^20/),
            title: "Potato",
            price: 100,
            availableOn: expect.stringMatching(/^20/),
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
            variant: null,
            meta: {
                locked: false,
                modelId: "product",
                publishedOn: null,
                revisions: [
                    {
                        id: expect.any(String),
                        title: "Potato"
                    }
                ],
                status: "draft",
                title: "Potato",
                version: 1
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
                ...productData,
                richText: richTextMock
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
                        richText: richTextMock
                    },
                    error: null
                }
            }
        });
    });
});
