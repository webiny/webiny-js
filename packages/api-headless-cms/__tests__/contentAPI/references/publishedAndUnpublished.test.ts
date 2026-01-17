import { beforeEach, describe, expect, it } from "vitest";
import { useCategoryManageHandler } from "../../testHelpers/useCategoryManageHandler";
import { useArticleManageHandler } from "../../testHelpers/useArticleManageHandler";
import { useArticleReadHandler } from "../../testHelpers/useArticleReadHandler";
import { useGraphQLHandler } from "../../testHelpers/useGraphQLHandler";
import { setupGroupAndModels } from "../../testHelpers/setup";
import { GenericRecord } from "@webiny/api/types";
import slugify from "slugify";
import type {
    ICategoryInputValues,
    ICategoryResponseValues
} from "~tests/testHelpers/category/manage/types.js";
import type { IManageQueryBaseResponse } from "~tests/testHelpers/types.js";

interface ICreateCategoryItemPrams {
    manager: ReturnType<typeof useCategoryManageHandler>;
    publish: boolean;
    values: ICategoryInputValues;
}

const createCategoryItem = async ({ manager, publish, values }: ICreateCategoryItemPrams) => {
    const [response] = await manager.createCategory({
        variables: {
            data: {
                values,
                status: publish ? "published" : undefined
            }
        }
    });
    if (response.data.createCategory.error) {
        throw new Error(response.data.createCategory.error.message);
    }
    return response.data.createCategory.data!;
};

interface IArticleValues {
    title: string;
    body: string;
    categories: {
        modelId: string;
        entryId: string;
        id: string;
    }[];
    category: {
        modelId: string;
        entryId: string;
        id: string;
    };
}

interface ICreateArticleItemPrams {
    manager: ReturnType<typeof useArticleManageHandler>;
    publish: boolean;
    values: GenericRecord;
}

const createArticleItem = async ({ manager, publish, values }: ICreateArticleItemPrams) => {
    const [response] = await manager.createArticle({
        data: {
            values,
            status: publish ? "published" : undefined
        }
    });
    if (response.data.createArticle.error) {
        throw new Error(response.data.createArticle.error.message);
    }
    return response.data.createArticle.data! as IManageQueryBaseResponse<IArticleValues>;
};

const categoryNames = ["Tech", "Health", "Space", "Food", "Science", "Sports"];

describe("published and unpublished references", () => {
    const manageOpts = { path: "manage" };
    const readOpts = { path: "read" };

    const manager = useGraphQLHandler(manageOpts);

    beforeEach(async () => {
        await setupGroupAndModels({
            manager,
            models: ["category", "article"]
        });
    });
    

    it("should populate reference field with some published and some unpublished records", async () => {

        const categoryManager = useCategoryManageHandler(manageOpts);
        const articleManager = useArticleManageHandler(manageOpts);
        const articleRead = useArticleReadHandler(readOpts);

        const categories: IManageQueryBaseResponse<ICategoryResponseValues>[] = [];

        for (const index in categoryNames) {
            const title = categoryNames[index];
            const published = Number(index) % 2 === 0;
            const category = await createCategoryItem({
                manager: categoryManager,
                values: {
                    title: title,
                    slug: slugify(title)
                },
                publish: published
            });
            categories.push(category);
        }
        expect(categories.length).toBe(categoryNames.length);

        const firstUnpublishedCategoryId = categories.find(c => c.meta.status !== "published")!.id;
        expect(firstUnpublishedCategoryId).toMatch(/^([a-zA-Z0-9]+)#0001$/);
        /**
         * Create an article and make sure all the categories are in it.
         */
        const createdArticle = await createArticleItem({
            manager: articleManager,
            values: {
                title: "Tech article",
                body: null,
                category: {
                    id: firstUnpublishedCategoryId,
                    modelId: "category"
                },
                categories: categories.map(c => {
                    return {
                        id: c.id,
                        modelId: "category"
                    };
                })
            },
            publish: false
        });

        const expectedAllCategories = categories.map(c => {
            return {
                id: c.id,
                entryId: c.entryId,
                modelId: "category"
            };
        });
        const expectedPublishedCategories = categories
            .filter(c => c.meta.status === "published")
            .map(c => {
                return {
                    id: c.id,
                    entryId: c.entryId,
                    modelId: "category"
                };
            });
        expect(expectedAllCategories).toHaveLength(expectedPublishedCategories.length * 2);

        expect(createdArticle.values.categories).toEqual(expectedAllCategories);

        const [articleManageGetResponse] = await articleManager.getArticle({
            revision: createdArticle.id
        });
        expect(articleManageGetResponse?.data?.getArticle?.data?.values?.categories).toEqual(
            expectedAllCategories
        );
        expect(articleManageGetResponse?.data?.getArticle?.data?.values?.category).toMatchObject({
            id: firstUnpublishedCategoryId
        });
        /**
         * Now we can publish the article and check that references are still there.
         */
        const [publishResponse] = await articleManager.publishArticle({
            revision: createdArticle.id
        });
        expect(publishResponse?.data?.publishArticle?.data?.values?.categories).toEqual(
            expectedAllCategories
        );
        expect(publishResponse?.data?.publishArticle?.data?.values?.category).toMatchObject({
            id: firstUnpublishedCategoryId
        });
        /**
         * Now we can read the article, from manage endpoint, and check that references are still there.
         *
         * There must be all the categories present.
         */
        const [articleManageGetPublishedResponse] = await articleManager.getArticle({
            revision: createdArticle.id
        });
        expect(articleManageGetPublishedResponse?.data?.getArticle?.data?.values?.categories).toEqual(
            expectedAllCategories
        );
        expect(articleManageGetPublishedResponse?.data?.getArticle?.data?.values?.category).toMatchObject({
            id: firstUnpublishedCategoryId
        });
        /**
         * And read from the read endpoint...
         *
         * There must be only published categories present.
         */
        const [articleReadGetPublishedResponse] = await articleRead.getArticle({
            where: {
                id: createdArticle.id
            }
        });
        expect(articleReadGetPublishedResponse?.data?.getArticle?.data?.values?.categories).toMatchObject(
            expectedPublishedCategories
        );
        expect(articleReadGetPublishedResponse?.data?.getArticle?.data?.values?.categories).toHaveLength(
            expectedPublishedCategories.length
        );
        expect(articleReadGetPublishedResponse?.data?.getArticle?.data?.values?.category).toBeNull();
    });
});
