import { beforeEach, describe, expect, it } from "vitest";
import { useCmsHandler } from "../testHelpers/useCmsHandler";
import { setupGroupAndModels } from "../testHelpers/setup";
import { createProductModel } from "./mocks/productModel";
import { createProductCategoryModel } from "./mocks/productCategoryModel";

/**
 * Test CMS SDK GraphQL schema queries (Query.cms.*).
 * These tests verify the CMS schema that the SDK uses to query entries.
 * All CMS queries are executed on the main /graphql endpoint.
 */
describe("SDK GraphQL - CMS Schema Queries", () => {
    const handler = useCmsHandler();

    beforeEach(async () => {
        // Setup group and models using the manage endpoint.
        const { group } = await setupGroupAndModels({
            manager: handler,
            models: undefined
        });

        // Create the product category and product models.
        const categoryModel = createProductCategoryModel(group);
        await handler.createContentModelMutation({
            data: {
                ...categoryModel,
                description: categoryModel.description || undefined,
                icon: categoryModel.icon || undefined
            }
        });

        const productModel = createProductModel(group);
        await handler.createContentModelMutation({
            data: {
                ...productModel,
                description: productModel.description || undefined,
                icon: productModel.icon || undefined
            }
        });
    });

    describe("listEntries", () => {
        it("should list entries with sort parameter", async () => {
            // Create test categories using the manage endpoint.
            const [createCategory1] = await handler.invoke({
                body: {
                    query: `mutation CreateProductCategory($data: ProductCategoryInput!) {
                        createProductCategory(data: $data) {
                            data {
                                id
                            }
                            error {
                                message
                                code
                            }
                        }
                    }`,
                    variables: {
                        data: {
                            values: {
                                name: "Electronics",
                                slug: "electronics",
                                description: "Electronic products and devices"
                            }
                        }
                    }
                }
            });

            expect(createCategory1.data.createProductCategory.error).toBeNull();

            // Create test products.
            const [createProduct1] = await handler.invoke({
                body: {
                    query: `mutation CreateProduct($data: ProductInput!) {
                        createProduct(data: $data) {
                            data {
                                id
                            }
                            error {
                                message
                                code
                            }
                        }
                    }`,
                    variables: {
                        data: {
                            values: {
                                name: "Laptop",
                                sku: "LAP-001",
                                description: "High-performance laptop",
                                price: 1200
                            }
                        }
                    }
                }
            });

            expect(createProduct1.data.createProduct.error).toBeNull();
            console.log("Created product 1:", createProduct1.data.createProduct.data.id);

            // Publish the first product so it's visible to the preview API.
            const [publishProduct1] = await handler.invoke({
                body: {
                    query: `mutation PublishProduct($revision: ID!) {
                        publishProduct(revision: $revision) {
                            data {
                                id
                            }
                            error {
                                message
                                code
                            }
                        }
                    }`,
                    variables: {
                        revision: createProduct1.data.createProduct.data.id
                    }
                }
            });

            expect(publishProduct1.data.publishProduct.error).toBeNull();

            // Wait a bit to ensure different createdOn timestamps.
            await new Promise(resolve => setTimeout(resolve, 100));

            const [createProduct2] = await handler.invoke({
                body: {
                    query: `mutation CreateProduct($data: ProductInput!) {
                        createProduct(data: $data) {
                            data {
                                id
                            }
                            error {
                                message
                                code
                            }
                        }
                    }`,
                    variables: {
                        data: {
                            values: {
                                name: "Mouse",
                                sku: "MOU-001",
                                description: "Wireless mouse",
                                price: 50
                            }
                        }
                    }
                }
            });

            expect(createProduct2.data.createProduct.error).toBeNull();
            console.log("Created product 2:", createProduct2.data.createProduct.data.id);

            // Publish the second product so it's visible to the preview API.
            const [publishProduct2] = await handler.invoke({
                body: {
                    query: `mutation PublishProduct($revision: ID!) {
                        publishProduct(revision: $revision) {
                            data {
                                id
                            }
                            error {
                                message
                                code
                            }
                        }
                    }`,
                    variables: {
                        revision: createProduct2.data.createProduct.data.id
                    }
                }
            });

            expect(publishProduct2.data.publishProduct.error).toBeNull();

            // Test CMS schema listEntries query with sort on main /graphql endpoint.
            const result = await handler.listEntries({
                modelId: "product",
                fields: ["id", "values.name", "values.price"],
                sort: ["createdOn_DESC"],
                preview: true
            });

            // Debug: log the result to see what's happening.
            if (result.data.length === 0) {
                console.log("Result error:", result.error);
                console.log("Result data:", result.data);
                console.log("Result meta:", result.meta);
            }

            expect(result.error).toBeNull();
            expect(result.data).toBeDefined();
            expect(result.data.length).toBe(2);
            expect(result.meta.totalCount).toBe(2);

            // Verify sort order - Mouse should be first (created last).
            expect(result.data[0].values.name).toBe("Mouse");
            expect(result.data[1].values.name).toBe("Laptop");
        });

        it("should list entries with where filter", async () => {
            // Create test products.
            const [createProduct1] = await handler.invoke({
                body: {
                    query: `mutation CreateProduct($data: ProductInput!) {
                        createProduct(data: $data) {
                            data {
                                id
                            }
                            error {
                                message
                                code
                            }
                        }
                    }`,
                    variables: {
                        data: {
                            values: {
                                name: "Keyboard",
                                sku: "KEY-001",
                                description: "Mechanical keyboard",
                                price: 150
                            }
                        }
                    }
                }
            });

            expect(createProduct1.data.createProduct.error).toBeNull();
            const productId = createProduct1.data.createProduct.data.id;

            const [createProduct2] = await handler.invoke({
                body: {
                    query: `mutation CreateProduct($data: ProductInput!) {
                        createProduct(data: $data) {
                            data {
                                id
                            }
                            error {
                                message
                                code
                            }
                        }
                    }`,
                    variables: {
                        data: {
                            values: {
                                name: "Monitor",
                                sku: "MON-001",
                                description: "4K Monitor",
                                price: 400
                            }
                        }
                    }
                }
            });

            expect(createProduct2.data.createProduct.error).toBeNull();

            // Test CMS schema listEntries query with where filter.
            const result = await handler.listEntries({
                modelId: "product",
                fields: ["id", "values.name", "values.price"],
                where: {
                    id: productId
                },
                preview: true
            });

            expect(result.error).toBeNull();
            expect(result.data.length).toBe(1);
            expect(result.data[0].id).toBe(productId);
            expect(result.data[0].values.name).toBe("Keyboard");
        });

        it("should list entries with limit and pagination", async () => {
            // Create 3 test products.
            for (let i = 1; i <= 3; i++) {
                const [createResponse] = await handler.invoke({
                    body: {
                        query: `mutation CreateProduct($data: ProductInput!) {
                            createProduct(data: $data) {
                                data {
                                    id
                                }
                                error {
                                    message
                                    code
                                }
                            }
                        }`,
                        variables: {
                            data: {
                                values: {
                                    name: `Product ${i}`,
                                    sku: `PROD-00${i}`,
                                    description: `Product ${i} description`,
                                    price: i * 100
                                }
                            }
                        }
                    }
                });

                expect(createResponse.data.createProduct.error).toBeNull();
            }

            // Test CMS schema listEntries query with limit.
            const result = await handler.listEntries({
                modelId: "product",
                fields: ["id", "values.name"],
                limit: 2,
                preview: true
            });

            expect(result.error).toBeNull();
            expect(result.data.length).toBe(2);
            expect(result.meta.hasMoreItems).toBe(true);
            expect(result.meta.totalCount).toBe(3);
            expect(result.meta.cursor).toBeDefined();

            // Test pagination with after cursor.
            const result2 = await handler.listEntries({
                modelId: "product",
                fields: ["id", "values.name"],
                limit: 2,
                after: result.meta.cursor!,
                preview: true
            });

            expect(result2.error).toBeNull();
            expect(result2.data.length).toBe(1);
            expect(result2.meta.hasMoreItems).toBe(false);
        });
    });

    describe("getEntry", () => {
        it("should get a single entry by where clause", async () => {
            // Create test product.
            const [createResponse] = await handler.invoke({
                body: {
                    query: `mutation CreateProduct($data: ProductInput!) {
                        createProduct(data: $data) {
                            data {
                                id
                            }
                            error {
                                message
                                code
                            }
                        }
                    }`,
                    variables: {
                        data: {
                            values: {
                                name: "Tablet",
                                sku: "TAB-001",
                                description: "10-inch tablet",
                                price: 300
                            }
                        }
                    }
                }
            });

            expect(createResponse.data.createProduct.error).toBeNull();
            const productId = createResponse.data.createProduct.data.id;

            // Test CMS schema getEntry query.
            const result = await handler.getEntry({
                modelId: "product",
                where: {
                    id: productId
                },
                fields: ["id", "values.name", "values.price", "values.sku"],
                preview: true
            });

            expect(result.error).toBeNull();
            expect(result.data).toBeDefined();
            expect(result.data.id).toBe(productId);
            expect(result.data.values.name).toBe("Tablet");
            expect(result.data.values.price).toBe(300);
            expect(result.data.values.sku).toBe("TAB-001");
        });

        it("should return null when entry not found", async () => {
            // Test CMS schema getEntry query with non-existent ID.
            const result = await handler.getEntry({
                modelId: "product",
                where: {
                    id: "nonexistent#0001"
                },
                fields: ["id", "values.name"]
            });

            expect(result.data).toBeNull();
        });
    });

    describe("getEntryRevisionById", () => {
        it("should get a specific entry revision by ID", async () => {
            // Create test product.
            const [createResponse] = await handler.invoke({
                body: {
                    query: `mutation CreateProduct($data: ProductInput!) {
                        createProduct(data: $data) {
                            data {
                                id
                            }
                            error {
                                message
                                code
                            }
                        }
                    }`,
                    variables: {
                        data: {
                            values: {
                                name: "Headphones",
                                sku: "HEAD-001",
                                description: "Wireless headphones",
                                price: 200
                            }
                        }
                    }
                }
            });

            expect(createResponse.data.createProduct.error).toBeNull();
            const revisionId = createResponse.data.createProduct.data.id;

            // Test CMS schema getEntryRevisionById query.
            const result = await handler.getEntryRevisionById({
                modelId: "product",
                revisionId: revisionId,
                fields: ["id", "values.name", "values.price"]
            });

            expect(result.error).toBeNull();
            expect(result.data).toBeDefined();
            expect(result.data.id).toBe(revisionId);
            expect(result.data.values.name).toBe("Headphones");
            expect(result.data.values.price).toBe(200);
        });
    });
});
