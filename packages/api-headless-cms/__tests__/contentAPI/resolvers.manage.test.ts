/* eslint-disable */
import { CmsContentModelGroupType } from "@webiny/api-headless-cms/types";
import { useContentGqlHandler } from "../utils/useContentGqlHandler";
import { useCategoryHandler } from "../utils/useCategoryHandler";
import models from "./mocks/contentModels";

describe("MANAGE - Resolvers", () => {
    let contentModelGroup: CmsContentModelGroupType;

    const esCmsIndex = "root-headless-cms";

    const handlerOpts = { path: "manage/en-US" };

    const {
        sleep,
        elasticSearch,
        createContentModelMutation,
        updateContentModelMutation,
        createContentModelGroupMutation
    } = useContentGqlHandler(handlerOpts);

    beforeEach(async () => {
        try {
            await elasticSearch.indices.create({ index: "root-headless-cms" });
        } catch {
            // Ignore errors
        }

        const [createCMG] = await createContentModelGroupMutation({
            data: {
                name: "Group",
                slug: "group",
                icon: "ico/ico",
                description: "description"
            }
        });
        contentModelGroup = createCMG.data.createContentModelGroup.data;

        const category = models.find(m => m.modelId === "category");

        // Create initial record
        const [create] = await createContentModelMutation({
            data: {
                name: category.name,
                modelId: category.modelId,
                group: contentModelGroup.id
            }
        });

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const [update] = await updateContentModelMutation({
            id: create.data.createContentModel.data.id,
            data: {
                fields: category.fields,
                layout: category.layout
            }
        });

        await sleep(300);
    });

    afterEach(async () => {
        try {
            await elasticSearch.indices.delete({ index: esCmsIndex });
        } catch (e) {}
    });

    test.skip(`get category`, async () => {
        const { createCategory, getCategory } = useCategoryHandler(handlerOpts);
        const [create] = await createCategory({ data: { title: "Hardware", slug: "hardware" } });
        const { id } = create.data.createCategory.data;

        const [get] = await getCategory({ where: { id } });
        
        expect(get.data.getCategory.data).toMatchObject({
            id,
            createdOn: /^20/,
            savedOn: /^20/,
            title: "Hardware",
            slug: "hardware",
            meta: {
                title: "Hardware",
                modelId: "category",
                version: 1,
                locked: false,
                publishedOn: null,
                status: "draft",
                revisions: [
                    {
                        id: expect.any(String),
                        title: "Hardware",
                        slug: "hardware"
                    }
                ]
            }
        });
        
        // TODO: test all other querying possibilities (by title, by slug)
    });

    test.skip(`list categories (no parameters)`, async () => {
        // Test resolvers
        const query = /* GraphQL */ `
            {
                listCategories {
                    data {
                        id
                        title
                        slug
                    }
                    error {
                        message
                    }
                }
            }
        `;
    });

    test.skip(`list entries (limit)`, async () => {
        const query = /* GraphQL */ `
            {
                listCategories(limit: 1) {
                    data {
                        id
                    }
                }
            }
        `;
    });

    test.skip(`list categories (sort ASC)`, async () => {
        // Test resolvers
        const query = /* GraphQL */ `
            query ListCategories($sort: [CategoryListSorter]) {
                listCategories(sort: $sort) {
                    data {
                        title
                    }
                }
            }
        `;
    });

    test.skip(`list categories (sort DESC)`, async () => {
        // Test resolvers
        const query = /* GraphQL */ `
            query ListCategories($sort: [CategoryListSorter]) {
                listCategories(sort: $sort) {
                    data {
                        title
                    }
                }
            }
        `;
    });

    test.skip(`list categories (contains, not_contains, in, not_in)`, async () => {
        // Test resolvers
        const query = /* GraphQL */ `
            query ListCategories($where: CategoryListWhereInput) {
                listCategories(where: $where) {
                    data {
                        title
                    }
                    error {
                        message
                    }
                }
            }
        `;
    });

    test(`create category`, async () => {
        const { createCategory } = useCategoryHandler(handlerOpts);
        const [result] = await createCategory({ data: { title: "Hardware", slug: "hardware" } });

        expect(result.data.createCategory.data).toMatchObject({
            id: expect.any(String),
            createdOn: /^20/,
            savedOn: /^20/,
            title: "Hardware",
            slug: "hardware",
            meta: {
                title: "Hardware",
                modelId: "category",
                version: 1,
                locked: false,
                publishedOn: null,
                status: "draft",
                revisions: [
                    {
                        id: expect.any(String),
                        title: "Hardware",
                        slug: "hardware"
                    }
                ]
            }
        });
    });

    test(`create category revision`, async () => {
        const { createCategory, createCategoryFrom } = useCategoryHandler(handlerOpts);
        const [create] = await createCategory({ data: { title: "Hardware", slug: "hardware" } });

        const { id } = create.data.createCategory.data;

        const [revision] = await createCategoryFrom({ revision: id });

        const newEntry = revision.data.createCategoryFrom.data;
        expect(newEntry).toMatchObject({
            id: expect.any(String),
            title: "Hardware",
            slug: "hardware",
            meta: {
                version: 2
            }
        });

        expect(newEntry.meta.revisions.length).toBe(2);
    });

    test(`update category`, async () => {
        const { createCategory, updateCategory } = useCategoryHandler(handlerOpts);
        const [create] = await createCategory({ data: { title: "Hardware", slug: "hardware" } });

        const { id } = create.data.createCategory.data;

        const [update] = await updateCategory({
            revision: id,
            data: { title: "New title", slug: "hardware-store" }
        });

        expect(update.data.updateCategory.data).toMatchObject({
            id: expect.any(String),
            savedOn: /^20/,
            title: "New title",
            slug: "hardware-store",
            meta: {
                title: "New title"
            }
        });

        const createdOn = new Date(create.data.createCategory.data.savedOn).getTime();
        const updatedOn = new Date(update.data.updateCategory.data.savedOn).getTime();
        expect(createdOn).toBeLessThan(updatedOn);
    });

    // TODO: Finish this when "list" and "get" are working

    test.skip(`delete category`, async () => {
        const {
            until,
            createCategory,
            createCategoryFrom,
            getCategory,
            listCategories,
            deleteCategory
        } = useCategoryHandler(handlerOpts);

        const [revision1] = await createCategory({ data: { title: "Hardware", slug: "hardware" } });

        const { id } = revision1.data.createCategory.data;

        await until(
            () => listCategories().then(([data]) => data),
            ({ data }) => data.listCategories.data.length > 0
        );

        const [revision2] = await createCategoryFrom({ revision: id });
        const { id: id2 } = revision2.data.createCategoryFrom.data;

        const [revision3] = await createCategoryFrom({ revision: id });
        const { id: id3 } = revision3.data.createCategoryFrom.data;

        // Wait until the new revision is indexed in Elastic as "latest"
        await until(
            () => listCategories().then(([data]) => data),
            ({ data }) => data.listCategories.data[0].id === id3
        );

        // Delete latest revision
        await deleteCategory({ id: id3 });

        // Wait until the new revision is indexed in Elastic as "latest"
        await until(
            () => listCategories().then(([data]) => data),
            ({ data }) => data.listCategories.data[0].id === id2
        );

        // Make sure revision #2 is now "latest"
        const [list2] = await listCategories();
        const { data: data2 } = list2.data.listCategories;
        expect(data2.length).toBe(1);
        expect(data2[0].id).toEqual(id2);

        // Delete revision #1; Revision #2 should still be "latest"
        await deleteCategory({ id });

        // Get revision #2 and verify it's the only remaining revision of this form
        const [get] = await getCategory({ where: { id } });
        const { meta } = get.data.getCategory;
        expect(meta.version).toBe(2);
        expect(meta.revisions.length).toBe(1);
        expect(meta.revisions[0].id).toEqual(id2);
    });
});
