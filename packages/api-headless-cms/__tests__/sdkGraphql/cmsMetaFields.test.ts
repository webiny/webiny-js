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
 * Test CMS SDK meta fields support.
 * These tests verify that users can send meta fields (status, createdOn, publishedOn,
 * createdBy, etc.) when creating or updating entries via the SDK.
 */
describe("SDK GraphQL - CMS Meta Fields", () => {
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

    describe("Create entry with meta fields", () => {
        it("should create entry with custom status field", async () => {
            const createResult = await sdk.cms.createEntry<ProductValues>({
                modelId: "product",
                data: {
                    status: "published",
                    values: {
                        name: "Published Laptop",
                        sku: "PUB-001",
                        description: "Laptop created with published status",
                        price: 1500
                    }
                },
                fields: ["id", "meta.status", "values.name"]
            });

            expect(createResult.isOk()).toBe(true);
            const entry = createResult.value;

            // @ts-expect-error - meta field exists in GraphQL response but not in SDK types.
            expect(entry.meta.status).toBe("published");
            expect(entry.values?.name).toBe("Published Laptop");
        });

        it("should create entry with custom status and publishing meta fields", async () => {
            const customPublishedDate = "2020-01-01T00:00:00.000Z";
            const customPublisher = {
                id: "custom-user",
                displayName: "Custom User",
                type: "admin"
            };

            const createResult = await sdk.cms.createEntry<ProductValues>({
                modelId: "product",
                data: {
                    status: "published",
                    firstPublishedOn: customPublishedDate,
                    lastPublishedOn: customPublishedDate,
                    firstPublishedBy: customPublisher,
                    lastPublishedBy: customPublisher,
                    values: {
                        name: "Published Laptop",
                        sku: "PUB-001",
                        description: "Laptop with custom publishing meta fields",
                        price: 1500
                    }
                },
                fields: [
                    "id",
                    "meta.status",
                    "firstPublishedOn",
                    "lastPublishedOn",
                    "firstPublishedBy.id",
                    "firstPublishedBy.displayName",
                    "firstPublishedBy.type",
                    "lastPublishedBy.id",
                    "lastPublishedBy.displayName",
                    "lastPublishedBy.type",
                    "values.name"
                ]
            });

            expect(createResult.isOk()).toBe(true);
            const entry = createResult.value;

            // @ts-expect-error - meta field exists in GraphQL response but not in SDK types.
            expect(entry.meta.status).toBe("published");
            expect(entry.firstPublishedOn).toBe(customPublishedDate);
            expect(entry.lastPublishedOn).toBe(customPublishedDate);
            expect(entry.firstPublishedBy).toMatchObject({
                id: customPublisher.id,
                displayName: customPublisher.displayName,
                type: customPublisher.type
            });
            expect(entry.lastPublishedBy).toMatchObject({
                id: customPublisher.id,
                displayName: customPublisher.displayName,
                type: customPublisher.type
            });
            expect(entry.values?.name).toBe("Published Laptop");
        });

        it("should create entry with custom creation meta fields", async () => {
            const customCreatedDate = "2021-06-15T10:30:00.000Z";
            const customSavedDate = "2021-06-15T10:30:00.000Z";
            const customCreator = {
                id: "original-creator",
                displayName: "Original Creator",
                type: "admin"
            };
            const customSaver = {
                id: "original-saver",
                displayName: "Original Saver",
                type: "admin"
            };

            const createResult = await sdk.cms.createEntry<ProductValues>({
                modelId: "product",
                data: {
                    createdOn: customCreatedDate,
                    savedOn: customSavedDate,
                    createdBy: customCreator,
                    savedBy: customSaver,
                    values: {
                        name: "Historical Product",
                        sku: "HIST-001",
                        description: "Product with custom creation timestamps",
                        price: 800
                    }
                },
                fields: [
                    "id",
                    "createdOn",
                    "savedOn",
                    "createdBy.id",
                    "createdBy.displayName",
                    "createdBy.type",
                    "savedBy.id",
                    "savedBy.displayName",
                    "savedBy.type",
                    "values.name"
                ]
            });

            expect(createResult.isOk()).toBe(true);
            const entry = createResult.value;

            expect(entry.createdOn).toBe(customCreatedDate);
            expect(entry.savedOn).toBe(customSavedDate);
            expect(entry.createdBy).toMatchObject({
                id: customCreator.id,
                displayName: customCreator.displayName,
                type: customCreator.type
            });
            expect(entry.savedBy).toMatchObject({
                id: customSaver.id,
                displayName: customSaver.displayName,
                type: customSaver.type
            });
            expect(entry.values?.name).toBe("Historical Product");
        });

        it("should create entry with custom revision-level meta fields", async () => {
            const customRevCreatedDate = "2022-03-10T14:00:00.000Z";
            const customRevSavedDate = "2022-03-10T14:05:00.000Z";
            const customRevCreator = {
                id: "rev-creator",
                displayName: "Revision Creator",
                type: "admin"
            };
            const customRevSaver = {
                id: "rev-saver",
                displayName: "Revision Saver",
                type: "admin"
            };

            const createResult = await sdk.cms.createEntry<ProductValues>({
                modelId: "product",
                data: {
                    revisionCreatedOn: customRevCreatedDate,
                    revisionSavedOn: customRevSavedDate,
                    revisionCreatedBy: customRevCreator,
                    revisionSavedBy: customRevSaver,
                    values: {
                        name: "Revision Tracked Product",
                        sku: "REV-001",
                        description: "Product with custom revision meta fields",
                        price: 650
                    }
                },
                fields: [
                    "id",
                    "revisionCreatedOn",
                    "revisionSavedOn",
                    "revisionCreatedBy.id",
                    "revisionCreatedBy.displayName",
                    "revisionCreatedBy.type",
                    "revisionSavedBy.id",
                    "revisionSavedBy.displayName",
                    "revisionSavedBy.type",
                    "values.name"
                ]
            });

            expect(createResult.isOk()).toBe(true);
            const entry = createResult.value;

            expect(entry.revisionCreatedOn).toBe(customRevCreatedDate);
            expect(entry.revisionSavedOn).toBe(customRevSavedDate);
            expect(entry.revisionCreatedBy).toMatchObject({
                id: customRevCreator.id,
                displayName: customRevCreator.displayName,
                type: customRevCreator.type
            });
            expect(entry.revisionSavedBy).toMatchObject({
                id: customRevSaver.id,
                displayName: customRevSaver.displayName,
                type: customRevSaver.type
            });
            expect(entry.values?.name).toBe("Revision Tracked Product");
        });
    });

    describe("Update entry with meta fields", () => {
        it("should update entry with custom meta fields", async () => {
            // Create initial entry.
            const createResult = await sdk.cms.createEntry<ProductValues>({
                modelId: "product",
                data: {
                    values: {
                        name: "Initial Product",
                        sku: "INIT-001",
                        description: "Product to be updated",
                        price: 500
                    }
                },
                fields: ["id"]
            });

            expect(createResult.isOk()).toBe(true);
            const revisionId = createResult.value.id!;

            // Update entry with custom meta fields.
            const customModifiedDate = "2023-01-20T09:00:00.000Z";
            const customModifier = {
                id: "modifier",
                displayName: "Modifier User",
                type: "admin"
            };

            const updateResult = await sdk.cms.updateEntryRevision<ProductValues>({
                modelId: "product",
                revisionId,
                data: {
                    modifiedOn: customModifiedDate,
                    modifiedBy: customModifier,
                    values: {
                        name: "Updated Product",
                        sku: "INIT-001",
                        description: "Product to be updated",
                        price: 999
                    }
                },
                fields: [
                    "id",
                    "modifiedOn",
                    "modifiedBy.id",
                    "modifiedBy.displayName",
                    "modifiedBy.type",
                    "values.price",
                    "values.name"
                ]
            });

            expect(updateResult.isOk()).toBe(true);
            const entry = updateResult.value;

            expect(entry.modifiedOn).toBe(customModifiedDate);
            expect(entry.modifiedBy).toMatchObject({
                id: customModifier.id,
                displayName: customModifier.displayName,
                type: customModifier.type
            });
            expect(entry.values?.price).toBe(999);
            expect(entry.values?.name).toBe("Updated Product");
        });
    });
});
