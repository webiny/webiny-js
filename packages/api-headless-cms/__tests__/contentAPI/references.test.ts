import { useCategoryManageHandler } from "../utils/useCategoryManageHandler";
import { useArticleManageHandler } from "../utils/useArticleManageHandler";
import { useArticleReadHandler } from "../utils/useArticleReadHandler";
import { useContentGqlHandler } from "../utils/useContentGqlHandler";
import { setupContentModelGroup, setupContentModels } from "../utils/setup";
import { until } from "../utils/helpers";

const createCategoryItem = async ({ manager, from = null, publish, data }) => {
    const [response] = await (from
        ? manager.createCategoryFrom({ revision: from.id })
        : manager.createCategory({ data }));
    const category = from
        ? response?.data?.createCategoryFrom?.data
        : response?.data?.createCategory?.data;
    const error = from
        ? response?.data?.createCategoryFrom?.error
        : response?.data?.createCategory?.error;
    if (!category?.id || error) {
        console.log(error.message);
        console.log(JSON.stringify(error.data));
        throw new Error("Could not create category.");
    }
    if (from) {
        const [updateResponse] = await manager.updateCategory({
            revision: category.id,
            data
        });
        const updatedCategory = updateResponse?.data?.updateCategory?.data;
        const updatedError = updateResponse?.data?.updateCategory?.error;
        if (!updatedCategory?.id || updatedError) {
            console.log(updatedError.message);
            throw new Error("Could not update category.");
        }
    }
    if (!publish) {
        return category;
    }
    const [publishResponse] = await manager.publishCategory({
        revision: category.id
    });
    if (!publishResponse?.data?.publishCategory?.data?.id) {
        console.log(publishResponse?.data?.publishCategory?.error?.message);
        throw new Error("Could not publish category.");
    }
    return publishResponse.data.publishCategory.data;
};

const createArticleItem = async ({ manager, from = null, publish, data }) => {
    const [response] = await (from
        ? manager.createArticleFrom({ revision: from.id })
        : manager.createArticle({ data }));
    const article = from
        ? response?.data?.createArticleFrom?.data
        : response?.data?.createArticle?.data;
    const error = from
        ? response?.data?.createArticleFrom?.error
        : response?.data?.createArticle?.error;
    if (!article?.id || error) {
        console.log(error.message);
        console.log(JSON.stringify(error.data));
        throw new Error("Could not create article.");
    }
    if (from) {
        const [updateResponse] = await manager.updateArticle({
            revision: article.id,
            data
        });
        const updatedArticle = updateResponse?.data?.updateArticle?.data;
        const updatedError = updateResponse?.data?.updateArticle?.error;
        if (!updatedArticle?.id || updatedError) {
            console.log(updatedError.message);
            throw new Error("Could not update article.");
        }
    }
    if (!publish) {
        return article;
    }
    const [publishResponse] = await manager.publishArticle({
        revision: article.id
    });
    if (!publishResponse?.data?.publishArticle?.data?.id) {
        console.log(publishResponse?.data?.publishArticle?.error?.message);
        throw new Error("Could not publish article.");
    }
    return publishResponse.data.publishArticle.data;
};

/**
 * We need only certain values from the article data when created.
 */
const extractReadArticle = (
    item: Record<string, any>,
    category?: Record<string, any>
): Record<string, any> => {
    return {
        id: item.id,
        entryId: item.entryId,
        createdOn: item.createdOn,
        savedOn: item.savedOn,
        createdBy: item.createdBy,
        ownedBy: item.ownedBy,
        title: item.title,
        body: item.body,
        categories: category
            ? [
                  {
                      id: category.id,
                      title: category.title
                  }
              ]
            : []
    };
};

describe("entry references", () => {
    const manageOpts = { path: "manage/en-US" };
    const readOpts = { path: "read/en-US" };

    const mainManager = useContentGqlHandler(manageOpts);

    it("should get the published references on entries", async () => {
        const group = await setupContentModelGroup(mainManager);
        await setupContentModels(mainManager, group, ["category", "article"]);

        const categoryManager = useCategoryManageHandler(manageOpts);
        const articleManager = useArticleManageHandler(manageOpts);
        const articleRead = useArticleReadHandler(readOpts);

        const techCategory = await createCategoryItem({
            manager: categoryManager,
            data: {
                title: "Tech category",
                slug: "tech-category"
            },
            publish: true
        });

        const techArticle = await createArticleItem({
            manager: articleManager,
            data: {
                title: "Tech article",
                body: null,
                categories: [
                    {
                        entryId: techCategory.id,
                        modelId: "category"
                    }
                ]
            },
            publish: true
        });
        const techCategory2 = await createCategoryItem({
            manager: categoryManager,
            from: techCategory,
            data: {
                title: "Tech category 2",
                slug: "tech-category-2"
            },
            publish: true
        });

        const techArticle2 = await createArticleItem({
            manager: articleManager,
            // from: techArticle,
            data: {
                title: "Tech article 2",
                body: null,
                categories: [
                    {
                        entryId: techCategory2.id,
                        modelId: "category"
                    }
                ]
            },
            publish: true
        });

        const techCategory3 = await createCategoryItem({
            manager: categoryManager,
            from: techCategory2,
            data: {
                title: "Tech category 3",
                slug: "tech-category-3"
            },
            publish: true
        });

        const techArticle3 = await createArticleItem({
            manager: articleManager,
            // from: techArticle2,
            data: {
                title: "Tech article 3",
                body: null,
                categories: [
                    {
                        entryId: techCategory3.id,
                        modelId: "category"
                    }
                ]
            },
            publish: true
        });

        /**
         * Make sure we have all articles published.
         */
        await until(
            () => articleManager.listArticles().then(([data]) => data),
            ({ data }) => {
                const entries = data?.listArticles?.data || [];
                if (entries.length !== 3) {
                    return false;
                }
                return entries.every(entry => {
                    return !!entry.meta.publishedOn;
                });
            },
            { name: "list all published articles", tries: 10 }
        );

        const [readListResponse] = await articleRead.listArticles({
            sort: ["createdOn_DESC"]
        });
        /**
         * All the articles must have last published revision of the category.
         */
        expect(readListResponse).toEqual({
            data: {
                listArticles: {
                    data: [
                        extractReadArticle(techArticle3, techCategory3),
                        extractReadArticle(techArticle2, techCategory3),
                        extractReadArticle(techArticle, techCategory3)
                    ],
                    error: null,
                    meta: {
                        cursor: null,
                        hasMoreItems: false,
                        totalCount: 3
                    }
                }
            }
        });
        /**
         * First article is expected to have the published revision of the category when loading a single article
         */
        const [readArticleResponse] = await articleRead.getArticle({
            where: {
                id: techArticle.id
            }
        });
        expect(readArticleResponse).toEqual({
            data: {
                getArticle: {
                    data: extractReadArticle(techArticle, techCategory3),
                    error: null
                }
            }
        });
        /**
         * When loading the article via manage API it must have the assigned revision of the category.
         */
        const [readArticleManageResponse] = await articleManager.getArticle({
            revision: techArticle.id
        });

        expect(readArticleManageResponse).toEqual({
            data: {
                getArticle: {
                    data: {
                        ...techArticle,
                        /**
                         * This is to prove that category in the loaded article really is the first one created and assigned to the article.
                         */
                        categories: [
                            {
                                entryId: techCategory.id,
                                modelId: techCategory.meta.modelId
                            }
                        ]
                    },
                    error: null
                }
            }
        });
    });

    it("should not break if referenced entry does not exist", async () => {
        const group = await setupContentModelGroup(mainManager);
        await setupContentModels(mainManager, group, ["category", "article"]);

        const categoryManager = useCategoryManageHandler(manageOpts);
        const articleManager = useArticleManageHandler(manageOpts);
        const articleRead = useArticleReadHandler(readOpts);
        /**
         * Create a category, article and then new revision of category.
         * We will delete the referenced #1 category and listArticles will need to pull #2 revision as it is the only one available.
         */
        const techCategory = await createCategoryItem({
            manager: categoryManager,
            data: {
                title: "Tech category",
                slug: "tech-category"
            },
            publish: true
        });

        const techArticle = await createArticleItem({
            manager: articleManager,
            data: {
                title: "Tech article",
                body: null,
                categories: [
                    {
                        entryId: techCategory.id,
                        modelId: "category"
                    }
                ]
            },
            publish: true
        });
        const techCategory2 = await createCategoryItem({
            manager: categoryManager,
            from: techCategory,
            data: {
                title: "Tech category 2",
                slug: "tech-category-2"
            },
            publish: true
        });

        const [deleteResponse] = await categoryManager.deleteCategory({
            revision: techCategory.id
        });
        expect(deleteResponse).toEqual({
            data: {
                deleteCategory: {
                    data: true,
                    error: null
                }
            }
        });
        /**
         * Make sure we have article published.
         */
        await until(
            () => articleManager.listArticles().then(([data]) => data),
            ({ data }) => {
                const entries = data?.listArticles?.data || [];
                if (entries.length !== 1) {
                    return false;
                }
                return entries.every(entry => {
                    return !!entry.meta.publishedOn;
                });
            },
            { name: "list all published articles", tries: 10 }
        );

        const [listManageResponse] = await articleManager.listArticles();
        expect(listManageResponse).toEqual({
            data: {
                listArticles: {
                    data: [techArticle],
                    error: null,
                    meta: {
                        totalCount: 1,
                        hasMoreItems: false,
                        cursor: null
                    }
                }
            }
        });

        const [getManageResponse] = await articleManager.getArticle({
            revision: techArticle.id
        });
        expect(getManageResponse).toEqual({
            data: {
                getArticle: {
                    data: {
                        ...techArticle
                    },
                    error: null
                }
            }
        });

        const [listReadResponse] = await articleRead.listArticles();
        expect(listReadResponse).toEqual({
            data: {
                listArticles: {
                    data: [extractReadArticle(techArticle, techCategory2)],
                    error: null,
                    meta: {
                        totalCount: 1,
                        hasMoreItems: false,
                        cursor: null
                    }
                }
            }
        });

        const [getReadResponse] = await articleRead.getArticle({
            where: {
                id: techArticle.id
            }
        });
        expect(getReadResponse).toEqual({
            data: {
                getArticle: {
                    data: extractReadArticle(techArticle, techCategory2),
                    error: null
                }
            }
        });

        const [delete2Response] = await categoryManager.deleteCategory({
            revision: techCategory2.id
        });
        expect(delete2Response).toEqual({
            data: {
                deleteCategory: {
                    data: true,
                    error: null
                }
            }
        });
        /**
         * Make sure there are no categories.
         */
        await until(
            () => categoryManager.listCategories().then(([data]) => data),
            ({ data }) => {
                const entries = data?.listCategories?.data || [];
                return entries.length === 0;
            },
            { name: "list all categories after delete", tries: 10 }
        );
    
        const [listAfterDeleteReadResponse] = await articleRead.listArticles();
        expect(listAfterDeleteReadResponse).toEqual({
            data: {
                listArticles: {
                    data: [
                        extractReadArticle(techArticle),
                    ],
                    meta: {
                        cursor: null,
                        hasMoreItems: false,
                        totalCount: 1,
                    },
                    error: null,
                }
            }
        });

        const [getAfterDeleteReadResponse] = await articleRead.getArticle({
            where: {
                id: techArticle.id
            }
        });
        expect(getAfterDeleteReadResponse).toEqual({
            data: {
                getArticle: {
                    data: extractReadArticle(techArticle),
                    error: null
                }
            }
        });
    });
});
