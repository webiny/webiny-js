import { CmsContentModelGroup } from "@webiny/api-headless-cms/types";
import { useContentGqlHandler } from "../utils/useContentGqlHandler";
import models from "./mocks/contentModels";
import { useCategoryManageHandler } from "../utils/useCategoryManageHandler";
import { useCategoryReadHandler } from "../utils/useCategoryReadHandler";
import { useProductManageHandler } from "../utils/useProductManageHandler";

jest.setTimeout(25000);

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
    let contentModelGroup: CmsContentModelGroup;

    const esCmsIndex = "root-headless-cms";

    const manageOpts = { path: "manage/en-US" };
    const readOpts = { path: "read/en-US" };

    const {
        elasticSearch,
        createContentModelMutation,
        updateContentModelMutation,
        createContentModelGroupMutation
    } = useContentGqlHandler(manageOpts);

    const setupModel = async (name: string, group: CmsContentModelGroup) => {
        const targetModel = models.find(m => m.modelId === name);

        // Create initial record
        const [create] = await createContentModelMutation({
            data: {
                name: targetModel.name,
                modelId: targetModel.modelId,
                group: group.id
            }
        });

        if (create.errors) {
            console.error(`[beforeEach] ${create.errors[0].message}`);
            process.exit(1);
        }

        const [update] = await updateContentModelMutation({
            modelId: create.data.createContentModel.data.modelId,
            data: {
                fields: targetModel.fields,
                layout: targetModel.layout
            }
        });

        if (update.errors) {
            console.error(`[beforeEach] ${update.errors[0].message}`);
            process.exit(1);
        }
        return targetModel;
    };

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

        await setupModel("category", contentModelGroup);
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

        expect(response).toEqual({
            data: {
                getCategory: {
                    data: null,
                    error: {
                        code: "NOT_FOUND",
                        message: "Entry not found!",
                        data: null
                    }
                }
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

        expect(response).toEqual({
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
                        cursor: expect.any(String)
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
            ({ data }) => data.listCategories.meta.totalCount === 3,
            { name: "list entries with limit" }
        );

        expect(result).toEqual({
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
                        cursor: expect.any(String)
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

        expect(firstResult).toEqual({
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
                        cursor: expect.any(String),
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

        expect(secondResult).toEqual({
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
                        cursor: expect.any(String),
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

        expect(thirdResult).toEqual({
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
                        cursor: expect.any(String),
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
        expect(fourthResult).toEqual({
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
                        cursor: expect.any(String),
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

        expect(result).toEqual({
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
                        cursor: expect.any(String),
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

        expect(result).toEqual({
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
                        cursor: expect.any(String),
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
                        title_contains: "*NIMal*"
                    }
                }).then(([data]) => data),
            ({ data }) => data.listCategories.data[0].id === animals.id
        );

        expect(result).toEqual({
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
                        cursor: expect.any(String),
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
                        title_not_contains: "fruits"
                    }
                }).then(([data]) => data),
            ({ data }) => data.listCategories.data.length === 2
        );

        expect(result).toEqual({
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
                        cursor: expect.any(String),
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
                        slug_in: [vegetables.slug, animals.slug]
                    }
                }).then(([data]) => data),
            ({ data }) => data.listCategories.data.length === 2
        );

        expect(result).toEqual({
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
                        cursor: expect.any(String),
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
                        slug_not_in: [vegetables.slug, animals.slug]
                    }
                }).then(([data]) => data),
            ({ data }) => data.listCategories.data.length === 1
        );

        expect(result).toEqual({
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
                        cursor: expect.any(String),
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
                        createdOn_gt: date
                    },
                    sort: ["createdOn_ASC"]
                }).then(([data]) => data),
            ({ data }) => data.listCategories.data.length === 3
        );

        expect(result).toEqual({
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
                        cursor: expect.any(String),
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
                        createdOn_gte: animals.createdOn
                    },
                    sort: ["createdOn_ASC"]
                }).then(([data]) => data),
            ({ data }) => data.listCategories.data.length === 1
        );

        expect(result).toEqual({
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
                        cursor: expect.any(String),
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
                        createdOn_lt: date
                    },
                    sort: ["createdOn_ASC"]
                }).then(([data]) => data),
            ({ data }) => Array.isArray(data.listCategories.data)
        );

        expect(result).toEqual({
            data: {
                listCategories: {
                    data: [],
                    meta: {
                        cursor: null,
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
                        savedOn_lte: vegetables.savedOn
                    },
                    sort: ["savedOn_ASC"]
                }).then(([data]) => data),
            ({ data }) => data.listCategories.data.length === 2
        );

        expect(result).toEqual({
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
                        cursor: expect.any(String),
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
                        savedOn_not_between: [from, to]
                    },
                    sort: ["savedOn_ASC"]
                }).then(([data]) => data),
            ({ data }) => data.listCategories.data.length === 2
        );

        expect(result).toEqual({
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
                        cursor: expect.any(String),
                        hasMoreItems: false,
                        totalCount: 2
                    },
                    error: null
                }
            }
        });
    });

    test("list entries that have price in given range", async () => {
        await setupModel("product", contentModelGroup);

        const { vegetables } = await categoryManagerHelper({
            ...manageOpts
        });
        const { createProduct, listProducts, until } = useProductManageHandler({
            ...manageOpts
        });

        await createProduct({
            data: {
                title: "Potato",
                price: 100.05,
                availableOn: "2020-12-25",
                color: "white",
                availableSizes: ["s", "m"],
                image: "potato.jpg",
                category: {
                    modelId: "category",
                    entryId: vegetables.id
                }
            }
        });

        await createProduct({
            data: {
                title: "Carrot",
                price: 98,
                availableOn: "2020-12-25",
                color: "white",
                availableSizes: ["m"],
                image: "orange.jpg",
                category: {
                    modelId: "category",
                    entryId: vegetables.id
                }
            }
        });

        await createProduct({
            data: {
                title: "Korn",
                price: 99.1,
                availableOn: "2020-12-25",
                color: "white",
                availableSizes: ["m"],
                image: "korn.jpg",
                category: {
                    modelId: "category",
                    entryId: vegetables.id
                }
            }
        });

        // Wait until the previous revision is indexed in Elastic as "latest"
        await until(
            () =>
                listProducts({
                    where: {}
                }).then(([data]) => data),
            ({ data }) => data.listProducts.data.length === 3,
            { name: "list all products in vegetables categories", tries: 10 }
        );

        const [response] = await listProducts({
            where: {
                price_gte: 99,
                price_lte: 107.99
            }
        });

        expect(response).toEqual({
            data: {
                listProducts: {
                    data: expect.any(Array),
                    meta: {
                        cursor: expect.any(String),
                        hasMoreItems: false,
                        totalCount: 2
                    },
                    error: null
                }
            }
        });
    });
});
