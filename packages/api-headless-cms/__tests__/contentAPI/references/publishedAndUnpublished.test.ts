import { describe, expect, it } from "vitest";
import { useCategoryManageHandler } from "../../testHelpers/useCategoryManageHandler";
import { useArticleManageHandler } from "../../testHelpers/useArticleManageHandler";
import { useArticleReadHandler } from "../../testHelpers/useArticleReadHandler";
import { useGraphQLHandler } from "../../testHelpers/useGraphQLHandler";
import { setupContentModelGroup, setupContentModels } from "../../testHelpers/setup";
import { GenericRecord } from "@webiny/api/types";
import slugify from "slugify";

interface ICreateCategoryItemPrams {
    manager: ReturnType<typeof useCategoryManageHandler>;
    publish: boolean;
    data: GenericRecord;
}

const createCategoryItem = async ({ manager, publish, data }: ICreateCategoryItemPrams) => {
    const [response] = await manager.createCategory({ data });
    const category = response?.data?.createCategory?.data;
    const error = response?.data?.createCategory?.error;
    if (!category?.id || error) {
        console.log(error.message);
        console.log(JSON.stringify(error.data));
        throw new Error("Could not create category.");
    }
    if (!publish) {
        return category;
    }
    const [publishResponse] = await manager.publishCategory({
        revision: category.id
    });
    if (publishResponse?.data?.publishCategory?.error) {
        console.log(publishResponse?.data?.publishCategory?.error?.message);
        throw new Error("Could not publish category.");
    }
    return publishResponse.data.publishCategory.data;
};

interface ICreateArticleItemPrams {
    manager: ReturnType<typeof useArticleManageHandler>;
    publish: boolean;
    data: GenericRecord;
}

const createArticleItem = async ({ manager, publish, data }: ICreateArticleItemPrams) => {
    const [response] = await manager.createArticle({ data });
    const article = response?.data?.createArticle?.data;
    const error = response?.data?.createArticle?.error;
    if (!article?.id || error) {
        console.log(error.message);
        console.log(JSON.stringify(error.data));
        throw new Error("Could not create article.");
    }
    if (!publish) {
        return article;
    }
    const [publishResponse] = await manager.publishArticle({
        revision: article.id
    });
    if (publishResponse?.data?.publishArticle?.error) {
        console.log(publishResponse?.data?.publishArticle?.error?.message);
        throw new Error("Could not publish article.");
    }
    return publishResponse.data.publishArticle.data;
};

interface ICategoryItem {
    id: string;
    entryId: string;
    title: string;
    slug: string;
    published: boolean;
}

const categoryNames = ["Tech", "Health", "Space", "Food", "Science", "Sports"];

describe("published and unpublished references", () => {
    const manageOpts = { path: "manage" };
    const readOpts = { path: "read" };

    const mainManager = useGraphQLHandler(manageOpts);

    it("should populate reference field with some published and some unpublished records", async () => {
        const group = await setupContentModelGroup(mainManager);
        await setupContentModels(mainManager, group, ["category", "article"]);

        const categoryManager = useCategoryManageHandler(manageOpts);
        const articleManager = useArticleManageHandler(manageOpts);
        const articleRead = useArticleReadHandler(readOpts);

        const categories: ICategoryItem[] = [];

        for (const index in categoryNames) {
            const title = categoryNames[index];
            const published = Number(index) % 2 === 0;
            const category = await createCategoryItem({
                manager: categoryManager,
                data: {
                    title: title,
                    slug: slugify(title)
                },
                publish: published
            });
            categories.push({
                ...category,
                published
            });
        }
        expect(categories.length).toBe(categoryNames.length);

        const firstUnpublishedCategoryId = categories.find(c => !c.published)!.id;
        expect(firstUnpublishedCategoryId).toMatch(/^([a-zA-Z0-9]+)#0001$/);
        /**
         * Create an article and make sure all the categories are in it.
         */
        const createdArticle = await createArticleItem({
            manager: articleManager,
            data: {
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
            .filter(c => c.published)
            .map(c => {
                return {
                    id: c.id,
                    entryId: c.entryId,
                    modelId: "category"
                };
            });
        expect(expectedAllCategories).toHaveLength(expectedPublishedCategories.length * 2);

        expect(createdArticle.categories).toEqual(expectedAllCategories);

        const [articleManageGetResponse] = await articleManager.getArticle({
            revision: createdArticle.id
        });
        expect(articleManageGetResponse?.data?.getArticle?.data?.categories).toEqual(
            expectedAllCategories
        );
        expect(articleManageGetResponse?.data?.getArticle?.data?.category).toMatchObject({
            id: firstUnpublishedCategoryId
        });
        /**
         * Now we can publish the article and check that references are still there.
         */
        const [publishResponse] = await articleManager.publishArticle({
            revision: createdArticle.id
        });
        expect(publishResponse?.data?.publishArticle?.data?.categories).toEqual(
            expectedAllCategories
        );
        expect(publishResponse?.data?.publishArticle?.data?.category).toMatchObject({
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
        expect(articleManageGetPublishedResponse?.data?.getArticle?.data?.categories).toEqual(
            expectedAllCategories
        );
        expect(articleManageGetPublishedResponse?.data?.getArticle?.data?.category).toMatchObject({
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
        expect(articleReadGetPublishedResponse?.data?.getArticle?.data?.categories).toMatchObject(
            expectedPublishedCategories
        );
        expect(articleReadGetPublishedResponse?.data?.getArticle?.data?.categories).toHaveLength(
            expectedPublishedCategories.length
        );
        expect(articleReadGetPublishedResponse?.data?.getArticle?.data?.category).toBeNull();
    });
});
