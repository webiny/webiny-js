import { CmsContentModelGroupType } from "@webiny/api-headless-cms/types";
import { useContentGqlHandler } from "../utils/useContentGqlHandler";
import models from "./mocks/contentModels";
import { useCategoryManageHandler } from "../utils/useCategoryManageHandler";
import { useCategoryReadHandler } from "../utils/useCategoryReadHandler";

const categoryManagerHelper = async manageOpts => {
    // Use "manage" API to create and publish entries
    const { until, createCategory, publishCategory, sleep } = useCategoryManageHandler(manageOpts);

    const [fruitsResponse] = await createCategory({
        data: {
            title: "Fruits",
            slug: "fruits"
        }
    });
    const fruits = fruitsResponse.data.createCategory.data;
    const [vegetablesResponse] = await createCategory({
        data: {
            title: "Vegetables",
            slug: "vegetables"
        }
    });
    const vegetables = vegetablesResponse.data.createCategory.data;
    const [animalsResponse] = await createCategory({
        data: {
            title: "Animals",
            slug: "animals"
        }
    });
    const animals = animalsResponse.data.createCategory.data;

    // Publish categories so then become available in the "read" API
    await publishCategory({ revision: fruits.id });
    await publishCategory({ revision: vegetables.id });
    await publishCategory({ revision: animals.id });

    return {
        sleep,
        until,
        fruits,
        vegetables,
        animals,
        createCategory,
        publishCategory
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
            await elasticSearch.indices.delete({ index: esCmsIndex });
        } catch (e) {}
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

    test(`list entries`, async () => {
        // Use "manage" API to create and publish entries
        const { until, createCategory, publishCategory } = useCategoryManageHandler(manageOpts);

        // Create an entry
        const [create] = await createCategory({ data: { title: "Title 1", slug: "slug-1" } });
        const category = create.data.createCategory.data;
        const { id } = category;

        // Publish it so it becomes available in the "read" API
        await publishCategory({ revision: id });

        // See if entries are available via "read" API
        const { listCategories } = useCategoryReadHandler(readOpts);

        // If this `until` resolves successfully, we know entry is accessible via the "read" API
        await until(
            () => listCategories().then(([data]) => data),
            ({ data }) => data.listCategories.data.length > 0
        );

        const [response] = await listCategories();

        expect(response).toMatchObject({
            data: {
                listCategories: {
                    data: [
                        {
                            id: category.id,
                            title: category.title,
                            slug: category.slug,
                            createdOn: category.createdOn,
                            savedOn: category.savedOn
                        }
                    ],
                    error: null,
                    meta: {
                        hasMoreItems: false,
                        totalCount: 1,
                        cursor: /^([a-zA-Z0-9]+)$/
                    }
                }
            }
        });
    });

    test(`list entries (limit)`, async () => {
        // create categories and return until from manage handler
        const { until, vegetables, animals } = await categoryManagerHelper(manageOpts);

        // See if entries are available via "read" API
        const { listCategories } = useCategoryReadHandler(readOpts);

        // If this `until` resolves successfully, we know entry is accessible via the "read" API
        const result = await until(
            () =>
                listCategories({
                    limit: 2
                }).then(([data]) => data),
            ({ data }) => data.listCategories.data.length === 2,
            { name: "list entries with limit" }
        );

        expect(result).toMatchObject({
            data: {
                listCategories: {
                    data: [
                        {
                            id: animals.id,
                            createdOn: animals.createdOn,
                            savedOn: animals.savedOn,
                            slug: animals.slug,
                            title: animals.title
                        },
                        {
                            id: vegetables.id,
                            createdOn: vegetables.createdOn,
                            savedOn: vegetables.savedOn,
                            slug: vegetables.slug,
                            title: vegetables.title
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
        const { until, fruits, vegetables, animals } = await categoryManagerHelper(manageOpts);

        const { listCategories } = useCategoryReadHandler(readOpts);

        // we need list with first result because of cursor that we need for later
        const firstResult = await until(
            () =>
                listCategories({
                    limit: 1
                }).then(([data]) => data),
            ({ data }) => data.listCategories.data[0].id === animals.id,
            { name: "list entries with limit after" }
        );

        expect(firstResult).toMatchObject({
            data: {
                listCategories: {
                    data: [
                        {
                            id: animals.id,
                            createdOn: animals.createdOn,
                            savedOn: animals.savedOn,
                            slug: animals.slug,
                            title: animals.title
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
            { name: "list categories after first cursor with limit" }
        );

        expect(secondResult).toMatchObject({
            data: {
                listCategories: {
                    data: [
                        {
                            id: vegetables.id,
                            createdOn: vegetables.createdOn,
                            savedOn: vegetables.savedOn,
                            slug: vegetables.slug,
                            title: vegetables.title
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
            { name: "list categories after second cursor with limit" }
        );

        expect(thirdResult).toMatchObject({
            data: {
                listCategories: {
                    data: [
                        {
                            id: fruits.id,
                            createdOn: fruits.createdOn,
                            savedOn: fruits.savedOn,
                            slug: fruits.slug,
                            title: fruits.title
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
            { name: "list categories after first cursor with limit" }
        );
        expect(fourthResult).toMatchObject({
            data: {
                listCategories: {
                    data: [
                        {
                            id: vegetables.id,
                            createdOn: vegetables.createdOn,
                            savedOn: vegetables.savedOn,
                            slug: vegetables.slug,
                            title: vegetables.title
                        },
                        {
                            id: fruits.id,
                            createdOn: fruits.createdOn,
                            savedOn: fruits.savedOn,
                            slug: fruits.slug,
                            title: fruits.title
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
        const { until, fruits, vegetables, animals } = await categoryManagerHelper(manageOpts);

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
                            id: fruits.id,
                            createdOn: fruits.createdOn,
                            savedOn: fruits.savedOn,
                            slug: fruits.slug,
                            title: fruits.title
                        },
                        {
                            id: vegetables.id,
                            createdOn: vegetables.createdOn,
                            savedOn: vegetables.savedOn,
                            slug: vegetables.slug,
                            title: vegetables.title
                        },
                        {
                            id: animals.id,
                            createdOn: animals.createdOn,
                            savedOn: animals.savedOn,
                            slug: animals.slug,
                            title: animals.title
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
        // create categories and return until from manage handler
        const { until, fruits, vegetables, animals } = await categoryManagerHelper(manageOpts);

        const { listCategories } = useCategoryReadHandler(readOpts);

        // If this `until` resolves successfully, we know entry is accessible via the "read" API
        const result = await until(
            () =>
                listCategories({
                    sort: ["title_DESC"]
                }).then(([data]) => data),
            ({ data }) => data.listCategories.data.length === 3,
            { name: "list entries by title DESC" }
        );

        expect(result).toMatchObject({
            data: {
                listCategories: {
                    data: [
                        {
                            id: vegetables.id,
                            createdOn: vegetables.createdOn,
                            savedOn: vegetables.savedOn,
                            slug: vegetables.slug,
                            title: vegetables.title
                        },
                        {
                            id: fruits.id,
                            createdOn: fruits.createdOn,
                            savedOn: fruits.savedOn,
                            slug: fruits.slug,
                            title: fruits.title
                        },
                        {
                            id: animals.id,
                            createdOn: animals.createdOn,
                            savedOn: animals.savedOn,
                            slug: animals.slug,
                            title: animals.title
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

    test("list entries that contains given value", async () => {
        // create categories and return until from manage handler
        const { until, animals } = await categoryManagerHelper(manageOpts);

        const { listCategories } = useCategoryReadHandler(readOpts);

        // If this `until` resolves successfully, we know entry is accessible via the "read" API
        const result = await until(
            () =>
                listCategories({
                    where: {
                        // eslint-disable-next-line @typescript-eslint/camelcase
                        title_contains: "*NIMal*"
                    }
                }).then(([data]) => data),
            ({ data }) => data.listCategories.data[0].id === animals.id
        );

        expect(result).toMatchObject({
            data: {
                listCategories: {
                    data: [
                        {
                            id: animals.id,
                            createdOn: animals.createdOn,
                            savedOn: animals.savedOn,
                            slug: animals.slug,
                            title: animals.title
                        }
                    ],
                    meta: {
                        cursor: /([a-zA-Z0-9]+)/,
                        hasMoreItems: false,
                        totalCount: 1
                    },
                    error: null
                }
            }
        });
    });

    test("list entries that do not contains given value", async () => {
        // create categories and return until from manage handler
        const { until, vegetables, animals } = await categoryManagerHelper(manageOpts);

        const { listCategories } = useCategoryReadHandler(readOpts);

        // If this `until` resolves successfully, we know entry is accessible via the "read" API
        const result = await until(
            () =>
                listCategories({
                    where: {
                        // eslint-disable-next-line @typescript-eslint/camelcase
                        title_not_contains: "fruits"
                    }
                }).then(([data]) => data),
            ({ data }) => data.listCategories.data.length === 2
        );

        expect(result).toMatchObject({
            data: {
                listCategories: {
                    data: [
                        {
                            id: animals.id,
                            createdOn: animals.createdOn,
                            savedOn: animals.savedOn,
                            slug: animals.slug,
                            title: animals.title
                        },
                        {
                            id: vegetables.id,
                            createdOn: vegetables.createdOn,
                            savedOn: vegetables.savedOn,
                            slug: vegetables.slug,
                            title: vegetables.title
                        }
                    ],
                    meta: {
                        cursor: /([a-zA-Z0-9]+)/,
                        hasMoreItems: false,
                        totalCount: 2
                    },
                    error: null
                }
            }
        });
    });

    test("list entries that are in given values", async () => {
        // create categories and return until from manage handler
        const { until, vegetables, animals } = await categoryManagerHelper(manageOpts);

        const { listCategories } = useCategoryReadHandler(readOpts);

        // If this `until` resolves successfully, we know entry is accessible via the "read" API
        const result = await until(
            () =>
                listCategories({
                    where: {
                        // eslint-disable-next-line @typescript-eslint/camelcase
                        slug_in: [vegetables.slug, animals.slug]
                    }
                }).then(([data]) => data),
            ({ data }) => data.listCategories.data.length === 2
        );

        expect(result).toMatchObject({
            data: {
                listCategories: {
                    data: [
                        {
                            id: animals.id,
                            createdOn: animals.createdOn,
                            savedOn: animals.savedOn,
                            slug: animals.slug,
                            title: animals.title
                        },
                        {
                            id: vegetables.id,
                            createdOn: vegetables.createdOn,
                            savedOn: vegetables.savedOn,
                            slug: vegetables.slug,
                            title: vegetables.title
                        }
                    ],
                    meta: {
                        cursor: /([a-zA-Z0-9]+)/,
                        hasMoreItems: false,
                        totalCount: 2
                    },
                    error: null
                }
            }
        });
    });

    test("list entries that are not in given values", async () => {
        // create categories and return until from manage handler
        const { until, fruits, vegetables, animals } = await categoryManagerHelper(manageOpts);

        const { listCategories } = useCategoryReadHandler(readOpts);

        // If this `until` resolves successfully, we know entry is accessible via the "read" API
        const result = await until(
            () =>
                listCategories({
                    where: {
                        // eslint-disable-next-line @typescript-eslint/camelcase
                        slug_not_in: [vegetables.slug, animals.slug]
                    }
                }).then(([data]) => data),
            ({ data }) => data.listCategories.data.length === 1
        );

        expect(result).toMatchObject({
            data: {
                listCategories: {
                    data: [
                        {
                            id: fruits.id,
                            createdOn: fruits.createdOn,
                            savedOn: fruits.savedOn,
                            slug: fruits.slug,
                            title: fruits.title
                        }
                    ],
                    meta: {
                        cursor: /([a-zA-Z0-9]+)/,
                        hasMoreItems: false,
                        totalCount: 1
                    },
                    error: null
                }
            }
        });
    });

    test("list entries that are created after given date", async () => {
        // create categories and return until from manage handler
        const { until, fruits, vegetables, animals } = await categoryManagerHelper(manageOpts);

        const { listCategories } = useCategoryReadHandler(readOpts);

        const date = new Date();
        date.setTime(date.getTime() - 86400000);
        // If this `until` resolves successfully, we know entry is accessible via the "read" API
        const result = await until(
            () =>
                listCategories({
                    where: {
                        // eslint-disable-next-line @typescript-eslint/camelcase
                        createdOn_gt: date
                    },
                    sort: ["createdOn_ASC"]
                }).then(([data]) => data),
            ({ data }) => data.listCategories.data.length === 3
        );

        expect(result).toMatchObject({
            data: {
                listCategories: {
                    data: [
                        {
                            id: fruits.id,
                            createdOn: fruits.createdOn,
                            savedOn: fruits.savedOn,
                            slug: fruits.slug,
                            title: fruits.title
                        },
                        {
                            id: vegetables.id,
                            createdOn: vegetables.createdOn,
                            savedOn: vegetables.savedOn,
                            slug: vegetables.slug,
                            title: vegetables.title
                        },
                        {
                            id: animals.id,
                            createdOn: animals.createdOn,
                            savedOn: animals.savedOn,
                            slug: animals.slug,
                            title: animals.title
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

    test("list entries that are created after or at given date: one returned", async () => {
        // create categories and return until from manage handler
        const { until, animals } = await categoryManagerHelper(manageOpts);

        const { listCategories } = useCategoryReadHandler(readOpts);
        // If this `until` resolves successfully, we know entry is accessible via the "read" API
        const result = await until(
            () =>
                listCategories({
                    where: {
                        // eslint-disable-next-line @typescript-eslint/camelcase
                        createdOn_gte: animals.createdOn
                    },
                    sort: ["createdOn_ASC"]
                }).then(([data]) => data),
            ({ data }) => data.listCategories.data.length === 1
        );

        expect(result).toMatchObject({
            data: {
                listCategories: {
                    data: [
                        {
                            id: animals.id,
                            createdOn: animals.createdOn,
                            savedOn: animals.savedOn,
                            slug: animals.slug,
                            title: animals.title
                        }
                    ],
                    meta: {
                        cursor: /([a-zA-Z0-9]+)/,
                        hasMoreItems: false,
                        totalCount: 1
                    },
                    error: null
                }
            }
        });
    });

    test("list entries that are created before given date: none returned", async () => {
        // create categories and return until from manage handler
        const { until } = await categoryManagerHelper(manageOpts);

        const { listCategories } = useCategoryReadHandler(readOpts);

        const date = new Date();
        date.setTime(date.getTime() - 86400000 * 100);
        // If this `until` resolves successfully, we know entry is accessible via the "read" API
        const result = await until(
            () =>
                listCategories({
                    where: {
                        // eslint-disable-next-line @typescript-eslint/camelcase
                        createdOn_lt: date
                    },
                    sort: ["createdOn_ASC"]
                }).then(([data]) => data),
            ({ data }) => Array.isArray(data.listCategories.data)
        );

        expect(result).toMatchObject({
            data: {
                listCategories: {
                    data: [],
                    meta: {
                        cursor: /([a-zA-Z0-9]+)/,
                        hasMoreItems: false,
                        totalCount: 0
                    },
                    error: null
                }
            }
        });
    });

    test("list entries that are created before or at given date: one returned", async () => {
        // create categories and return until from manage handler
        const { until, fruits, vegetables } = await categoryManagerHelper(manageOpts);

        const { listCategories } = useCategoryReadHandler(readOpts);

        // If this `until` resolves successfully, we know entry is accessible via the "read" API
        const result = await until(
            () =>
                listCategories({
                    where: {
                        // eslint-disable-next-line @typescript-eslint/camelcase
                        savedOn_lte: vegetables.savedOn
                    },
                    sort: ["savedOn_ASC"]
                }).then(([data]) => data),
            ({ data }) => data.listCategories.data.length === 2
        );

        expect(result).toMatchObject({
            data: {
                listCategories: {
                    data: [
                        {
                            id: fruits.id,
                            createdOn: fruits.createdOn,
                            savedOn: fruits.savedOn,
                            slug: fruits.slug,
                            title: fruits.title
                        },
                        {
                            id: vegetables.id,
                            createdOn: vegetables.createdOn,
                            savedOn: vegetables.savedOn,
                            slug: vegetables.slug,
                            title: vegetables.title
                        }
                    ],
                    meta: {
                        cursor: /([a-zA-Z0-9]+)/,
                        hasMoreItems: false,
                        totalCount: 2
                    },
                    error: null
                }
            }
        });
    });

    test("list entries that are not created between given dates", async () => {
        // create categories and return until from manage handler
        const { until, fruits, vegetables, animals } = await categoryManagerHelper(manageOpts);

        const { listCategories } = useCategoryReadHandler(readOpts);

        const from = new Date(vegetables.savedOn);
        from.setTime(from.getTime() - 10);
        const to = new Date(vegetables.savedOn);
        to.setTime(to.getTime() + 10);
        // If this `until` resolves successfully, we know entry is accessible via the "read" API
        const result = await until(
            () =>
                listCategories({
                    where: {
                        // eslint-disable-next-line @typescript-eslint/camelcase
                        savedOn_not_between: [from, to]
                    },
                    sort: ["savedOn_ASC"]
                }).then(([data]) => data),
            ({ data }) => data.listCategories.data.length === 2
        );

        expect(result).toMatchObject({
            data: {
                listCategories: {
                    data: [
                        {
                            id: fruits.id,
                            createdOn: fruits.createdOn,
                            savedOn: fruits.savedOn,
                            slug: fruits.slug,
                            title: fruits.title
                        },
                        {
                            id: animals.id,
                            createdOn: animals.createdOn,
                            savedOn: animals.savedOn,
                            slug: animals.slug,
                            title: animals.title
                        }
                    ],
                    meta: {
                        cursor: /([a-zA-Z0-9]+)/,
                        hasMoreItems: false,
                        totalCount: 2
                    },
                    error: null
                }
            }
        });
    });
});
