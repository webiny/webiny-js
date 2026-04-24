import { beforeEach, describe, expect, it } from "vitest";
import { useCategoryManageHandler } from "../testHelpers/useCategoryManageHandler";
import { useArticleManageHandler } from "../testHelpers/useArticleManageHandler";
import { useArticleReadHandler } from "../testHelpers/useArticleReadHandler";
import { useGraphQLHandler } from "../testHelpers/useGraphQLHandler";
import { setupGroupAndModels } from "../testHelpers/setup";
import type { GenericRecord } from "@webiny/api/types.js";
import type {
    ICategoryInput,
    ICategoryResponseValues
} from "~tests/testHelpers/category/manage/types.js";
import type { IManageQueryBaseResponse } from "~tests/testHelpers/types.js";

interface ICreateCategoryItemParams {
    manager: ReturnType<typeof useCategoryManageHandler>;
    from?: GenericRecord | null;
    data: ICategoryInput;
}

const createCategoryItem = async ({ manager, from, data }: ICreateCategoryItemParams) => {
    if (from) {
        const [result] = await manager.createCategoryFrom({
            variables: {
                revision: from.id,
                data
            }
        });
        if (result.data.createCategoryFrom.error) {
            console.log(result.data.createCategoryFrom.error);
            throw new Error("Could not create category.");
        }
        return result.data.createCategoryFrom.data!;
    }

    const [result] = await manager.createCategory({
        variables: {
            data
        }
    });
    if (result.data.createCategory.error) {
        console.log(result.data.createCategory.error);
        throw new Error("Could not create category.");
    }
    return result.data.createCategory.data!;
};

interface ICreateArticleItemParams {
    manager: ReturnType<typeof useArticleManageHandler>;
    from?: GenericRecord | null;
    data: GenericRecord;
}

const createArticleItem = async ({ manager, from, data }: ICreateArticleItemParams) => {
    if (from) {
        const [result] = await manager.createArticleFrom({
            revision: from.id,
            data
        });
        if (result?.data?.createArticleFrom?.error) {
            console.log(result.data.createArticleFrom.error);
            throw new Error("Could not create article.");
        }
        return result.data.createArticleFrom.data;
    }

    const [result] = await manager.createArticle({
        data
    });
    if (result?.data?.createArticle?.error) {
        console.log(result.data.createArticle.error);
        throw new Error("Could not create article.");
    }
    return result.data.createArticle.data;
};

/**
 * We need only certain values from the article data when created.
 */
const extractReadArticle = (
    item: IManageQueryBaseResponse<GenericRecord>,
    category?: IManageQueryBaseResponse<ICategoryResponseValues>
) => {
    return {
        id: item.id,
        entryId: item.entryId,
        createdOn: item.createdOn,
        modifiedOn: null,
        savedOn: item.savedOn,
        firstPublishedOn: expect.toBeDateString(),
        lastPublishedOn: expect.toBeDateString(),
        createdBy: item.createdBy,
        values: {
            title: item.values.title,
            body: item.values.body,
            categories: category
                ? [
                      {
                          id: category.id,
                          entryId: category.entryId,
                          modelId: "category",
                          values: {
                              title: category.values.title
                          }
                      }
                  ]
                : [],
            category: category
                ? {
                      id: category.id,
                      entryId: category.entryId,
                      modelId: "category",
                      values: {
                          title: category.values.title
                      }
                  }
                : null
        }
    };
};

describe("entry references", () => {
    const manageOpts = { path: "manage" };
    const readOpts = { path: "read" };

    const mainManager = useGraphQLHandler(manageOpts);
    beforeEach(async () => {
        await setupGroupAndModels({
            manager: mainManager,
            models: ["category", "article"]
        });
    });

    it("should get the published references on entries", async () => {
        const categoryManager = useCategoryManageHandler(manageOpts);
        const articleManager = useArticleManageHandler(manageOpts);
        const articleRead = useArticleReadHandler(readOpts);

        const techCategory = await createCategoryItem({
            manager: categoryManager,
            data: {
                values: {
                    title: "Tech category",
                    slug: "tech-category"
                },
                status: "published"
            }
        });

        const techArticle = await createArticleItem({
            manager: articleManager,
            data: {
                values: {
                    title: "Tech article",
                    body: null,
                    category: {
                        id: techCategory.id,
                        modelId: "category"
                    },
                    categories: [
                        {
                            id: techCategory.id,
                            modelId: "category"
                        }
                    ]
                },
                status: "published"
            }
        });
        const techCategory2 = await createCategoryItem({
            manager: categoryManager,
            from: techCategory,
            data: {
                values: {
                    title: "Tech category 2",
                    slug: "tech-category-2"
                },
                status: "published"
            }
        });

        const techArticle2 = await createArticleItem({
            manager: articleManager,
            data: {
                values: {
                    title: "Tech article 2",
                    body: null,
                    category: {
                        id: techCategory2.id,
                        modelId: "category"
                    },
                    categories: [
                        {
                            id: techCategory2.id,
                            modelId: "category"
                        }
                    ]
                },
                status: "published"
            }
        });

        const techCategory3 = await createCategoryItem({
            manager: categoryManager,
            from: techCategory2,
            data: {
                values: {
                    title: "Tech category 3",
                    slug: "tech-category-3"
                },
                status: "published"
            }
        });

        const techArticle3 = await createArticleItem({
            manager: articleManager,
            data: {
                values: {
                    title: "Tech article 3",
                    body: null,
                    category: {
                        id: techCategory3.id,
                        modelId: "category"
                    },
                    categories: [
                        {
                            id: techCategory3.id,
                            modelId: "category"
                        }
                    ]
                },
                status: "published"
            }
        });

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
                        values: {
                            ...techArticle.values,
                            /**
                             * This is to prove that category in the loaded article really is the first one created and assigned to the article.
                             */
                            categories: [
                                {
                                    id: techCategory.id,
                                    entryId: techCategory.entryId,
                                    modelId: techCategory.meta.modelId
                                }
                            ]
                        }
                    },
                    error: null
                }
            }
        });
    });

    it("should not break if referenced entry does not exist", async () => {
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
                values: {
                    title: "Tech category",
                    slug: "tech-category"
                },
                status: "published"
            }
        });

        const techArticle = await createArticleItem({
            manager: articleManager,
            data: {
                values: {
                    title: "Tech article",
                    body: null,
                    category: {
                        id: techCategory.id,
                        modelId: "category"
                    },
                    categories: [
                        {
                            id: techCategory.id,
                            modelId: "category"
                        }
                    ]
                },
                status: "published"
            }
        });
        const techCategory2 = await createCategoryItem({
            manager: categoryManager,
            from: techCategory,
            data: {
                values: {
                    title: "Tech category 2",
                    slug: "tech-category-2"
                },
                status: "published"
            }
        });

        const [deleteResponse] = await categoryManager.deleteCategory({
            variables: {
                revision: techCategory.id
            }
        });
        expect(deleteResponse).toEqual({
            data: {
                deleteCategory: {
                    data: true,
                    error: null
                }
            }
        });

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
            variables: {
                revision: techCategory2.id
            }
        });
        expect(delete2Response).toEqual({
            data: {
                deleteCategory: {
                    data: true,
                    error: null
                }
            }
        });

        const [listAfterDeleteManageResponse] = await articleManager.listArticles();
        expect(listAfterDeleteManageResponse).toEqual({
            data: {
                listArticles: {
                    data: [techArticle],
                    meta: {
                        cursor: null,
                        hasMoreItems: false,
                        totalCount: 1
                    },
                    error: null
                }
            }
        });

        const [getAfterDeleteManageResponse] = await articleManager.getArticle({
            revision: techArticle.id
        });
        expect(getAfterDeleteManageResponse).toEqual({
            data: {
                getArticle: {
                    data: techArticle,
                    error: null
                }
            }
        });

        const articleRead2 = useArticleReadHandler(readOpts);

        const [getAfterDelete2ReadResponse] = await articleRead2.getArticle({
            where: {
                id: techArticle.id
            }
        });
        expect(getAfterDelete2ReadResponse).toEqual({
            data: {
                getArticle: {
                    data: extractReadArticle(techArticle),
                    error: null
                }
            }
        });

        const [listAfterDelete2ReadResponse] = await articleRead2.listArticles();
        expect(listAfterDelete2ReadResponse).toEqual({
            data: {
                listArticles: {
                    data: [extractReadArticle(techArticle)],
                    meta: {
                        cursor: null,
                        hasMoreItems: false,
                        totalCount: 1
                    },
                    error: null
                }
            }
        });
    });

    it("should list articles filtered by reference", async () => {
        expect.assertions(12);

        const categoryManager = useCategoryManageHandler(manageOpts);
        const articleManager = useArticleManageHandler(manageOpts);
        const articleReader = useArticleReadHandler(readOpts);

        const techCategory = await createCategoryItem({
            manager: categoryManager,
            data: {
                values: {
                    title: "Tech category",
                    slug: "tech-category"
                },
                status: "published"
            }
        });

        const techArticle = await createArticleItem({
            manager: articleManager,
            data: {
                values: {
                    title: "Tech article",
                    body: null,
                    category: {
                        id: techCategory.id,
                        modelId: "category"
                    },
                    categories: [
                        {
                            id: techCategory.id,
                            modelId: "category"
                        }
                    ]
                },
                status: "published"
            }
        });
        const techCategory2 = await createCategoryItem({
            manager: categoryManager,
            from: techCategory,
            data: {
                values: {
                    title: "Tech category 2",
                    slug: "tech-category-2"
                },
                status: "published"
            }
        });

        const techArticle2 = await createArticleItem({
            manager: articleManager,
            data: {
                values: {
                    title: "Tech article 2",
                    body: null,
                    category: {
                        id: techCategory2.id,
                        modelId: "category"
                    },
                    categories: [
                        {
                            id: techCategory2.id,
                            modelId: "category"
                        }
                    ]
                },
                status: "published"
            }
        });

        const techCategory3 = await createCategoryItem({
            manager: categoryManager,
            from: techCategory2,
            data: {
                values: {
                    title: "Tech category 3",
                    slug: "tech-category-3"
                },
                status: "published"
            }
        });

        const techArticle3 = await createArticleItem({
            manager: articleManager,
            data: {
                values: {
                    title: "Tech article 3",
                    body: null,
                    category: {
                        id: techCategory3.id,
                        modelId: "category"
                    },
                    categories: [
                        {
                            id: techCategory3.id,
                            modelId: "category"
                        }
                    ]
                },
                status: "published"
            }
        });

        const foodCategory = await createCategoryItem({
            manager: categoryManager,
            data: {
                values: {
                    title: "Food category",
                    slug: "food-category"
                },
                status: "published"
            }
        });

        const foodArticle = await createArticleItem({
            manager: articleManager,
            data: {
                values: {
                    title: "Food article",
                    body: null,
                    category: {
                        id: foodCategory.id,
                        modelId: "category"
                    },
                    categories: [
                        {
                            id: foodCategory.id,
                            modelId: "category"
                        }
                    ]
                },
                status: "published"
            }
        });

        const [listArticlesEntryIdResponse] = await articleReader.listArticles({
            where: {
                values: {
                    category: {
                        entryId: techCategory.entryId
                    }
                }
            },
            sort: ["createdOn_ASC"]
        });

        const expectedTechArticles = [
            {
                ...techArticle,
                values: {
                    ...techArticle.values,
                    category: {
                        id: techCategory3.id,
                        entryId: techCategory3.entryId,
                        modelId: "category",
                        values: {
                            title: techCategory3.values.title
                        }
                    },
                    categories: [
                        {
                            id: techCategory3.id,
                            entryId: techCategory3.entryId,
                            modelId: "category",
                            values: {
                                title: techCategory3.values.title
                            }
                        }
                    ]
                },
                meta: undefined
            },
            {
                ...techArticle2,
                values: {
                    ...techArticle2.values,
                    category: {
                        id: techCategory3.id,
                        entryId: techCategory3.entryId,
                        modelId: "category",
                        values: {
                            title: techCategory3.values.title
                        }
                    },
                    categories: [
                        {
                            id: techCategory3.id,
                            entryId: techCategory3.entryId,
                            modelId: "category",
                            values: {
                                title: techCategory3.values.title
                            }
                        }
                    ]
                },
                meta: undefined
            },
            {
                ...techArticle3,
                values: {
                    ...techArticle3.values,
                    category: {
                        id: techCategory3.id,
                        entryId: techCategory3.entryId,
                        modelId: "category",
                        values: {
                            title: techCategory3.values.title
                        }
                    },
                    categories: [
                        {
                            id: techCategory3.id,
                            entryId: techCategory3.entryId,
                            modelId: "category",
                            values: {
                                title: techCategory3.values.title
                            }
                        }
                    ]
                },
                meta: undefined
            }
        ];

        expect(listArticlesEntryIdResponse).toEqual({
            data: {
                listArticles: {
                    data: expectedTechArticles,
                    meta: {
                        hasMoreItems: false,
                        totalCount: 3,
                        cursor: null
                    },
                    error: null
                }
            }
        });

        const [listArticlesEntryIdWrongResponse] = await articleReader.listArticles({
            where: {
                values: {
                    category: {
                        entryId: techCategory.id
                    }
                }
            },
            sort: ["createdOn_ASC"]
        });
        expect(listArticlesEntryIdWrongResponse).toEqual({
            data: {
                listArticles: {
                    data: [],
                    meta: {
                        hasMoreItems: false,
                        totalCount: 0,
                        cursor: null
                    },
                    error: null
                }
            }
        });

        const [listArticlesIdWrongResponse] = await articleReader.listArticles({
            where: {
                values: {
                    category: {
                        id: techCategory.entryId
                    }
                }
            },
            sort: ["createdOn_ASC"]
        });
        expect(listArticlesIdWrongResponse).toEqual({
            data: {
                listArticles: {
                    data: [],
                    meta: {
                        hasMoreItems: false,
                        totalCount: 0,
                        cursor: null
                    },
                    error: null
                }
            }
        });

        const [listArticlesEntryIdInResponse] = await articleReader.listArticles({
            where: {
                values: {
                    category: {
                        entryId_in: [techCategory.entryId]
                    }
                }
            },
            sort: ["createdOn_ASC"]
        });

        expect(listArticlesEntryIdInResponse).toEqual({
            data: {
                listArticles: {
                    data: expectedTechArticles,
                    meta: {
                        hasMoreItems: false,
                        totalCount: 3,
                        cursor: null
                    },
                    error: null
                }
            }
        });

        const [listArticlesIdResponse] = await articleReader.listArticles({
            where: {
                values: {
                    category: {
                        id: techCategory.id
                    }
                }
            },
            sort: ["createdOn_ASC"]
        });

        expect(listArticlesIdResponse).toEqual({
            data: {
                listArticles: {
                    data: [expectedTechArticles[0]],
                    meta: {
                        hasMoreItems: false,
                        totalCount: 1,
                        cursor: null
                    },
                    error: null
                }
            }
        });

        const [listArticlesIdInResponse] = await articleReader.listArticles({
            where: {
                values: {
                    category: {
                        id_in: [techCategory.id]
                    }
                }
            },
            sort: ["createdOn_ASC"]
        });

        expect(listArticlesIdInResponse).toEqual({
            data: {
                listArticles: {
                    data: [expectedTechArticles[0]],
                    meta: {
                        hasMoreItems: false,
                        totalCount: 1,
                        cursor: null
                    },
                    error: null
                }
            }
        });

        const [listArticlesFoodResponse] = await articleReader.listArticles({
            where: {
                values: {
                    category: {
                        entryId: foodCategory.entryId
                    }
                }
            },
            sort: ["createdOn_ASC"]
        });

        expect(listArticlesFoodResponse).toEqual({
            data: {
                listArticles: {
                    data: [
                        {
                            ...foodArticle,
                            values: {
                                ...foodArticle.values,
                                category: {
                                    id: foodCategory.id,
                                    entryId: foodCategory.entryId,
                                    modelId: "category",
                                    values: {
                                        title: foodCategory.values.title
                                    }
                                },
                                categories: [
                                    {
                                        id: foodCategory.id,
                                        entryId: foodCategory.entryId,
                                        modelId: "category",
                                        values: {
                                            title: foodCategory.values.title
                                        }
                                    }
                                ]
                            },
                            meta: undefined
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
         * Filtering on list field
         */

        const [listArticlesFoodMultipleEntryIdResponse] = await articleReader.listArticles({
            where: {
                values: {
                    categories: {
                        entryId: foodCategory.entryId
                    }
                }
            },
            sort: ["createdOn_ASC"]
        });

        expect(listArticlesFoodMultipleEntryIdResponse).toEqual({
            data: {
                listArticles: {
                    data: [
                        {
                            ...foodArticle,
                            values: {
                                ...foodArticle.values,
                                category: {
                                    id: foodCategory.id,
                                    entryId: foodCategory.entryId,
                                    modelId: "category",
                                    values: {
                                        title: foodCategory.values.title
                                    }
                                },
                                categories: [
                                    {
                                        id: foodCategory.id,
                                        entryId: foodCategory.entryId,
                                        modelId: "category",
                                        values: {
                                            title: foodCategory.values.title
                                        }
                                    }
                                ]
                            },
                            meta: undefined
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

        const [listArticlesFoodMultipleIdResponse] = await articleReader.listArticles({
            where: {
                values: {
                    categories: {
                        id: foodCategory.id
                    }
                }
            },
            sort: ["createdOn_ASC"]
        });

        expect(listArticlesFoodMultipleIdResponse).toEqual({
            data: {
                listArticles: {
                    data: [
                        {
                            ...foodArticle,
                            values: {
                                ...foodArticle.values,
                                category: {
                                    id: foodCategory.id,
                                    entryId: foodCategory.entryId,
                                    modelId: "category",
                                    values: {
                                        title: foodCategory.values.title
                                    }
                                },
                                categories: [
                                    {
                                        id: foodCategory.id,
                                        entryId: foodCategory.entryId,
                                        modelId: "category",
                                        values: {
                                            title: foodCategory.values.title
                                        }
                                    }
                                ]
                            },
                            meta: undefined
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

        const [listArticlesMultipleEntryIdInResponse] = await articleReader.listArticles({
            where: {
                values: {
                    categories: {
                        entryId_in: [techCategory.entryId]
                    }
                }
            },
            sort: ["createdOn_ASC"]
        });

        expect(listArticlesMultipleEntryIdInResponse).toEqual({
            data: {
                listArticles: {
                    data: expectedTechArticles,
                    meta: {
                        hasMoreItems: false,
                        totalCount: 3,
                        cursor: null
                    },
                    error: null
                }
            }
        });

        const [listArticlesMultipleEntryIdWrongResponse] = await articleReader.listArticles({
            where: {
                values: {
                    categories: {
                        entryId_in: [techCategory.id]
                    }
                }
            },
            sort: ["createdOn_ASC"]
        });

        expect(listArticlesMultipleEntryIdWrongResponse).toEqual({
            data: {
                listArticles: {
                    data: [],
                    meta: {
                        hasMoreItems: false,
                        totalCount: 0,
                        cursor: null
                    },
                    error: null
                }
            }
        });

        const [listArticlesMultipleIdWrongResponse] = await articleReader.listArticles({
            where: {
                values: {
                    categories: {
                        id_in: [techCategory.entryId]
                    }
                }
            },
            sort: ["createdOn_ASC"]
        });

        expect(listArticlesMultipleIdWrongResponse).toEqual({
            data: {
                listArticles: {
                    data: [],
                    meta: {
                        hasMoreItems: false,
                        totalCount: 0,
                        cursor: null
                    },
                    error: null
                }
            }
        });
    });

    it("should not populate referenced field", async () => {
        const categoryManager = useCategoryManageHandler(manageOpts);
        const articleManager = useArticleManageHandler(manageOpts);
        const articleRead = useArticleReadHandler(readOpts);

        const techCategory = await createCategoryItem({
            manager: categoryManager,
            data: {
                values: {
                    title: "Tech category",
                    slug: "tech-category"
                },
                status: "published"
            }
        });

        const techArticle = await createArticleItem({
            manager: articleManager,
            data: {
                values: {
                    title: "Tech article",
                    body: null,
                    category: {
                        id: techCategory.id,
                        modelId: "category"
                    },
                    categories: [
                        {
                            id: techCategory.id,
                            modelId: "category"
                        }
                    ]
                },
                status: "published"
            }
        });

        const [result] = await articleRead.listArticlesWithoutReferences();

        expect(result).toMatchObject({
            data: {
                listArticles: {
                    data: [
                        {
                            id: techArticle.id,
                            values: {
                                title: techArticle.values.title,
                                category: {
                                    id: techCategory.id,
                                    entryId: techCategory.entryId,
                                    modelId: "category",
                                    values: null
                                },
                                categories: [
                                    {
                                        id: techCategory.id,
                                        entryId: techCategory.entryId,
                                        modelId: "category",
                                        values: null
                                    }
                                ]
                            }
                        }
                    ],
                    error: null,
                    meta: {
                        cursor: null,
                        hasMoreItems: false,
                        totalCount: 1
                    }
                }
            }
        });
    });

    /**
     * Test is commented because we do not have access to the data loaders in the storage operations.
     */
    /*
    it("should not produce multiple requests to the database when loading references", async () => {
        const group = await setupContentModelGroup(mainManager);
        await setupContentModels(mainManager, group, ["category", "article"]);
        const categoryManager = useCategoryManageHandler(manageOpts);
        const articleManager = useArticleManageHandler({
            ...manageOpts,
            plugins: []
        });
        const articleRead = useArticleReadHandler({
            ...readOpts
        });
        const techCategory = await createCategoryItem({
            manager: categoryManager,
            data: {
                title: "Tech category",
                slug: "tech-category"
            },
            publish: true
        });
        const totalCount = 10;
        for (let current = 1; current <= totalCount; current++) {
            await createArticleItem({
                manager: articleManager,
                data: {
                    title: `Tech article #${current}`,
                    body: null,
                    category: {
                        id: techCategory.id,
                        modelId: "category"
                    }
                },
                publish: true
            });
        }
        const [result] = await articleRead.listArticles({
            limit: 1000
        });
        expect(result.data.listArticles.data).toHaveLength(totalCount);
        expect(result).toMatchObject({
            data: {
                listArticles: {
                    meta: {
                        hasMoreItems: false,
                        totalCount,
                        cursor: null
                    },
                    error: null
                }
            }
        });
    });
    */
});
