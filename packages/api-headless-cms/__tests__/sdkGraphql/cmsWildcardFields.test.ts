import { beforeEach, describe, expect, it } from "vitest";
import { useWebinySdk } from "../testHelpers/useWebinySdk";
import { useGraphQLHandler } from "../testHelpers/useGraphQLHandler";
import { setupGroupAndModels } from "../testHelpers/setup";
import { createProductModel } from "./mocks/productModel";
import { createProductCategoryModel } from "./mocks/productCategoryModel";
import { createArticleModel } from "./mocks/articleModel";

interface ProductValues {
    name: string;
    sku: string;
    description: string;
    price: number;
}

interface ArticleValues {
    title: string;
    content: Array<{
        __typename?: string;
        [key: string]: unknown;
    }>;
}

describe("SDK GraphQL - values.* wildcard field selection", () => {
    const { sdk } = useWebinySdk();
    const manageHandler = useGraphQLHandler({ path: "manage" });

    beforeEach(async () => {
        const { group } = await setupGroupAndModels({
            manager: manageHandler,
            models: undefined
        });

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

        const articleModel = createArticleModel(group);
        await manageHandler.createContentModelMutation({
            data: {
                ...articleModel,
                description: articleModel.description || undefined,
                icon: articleModel.icon || undefined
            }
        });
    });

    describe("getEntry with values.*", () => {
        it("should return all scalar fields when using values.* wildcard", async () => {
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
                fields: ["id"]
            });
            expect(createResult.isOk()).toBe(true);
            const productId = createResult.value.id!;

            await sdk.cms.publishEntryRevision({
                modelId: "product",
                revisionId: productId,
                fields: ["id"]
            });

            const getResult = await sdk.cms.getEntry<ProductValues>({
                modelId: "product",
                where: { id: productId },
                fields: ["id", "entryId", "values.*"]
            });

            expect(getResult.isOk()).toBe(true);
            const entry = getResult.value;
            expect(entry).not.toBeNull();
            expect(entry.id).toBe(productId);
            expect(entry.values?.name).toBe("Laptop");
            expect(entry.values?.sku).toBe("LAP-001");
            expect(entry.values?.description).toBe("High-performance laptop");
            expect(entry.values?.price).toBe(1200);
        });

        it("should mix values.* with explicit system fields", async () => {
            const createResult = await sdk.cms.createEntry<ProductValues>({
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
            expect(createResult.isOk()).toBe(true);
            const productId = createResult.value.id!;

            await sdk.cms.publishEntryRevision({
                modelId: "product",
                revisionId: productId,
                fields: ["id"]
            });

            const getResult = await sdk.cms.getEntry({
                modelId: "product",
                where: { id: productId },
                fields: ["id", "entryId", "createdOn", "values.*"]
            });

            expect(getResult.isOk()).toBe(true);
            const entry = getResult.value;
            expect(entry.id).toBeDefined();
            expect(entry.entryId).toBeDefined();
            expect(entry.createdOn).toBeDefined();
            expect(entry.values).toBeDefined();
        });

        it("should return DZ template values with _templateId", async () => {
            const createResult = await sdk.cms.createEntry<ArticleValues>({
                modelId: "article",
                data: {
                    values: {
                        title: "Test Article",
                        content: [
                            {
                                Hero: { title: "Hero Title" }
                            },
                            {
                                SimpleText: { text: "Some paragraph text" }
                            }
                        ]
                    }
                },
                fields: ["id"]
            });
            expect(createResult.isOk()).toBe(true);
            const articleId = createResult.value.id!;

            await sdk.cms.publishEntryRevision({
                modelId: "article",
                revisionId: articleId,
                fields: ["id"]
            });

            const getResult = await sdk.cms.getEntry<ArticleValues>({
                modelId: "article",
                where: { id: articleId },
                fields: ["id", "values.*"]
            });

            expect(getResult.isOk()).toBe(true);
            const entry = getResult.value;
            expect(entry.values?.title).toBe("Test Article");
            expect(entry.values?.content).toBeInstanceOf(Array);
            expect(entry.values?.content.length).toBe(2);

            const hero = entry.values?.content[0];
            expect(hero?._templateId).toBe("heroTemplateId");
            expect(hero?.title).toBe("Hero Title");

            const text = entry.values?.content[1];
            expect(text?._templateId).toBe("simpleTextTemplateId");
            expect(text?.text).toBe("Some paragraph text");
        });
    });

    describe("listEntries with values.*", () => {
        it("should return all values for listed entries", async () => {
            for (let i = 1; i <= 2; i++) {
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

                await sdk.cms.publishEntryRevision({
                    modelId: "product",
                    revisionId: createResult.value.id!,
                    fields: ["id"]
                });
            }

            const listResult = await sdk.cms.listEntries<ProductValues>({
                modelId: "product",
                fields: ["id", "values.*"]
            });

            expect(listResult.isOk()).toBe(true);
            const list = listResult.value;
            expect(list.data.length).toBe(2);

            for (const entry of list.data) {
                expect(entry.values?.name).toBeDefined();
                expect(entry.values?.sku).toBeDefined();
                expect(entry.values?.description).toBeDefined();
                expect(entry.values?.price).toBeDefined();
            }
        });
    });
});
