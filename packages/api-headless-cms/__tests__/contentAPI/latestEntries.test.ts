import { useGraphQLHandler } from "../utils/useGraphQLHandler";
import { CmsModel, CmsGroup } from "~/types";
import models from "./mocks/contentModels";
import { useCategoryManageHandler } from "../utils/useCategoryManageHandler";
import { useArticleManageHandler } from "../utils/useArticleManageHandler";
import { useArticleReadHandler } from "../utils/useArticleReadHandler";

jest.setTimeout(100000);

describe("latest entries", function () {
    const manageOpts = { path: "manage/en-US" };
    const previewOpts = { path: "preview/en-US" };
    const readOpts = { path: "read/en-US" };

    const {
        createContentModelMutation,
        updateContentModelMutation,
        createContentModelGroupMutation
    } = useGraphQLHandler(manageOpts);

    const { createCategory, createCategoryFrom, updateCategory, publishCategory } =
        useCategoryManageHandler({
            ...manageOpts
        });

    const setupContentModelGroup = async (): Promise<CmsGroup> => {
        const [createCMG] = await createContentModelGroupMutation({
            data: {
                name: "Group",
                slug: "group",
                icon: "ico/ico",
                description: "description"
            }
        });
        if (!createCMG?.data?.createContentModelGroup?.data) {
            throw new Error("There is no data when creating new content model group.");
        }
        return createCMG.data.createContentModelGroup.data;
    };

    const setupContentModel = async (contentModelGroup: CmsGroup, name: string) => {
        const model = models.find(m => m.modelId === name);
        if (!model) {
            throw new Error(`Could not find model "${name}".`);
        }
        // Create initial record
        const [create] = await createContentModelMutation({
            data: {
                name: model.name,
                modelId: model.modelId,
                group: contentModelGroup.id
            }
        });

        if (create.errors) {
            console.error(`[beforeEach] ${create.errors[0].message}`);
            process.exit(1);
        }

        const [update] = await updateContentModelMutation({
            modelId: create.data.createContentModel.data.modelId,
            data: {
                fields: model.fields,
                layout: model.layout
            }
        });
        return update.data.updateContentModel.data;
    };

    const createCategoryEntry = async ({ title, slug }: { title: string; slug: string }) => {
        const [createResponse] = await createCategory({
            data: {
                title,
                slug
            }
        });
        const entry = createResponse?.data?.createCategory?.data;
        if (!entry) {
            throw new Error("Could not create category.");
        }
        const [publishResponse] = await publishCategory({
            revision: entry.id
        });
        const publishedEntry = publishResponse?.data?.publishCategory?.data;
        if (!publishedEntry) {
            throw new Error("Could not publish category.");
        }
        return publishedEntry;
    };

    const updateCategoryEntry = async (original: any, { title }: { title: string }) => {
        /**
         * We need to create category from the original one and then update the new one.
         */
        const [createFromResponse] = await createCategoryFrom({
            revision: original.id
        });
        const createdEntry = createFromResponse?.data?.createCategoryFrom?.data;
        if (!createdEntry) {
            throw new Error(
                `Could not create category from existing one "${original.id}" - ${original.title}.`
            );
        }

        const [updateResponse] = await updateCategory({
            revision: createdEntry.id,
            data: {
                title,
                slug: createdEntry.slug
            }
        });
        const entry = updateResponse?.data?.updateCategory?.data;
        if (!entry) {
            throw new Error(
                `Could not update category "${createdEntry.id}" - ${createdEntry.title}.`
            );
        }
        return entry;
    };

    let categoryModel: CmsModel;
    let articleModel: CmsModel;

    let fruitCategory: any;
    let vehicleCategory: any;
    let animalCategory: any;

    beforeEach(async () => {
        const group = await setupContentModelGroup();
        categoryModel = await setupContentModel(group, "category");
        articleModel = await setupContentModel(group, "article");

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
        const { createArticle, publishArticle, until } = useArticleManageHandler(manageOpts);
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
                title,
                body,
                categories: categories.map(category => {
                    return {
                        id: category.id,
                        modelId: category.modelId
                    };
                })
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
                        createdBy: expect.any(Object),
                        ownedBy: expect.any(Object),
                        savedOn: expect.any(String),
                        category: null,
                        meta: {
                            title,
                            modelId: articleModel.modelId,
                            version: 1,
                            locked: false,
                            publishedOn: null,
                            status: "draft",
                            revisions: [
                                {
                                    id: expect.any(String),
                                    title
                                }
                            ]
                        },
                        title,
                        body,
                        categories
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

        /**
         * Need to wait propagation of the updated fruit category on the preview API.
         */
        await until(
            () => previewListArticles().then(([data]) => data),
            ({ data }: any) => {
                const targetArticle = data?.listArticles?.data[0];
                if (targetArticle.savedOn !== article.savedOn) {
                    return false;
                }
                const categories: any[] = targetArticle.categories || [];
                return categories.some(category => {
                    return category.id === updatedFruitCategory.id;
                });
            },
            { name: "list all articles", tries: 10 }
        );

        const [listResponse] = await previewListArticles();

        expect(listResponse).toEqual({
            data: {
                listArticles: {
                    data: [
                        {
                            id: article.id,
                            entryId: article.entryId,
                            createdOn: article.createdOn,
                            createdBy: article.createdBy,
                            ownedBy: article.ownedBy,
                            savedOn: article.savedOn,
                            category: null,
                            title,
                            body,
                            categories: [
                                {
                                    id: updatedFruitCategory.id,
                                    title: updatedFruitCategory.title
                                },
                                {
                                    id: vehicleCategory.id,
                                    title: vehicleCategory.title
                                },
                                {
                                    id: animalCategory.id,
                                    title: animalCategory.title
                                }
                            ]
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
            revision: updatedFruitCategory.id
        });

        expect(publishFruitResponse).toEqual({
            data: {
                publishCategory: {
                    data: {
                        id: `${updatedFruitCategory.id.replace("#0001", "#0002")}`,
                        entryId: updatedFruitCategory.entryId,
                        createdOn: expect.any(String),
                        createdBy: expect.any(Object),
                        savedOn: expect.any(String),
                        meta: {
                            title: "Fruit 2",
                            modelId: categoryModel.modelId,
                            version: 2,
                            locked: true,
                            publishedOn: expect.stringMatching(/^20/),
                            status: "published",
                            revisions: [
                                {
                                    id: `${updatedFruitCategory.id}`,
                                    title: updatedFruitCategory.title,
                                    slug: updatedFruitCategory.slug,
                                    meta: {
                                        status: "published",
                                        version: 2
                                    }
                                },
                                {
                                    id: fruitCategory.id,
                                    title: fruitCategory.title,
                                    slug: fruitCategory.slug,
                                    meta: {
                                        status: "unpublished",
                                        version: 1
                                    }
                                }
                            ],
                            data: {}
                        },
                        title: updatedFruitCategory.title,
                        slug: updatedFruitCategory.slug
                    },
                    error: null
                }
            }
        });
        const publishedFruitCategory = publishFruitResponse?.data?.publishCategory?.data;
        /**
         * Need to wait propagation of the updated fruit category on the read API.
         */
        await until(
            () => listArticles().then(([data]) => data),
            ({ data }: any) => {
                const categories: any[] = data?.listArticles?.data[0]?.categories || [];
                return categories.some(category => {
                    return category.id === publishedFruitCategory.id;
                });
            },
            { name: "list all articles after published fruit category", tries: 5 }
        );

        const [listReadResponse] = await listArticles();

        expect(listReadResponse).toEqual({
            data: {
                listArticles: {
                    data: [
                        {
                            id: article.id,
                            entryId: article.entryId,
                            createdOn: article.createdOn,
                            createdBy: article.createdBy,
                            ownedBy: article.ownedBy,
                            savedOn: article.savedOn,
                            category: null,
                            title,
                            body,
                            categories: [
                                {
                                    id: publishedFruitCategory.id,
                                    title: updatedFruitCategory.title
                                },
                                {
                                    id: vehicleCategory.id,
                                    title: vehicleCategory.title
                                },
                                {
                                    id: animalCategory.id,
                                    title: animalCategory.title
                                }
                            ]
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
