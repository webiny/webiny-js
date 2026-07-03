import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { useGraphQLHandler } from "../testHelpers/useGraphQLHandler";
import { CmsGroup, CmsModel } from "~/types";
import { CmsModelPlugin } from "~/plugins/CmsModelPlugin";
import { HeadlessCms } from "~/features/shared/abstractions.js";
import { createModelField } from "~/utils/createModelField.js";
import { createIcon } from "~tests/__helpers/icon.js";

const contentModelPlugin = new CmsModelPlugin({
    name: "Product",
    modelId: "product",
    singularApiName: "Product",
    pluralApiName: "Products",
    tenant: "root",
    icon: createIcon("ico/ico"),
    group: "e-commerce",
    fields: [
        createModelField({
            id: "name",
            // storageId: "text@name",
            fieldId: "name",
            type: "text",
            label: "Product Name"
        }),
        createModelField({
            id: "sku",
            // storageId: "text@sku",
            fieldId: "sku",
            type: "text",
            label: "SKU"
        }),
        createModelField({
            id: "price",
            // storageId: "number@price",
            fieldId: "price",
            type: "number",
            label: "Price"
        }),
        createModelField({
            id: "descr",
            fieldId: "descr",
            label: "Description",
            type: "long-text"
        })
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
            values {
                name
                sku
                price
            }
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
    const handler = useGraphQLHandler({
        path: "manage"
    });

    const getStorageOperations = async () => {
        if (!handler.getContext()) {
            await handler.isInstalledQuery();
        }
        return handler.getContext().container.resolve(HeadlessCms).storageOperations;
    };

    beforeEach(async () => {
        const storageOperations = await getStorageOperations();
        await storageOperations.models.delete({
            model: {
                ...(contentModelPlugin.contentModel as CmsModel)
            }
        });
    });
    afterEach(async () => {
        const storageOperations = await getStorageOperations();
        await storageOperations.models.delete({
            model: {
                ...(contentModelPlugin.contentModel as CmsModel)
            }
        });
    });

    it("must not be able to create, update, or delete a content model that was registered via plugins", async () => {
        const {
            createContentModelMutation,
            createContentModelGroupMutation,
            updateContentModelMutation,
            deleteContentModelMutation
        } = useGraphQLHandler({
            path: "manage",
            plugins: [contentModelPlugin]
        });

        const [createGroupResponse] = await createContentModelGroupMutation({
            data: {
                name: "Group",
                slug: "group",
                icon: createIcon("ico/ico"),
                description: "description"
            }
        });
        expect(createGroupResponse).toMatchObject({
            data: {
                createContentModelGroup: {
                    data: {
                        name: "Group",
                        slug: "group",
                        icon: createIcon("ico/ico"),
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
                group: group.slug
            }
        });

        expect(createContentModelResponse).toEqual({
            data: {
                createContentModel: {
                    data: null,
                    error: {
                        code: "Cms/Model/AlreadyExists",
                        data: {
                            modelId: "product"
                        },
                        message: `Model "product" is already registered via a plugin.`
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
                        code: "Cms/Model/CannotUpdateCodeModel",
                        data: {
                            modelId: "product"
                        },
                        message: `Cannot update model "product" defined via code.`
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
                        code: "Cms/Model/CannotDeleteCodeModel",
                        data: {
                            modelId: "product"
                        },
                        message: `Cannot delete model "product" defined via code.`
                    }
                }
            }
        });
    });

    it("content model must be returned in the content models list and get queries", async () => {
        const { listContentModelsQuery, getContentModelQuery } = useGraphQLHandler({
            path: "manage",
            plugins: [contentModelPlugin]
        });

        const [getContentModelResponse] = await getContentModelQuery({ modelId: "product" });
        expect(getContentModelResponse).toMatchObject({
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
                                id: "name",
                                label: "Product Name",
                                type: "text"
                            },
                            {
                                storageId: "text@sku",
                                fieldId: "sku",
                                id: "sku",
                                label: "SKU",
                                type: "text"
                            },
                            {
                                storageId: "number@price",
                                fieldId: "price",
                                id: "price",
                                label: "Price",
                                type: "number"
                            },
                            {
                                storageId: "long-text@descr",
                                fieldId: "descr",
                                id: "descr",
                                label: "Description",
                                type: "long-text"
                            }
                        ],
                        group: "e-commerce",
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
                        icon: {
                            name: "ico/ico",
                            type: "icon"
                        }
                    },
                    error: null
                }
            }
        });

        const [listContentModelsResponse] = await listContentModelsQuery();

        expect(listContentModelsResponse).toMatchObject({
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
                                    id: "name",
                                    label: "Product Name",
                                    type: "text"
                                },
                                {
                                    storageId: "text@sku",
                                    fieldId: "sku",
                                    id: "sku",
                                    label: "SKU",
                                    type: "text"
                                },
                                {
                                    storageId: "number@price",
                                    fieldId: "price",
                                    id: "price",
                                    label: "Price",
                                    type: "number"
                                },
                                {
                                    storageId: "long-text@descr",
                                    fieldId: "descr",
                                    id: "descr",
                                    label: "Description",
                                    type: "long-text"
                                }
                            ],
                            group: "e-commerce",
                            icon: {
                                name: "ico/ico",
                                type: "icon"
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
                            imageFieldId: null
                        }
                    ],
                    error: null
                }
            }
        });
    });

    it("must be able to perform basic CRUD operations with content models registered via plugin", async () => {
        const { invoke } = useGraphQLHandler({
            path: "manage",
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
                            values: {
                                name: `product-${i}`,
                                sku: `sku-${i}`,
                                price: i * 100
                            }
                        }
                    }
                }
            });
            expect(createResponse).toMatchObject({
                data: {
                    createProduct: {
                        data: {
                            values: {
                                name: `product-${i}`,
                                sku: `sku-${i}`,
                                price: i * 100
                            }
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
                            values: {
                                name: "product-2",
                                price: 200,
                                sku: "sku-2"
                            }
                        },
                        {
                            id: expect.any(String),
                            meta: {
                                status: "draft"
                            },
                            values: {
                                name: "product-1",
                                price: 100,
                                sku: "sku-1"
                            }
                        },
                        {
                            id: expect.any(String),
                            meta: {
                                status: "draft"
                            },
                            values: {
                                name: "product-0",
                                price: 0,
                                sku: "sku-0"
                            }
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
                            values: {
                                name: "product-2",
                                price: 200,
                                sku: "sku-2"
                            }
                        },
                        {
                            id: expect.any(String),
                            meta: {
                                status: "published"
                            },
                            values: {
                                name: "product-1",
                                price: 100,
                                sku: "sku-1"
                            }
                        },
                        {
                            id: expect.any(String),
                            meta: {
                                status: "published"
                            },
                            values: {
                                name: "product-0",
                                price: 0,
                                sku: "sku-0"
                            }
                        }
                    ],
                    error: null
                }
            }
        });
    });

    it(`"plugin" GraphQL field must have the correct value`, async () => {
        const {
            createContentModelMutation,
            createContentModelGroupMutation,
            listContentModelsQuery
        } = useGraphQLHandler({
            path: "manage",
            plugins: [contentModelPlugin]
        });

        const group = await createContentModelGroupMutation({
            data: {
                name: "Group",
                slug: "group",
                icon: createIcon("ico/ico"),
                description: "description"
            }
        }).then(([response]) => response.data.createContentModelGroup.data);

        await createContentModelMutation({
            data: {
                name: "shop",
                modelId: "shop",
                singularApiName: "Shop",
                pluralApiName: "Shops",
                group: group.slug
            }
        });

        await listContentModelsQuery().then(([response]) =>
            expect(response).toMatchObject({
                data: {
                    listContentModels: {
                        data: [
                            {
                                modelId: "product",
                                name: "Product",
                                plugin: true
                            },
                            {
                                modelId: "shop",
                                name: "shop",
                                plugin: false
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
                icon: null,
                layout: [],
                fields: [
                    createModelField({
                        type: "text",
                        fieldId: "something",
                        id: "something",
                        label: "Something",
                        storageId: "text@something!",
                        settings: {}
                    })
                ],
                modelId: "test",
                singularApiName: "Test",
                pluralApiName: "Tests",
                group: "group",
                description: "",
                titleFieldId: "something"
            });
        } catch (ex) {
            error = ex;
        }
        expect(error).toBeInstanceOf(Error);
        expect(error?.message).toEqual(
            `Invalid storageId provided ("text@something!"). Only alphanumeric characters and "@" are allowed.`
        );
    });

    const testModel = {
        modelId: "testModel",
        singularApiName: "TestModel",
        pluralApiName: "TestModels",
        fields: [
            createModelField({
                id: "title",
                fieldId: "title",
                label: "Title",
                type: "text"
            })
        ],
        layout: [],
        titleFieldId: "title",
        name: "Test Model",
        description: "",
        icon: null,
        group: "name"
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
