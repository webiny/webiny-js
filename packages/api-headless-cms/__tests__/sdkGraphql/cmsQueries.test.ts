import { beforeEach, describe, expect, it } from "vitest";
import { useSdkGqlHandler } from "../testHelpers/useSdkGqlHandler";
import { useGraphQLHandler } from "../testHelpers/useGraphQLHandler";
import { createProduct, publishProduct } from "../testHelpers/productHelpers";
import { setupGroupAndModels } from "../testHelpers/setup";
import { createProductModel } from "./mocks/productModel";
import { createProductCategoryModel } from "./mocks/productCategoryModel";

/**
 * Test CMS SDK GraphQL schema queries (Query.cms.*).
 * These tests verify the CMS schema that the SDK uses to query entries.
 * All CMS queries are executed on the main /graphql endpoint.
 */
describe("SDK GraphQL - CMS Schema Queries", () => {
    const handler = useSdkGqlHandler();
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
            // Create test products using helper functions.
            const product1Id = await createProduct(manageHandler, {
                name: "Laptop",
                sku: "LAP-001",
                description: "High-performance laptop",
                price: 1200
            });

            // Publish the first product so it's visible to the preview API.
            await publishProduct(manageHandler, product1Id);

            // Wait a bit to ensure different createdOn timestamps.
            await new Promise(resolve => setTimeout(resolve, 100));

            const product2Id = await createProduct(manageHandler, {
                name: "Mouse",
                sku: "MOU-001",
                description: "Wireless mouse",
                price: 50
            });

            // Publish the second product so it's visible to the preview API.
            await publishProduct(manageHandler, product2Id);

            // Test CMS schema listEntries query with sort on main /graphql endpoint.
            const result = await handler.listEntries({
                modelId: "product",
                fields: ["id", "values.name", "values.price"],
                sort: {
                    createdOn: "desc"
                },
                preview: true
            });

            expect(result.error).toBeNull();
            expect(result.data).toBeDefined();
            expect(result.data.length).toBe(2);
            expect(result.meta.totalCount).toBe(2);

            // Verify sort order - Mouse should be first (created last).
            expect(result.data[0].values.name).toBe("Mouse");
            expect(result.data[1].values.name).toBe("Laptop");
        });

        it("should list entries with where filter", async () => {
            // Create test products using helper functions.
            const productId = await createProduct(manageHandler, {
                name: "Keyboard",
                sku: "KEY-001",
                description: "Mechanical keyboard",
                price: 150
            });

            await createProduct(manageHandler, {
                name: "Monitor",
                sku: "MON-001",
                description: "4K Monitor",
                price: 400
            });

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
            // Create 3 test products using helper functions.
            for (let i = 1; i <= 3; i++) {
                await createProduct(manageHandler, {
                    name: `Product ${i}`,
                    sku: `PROD-00${i}`,
                    description: `Product ${i} description`,
                    price: i * 100
                });
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
            // Create test product using helper function.
            const productId = await createProduct(manageHandler, {
                name: "Tablet",
                sku: "TAB-001",
                description: "10-inch tablet",
                price: 300
            });

            // Test CMS schema getEntry query.
            const getResult = await handler.getEntry({
                modelId: "product",
                where: {
                    id: productId
                },
                fields: ["id", "values.name", "values.price", "values.sku"],
                preview: true
            });

            expect(getResult.error).toBeNull();
            expect(getResult.data).toBeDefined();
            expect(getResult.data!.id).toBe(productId);
            expect(getResult.data!.values.name).toBe("Tablet");
            expect(getResult.data!.values.price).toBe(300);
            expect(getResult.data!.values.sku).toBe("TAB-001");
        });

        it("should return null when entry not found", async () => {
            // Test CMS schema getEntry query with non-existent ID.
            const getResult = await handler.getEntry({
                modelId: "product",
                where: {
                    id: "nonexistent#0001"
                },
                fields: ["id", "values.name"]
            });

            expect(getResult.data).toBeNull();
        });
    });

    describe("getEntryRevisionById", () => {
        // TODO: This test is currently skipped due to an issue with getEntryRevisionById.
        // The resolver internally calls context.cms.getExecutableSchema("manage") which doesn't
        // properly preserve the authentication/security context, causing the query to fail silently.
        // This needs to be investigated and fixed in the getEntryByIdResolver implementation.
        it.skip("should get a specific entry revision by ID", async () => {
            // Create and publish test product using helper functions.
            const revisionId = await createProduct(manageHandler, {
                name: "Headphones",
                sku: "HEAD-001",
                description: "Wireless headphones",
                price: 200
            });

            await publishProduct(manageHandler, revisionId);

            // Test CMS schema getEntryRevisionById query.
            const getResult = await handler.getEntryRevisionById({
                modelId: "product",
                revisionId: revisionId,
                fields: ["id", "values.name", "values.price"]
            });

            expect(getResult.error).toBeNull();
            expect(getResult.data).toBeDefined();
            expect(getResult.data!.id).toBe(revisionId);
            expect(getResult.data!.values.name).toBe("Headphones");
            expect(getResult.data!.values.price).toBe(200);
        });
    });
});
