import { describe, expect, it } from "vitest";
import { useGraphQLHandler } from "../testHelpers/useGraphQLHandler";
import { CmsModelPlugin, createModelField } from "~/index";
import { createIcon } from "~tests/__helpers/icon.js";

const SINGULAR_API_NAME = "StoreSettings";
const PLURAL_API_NAME = "StoreSettingsPlural";

/**
 * After tabs field hoisting, the model structure is flat:
 * child fields live directly in model.fields[], and the layout
 * contains rich descriptor objects instead of the tabs field ID.
 */
const createStoreSettingsModel = () => {
    return [
        new CmsModelPlugin({
            name: "Store Settings",
            modelId: "storeSettings",
            singularApiName: SINGULAR_API_NAME,
            pluralApiName: PLURAL_API_NAME,
            description: "Settings for our e-commerce store",
            group: "ungrouped",
            icon: createIcon(),
            titleFieldId: "title",
            layout: [
                [
                    {
                        type: "tabs",
                        label: "My Tabs",
                        tabs: [
                            {
                                id: "general",
                                label: "General",
                                layout: [["title"], ["slug"], ["price"]]
                            },
                            {
                                id: "seo",
                                label: "SEO",
                                layout: [["metaTitle"], ["metaDescription"]]
                            }
                        ]
                    }
                ],
                ["details"]
            ],
            tags: ["type:model"],
            fields: [
                createModelField({
                    id: "title",
                    fieldId: "title",
                    type: "text",
                    label: "Title",
                    renderer: { name: "text-input" },
                    validation: [
                        {
                            name: "required",
                            message: "Title is required."
                        }
                    ]
                }),
                createModelField({
                    id: "slug",
                    fieldId: "slug",
                    type: "text",
                    label: "Slug",
                    renderer: { name: "text-input" }
                }),
                createModelField({
                    id: "price",
                    fieldId: "price",
                    type: "number",
                    label: "Price",
                    renderer: { name: "number-input" }
                }),
                createModelField({
                    id: "metaTitle",
                    fieldId: "metaTitle",
                    type: "text",
                    label: "Meta Title",
                    renderer: { name: "text-input" }
                }),
                createModelField({
                    id: "metaDescription",
                    fieldId: "metaDescription",
                    type: "long-text",
                    label: "Meta Description",
                    renderer: { name: "long-text-text-area" }
                }),
                createModelField({
                    id: "details",
                    fieldId: "details",
                    type: "object",
                    label: "Details",
                    renderer: { name: "object" },
                    settings: {
                        fields: [
                            createModelField({
                                id: "brand",
                                fieldId: "brand",
                                type: "text",
                                label: "Brand",
                                renderer: { name: "text-input" }
                            }),
                            createModelField({
                                id: "color",
                                fieldId: "color",
                                type: "text",
                                label: "Color",
                                renderer: { name: "text-input" }
                            })
                        ]
                    }
                })
            ]
        })
    ];
};

const VALUES_FRAGMENT = /* GraphQL */ `
    fragment StoreValues on ${SINGULAR_API_NAME}Values {
        title
        slug
        price
        metaTitle
        metaDescription
        details {
            brand
            color
        }
    }
`;

const CREATE_MUTATION = /* GraphQL */ `
    ${VALUES_FRAGMENT}
    mutation CreateStoreSettings($data: ${SINGULAR_API_NAME}Input!) {
        createStoreSettings: create${SINGULAR_API_NAME}(data: $data) {
            data {
                id
                values {
                    ...StoreValues
                }
            }
            error {
                message
                code
                data
            }
        }
    }
`;

const GET_QUERY = /* GraphQL */ `
    ${VALUES_FRAGMENT}
    query GetStoreSettings($revision: ID!) {
        getStoreSettings: get${SINGULAR_API_NAME}(revision: $revision) {
            data {
                id
                values {
                    ...StoreValues
                }
            }
            error {
                message
                code
                data
            }
        }
    }
`;

const LIST_QUERY = /* GraphQL */ `
    ${VALUES_FRAGMENT}
    query ListStoreSettings(
        $where: ${SINGULAR_API_NAME}ListWhereInput
        $sort: [${SINGULAR_API_NAME}ListSorter]
        $limit: Int
        $after: String
    ) {
        listStoreSettings: list${PLURAL_API_NAME}(
            where: $where
            sort: $sort
            limit: $limit
            after: $after
        ) {
            data {
                id
                values {
                    ...StoreValues
                }
            }
            error {
                message
                code
                data
            }
        }
    }
`;

describe("Tabs Field - Content API", () => {
    const handler = useGraphQLHandler({
        plugins: [...createStoreSettingsModel()],
        path: "manage"
    });

    it("should generate a valid GraphQL schema with fields from tabs", async () => {
        const [result] = await handler.introspect();

        expect(result).toMatchObject({
            data: {
                __schema: {
                    types: expect.any(Array)
                }
            }
        });

        // Find the StoreSettings type
        const storeSettingsType = result.data.__schema.types.find(
            (t: any) => t.name === SINGULAR_API_NAME
        );
        expect(storeSettingsType).toBeDefined();
        expect(storeSettingsType).toMatchObject({
            name: SINGULAR_API_NAME,
            kind: "OBJECT"
        });
    });

    it("should create, get, and list entries with fields defined inside tabs", async () => {
        const mutationData = {
            title: "My Store",
            slug: "my-store",
            price: 99.99,
            metaTitle: "My Store - Best Prices",
            metaDescription: "Welcome to my store with the best prices.",
            details: {
                brand: "My Brand",
                color: "Red"
            }
        };

        // Create
        const [createResult] = await handler.invoke({
            body: {
                query: CREATE_MUTATION,
                variables: {
                    data: {
                        values: mutationData
                    }
                }
            }
        });

        expect(createResult).toEqual({
            data: {
                createStoreSettings: {
                    data: {
                        id: expect.any(String),
                        values: mutationData
                    },
                    error: null
                }
            }
        });

        const entryId = createResult.data.createStoreSettings.data.id;

        // Get
        const [getResult] = await handler.invoke({
            body: {
                query: GET_QUERY,
                variables: {
                    revision: entryId
                }
            }
        });

        expect(getResult).toEqual({
            data: {
                getStoreSettings: {
                    data: {
                        id: entryId,
                        values: mutationData
                    },
                    error: null
                }
            }
        });

        // List
        const [listResult] = await handler.invoke({
            body: {
                query: LIST_QUERY
            }
        });

        expect(listResult).toEqual({
            data: {
                listStoreSettings: {
                    data: [
                        {
                            id: entryId,
                            values: mutationData
                        }
                    ],
                    error: null
                }
            }
        });
    });

    it("should filter by fields defined inside tabs", async () => {
        // Create two entries
        const [result1] = await handler.invoke({
            body: {
                query: CREATE_MUTATION,
                variables: {
                    data: {
                        values: {
                            title: "Store Alpha",
                            slug: "store-alpha",
                            price: 49.99,
                            metaTitle: "Alpha Store",
                            metaDescription: "First store"
                        }
                    }
                }
            }
        });

        await handler.invoke({
            body: {
                query: CREATE_MUTATION,
                variables: {
                    data: {
                        values: {
                            title: "Store Beta",
                            slug: "store-beta",
                            price: 149.99,
                            metaTitle: "Beta Store",
                            metaDescription: "Second store"
                        }
                    }
                }
            }
        });

        // Filter by title
        const [filteredResult] = await handler.invoke({
            body: {
                query: LIST_QUERY,
                variables: {
                    where: {
                        values: {
                            title: "Store Alpha"
                        }
                    }
                }
            }
        });

        expect(filteredResult).toEqual({
            data: {
                listStoreSettings: {
                    data: [
                        {
                            id: result1.data.createStoreSettings.data.id,
                            values: {
                                title: "Store Alpha",
                                slug: "store-alpha",
                                price: 49.99,
                                metaTitle: "Alpha Store",
                                metaDescription: "First store",
                                details: null
                            }
                        }
                    ],
                    error: null
                }
            }
        });
    });
});
