import { useGraphQLHandler } from "../testHelpers/useGraphQLHandler";
import { CmsGroup, CmsModel } from "~/types";
import { CmsModelPlugin } from "~/plugins/CmsModelPlugin";

const contentModelPlugin = new CmsModelPlugin({
    name: "Product",
    modelId: "product",
    singularApiName: "Product",
    pluralApiName: "Products",
    locale: "en-US",
    tenant: "root",
    group: {
        id: "ecommerce",
        name: "E-Commerce"
    },
    fields: [
        {
            id: "name",
            // storageId: "text@name",
            fieldId: "name",
            type: "text",
            label: "Product Name"
        },
        {
            id: "sku",
            // storageId: "text@sku",
            fieldId: "sku",
            type: "text",
            label: "SKU"
        },
        {
            id: "price",
            // storageId: "number@price",
            fieldId: "price",
            type: "number",
            label: "Price"
        },
        {
            id: "descr",
            fieldId: "descr",
            label: "Description",
            type: "long-text"
        }
    ],
    layout: [["name"], ["sku", "price"], ["descr"]],
    titleFieldId: "name",
    descriptionFieldId: "descr",
    description: ""
});

const FIELDS_FRAGMENT = (model: Pick<CmsModel, "singularApiName">) => {
    return /* GraphQL */ `
        fragment ${model.singularApiName}Fields on ${model.singularApiName} {
            id
            name
            sku
            price
            meta {
                status
            }
        }
    `;
};

const ERROR_FRAGMENT = /* GraphQL */ `
    fragment ErrorFields on CmsError {
        data
        code
        message
    }
`;

const CREATE_PRODUCT = (model: Pick<CmsModel, "singularApiName" | "pluralApiName">) => {
    return /* GraphQL */ `
        ${FIELDS_FRAGMENT(model)}
        ${ERROR_FRAGMENT}
        mutation CreateProduct($data: ${model.singularApiName}Input!) {
            createProduct: create${model.singularApiName}(data: $data) {
                data {
                    ...${model.singularApiName}Fields
                }
                error {
                    ...ErrorFields
                }
            }
        }
    `;
};

const PUBLISH_PRODUCT = (model: Pick<CmsModel, "singularApiName" | "pluralApiName">) => {
    return /* GraphQL */ `
        ${FIELDS_FRAGMENT(model)}
        ${ERROR_FRAGMENT}
        mutation PublishProduct($revision: ID!) {
                publishProduct: publish${model.singularApiName}(revision: $revision) {
                data {
                    ...${model.singularApiName}Fields
                }
                error {
                    ...ErrorFields
                }
            }
        }
    `;
};

const LIST_PRODUCTS = (model: Pick<CmsModel, "singularApiName" | "pluralApiName">) => {
    return /* GraphQL */ `
        ${FIELDS_FRAGMENT(model)}
        ${ERROR_FRAGMENT}
        query ListProducts {
            listProducts: list${model.pluralApiName} {
            data {
                ...${model.singularApiName}Fields
            }
            error {
                ...ErrorFields
            }
        }
        }
    `;
};

const GET_PRODUCT = (model: Pick<CmsModel, "singularApiName" | "pluralApiName">) => {
    return /* GraphQL */ `
        ${FIELDS_FRAGMENT(model)}
        ${ERROR_FRAGMENT}
        query GetProduct($revision: ID!) {
            getProduct: get${model.singularApiName}(revision: $revision) {
            data {
                ...${model.singularApiName}Fields
            }
            error {
                ...ErrorFields
            }
        }
        }
    `;
};

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
                icon: {
                    type: "emoji",
                    name: "thumbs_up",
                    value: "👍"
                },
                description: "description"
            }
        });
        expect(createGroupResponse).toMatchObject({
            data: {
                createContentModelGroup: {
                    data: {
                        name: "Group",
                        slug: "group",
                        icon: {
                            type: "emoji",
                            name: "thumbs_up",
                            value: "👍"
                        },
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
                singularApiName: "Product",
                pluralApiName: "Products",
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

        const [getContentModelResponse] = await getContentModelQuery({ modelId: "product" });
        expect(getContentModelResponse).toEqual({
            data: {
                getContentModel: {
                    data: {
                        createdBy: null,
                        createdOn: null,
                        description: "",
                        fields: [
                            {
                                storageId: "text@name",
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
                                storageId: "text@sku",
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
                                storageId: "number@price",
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
                            },
                            {
                                storageId: "long-text@descr",
                                fieldId: "descr",
                                helpText: null,
                                id: "descr",
                                label: "Description",
                                listValidation: null,
                                multipleValues: null,
                                placeholderText: null,
                                predefinedValues: null,
                                renderer: null,
                                settings: null,
                                type: "long-text",
                                validation: null
                            }
                        ],
                        group: {
                            id: "ecommerce",
                            slug: "e-commerce",
                            name: "E-Commerce"
                        },
                        layout: [["name"], ["sku", "price"], ["descr"]],
                        modelId: "product",
                        name: "Product",
                        singularApiName: "Product",
                        pluralApiName: "Products",
                        plugin: true,
                        savedOn: null,
                        titleFieldId: "name",
                        descriptionFieldId: "descr",
                        imageFieldId: null,
                        icon: null
                    },
                    error: null
                }
            }
        });

        const [listContentModelsResponse] = await listContentModelsQuery();

        expect(listContentModelsResponse).toEqual({
            data: {
                listContentModels: {
                    data: [
                        {
                            createdBy: null,
                            createdOn: null,
                            description: "",
                            fields: [
                                {
                                    storageId: "text@name",
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
                                    storageId: "text@sku",
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
                                    storageId: "number@price",
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
                                },
                                {
                                    storageId: "long-text@descr",
                                    fieldId: "descr",
                                    helpText: null,
                                    id: "descr",
                                    label: "Description",
                                    listValidation: null,
                                    multipleValues: null,
                                    placeholderText: null,
                                    predefinedValues: null,
                                    renderer: null,
                                    settings: null,
                                    type: "long-text",
                                    validation: null
                                }
                            ],
                            group: {
                                id: "ecommerce",
                                slug: "e-commerce",
                                name: "E-Commerce"
                            },
                            icon: null,
                            layout: [["name"], ["sku", "price"], ["descr"]],
                            modelId: "product",
                            name: "Product",
                            singularApiName: "Product",
                            pluralApiName: "Products",
                            plugin: true,
                            savedOn: null,
                            titleFieldId: "name",
                            descriptionFieldId: "descr",
                            imageFieldId: null
                        }
                    ],
                    error: null
                }
            }
        });
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
                    query: CREATE_PRODUCT(contentModelPlugin.contentModel),
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

        for (const product of products) {
            const [getProductResponse] = await invoke({
                body: {
                    query: GET_PRODUCT(contentModelPlugin.contentModel),
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

        const [listProductsResponse] = await invoke({
            body: { query: LIST_PRODUCTS(contentModelPlugin.contentModel) }
        });

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
                    query: PUBLISH_PRODUCT(contentModelPlugin.contentModel),
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

        // The list should contain three products, all published.
        const [listProductsAfterPublishResponse] = await invoke({
            body: {
                query: LIST_PRODUCTS(contentModelPlugin.contentModel)
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
                icon: {
                    type: "emoji",
                    name: "thumbs_up",
                    value: "👍"
                },
                description: "description"
            }
        }).then(([response]) => response.data.createContentModelGroup.data);

        await createContentModelMutation({
            data: {
                name: "shop",
                modelId: "shop",
                singularApiName: "Shop",
                pluralApiName: "Shops",
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

    it(`should fail to create model plugin due to invalid "storageId"`, async () => {
        let error: Error | undefined;
        try {
            new CmsModelPlugin({
                name: "test",
                layout: [],
                fields: [
                    {
                        type: "text",
                        fieldId: "something",
                        id: "something",
                        label: "Something",
                        storageId: "text@something",
                        settings: {}
                    }
                ],
                modelId: "test",
                singularApiName: "Test",
                pluralApiName: "Tests",
                group: {
                    id: "group",
                    name: "Group"
                },
                description: "",
                titleFieldId: "something"
            });
        } catch (ex) {
            error = ex;
        }
        expect(error).toBeInstanceOf(Error);
        expect(error?.message).toEqual(
            `Field's "storageId" of the field with "fieldId" something is not camel cased string in the content model "test".`
        );
    });

    const testModel = {
        modelId: "testModel",
        singularApiName: "TestModel",
        pluralApiName: "TestModels",
        fields: [
            {
                id: "title",
                fieldId: "title",
                label: "Title",
                type: "text"
            }
        ],
        layout: [],
        titleFieldId: "title",
        name: "Test Model",
        description: "",
        group: {
            id: "id",
            name: "name"
        }
    };

    it("should validate model fields layout", () => {
        let error: Error | undefined;
        try {
            new CmsModelPlugin(testModel);
        } catch (ex) {
            error = ex;
        }

        expect(error).toBeInstanceOf(Error);
        expect(error?.message).toEqual(`Missing field "title" in layout.`);
    });

    it("should not validate model fields layout", () => {
        const model = new CmsModelPlugin(testModel, {
            validateLayout: false
        });

        expect(model).toBeInstanceOf(CmsModelPlugin);
    });
});
