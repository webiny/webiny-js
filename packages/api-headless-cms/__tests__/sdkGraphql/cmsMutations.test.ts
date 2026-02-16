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
 * Test CMS SDK mutation operations.
 * These tests verify the SDK's interaction with the CMS GraphQL API for mutations.
 */
describe("SDK GraphQL - CMS Mutation Operations", () => {
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

    describe("createEntry and publishEntryRevision", () => {
        it("should create and publish an entry using SDK", async () => {
            // Create entry using SDK.
            const createResult = await sdk.cms.createEntry<ProductValues>({
                modelId: "product",
                data: {
                    values: {
                        name: "Laptop",
                        sku: "LAP-001",
                        description: "High-performance laptop",
                        price: 1200
                    }
                },
                fields: ["id", "values.name", "values.price"]
            });

            expect(createResult.isOk()).toBe(true);
            const createdEntry = createResult.value;
            expect(createdEntry.id).toBeDefined();
            expect(createdEntry.values?.name).toBe("Laptop");
            expect(createdEntry.values?.price).toBe(1200);

            // Publish entry using SDK.
            const publishResult = await sdk.cms.publishEntryRevision<ProductValues>({
                modelId: "product",
                revisionId: createdEntry.id!,
                fields: ["id", "meta.status", "values.name"]
            });

            expect(publishResult.isOk()).toBe(true);
            const publishedEntry = publishResult.value;
            // @ts-ignore
            expect(publishedEntry.meta.status).toBe("published");
        });
    });

    describe("updateEntryRevision", () => {
        it("should update an entry revision", async () => {
            // Create entry using SDK.
            const createResult = await sdk.cms.createEntry<ProductValues>({
                modelId: "product",
                data: {
                    values: {
                        name: "Headphones",
                        sku: "HEAD-001",
                        description: "Wireless headphones",
                        price: 200
                    }
                },
                fields: ["id"]
            });
            expect(createResult.isOk()).toBe(true);
            const revisionId = createResult.value.id!;

            // Update entry using SDK.
            const updateResult = await sdk.cms.updateEntryRevision<ProductValues>({
                modelId: "product",
                revisionId,
                data: {
                    values: {
                        name: "Headphones",
                        sku: "HEAD-001",
                        description: "Wireless headphones",
                        price: 250 // Updated price.
                    }
                },
                fields: ["id", "values.price"]
            });

            expect(updateResult.isOk()).toBe(true);
            const updatedEntry = updateResult.value;
            expect(updatedEntry.values?.price).toBe(250);
        });
    });

    describe("deleteEntryRevision", () => {
        it("should delete an entry revision", async () => {
            // Create entry using SDK.
            const createResult = await sdk.cms.createEntry<ProductValues>({
                modelId: "product",
                data: {
                    values: {
                        name: "Camera",
                        sku: "CAM-001",
                        description: "Digital camera",
                        price: 800
                    }
                },
                fields: ["id"]
            });
            expect(createResult.isOk()).toBe(true);
            const revisionId = createResult.value.id!;

            // Delete entry using SDK.
            const deleteResult = await sdk.cms.deleteEntryRevision({
                modelId: "product",
                revisionId
            });

            expect(deleteResult.isOk()).toBe(true);
            expect(deleteResult.value).toBe(true);

            // Verify entry is deleted.
            const getResult = await sdk.cms.getEntry({
                modelId: "product",
                where: { id: revisionId },
                fields: ["id"]
            });

            expect(getResult.isOk()).toBe(false);
            expect(getResult.error?.code).toBe("GRAPHQL_ERROR");
        });
    });

    describe("unpublishEntryRevision", () => {
        it("should unpublish an entry revision", async () => {
            // Create entry using SDK.
            const createResult = await sdk.cms.createEntry<ProductValues>({
                modelId: "product",
                data: {
                    values: {
                        name: "Speaker",
                        sku: "SPK-001",
                        description: "Bluetooth speaker",
                        price: 100
                    }
                },
                fields: ["id"]
            });
            expect(createResult.isOk()).toBe(true);
            const revisionId = createResult.value.id!;

            // Publish entry using SDK.
            await sdk.cms.publishEntryRevision({
                modelId: "product",
                revisionId,
                fields: ["id"]
            });

            // Unpublish entry using SDK.
            const unpublishResult = await sdk.cms.unpublishEntryRevision<ProductValues>({
                modelId: "product",
                revisionId,
                fields: ["id", "meta.status"]
            });

            expect(unpublishResult.isOk()).toBe(true);
            const unpublishedEntry = unpublishResult.value;
            // @ts-ignore
            expect(unpublishedEntry.meta.status).toBe("unpublished");
        });
    });
});
