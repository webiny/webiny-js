import { CmsContentModelGroupType } from "@webiny/api-headless-cms/types";
import { useContentGqlHandler } from "../utils/useContentGqlHandler";
import models from "./mocks/contentModels";
import { useCategoryManageHandler } from "../utils/useCategoryManageHandler";
import { useCategoryReadHandler } from "../utils/useCategoryReadHandler";

const categoryManagerHelper = async manageOpts => {
    // Use "manage" API to create and publish entries
    const { until, createCategory, publishCategory } = useCategoryManageHandler(manageOpts);

    // Create an entry
    const [firstCategoryResponse] = await createCategory({
        data: { title: "Title 1", slug: "slug-1" }
    });
    const firstCategory = firstCategoryResponse.data.createCategory.data;
    const { id: firstCategoryId } = firstCategory;
    const [secondCategoryResponse] = await createCategory({
        data: { title: "Title 2", slug: "slug-2" }
    });
    const secondCategory = secondCategoryResponse.data.createCategory.data;
    const { id: secondCategoryId } = secondCategory;
    const [thirdCategoryResponse] = await createCategory({
        data: { title: "Title 3", slug: "slug-3" }
    });
    const thirdCategory = thirdCategoryResponse.data.createCategory.data;
    const { id: thirdCategoryId } = thirdCategory;

    // Publish categories so then become available in the "read" API
    await publishCategory({ revision: firstCategoryId });
    await publishCategory({ revision: secondCategoryId });
    await publishCategory({ revision: thirdCategoryId });

    return {
        until,
        firstCategory,
        secondCategory,
        thirdCategory
    };
};

describe("READ - Resolvers", () => {
    let contentModelGroup: CmsContentModelGroupType;

    const esCmsIndex = "root-headless-cms";

    const manageOpts = { path: "manage/en-US" };
    const readOpts = { path: "read/en-US" };

    const {
        elasticSearch,
        createContentModelMutation,
        updateContentModelMutation,
        createContentModelGroupMutation
    } = useContentGqlHandler(manageOpts);

    beforeEach(async () => {
        try {
            await elasticSearch.indices.create({ index: esCmsIndex });
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

        if (create.errors) {
            console.error(`[beforeEach] ${create.errors[0].message}`);
            process.exit(1);
        }

        const [update] = await updateContentModelMutation({
            modelId: create.data.createContentModel.data.modelId,
            data: {
                fields: category.fields,
                layout: category.layout
            }
        });

        if (update.errors) {
            console.error(`[beforeEach] ${update.errors[0].message}`);
            process.exit(1);
        }
    });

    afterEach(async () => {
        try {
            await elasticSearch.indices.delete({ index: esCmsIndex });
        } catch (e) {}
    });

    test("should return a record by id", async () => {
        // Use "manage" API to create and publish entries
        const { until, createCategory, publishCategory } = useCategoryManageHandler(manageOpts);

        // Create an entry
        const [create] = await createCategory({ data: { title: "Title 1", slug: "slug-1" } });
        const category = create.data.createCategory.data;
        const { id: categoryId } = category;

        // Publish it so it becomes available in the "read" API
        await publishCategory({ revision: categoryId });

        // See if entries are available via "read" API
        const { getCategory } = useCategoryReadHandler(readOpts);

        // If this `until` resolves successfully, we know entry is accessible via the "read" API
        const result = await until(
            () =>
                getCategory({
                    where: {
                        id: categoryId
                    }
                }).then(([data]) => data),
            ({ data }) => data.getCategory.data
        );

        expect(result).toEqual({
            data: {
                getCategory: {
                    data: {
                        id: category.id,
                        createdOn: category.createdOn,
                        savedOn: category.savedOn,
                        title: category.title,
                        slug: category.slug
                    },
                    error: null
                }
            }
        });
    });

    test(`should return a NOT_FOUND error when getting an entry by non-existing ID`, async () => {
        const { getCategory } = useCategoryReadHandler(readOpts);

        const [response] = await getCategory({
            where: {
                id: "nonExistingCategoryId"
            }
        });

        expect(response.data.getCategory).toMatchObject({
            data: null,
            error: {
                code: "NOT_FOUND"
            }
        });
    });

    test(`should return a list of published entries (no parameters)`, async () => {
        // Use "manage" API to create and publish entries
        const { until, createCategory, publishCategory } = useCategoryManageHandler(manageOpts);

        // Create an entry
        const [create] = await createCategory({ data: { title: "Title 1", slug: "slug-1" } });
        const { id } = create.data.createCategory.data;

        // Publish it so it becomes available in the "read" API
        await publishCategory({ revision: id });

        // See if entries are available via "read" API
        const { listCategories } = useCategoryReadHandler(readOpts);

        // If this `until` resolves successfully, we know entry is accessible via the "read" API
        await until(
            () => listCategories().then(([data]) => data),
            ({ data }) => data.listCategories.data[0].id === id
        );
    });

    test(`list entries (limit)`, async () => {
        // create categories and return until from manage handler
        const { until, secondCategory, thirdCategory } = await categoryManagerHelper(manageOpts);

        // See if entries are available via "read" API
        const { listCategories } = useCategoryReadHandler(readOpts);

        // If this `until` resolves successfully, we know entry is accessible via the "read" API
        const result = await until(
            () =>
                listCategories({
                    limit: 2
                }).then(([data]) => data),
            ({ data }) => data.listCategories.data.length === 2
        );

        expect(result).toMatchObject({
            data: {
                listCategories: {
                    data: [
                        {
                            id: thirdCategory.id,
                            createdOn: thirdCategory.createdOn,
                            savedOn: thirdCategory.savedOn,
                            slug: thirdCategory.slug,
                            title: thirdCategory.title
                        },
                        {
                            id: secondCategory.id,
                            createdOn: secondCategory.createdOn,
                            savedOn: secondCategory.savedOn,
                            slug: secondCategory.slug,
                            title: secondCategory.title
                        }
                    ],
                    meta: {
                        hasMoreItems: true,
                        totalCount: 3,
                        cursor: /^([a-zA-Z0-9]+)$/
                    },
                    error: null
                }
            }
        });
    });

    test(`list entries (limit + after)`, async () => {
        // create categories and return until from manage handler
        const { until, firstCategory, secondCategory, thirdCategory } = await categoryManagerHelper(
            manageOpts
        );

        const { listCategories } = useCategoryReadHandler(readOpts);

        // we need list with first result because of cursor that we need for later
        const firstResult = await until(
            () =>
                listCategories({
                    limit: 1
                }).then(([data]) => data),
            ({ data }) => data.listCategories.data.length === 1
        );

        expect(firstResult).toMatchObject({
            data: {
                listCategories: {
                    data: [
                        {
                            id: thirdCategory.id,
                            createdOn: thirdCategory.createdOn,
                            savedOn: thirdCategory.savedOn,
                            slug: thirdCategory.slug,
                            title: thirdCategory.title
                        }
                    ],
                    meta: {
                        cursor: /([a-zA-Z0-9]+)/,
                        hasMoreItems: true,
                        totalCount: 3
                    },
                    error: null
                }
            }
        });

        const firstCursor = firstResult.data.listCategories.meta.cursor;

        // If this `until` resolves successfully, we know entry is accessible via the "read" API
        const secondResult = await until(
            () =>
                listCategories({
                    limit: 1,
                    after: firstCursor
                }).then(([data]) => data),
            ({ data }) => data.listCategories.data.length === 1,
            { name: "list categories after first cursor limit 1" }
        );

        expect(secondResult).toMatchObject({
            data: {
                listCategories: {
                    data: [
                        {
                            id: secondCategory.id,
                            createdOn: secondCategory.createdOn,
                            savedOn: secondCategory.savedOn,
                            slug: secondCategory.slug,
                            title: secondCategory.title
                        }
                    ],
                    meta: {
                        cursor: /([a-zA-Z0-9]+)/,
                        hasMoreItems: true,
                        totalCount: 3
                    },
                    error: null
                }
            }
        });

        const secondCursor = secondResult.data.listCategories.meta.cursor;

        // If this `until` resolves successfully, we know entry is accessible via the "read" API
        const thirdResult = await until(
            () =>
                listCategories({
                    limit: 1,
                    after: secondCursor
                }).then(([data]) => data),
            ({ data }) => data.listCategories.data.length === 1,
            { name: "list categories after second cursor limit 1" }
        );

        expect(thirdResult).toMatchObject({
            data: {
                listCategories: {
                    data: [
                        {
                            id: firstCategory.id,
                            createdOn: firstCategory.createdOn,
                            savedOn: firstCategory.savedOn,
                            slug: firstCategory.slug,
                            title: firstCategory.title
                        }
                    ],
                    meta: {
                        cursor: /([a-zA-Z0-9]+)/,
                        hasMoreItems: false,
                        totalCount: 3
                    },
                    error: null
                }
            }
        });

        // also, when limit 2 with first cursor, there should be 2 categories listed

        // If this `until` resolves successfully, we know entry is accessible via the "read" API
        const fourthResult = await until(
            () =>
                listCategories({
                    limit: 2,
                    after: firstCursor
                }).then(([data]) => data),
            ({ data }) => data.listCategories.data.length === 2,
            { name: "list categories after first cursor limit 2" }
        );
        expect(fourthResult).toMatchObject({
            data: {
                listCategories: {
                    data: [
                        {
                            id: secondCategory.id,
                            createdOn: secondCategory.createdOn,
                            savedOn: secondCategory.savedOn,
                            slug: secondCategory.slug,
                            title: secondCategory.title
                        },
                        {
                            id: firstCategory.id,
                            createdOn: firstCategory.createdOn,
                            savedOn: firstCategory.savedOn,
                            slug: firstCategory.slug,
                            title: firstCategory.title
                        }
                    ],
                    meta: {
                        cursor: /([a-zA-Z0-9]+)/,
                        hasMoreItems: false,
                        totalCount: 3
                    },
                    error: null
                }
            }
        });
    });

    test(`list entries (sort ASC)`, async () => {
        // create categories and return until from manage handler
        const { until, firstCategory, secondCategory, thirdCategory } = await categoryManagerHelper(
            manageOpts
        );

        const { listCategories } = useCategoryReadHandler(readOpts);

        // If this `until` resolves successfully, we know entry is accessible via the "read" API
        const result = await until(
            () =>
                listCategories({
                    sort: ["savedOn_ASC"]
                }).then(([data]) => data),
            ({ data }) => data.listCategories.data.length === 3
        );

        expect(result).toMatchObject({
            data: {
                listCategories: {
                    data: [
                        {
                            id: firstCategory.id,
                            createdOn: firstCategory.createdOn,
                            savedOn: firstCategory.savedOn,
                            slug: firstCategory.slug,
                            title: firstCategory.title
                        },
                        {
                            id: secondCategory.id,
                            createdOn: secondCategory.createdOn,
                            savedOn: secondCategory.savedOn,
                            slug: secondCategory.slug,
                            title: secondCategory.title
                        },
                        {
                            id: thirdCategory.id,
                            createdOn: thirdCategory.createdOn,
                            savedOn: thirdCategory.savedOn,
                            slug: thirdCategory.slug,
                            title: thirdCategory.title
                        }
                    ],
                    meta: {
                        cursor: /([a-zA-Z0-9]+)/,
                        hasMoreItems: false,
                        totalCount: 3
                    },
                    error: null
                }
            }
        });
    });

    test(`list entries (sort DESC)`, async () => {
        const { listCategories } = useCategoryReadHandler(readOpts);

        const [response] = await listCategories({
            sort: ["title_DESC"]
        });

        expect(response).toEqual({
            data: {
                listCategories: {
                    data: [
                        {
                            title: "Second category"
                        },
                        {
                            title: "First category"
                        }
                    ]
                }
            }
        });
    });

    test("list entries that contains given value", async () => {
        const { listCategories } = useCategoryReadHandler(readOpts);

        const [response] = await listCategories({
            where: {
                // eslint-disable-next-line @typescript-eslint/camelcase
                title_contains: "first"
            }
        });

        expect(response).toEqual({
            data: {
                listCategories: {
                    data: [
                        {
                            title: "First category",
                            slug: "first-category"
                        }
                    ],
                    error: null
                }
            }
        });
    });

    test("list entries that do not contains given value", async () => {
        const { listCategories } = useCategoryReadHandler(readOpts);

        const [response] = await listCategories({
            where: {
                // eslint-disable-next-line @typescript-eslint/camelcase
                title_not_contains: "first"
            }
        });

        expect(response).toEqual({
            data: {
                listCategories: {
                    data: [
                        {
                            title: "Second category",
                            slug: "second-category"
                        }
                    ],
                    error: null
                }
            }
        });
    });

    test("list entries that are in given values", async () => {
        const { listCategories } = useCategoryReadHandler(readOpts);

        const [response] = await listCategories({
            where: {
                // eslint-disable-next-line @typescript-eslint/camelcase
                slug_in: ["first-category"]
            }
        });

        expect(response).toEqual({
            data: {
                listCategories: {
                    data: [
                        {
                            title: "First category",
                            slug: "first-category"
                        }
                    ],
                    error: null
                }
            }
        });
    });

    test("list entries that are not in given values", async () => {
        const { listCategories } = useCategoryReadHandler(readOpts);

        const [response] = await listCategories({
            where: {
                // eslint-disable-next-line @typescript-eslint/camelcase
                slug_not_in: ["first-category"]
            }
        });

        expect(response).toEqual({
            data: {
                listCategories: {
                    data: [
                        {
                            title: "Second category",
                            slug: "second-category"
                        }
                    ],
                    error: null
                }
            }
        });
    });
});
