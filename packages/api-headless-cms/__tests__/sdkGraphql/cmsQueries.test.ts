import { beforeEach, describe, expect, it } from "vitest";
import { useWebinySdk } from "../testHelpers/useWebinySdk";
import { useGraphQLHandler } from "../testHelpers/useGraphQLHandler";
import { setupGroupAndModels } from "../testHelpers/setup";
import { createProductModel } from "./mocks/productModel";
import { createProductCategoryModel } from "./mocks/productCategoryModel";

interface ProductValues {
    name: string;
    sku: string;
    description: string;
    price: number;
}

/**
 * Test CMS SDK operations.
 * These tests verify the SDK's interaction with the CMS GraphQL API.
 * All operations (both queries and mutations) use the SDK.
 */
describe("SDK GraphQL - CMS Operations", () => {
    const { sdk } = useWebinySdk();
    const manageHandler = useGraphQLHandler({ path: "manage" });

    beforeEach(async () => {
        // Setup group and models using the manage endpoint.
        const { group } = await setupGroupAndModels({
            manager: manageHandler,
            models: undefined
        });

        // Create the product category and product models.
        const categoryModel = createProductCategoryModel(group);
        await manageHandler.createContentModelMutation({
            data: {
                ...categoryModel,
                description: categoryModel.description || undefined,
                icon: categoryModel.icon || undefined
            }
        });

        const productModel = createProductModel(group);
        await manageHandler.createContentModelMutation({
            data: {
                ...productModel,
                description: productModel.description || undefined,
                icon: productModel.icon || undefined
            }
        });
    });

    describe("listEntries", () => {
        it("should list entries with sort parameter", async () => {
            // Create first product using SDK.
            const product1Result = await sdk.cms.createEntry<ProductValues>({
                modelId: "product",
                data: {
                    values: {
                        name: "Laptop",
                        sku: "LAP-001",
                        description: "High-performance laptop",
                        price: 1200
                    }
                },
                fields: ["id"]
            });
            expect(product1Result.isOk()).toBe(true);
            const product1 = product1Result.value;

            // Publish first product.
            await sdk.cms.publishEntryRevision({
                modelId: "product",
                revisionId: product1.id!,
                fields: ["id"]
            });

            // Wait a bit to ensure different createdOn timestamps.
            await new Promise(resolve => setTimeout(resolve, 100));

            // Create second product using SDK.
            const product2Result = await sdk.cms.createEntry<ProductValues>({
                modelId: "product",
                data: {
                    values: {
                        name: "Mouse",
                        sku: "MOU-001",
                        description: "Wireless mouse",
                        price: 50
                    }
                },
                fields: ["id"]
            });
            expect(product2Result.isOk()).toBe(true);
            const product2 = product2Result.value;

            // Publish second product.
            await sdk.cms.publishEntryRevision({
                modelId: "product",
                revisionId: product2.id!,
                fields: ["id"]
            });

            // List entries with sort using SDK.
            const listResult = await sdk.cms.listEntries<ProductValues>({
                modelId: "product",
                fields: ["id", "values.name", "values.price"],
                sort: {
                    createdOn: "desc"
                }
            });

            expect(listResult.isOk()).toBe(true);
            const list = listResult.value;
            expect(list.data.length).toBe(2);
            expect(list.meta.totalCount).toBe(2);

            // Verify sort order - Mouse should be first (created last).
            expect(list.data[0].values?.name).toBe("Mouse");
            expect(list.data[1].values?.name).toBe("Laptop");
        });

        it("should list entries with where filter", async () => {
            // Create first product.
            const product1Result = await sdk.cms.createEntry<ProductValues>({
                modelId: "product",
                data: {
                    values: {
                        name: "Keyboard",
                        sku: "KEY-001",
                        description: "Mechanical keyboard",
                        price: 150
                    }
                },
                fields: ["id"]
            });
            expect(product1Result.isOk()).toBe(true);
            const productId = product1Result.value.id!;

            // Publish first product.
            await sdk.cms.publishEntryRevision({
                modelId: "product",
                revisionId: productId,
                fields: ["id"]
            });

            // Create second product.
            const product2Result = await sdk.cms.createEntry<ProductValues>({
                modelId: "product",
                data: {
                    values: {
                        name: "Monitor",
                        sku: "MON-001",
                        description: "4K Monitor",
                        price: 400
                    }
                },
                fields: ["id"]
            });
            expect(product2Result.isOk()).toBe(true);

            // Publish second product.
            await sdk.cms.publishEntryRevision({
                modelId: "product",
                revisionId: product2Result.value.id!,
                fields: ["id"]
            });

            // List entries with where filter using SDK.
            const listResult = await sdk.cms.listEntries<ProductValues>({
                modelId: "product",
                fields: ["id", "values.name", "values.price"],
                where: {
                    id: productId
                }
            });

            expect(listResult.isOk()).toBe(true);
            const list = listResult.value;
            expect(list.data.length).toBe(1);
            expect(list.data[0].id).toBe(productId);
            expect(list.data[0].values?.name).toBe("Keyboard");
        });

        it("should list entries with limit and pagination", async () => {
            // Create 3 test products using SDK.
            for (let i = 1; i <= 3; i++) {
                const createResult = await sdk.cms.createEntry<ProductValues>({
                    modelId: "product",
                    data: {
                        values: {
                            name: `Product ${i}`,
                            sku: `PROD-00${i}`,
                            description: `Product ${i} description`,
                            price: i * 100
                        }
                    },
                    fields: ["id"]
                });

                // Publish created product.
                await sdk.cms.publishEntryRevision({
                    modelId: "product",
                    revisionId: createResult.value.id!,
                    fields: ["id"]
                });
            }

            // List entries with limit using SDK.
            const listResult = await sdk.cms.listEntries<ProductValues>({
                modelId: "product",
                fields: ["id", "values.name"],
                limit: 2
            });

            expect(listResult.isOk()).toBe(true);
            const list = listResult.value;
            expect(list.data.length).toBe(2);
            expect(list.meta.hasMoreItems).toBe(true);
            expect(list.meta.totalCount).toBe(3);
            expect(list.meta.cursor).toBeDefined();

            // Test pagination with after cursor.
            const list2Result = await sdk.cms.listEntries<ProductValues>({
                modelId: "product",
                fields: ["id", "values.name"],
                limit: 2,
                after: list.meta.cursor!
            });

            expect(list2Result.isOk()).toBe(true);
            const list2 = list2Result.value;
            expect(list2.data.length).toBe(1);
            expect(list2.meta.hasMoreItems).toBe(false);
        });
    });

    describe("getEntry", () => {
        it("should get a single entry by where clause", async () => {
            // Create product using SDK.
            const createResult = await sdk.cms.createEntry<ProductValues>({
                modelId: "product",
                data: {
                    values: {
                        name: "Tablet",
                        sku: "TAB-001",
                        description: "High-performance tablet",
                        price: 300
                    }
                },
                fields: ["id", "values.name", "values.price"]
            });

            expect(createResult.isOk()).toBe(true);
            const productId = createResult.value.id!;

            // Publish product.
            await sdk.cms.publishEntryRevision({
                modelId: "product",
                revisionId: productId,
                fields: ["id"]
            });

            // Get entry using SDK.
            const getResult = await sdk.cms.getEntry<ProductValues>({
                modelId: "product",
                where: {
                    id: productId
                },
                fields: ["id", "values.name", "values.price", "values.sku"]
            });

            expect(getResult.isOk()).toBe(true);
            const entry = getResult.value;
            expect(entry).not.toBeNull();
            expect(entry?.id).toBe(productId);
            expect(entry?.values?.name).toBe("Tablet");
            expect(entry?.values?.price).toBe(300);
            expect(entry?.values?.sku).toBe("TAB-001");
        });

        it("should return null when entry not found", async () => {
            // Get non-existent entry using SDK.
            const getResult = await sdk.cms.getEntry<ProductValues>({
                modelId: "product",
                where: {
                    id: "nonexistent#0001"
                },
                fields: ["id", "values.name"]
            });

            expect(getResult.isOk()).toBe(false);
            expect(getResult.error?.code).toBe("GRAPHQL_ERROR");
        });
    });
});
