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

        await invoke({
            body: {
                query: LIST_PRODUCTS,
                variables: {}
            }
        }).then(([response]) =>
            expect(response).toEqual({
                data: {
                    listProducts: {
                        data: [
                            {
                                name: "product-2",
                                price: 200,
                                sku: "sku-2"
                            },
                            {
                                name: "product-1",
                                price: 100,
                                sku: "sku-1"
                            },
                            {
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
