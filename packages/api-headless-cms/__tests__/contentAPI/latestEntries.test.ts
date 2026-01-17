import { beforeEach, describe, expect, it, vi } from "vitest";
import { CmsModel } from "~/types";
import { useCategoryManageHandler } from "../testHelpers/useCategoryManageHandler";
import { useArticleManageHandler } from "../testHelpers/useArticleManageHandler";
import { useArticleReadHandler } from "../testHelpers/useArticleReadHandler";
import { setupGroupAndModels } from "~tests/testHelpers/setup.js";
import type { IManageQueryBaseResponse } from "~tests/testHelpers/types.js";
import type { ICategoryResponseValues } from "~tests/testHelpers/category/manage/types.js";

vi.setConfig({
    testTimeout: 100_000
});

describe("latest entries", function () {
    const manageOpts = { path: "manage" };
    const previewOpts = { path: "preview" };
    const readOpts = { path: "read" };

    const manager = useCategoryManageHandler({
        ...manageOpts
    });

    const { createCategory, createCategoryFrom, updateCategory, publishCategory } = manager;

    const createCategoryEntry = async ({ title, slug }: { title: string; slug: string }) => {
        const [response] = await createCategory({
            variables: {
                data: {
                    values: {
                        title,
                        slug
                    },
                    status: "published"
                }
            }
        });
        if (response.data.createCategory.error) {
            console.error(response.data.createCategory.error);
            throw new Error(response.data.createCategory.error.message);
        }
        return response.data.createCategory.data!;
    };

    const updateCategoryEntry = async (original: any, { title }: { title: string }) => {
        /**
         * We need to create category from the original one and then update the new one.
         */
        const [result] = await createCategoryFrom({
            variables: {
                revision: original.id,
                data: {
                    values: {
                        title
                    }
                }
            }
        });
        if (result.data.createCategoryFrom.error) {
            throw new Error(result.data.createCategoryFrom.error.message);
        }
        return result.data.createCategoryFrom.data!;
    };

    let categoryModel: CmsModel;
    let articleModel: CmsModel;

    let fruitCategory: IManageQueryBaseResponse<ICategoryResponseValues>;
    let vehicleCategory: IManageQueryBaseResponse<ICategoryResponseValues>;
    let animalCategory: IManageQueryBaseResponse<ICategoryResponseValues>;

    beforeEach(async () => {
        const result = await setupGroupAndModels({
            manager,
            models: ["category", "article"]
        });
        categoryModel = result.getModel("category");
        articleModel = result.getModel("article");

        fruitCategory = await createCategoryEntry({
            title: "Fruit",
            slug: "fruit"
        });
        vehicleCategory = await createCategoryEntry({
            title: "Vehicle",
            slug: "vehicle"
        });
        animalCategory = await createCategoryEntry({
            title: "Animal",
            slug: "animal"
        });
    });

    it("should load all the latest categories in the article ref field", async () => {
        const { createArticle, publishArticle } = useArticleManageHandler(manageOpts);
        const { listArticles: previewListArticles } = useArticleReadHandler(previewOpts);
        const { listArticles } = useArticleReadHandler(readOpts);
        const title = "Test article";
        const categories = [
            {
                id: fruitCategory.id,
                entryId: fruitCategory.entryId,
                modelId: categoryModel.modelId
            },
            {
                id: vehicleCategory.id,
                entryId: vehicleCategory.entryId,
                modelId: categoryModel.modelId
            },
            {
                id: animalCategory.id,
                entryId: animalCategory.entryId,
                modelId: categoryModel.modelId
            }
        ];
        const body = null;
        const [createResponse] = await createArticle({
            data: {
                values: {
                    title,
                    body,
                    categories: categories.map(category => {
                        return {
                            id: category.id,
                            modelId: category.modelId
                        };
                    })
                }
            }
        });
        /**
         * First we create the article with initial categories and expect everything is ok.
         */
        expect(createResponse).toEqual({
            data: {
                createArticle: {
                    data: {
                        id: expect.any(String),
                        entryId: expect.any(String),
                        createdOn: expect.any(String),
                        modifiedOn: null,
                        savedOn: expect.any(String),
                        createdBy: expect.any(Object),
                        lastPublishedOn: null,
                        firstPublishedOn: null,
                        meta: {
                            title,
                            modelId: articleModel.modelId,
                            version: 1,
                            locked: false,
                            status: "draft",
                            revisions: [
                                {
                                    id: expect.any(String),
                                    values: {
                                        title
                                    }
                                }
                            ]
                        },
                        values: {
                            category: null,
                            title,
                            body,
                            categories
                        }
                    },
                    error: null
                }
            }
        });

        const [publishArticleResponse] = await publishArticle({
            revision: createResponse.data.createArticle.data.id
        });
        const article = publishArticleResponse.data.publishArticle.data;
        /**
         * Next we will update the Fruit category and it should return a new revision in categories field when listing the articles.
         */
        const updatedFruitCategory = await updateCategoryEntry(fruitCategory, {
            title: "Fruit 2"
        });

        const [listResponse] = await previewListArticles();

        expect(listResponse).toEqual({
            data: {
                listArticles: {
                    data: [
                        {
                            id: article.id,
                            entryId: article.entryId,
                            createdOn: article.createdOn,
                            modifiedOn: article.modifiedOn,
                            savedOn: article.savedOn,
                            createdBy: article.createdBy,
                            firstPublishedOn: article.firstPublishedOn,
                            lastPublishedOn: article.lastPublishedOn,
                            values: {
                                category: null,
                                title,
                                body,
                                categories: [
                                    {
                                        id: updatedFruitCategory.id,
                                        entryId: updatedFruitCategory.entryId,
                                        modelId: "category",
                                        values: {
                                            title: updatedFruitCategory.values.title
                                        }
                                    },
                                    {
                                        id: vehicleCategory.id,
                                        entryId: vehicleCategory.entryId,
                                        modelId: "category",
                                        values: {
                                            title: vehicleCategory.values.title
                                        }
                                    },
                                    {
                                        id: animalCategory.id,
                                        entryId: animalCategory.entryId,
                                        modelId: "category",
                                        values: {
                                            title: animalCategory.values.title
                                        }
                                    }
                                ]
                            }
                        }
                    ],
                    meta: {
                        hasMoreItems: false,
                        totalCount: 1,
                        cursor: null
                    },
                    error: null
                }
            }
        });
        /**
         * Let's publish the updated category and wait for it on the read API.
         */
        const [publishFruitResponse] = await publishCategory({
            variables: {
                revision: updatedFruitCategory.id
            }
        });

        expect(publishFruitResponse).toMatchObject({
            data: {
                publishCategory: {
                    data: {
                        id: `${updatedFruitCategory.id.replace("#0001", "#0002")}`,
                        entryId: updatedFruitCategory.entryId,
                        createdOn: expect.any(String),
                        createdBy: expect.any(Object),
                        savedOn: expect.any(String),
                        lastPublishedOn: expect.stringMatching(/^20/),
                        meta: {
                            title: "Fruit 2",
                            modelId: categoryModel.modelId,
                            version: 2,
                            locked: true,
                            status: "published",
                            revisions: [
                                {
                                    id: `${updatedFruitCategory.id}`,
                                    values: {
                                        title: updatedFruitCategory.values.title,
                                        slug: updatedFruitCategory.values.slug
                                    },
                                    meta: {
                                        status: "published",
                                        version: 2
                                    }
                                },
                                {
                                    id: fruitCategory.id,
                                    values: {
                                        title: fruitCategory.values.title,
                                        slug: fruitCategory.values.slug
                                    },
                                    meta: {
                                        status: "unpublished",
                                        version: 1
                                    }
                                }
                            ],
                            data: {}
                        },
                        values: {
                            title: updatedFruitCategory.values.title,
                            slug: updatedFruitCategory.values.slug
                        }
                    },
                    error: null
                }
            }
        });
        const publishedFruitCategory = publishFruitResponse?.data?.publishCategory?.data!;

        const [listReadResponse] = await listArticles();

        expect(listReadResponse).toEqual({
            data: {
                listArticles: {
                    data: [
                        {
                            id: article.id,
                            entryId: article.entryId,
                            createdOn: article.createdOn,
                            modifiedOn: article.modifiedOn,
                            savedOn: article.savedOn,
                            firstPublishedOn: article.firstPublishedOn,
                            lastPublishedOn: article.lastPublishedOn,
                            createdBy: article.createdBy,
                            values: {
                                category: null,
                                title,
                                body,
                                categories: [
                                    {
                                        id: publishedFruitCategory.id,
                                        entryId: publishedFruitCategory.entryId,
                                        modelId: "category",
                                        values: {
                                            title: updatedFruitCategory.values.title
                                        }
                                    },
                                    {
                                        id: vehicleCategory.id,
                                        entryId: vehicleCategory.entryId,
                                        modelId: "category",
                                        values: {
                                            title: vehicleCategory.values.title
                                        }
                                    },
                                    {
                                        id: animalCategory.id,
                                        entryId: animalCategory.entryId,
                                        modelId: "category",
                                        values: {
                                            title: animalCategory.values.title
                                        }
                                    }
                                ]
                            }
                        }
                    ],
                    meta: {
                        hasMoreItems: false,
                        totalCount: 1,
                        cursor: null
                    },
                    error: null
                }
            }
        });
    });
});
