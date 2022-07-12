import { useGraphQLHandler } from "../utils/useGraphQLHandler";
import { until } from "./../utils/helpers";
import { CmsGroup, CmsModel } from "~/types";
import { CmsModelPlugin } from "~/plugins/CmsModelPlugin";

const contentModelPlugin = new CmsModelPlugin({
    name: "Product",
    modelId: "product",
    locale: "en-US",
    tenant: "root",
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
    titleFieldId: "name",
    description: ""
});

const FIELDS_FRAGMENT = /* GraphQL */ `
    fragment ProductFields on Product {
        id
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

const GET_PRODUCT = /* GraphQL */ `
    ${FIELDS_FRAGMENT}
    ${ERROR_FRAGMENT}
    query GetProduct($revision: ID!) {
        getProduct(revision: $revision) {
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
    const { storageOperations } = useGraphQLHandler({
        path: "manage/en-US"
    });

    beforeEach(async () => {
        await storageOperations.models.delete({
            model: {
                ...(contentModelPlugin.contentModel as CmsModel),
                webinyVersion: "x.x.x"
            }
        });
    });
    afterEach(async () => {
        await storageOperations.models.delete({
            model: {
                ...(contentModelPlugin.contentModel as CmsModel),
                webinyVersion: "x.x.x"
            }
        });
    });

    test("must not be able to create, update, or delete a content model that was registered via plugins", async () => {
        const {
            createContentModelMutation,
            createContentModelGroupMutation,
            updateContentModelMutation,
            deleteContentModelMutation
        } = useGraphQLHandler({
            path: "manage/en-US",
            plugins: [contentModelPlugin]
        });

        const [createGroupResponse] = await createContentModelGroupMutation({
            data: {
                name: "Group",
                slug: "group",
                icon: "ico/ico",
                description: "description"
            }
        });
        expect(createGroupResponse).toMatchObject({
            data: {
                createContentModelGroup: {
                    data: {
                        name: "Group",
                        slug: "group",
                        icon: "ico/ico",
                        description: "description"
                    },
                    error: null
                }
            }
        });

        const group: CmsGroup = createGroupResponse.data.createContentModelGroup.data;

        const [createContentModelResponse] = await createContentModelMutation({
            data: {
                name: "product",
                modelId: "product",
                group: group.id
            }
        });

        expect(createContentModelResponse).toEqual({
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
        });

        const [updateContentModelResponse] = await updateContentModelMutation({
            modelId: "product",
            data: {
                name: "product-updated",
                layout: [],
                fields: []
            }
        });

        expect(updateContentModelResponse).toEqual({
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
        });

        const [deleteContentModelResponse] = await deleteContentModelMutation({
            modelId: "product"
        });
        expect(deleteContentModelResponse).toEqual({
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
        });
    });

    test("content model must be returned in the content models list and get queries", async () => {
        const { listContentModelsQuery, getContentModelQuery } = useGraphQLHandler({
            path: "manage/en-US",
            plugins: [contentModelPlugin]
        });

        await getContentModelQuery({ modelId: "product" }).then(([response]) =>
            expect(response).toEqual({
                data: {
                    getContentModel: {
                        data: {
                            createdBy: null,
                            createdOn: null,
                            description: "",
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
                            plugin: true,
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
                                description: "",
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
                                plugin: true,
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
        const { invoke } = useGraphQLHandler({
            path: "manage/en-US",
            plugins: [contentModelPlugin]
        });

        // Let's get a string schema JSON and do text-based assertions.
        const products = [];
        for (let i = 0; i < 3; i++) {
            const [createResponse] = await invoke({
                body: {
                    query: CREATE_PRODUCT,
                    variables: {
                        data: {
                            name: `product-${i}`,
                            sku: `sku-${i}`,
                            price: i * 100
                        }
                    }
                }
            });
            expect(createResponse).toMatchObject({
                data: {
                    createProduct: {
                        data: {
                            name: `product-${i}`,
                            sku: `sku-${i}`,
                            price: i * 100
                        },
                        error: null
                    }
                }
            });
            products.push(createResponse.data.createProduct.data);
        }

        await until(
            () => invoke({ body: { query: LIST_PRODUCTS } }),
            ([response]: any) => response.data.listProducts.data.length === 3,
            {
                name: "list after create products"
            }
        );

        for (const product of products) {
            const [getProductResponse] = await invoke({
                body: {
                    query: GET_PRODUCT,
                    variables: {
                        revision: product.id
                    }
                }
            });
            expect(getProductResponse).toMatchObject({
                data: {
                    getProduct: {
                        data: {
                            id: product.id
                        },
                        error: null
                    }
                }
            });
        }

        const [listProductsResponse] = await invoke({ body: { query: LIST_PRODUCTS } });

        expect(listProductsResponse).toEqual({
            data: {
                listProducts: {
                    data: [
                        {
                            id: expect.any(String),
                            meta: {
                                status: "draft"
                            },
                            name: "product-2",
                            price: 200,
                            sku: "sku-2"
                        },
                        {
                            id: expect.any(String),
                            meta: {
                                status: "draft"
                            },
                            name: "product-1",
                            price: 100,
                            sku: "sku-1"
                        },
                        {
                            id: expect.any(String),
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
        });

        const productsIds = listProductsResponse.data.listProducts.data.map((p: any) => p.id);

        // Let's try to publish all three entries.
        for (const id of productsIds) {
            const [publishResponse] = await invoke({
                body: {
                    query: PUBLISH_PRODUCT,
                    variables: {
                        revision: id
                    }
                }
            });
            expect(publishResponse).toMatchObject({
                data: {
                    publishProduct: {
                        data: {
                            id
                        },
                        error: null
                    }
                }
            });
        }

        await until(
            () => invoke({ body: { query: LIST_PRODUCTS } }),
            ([response]: any) => {
                return response.data.listProducts.data.every(
                    (p: any) => p.meta.status === "published"
                );
            },
            {
                name: "list products after published"
            }
        );

        // The list should contain three products, all published.
        const [listProductsAfterPublishResponse] = await invoke({
            body: {
                query: LIST_PRODUCTS
            }
        });
        expect(listProductsAfterPublishResponse).toEqual({
            data: {
                listProducts: {
                    data: [
                        {
                            id: expect.any(String),
                            meta: {
                                status: "published"
                            },
                            name: "product-2",
                            price: 200,
                            sku: "sku-2"
                        },
                        {
                            id: expect.any(String),
                            meta: {
                                status: "published"
                            },
                            name: "product-1",
                            price: 100,
                            sku: "sku-1"
                        },
                        {
                            id: expect.any(String),
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
        });
    });

    test(`"plugin" GraphQL field must have the correct value`, async () => {
        const {
            createContentModelMutation,
            createContentModelGroupMutation,
            listContentModelsQuery
        } = useGraphQLHandler({
            path: "manage/en-US",
            plugins: [contentModelPlugin]
        });

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
                name: "shop",
                modelId: "shop",
                group: group.id
            }
        });

        await listContentModelsQuery().then(([response]) =>
            expect(response).toMatchObject({
                data: {
                    listContentModels: {
                        data: [
                            {
                                modelId: "shop",
                                name: "shop",
                                plugin: false
                            },
                            {
                                modelId: "product",
                                name: "Product",
                                plugin: true
                            }
                        ],
                        error: null
                    }
                }
            })
        );
    });
});
