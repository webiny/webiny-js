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
 * Test CMS SDK search functionality.
 * These tests verify that users can perform full-text search on CMS entries via the SDK.
 */
describe("SDK GraphQL - CMS Search", () => {
    const { sdk } = useWebinySdk();
    const manageHandler = useGraphQLHandler({ path: "manage" });

    // Helper function to create and publish an entry.
    const createAndPublishEntry = async (values: ProductValues) => {
        const createResult = await sdk.cms.createEntry<ProductValues>({
            modelId: "product",
            data: { values },
            fields: ["id"]
        });
        await sdk.cms.publishEntryRevision({
            modelId: "product",
            revisionId: createResult.value.id!,
            fields: ["id"]
        });
        return createResult.value;
    };

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

    describe("Full-text search", () => {
        it("should search entries by name field", async () => {
            // Create and publish products with different names.
            await createAndPublishEntry({
                name: "Gaming Laptop",
                sku: "LAP-001",
                description: "High-performance gaming laptop",
                price: 1500
            });

            await createAndPublishEntry({
                name: "Wireless Mouse",
                sku: "MOU-001",
                description: "Ergonomic wireless mouse",
                price: 50
            });

            await createAndPublishEntry({
                name: "Mechanical Keyboard",
                sku: "KEY-001",
                description: "RGB mechanical keyboard",
                price: 120
            });

            // Search for "Laptop".
            const searchResult = await sdk.cms.listEntries<ProductValues>({
                modelId: "product",
                search: "Laptop",
                fields: ["id", "values.name", "values.price"]
            });

            expect(searchResult.isOk()).toBe(true);
            const result = searchResult.value;

            expect(result.data).toHaveLength(1);
            expect(result.data[0].values?.name).toBe("Gaming Laptop");
            expect(result.data[0].values?.price).toBe(1500);
        });

        it("should search entries with special characters", async () => {
            // Create products with special characters.
            await createAndPublishEntry({
                name: "High-End Laptop w/ SSD",
                sku: "LAP-002",
                description: "Premium laptop with solid state drive",
                price: 2000
            });

            await createAndPublishEntry({
                name: "Standard Laptop",
                sku: "LAP-003",
                description: "Basic laptop",
                price: 800
            });

            // Search for "w/".
            const searchResult = await sdk.cms.listEntries<ProductValues>({
                modelId: "product",
                search: "w/",
                fields: ["id", "values.name"]
            });

            expect(searchResult.isOk()).toBe(true);
            const result = searchResult.value;

            expect(result.data).toHaveLength(1);
            expect(result.data[0].values?.name).toBe("High-End Laptop w/ SSD");
        });

        it("should perform case-insensitive search", async () => {
            // Create product with mixed case name.
            await createAndPublishEntry({
                name: "Gaming Laptop",
                sku: "LAP-004",
                description: "High-performance gaming laptop",
                price: 1500
            });

            // Search with lowercase.
            const searchResult = await sdk.cms.listEntries<ProductValues>({
                modelId: "product",
                search: "gaming laptop",
                fields: ["id", "values.name"]
            });

            expect(searchResult.isOk()).toBe(true);
            const result = searchResult.value;

            expect(result.data).toHaveLength(1);
            expect(result.data[0].values?.name).toBe("Gaming Laptop");
        });

        it("should search across multiple fields", async () => {
            // Create products where search term appears in different fields.
            await createAndPublishEntry({
                name: "Mobile Device",
                sku: "PHO-001",
                description: "Latest smartphone with advanced features",
                price: 900
            });

            await createAndPublishEntry({
                name: "Tablet",
                sku: "TAB-001",
                description: "Portable tablet device",
                price: 400
            });

            // Search for "smartphone" (in description, not name).
            const searchResult = await sdk.cms.listEntries<ProductValues>({
                modelId: "product",
                search: "smartphone",
                fields: ["id", "values.name", "values.description"]
            });

            expect(searchResult.isOk()).toBe(true);
            const result = searchResult.value;

            expect(result.data).toHaveLength(1);
            expect(result.data[0].values?.name).toBe("Mobile Device");
            expect(result.data[0].values?.description).toContain("smartphone");
        });
    });

    describe("Search combined with filters", () => {
        it("should combine search with where filters", async () => {
            // Create products with different prices.
            await createAndPublishEntry({
                name: "Budget Laptop",
                sku: "LAP-005",
                description: "Affordable laptop",
                price: 500
            });

            await createAndPublishEntry({
                name: "Premium Laptop",
                sku: "LAP-006",
                description: "High-end laptop",
                price: 2000
            });

            await createAndPublishEntry({
                name: "Gaming Mouse",
                sku: "MOU-002",
                description: "High-performance gaming mouse",
                price: 80
            });

            // Search "Laptop" + price >= 1000.
            const searchResult = await sdk.cms.listEntries<ProductValues>({
                modelId: "product",
                search: "Laptop",
                where: {
                    "values.price_gte": 1000
                },
                fields: ["id", "values.name", "values.price"]
            });

            expect(searchResult.isOk()).toBe(true);
            const result = searchResult.value;

            expect(result.data).toHaveLength(1);
            expect(result.data[0].values?.name).toBe("Premium Laptop");
            expect(result.data[0].values?.price).toBe(2000);
        });

        it("should combine search with sorting", async () => {
            // Create multiple laptops (with delays to ensure different createdOn times).
            await createAndPublishEntry({
                name: "Laptop A",
                sku: "LAP-007",
                description: "Mid-range laptop",
                price: 1200
            });

            await new Promise(resolve => setTimeout(resolve, 100));

            await createAndPublishEntry({
                name: "Laptop B",
                sku: "LAP-008",
                description: "Budget laptop",
                price: 800
            });

            await new Promise(resolve => setTimeout(resolve, 100));

            await createAndPublishEntry({
                name: "Laptop C",
                sku: "LAP-009",
                description: "Premium laptop",
                price: 1800
            });

            // Search "Laptop" + sort by createdOn descending.
            const searchResult = await sdk.cms.listEntries<ProductValues>({
                modelId: "product",
                search: "Laptop",
                sort: {
                    createdOn: "desc"
                },
                fields: ["id", "values.name", "createdOn"]
            });

            expect(searchResult.isOk()).toBe(true);
            const result = searchResult.value;

            expect(result.data).toHaveLength(3);
            // Most recently created should be first (Laptop C).
            expect(result.data[0].values?.name).toBe("Laptop C");
            expect(result.data[1].values?.name).toBe("Laptop B");
            expect(result.data[2].values?.name).toBe("Laptop A");
        });

        it("should combine search with pagination", async () => {
            // Create 5 laptops.
            for (let i = 1; i <= 5; i++) {
                await createAndPublishEntry({
                    name: `Laptop ${i}`,
                    sku: `LAP-${100 + i}`,
                    description: `Description for laptop ${i}`,
                    price: 1000 + i * 100
                });
            }

            // Search "Laptop" + limit: 2.
            const searchResult = await sdk.cms.listEntries<ProductValues>({
                modelId: "product",
                search: "Laptop",
                limit: 2,
                fields: ["id", "values.name"]
            });

            expect(searchResult.isOk()).toBe(true);
            const result = searchResult.value;

            expect(result.data).toHaveLength(2);
            expect(result.meta.hasMoreItems).toBe(true);
            expect(result.meta.totalCount).toBe(5);
        });
    });

    describe("Search edge cases", () => {
        it("should return empty results for non-matching search", async () => {
            // Create some products.
            await createAndPublishEntry({
                name: "Monitor",
                sku: "MON-001",
                description: "4K monitor",
                price: 500
            });

            // Search for non-existent term.
            const searchResult = await sdk.cms.listEntries<ProductValues>({
                modelId: "product",
                search: "NonExistentProductTerm",
                fields: ["id", "values.name"]
            });

            expect(searchResult.isOk()).toBe(true);
            const result = searchResult.value;

            expect(result.data).toHaveLength(0);
            expect(result.meta.totalCount).toBe(0);
        });

        it("should return all entries when search is undefined", async () => {
            // Create 3 products.
            await createAndPublishEntry({
                name: "Product A",
                sku: "PRO-001",
                description: "First product",
                price: 100
            });

            await createAndPublishEntry({
                name: "Product B",
                sku: "PRO-002",
                description: "Second product",
                price: 200
            });

            await createAndPublishEntry({
                name: "Product C",
                sku: "PRO-003",
                description: "Third product",
                price: 300
            });

            // List without search parameter.
            const listResult = await sdk.cms.listEntries<ProductValues>({
                modelId: "product",
                fields: ["id", "values.name"]
            });

            expect(listResult.isOk()).toBe(true);
            const result = listResult.value;

            expect(result.data).toHaveLength(3);
            expect(result.meta.totalCount).toBe(3);
        });
    });
});
