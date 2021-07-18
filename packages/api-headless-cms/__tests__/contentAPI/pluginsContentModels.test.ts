import { useContentGqlHandler } from "../utils/useContentGqlHandler";
import { ContentModelPlugin } from "@webiny/api-headless-cms/content/plugins/ContentModelPlugin";

const contentModelPlugin = new ContentModelPlugin({
    name: "Product",
    modelId: "product",
    locale: "en-us",
    group: {
        id: "ecommerce",
        name: "E-Commerce"
    },
    fields: [
        {
            id: "name",
            fieldId: "name",
            type: "text",
            label: "Product Name"
        },
        {
            id: "sku",
            fieldId: "sku",
            type: "text",
            label: "SKU"
        },
        {
            id: "price",
            fieldId: "price",
            type: "number",
            label: "Price"
        }
    ],
    layout: [["name"], ["sku", "price"]],
    titleFieldId: "name"
});

const FIELDS_FRAGMENT = /* GraphQL */ `
    fragment ProductFields on Product {
        name
        sku
        price
        meta {
            status
        }
    }
`;

const ERROR_FRAGMENT = /* GraphQL */ `
    fragment ErrorFields on CmsError {
        data
        code
        message
    }
`;

const CREATE_PRODUCT = /* GraphQL */ `
    ${FIELDS_FRAGMENT}
    ${ERROR_FRAGMENT}
    mutation CreateProduct($data: ProductInput!) {
        createProduct(data: $data) {
            data {
                ...ProductFields
            }
            error {
                ...ErrorFields
            }
        }
    }
`;

const PUBLISH_PRODUCT = /* GraphQL */ `
    ${FIELDS_FRAGMENT}
    ${ERROR_FRAGMENT}
    mutation PublishProduct($revision: ID!) {
        publishProduct(revision: $revision) {
            data {
                ...ProductFields
            }
            error {
                ...ErrorFields
            }
        }
    }
`;

const LIST_PRODUCTS = /* GraphQL */ `
    ${FIELDS_FRAGMENT}
    ${ERROR_FRAGMENT}
    query ListProducts {
        listProducts {
            data {
                ...ProductFields
            }
            error {
                ...ErrorFields
            }
        }
    }
`;

describe("content model plugins", () => {
    test("must not be able to create, update, or delete a content model that was registered via plugins", async () => {
        const {
            createContentModelMutation,
            createContentModelGroupMutation,
            updateContentModelMutation,
            deleteContentModelMutation
        } = useContentGqlHandler(
            {
                path: "manage/en-US"
            },
            [contentModelPlugin]
        );

        const group = await createContentModelGroupMutation({
            data: {
                name: "Group",
                slug: "group",
                icon: "ico/ico",
                description: "description"
            }
        }).then(([response]) => response.data.createContentModelGroup.data);

        await createContentModelMutation({
            data: {
                name: "product",
                modelId: "product",
                group: group.id
            }
        }).then(([response]) =>
            expect(response).toEqual({
                data: {
                    createContentModel: {
                        data: null,
                        error: {
                            code: "CONTENT_MODEL_CREATE_ERROR",
                            data: {
                                modelId: "product"
                            },
                            message:
                                'Cannot create "product" content model because one is already registered via a plugin.'
                        }
                    }
                }
            })
        );

        await updateContentModelMutation({
            modelId: "product",
            data: {
                name: "product-updated",
                layout: [],
                fields: []
            }
        }).then(([response]) =>
            expect(response).toEqual({
                data: {
                    updateContentModel: {
                        data: null,
                        error: {
                            code: "CONTENT_MODEL_UPDATE_ERROR",
                            data: {
                                modelId: "product"
                            },
                            message: "Content models defined via plugins cannot be updated."
                        }
                    }
                }
            })
        );

        await deleteContentModelMutation({
            modelId: "product"
        }).then(([response]) =>
            expect(response).toEqual({
                data: {
                    deleteContentModel: {
                        data: null,
                        error: {
                            code: "CONTENT_MODEL_DELETE_ERROR",
                            data: {
                                modelId: "product"
                            },
                            message: "Content models defined via plugins cannot be deleted."
                        }
                    }
                }
            })
        );
    });

    test("content model must be returned in the content models list and get queries", async () => {
        const { listContentModelsQuery, getContentModelQuery } = useContentGqlHandler(
            {
                path: "manage/en-US"
            },
            [contentModelPlugin]
        );

        await getContentModelQuery({
            modelId: "product"
        }).then(([response]) =>
            expect(response).toEqual({
                data: {
                    getContentModel: {
                        data: {
                            createdBy: null,
                            createdOn: null,
                            description: null,
                            fields: [
                                {
                                    fieldId: "name",
                                    helpText: null,
                                    id: "name",
                                    label: "Product Name",
                                    listValidation: null,
                                    multipleValues: null,
                                    placeholderText: null,
                                    predefinedValues: null,
                                    renderer: null,
                                    settings: null,
                                    type: "text",
                                    validation: null
                                },
                                {
                                    fieldId: "sku",
                                    helpText: null,
                                    id: "sku",
                                    label: "SKU",
                                    listValidation: null,
                                    multipleValues: null,
                                    placeholderText: null,
                                    predefinedValues: null,
                                    renderer: null,
                                    settings: null,
                                    type: "text",
                                    validation: null
                                },
                                {
                                    fieldId: "price",
                                    helpText: null,
                                    id: "price",
                                    label: "Price",
                                    listValidation: null,
                                    multipleValues: null,
                                    placeholderText: null,
                                    predefinedValues: null,
                                    renderer: null,
                                    settings: null,
                                    type: "number",
                                    validation: null
                                }
                            ],
                            group: {
                                id: "ecommerce",
                                name: "E-Commerce"
                            },
                            layout: [["name"], ["sku", "price"]],
                            modelId: "product",
                            name: "Product",
                            savedOn: null,
                            titleFieldId: "name"
                        },
                        error: null
                    }
                }
            })
        );

        await listContentModelsQuery().then(([response]) =>
            expect(response).toEqual({
                data: {
                    listContentModels: {
                        data: [
                            {
                                createdBy: null,
                                createdOn: null,
                                description: null,
                                fields: [
                                    {
                                        fieldId: "name",
                                        helpText: null,
                                        id: "name",
                                        label: "Product Name",
                                        listValidation: null,
                                        multipleValues: null,
                                        placeholderText: null,
                                        predefinedValues: null,
                                        renderer: null,
                                        settings: null,
                                        type: "text",
                                        validation: null
                                    },
                                    {
                                        fieldId: "sku",
                                        helpText: null,
                                        id: "sku",
                                        label: "SKU",
                                        listValidation: null,
                                        multipleValues: null,
                                        placeholderText: null,
                                        predefinedValues: null,
                                        renderer: null,
                                        settings: null,
                                        type: "text",
                                        validation: null
                                    },
                                    {
                                        fieldId: "price",
                                        helpText: null,
                                        id: "price",
                                        label: "Price",
                                        listValidation: null,
                                        multipleValues: null,
                                        placeholderText: null,
                                        predefinedValues: null,
                                        renderer: null,
                                        settings: null,
                                        type: "number",
                                        validation: null
                                    }
                                ],
                                group: {
                                    id: "ecommerce",
                                    name: "E-Commerce"
                                },
                                layout: [["name"], ["sku", "price"]],
                                modelId: "product",
                                name: "Product",
                                savedOn: null,
                                titleFieldId: "name"
                            }
                        ],
                        error: null
                    }
                }
            })
        );
    });

    test("must be able to perform basic CRUD operations with content models registered via plugin", async () => {
        const { invoke } = useContentGqlHandler(
            {
                path: "manage/en-US"
            },
            [contentModelPlugin]
        );

        // Let's get a string schema JSON and do text-based assertions.
        const products = [];
        for (let i = 0; i < 3; i++) {
            products.push(
                await invoke({
                    body: {
                        query: CREATE_PRODUCT,
                        variables: {
                            data: { name: `product-${i}`, sku: `sku-${i}`, price: i * 100 }
                        }
                    }
                }).then(([response]) => response)
            );
        }

        await invoke({ body: { query: LIST_PRODUCTS } }).then(([response]) =>
            expect(response).toEqual({
                data: {
                    listProducts: {
                        data: [
                            {
                                meta: {
                                    status: "draft"
                                },
                                name: "product-2",
                                price: 200,
                                sku: "sku-2"
                            },
                            {
                                meta: {
                                    status: "draft"
                                },
                                name: "product-1",
                                price: 100,
                                sku: "sku-1"
                            },
                            {
                                meta: {
                                    status: "draft"
                                },
                                name: "product-0",
                                price: 0,
                                sku: "sku-0"
                            }
                        ],
                        error: null
                    }
                }
            })
        );

        // Get ID of every created product.
        const productsIds = await invoke({
            body: {
                query: /* GraphQL */ `
                    query ListProducts {
                        listProducts {
                            data {
                                id
                            }
                        }
                    }
                `
            }
        }).then(([response]) => response.data.listProducts.data.map(item => item.id));

        // Let's try to publish all three entries.
        for (let i = 0; i < productsIds.length; i++) {
            await invoke({
                body: {
                    query: PUBLISH_PRODUCT,
                    variables: {
                        revision: productsIds[i]
                    }
                }
            });
        }

        await invoke({
            body: {
                query: LIST_PRODUCTS
            }
        }).then(([response]) =>
            expect(response).toEqual({
                data: {
                    listProducts: {
                        data: [
                            {
                                meta: {
                                    status: "published"
                                },
                                name: "product-2",
                                price: 200,
                                sku: "sku-2"
                            },
                            {
                                meta: {
                                    status: "published"
                                },
                                name: "product-1",
                                price: 100,
                                sku: "sku-1"
                            },
                            {
                                meta: {
                                    status: "published"
                                },
                                name: "product-0",
                                price: 0,
                                sku: "sku-0"
                            }
                        ],
                        error: null
                    }
                }
            })
        );
    });
});
