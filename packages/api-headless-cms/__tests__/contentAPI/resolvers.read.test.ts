import { beforeEach, describe, expect, it, vi } from "vitest";
import { CmsGroup } from "~/types";
import { useCategoryManageHandler } from "../testHelpers/useCategoryManageHandler";
import { useCategoryReadHandler } from "../testHelpers/useCategoryReadHandler";
import { useProductManageHandler } from "../testHelpers/useProductManageHandler";
import { useProductReadHandler } from "../testHelpers/useProductReadHandler";
import { setupGroupAndModels } from "~tests/testHelpers/setup.js";

interface ICreatePermissionsParams {
    groups?: string[];
    models?: string[];
}

const createPermissions = ({ groups, models }: ICreatePermissionsParams) => [
    {
        name: "cms.settings"
    },
    {
        name: "cms.contentModelGroup",
        rwd: "r",
        groups
    },
    {
        name: "cms.contentModel",
        rwd: "r",
        models
    },
    {
        name: "cms.contentEntry",
        rwd: "r"
    },
    {
        name: "cms.endpoint.read"
    },
    {
        name: "cms.endpoint.preview"
    }
];

const categoryManagerHelper = async (manager: ReturnType<typeof useCategoryManageHandler>) => {
    const [fruitsResponse] = await manager.createCategory({
        variables: {
            data: {
                values: {
                    title: "Fruits",
                    slug: "fruits"
                },
                status: "published"
            }
        }
    });
    const fruits = fruitsResponse.data.createCategory.data!;
    const [vegetablesResponse] = await manager.createCategory({
        variables: {
            data: {
                values: {
                    title: "Vegetables",
                    slug: "vegetables"
                },
                status: "published"
            }
        }
    });
    const vegetables = vegetablesResponse.data.createCategory.data!;
    const [animalsResponse] = await manager.createCategory({
        variables: {
            data: {
                values: {
                    title: "Animals",
                    slug: "animals"
                },
                status: "published"
            }
        }
    });
    const animals = animalsResponse.data.createCategory.data!;

    return {
        fruits,
        vegetables,
        animals
    };
};

vi.setConfig({
    testTimeout: 100_000
});

describe.sequential("READ - Resolvers", () => {
    let contentModelGroup: CmsGroup;

    const manageOpts = { path: "manage" };
    const readOpts = { path: "read" };

    const categoryManager = useCategoryManageHandler(manageOpts);

    beforeEach(async () => {
        const result = await setupGroupAndModels({
            manager: categoryManager,
            models: ["category", "product"]
        });
        contentModelGroup = result.group;
    });

    it("should return a record by id", async () => {
        // Use "manage" API to create and publish entries
        const { createCategory, publishCategory } = categoryManager;

        // Create an entry
        const [create] = await createCategory({
            variables: {
                data: {
                    values: {
                        title: "Title 1",
                        slug: "slug-1"
                    }
                }
            }
        });

        expect(create).toEqual({
            data: {
                createCategory: {
                    data: expect.any(Object),
                    error: null
                }
            }
        });

        const category = create.data.createCategory.data!;

        // Publish it so it becomes available in the "read" API
        const [publishResponse] = await publishCategory({
            variables: {
                revision: category.id
            }
        });

        const publishedCategory = publishResponse.data.publishCategory.data!;

        // See if entries are available via "read" API
        const { getCategory } = useCategoryReadHandler(readOpts);

        const [result] = await getCategory({
            where: {
                id: category.id
            }
        });

        expect(result).toEqual({
            data: {
                getCategory: {
                    data: {
                        id: category.id,
                        entryId: category.entryId,
                        createdOn: category.createdOn,
                        savedOn: publishedCategory.savedOn,
                        values: {
                            title: category.values.title,
                            slug: category.values.slug
                        }
                    },
                    error: null
                }
            }
        });
    });

    it(`should return a ENTRY_NOT_FOUND error when getting an entry by non-existing ID`, async () => {
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
                        code: "Cms/Entry/NotFound",
                        message: "Entry was not found!",
                        data: null
                    }
                }
            }
        });
    });

    it(`list entries`, async () => {
        // Use "manage" API to create and publish entries
        const { createCategory, publishCategory } = categoryManager;

        // Create an entry
        const [create] = await createCategory({
            variables: {
                data: {
                    values: {
                        title: "Title 1",
                        slug: "slug-1"
                    }
                }
            }
        });
        const category = create.data.createCategory.data!;

        // Publish it so it becomes available in the "read" API
        const [publishResponse] = await publishCategory({
            variables: {
                revision: category.id
            }
        });

        const publishedCategory = publishResponse.data.publishCategory.data!;

        // See if entries are available via "read" API
        const { listCategories } = useCategoryReadHandler(readOpts);

        const [response] = await listCategories();

        expect(response).toEqual({
            data: {
                listCategories: {
                    data: [
                        {
                            id: category.id,
                            entryId: category.entryId,
                            values: {
                                title: category.values.title,
                                slug: category.values.slug
                            },
                            createdOn: category.createdOn,
                            savedOn: publishedCategory.savedOn
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

    it(`list entries with specific group and model permissions`, async () => {
        // Use "manage" API to create and publish entries
        const { createCategory, publishCategory } = categoryManager;

        // Create an entry
        const [create] = await createCategory({
            variables: {
                data: {
                    values: {
                        title: "Title 1",
                        slug: "slug-1"
                    }
                }
            }
        });
        const category = create.data.createCategory.data!;

        // Publish it so it becomes available in the "read" API
        const [publishedCategoryResponse] = await publishCategory({
            variables: {
                revision: category.id
            }
        });

        const publishedCategory = publishedCategoryResponse.data.publishCategory.data!;

        // See if entries are available via "read" API
        const { listCategories } = useCategoryReadHandler({
            ...readOpts,
            permissions: createPermissions({
                groups: [contentModelGroup.slug],
                models: ["category"]
            })
        });

        const [response] = await listCategories();

        expect(response).toEqual({
            data: {
                listCategories: {
                    data: [
                        {
                            id: category.id,
                            entryId: category.entryId,
                            values: {
                                title: category.values.title,
                                slug: category.values.slug
                            },
                            createdOn: category.createdOn,
                            savedOn: publishedCategory.savedOn
                        }
                    ],
                    error: null,
                    meta: {
                        hasMoreItems: false,
                        totalCount: 1,
                        cursor: null
                    }
                }
            }
        });
    });

    it(`should return an error when getting entry without specific group permissions`, async () => {
        // Use "manage" API to create and publish entries
        const { createCategory, publishCategory } = categoryManager;

        // Create an entry
        const [create] = await createCategory({
            variables: {
                data: {
                    values: {
                        title: "Title 1",
                        slug: "slug-1"
                    }
                }
            }
        });
        const category = create.data.createCategory.data!;

        // Publish it so it becomes available in the "read" API
        await publishCategory({
            variables: {
                revision: category.id
            }
        });

        // See if entries are available via "read" API
        const { getCategory } = useCategoryReadHandler({
            ...readOpts,
            permissions: createPermissions({
                groups: ["someOtherGroupSlug"]
            })
        });

        const [response] = await getCategory({
            where: {
                id: category.id
            }
        });

        expect(response).toMatchObject({
            data: {
                getCategory: {
                    data: null,
                    error: {
                        code: "Cms/Entry/NotAuthorized",
                        message: 'Not allowed to access "category" entries.'
                    }
                }
            }
        });
    });

    it(`should return an error when getting entry without specific model permissions`, async () => {
        // Use "manage" API to create and publish entries
        const { createCategory, publishCategory } = categoryManager;

        // Create an entry
        const [create] = await createCategory({
            variables: {
                data: {
                    values: {
                        title: "Title 1",
                        slug: "slug-1"
                    }
                }
            }
        });
        const category = create.data.createCategory.data!;
        const { id } = category;

        // Publish it so it becomes available in the "read" API
        await publishCategory({
            variables: {
                revision: category.id
            }
        });

        // See if entries are available via "read" API
        const { getCategory } = useCategoryReadHandler({
            ...readOpts,
            permissions: createPermissions({
                models: ["someOtherModelId"]
            })
        });

        const [response] = await getCategory({
            where: { id }
        });

        expect(response).toMatchObject({
            data: {
                getCategory: {
                    data: null,
                    error: {
                        code: "Cms/Entry/NotAuthorized",
                        message: 'Not allowed to access "category" entries.'
                    }
                }
            }
        });
    });

    it(`list entries (limit)`, async () => {
        const { vegetables, animals } = await categoryManagerHelper(categoryManager);

        // See if entries are available via "read" API
        const { listCategories } = useCategoryReadHandler(readOpts);

        const [result] = await listCategories({
            limit: 2
        });

        expect(result).toEqual({
            data: {
                listCategories: {
                    data: [
                        {
                            id: animals.id,
                            entryId: animals.entryId,
                            createdOn: animals.createdOn,
                            savedOn: animals.savedOn,
                            values: {
                                slug: animals.values.slug,
                                title: animals.values.title
                            }
                        },
                        {
                            id: vegetables.id,
                            entryId: vegetables.entryId,
                            createdOn: vegetables.createdOn,
                            savedOn: vegetables.savedOn,
                            values: {
                                slug: vegetables.values.slug,
                                title: vegetables.values.title
                            }
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

    it(`list entries (limit + after)`, async () => {
        const { fruits, vegetables, animals } = await categoryManagerHelper(categoryManager);

        const { listCategories } = useCategoryReadHandler(readOpts);

        // we need list with first result because of cursor that we need for later
        const [firstResult] = await listCategories({
            limit: 1
        });

        expect(firstResult).toEqual({
            data: {
                listCategories: {
                    data: [
                        {
                            id: animals.id,
                            entryId: animals.entryId,
                            createdOn: animals.createdOn,
                            savedOn: animals.savedOn,
                            values: {
                                slug: animals.values.slug,
                                title: animals.values.title
                            }
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

        const [secondResult] = await listCategories({
            limit: 1,
            after: firstCursor
        });

        expect(secondResult).toEqual({
            data: {
                listCategories: {
                    data: [
                        {
                            id: vegetables.id,
                            entryId: vegetables.entryId,
                            createdOn: vegetables.createdOn,
                            savedOn: vegetables.savedOn,
                            values: {
                                slug: vegetables.values.slug,
                                title: vegetables.values.title
                            }
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

        const [thirdResult] = await listCategories({
            limit: 1,
            after: secondCursor
        });

        expect(thirdResult).toEqual({
            data: {
                listCategories: {
                    data: [
                        {
                            id: fruits.id,
                            entryId: fruits.entryId,
                            createdOn: fruits.createdOn,
                            savedOn: fruits.savedOn,
                            values: {
                                slug: fruits.values.slug,
                                title: fruits.values.title
                            }
                        }
                    ],
                    meta: {
                        cursor: null,
                        hasMoreItems: false,
                        totalCount: 3
                    },
                    error: null
                }
            }
        });

        // also, when limit 2 with first cursor, there should be 2 categories listed

        const [fourthResult] = await listCategories({
            limit: 2,
            after: firstCursor
        });
        expect(fourthResult).toEqual({
            data: {
                listCategories: {
                    data: [
                        {
                            id: vegetables.id,
                            entryId: vegetables.entryId,
                            createdOn: vegetables.createdOn,
                            savedOn: vegetables.savedOn,
                            values: {
                                slug: vegetables.values.slug,
                                title: vegetables.values.title
                            }
                        },
                        {
                            id: fruits.id,
                            entryId: fruits.entryId,
                            createdOn: fruits.createdOn,
                            savedOn: fruits.savedOn,
                            values: {
                                slug: fruits.values.slug,
                                title: fruits.values.title
                            }
                        }
                    ],
                    meta: {
                        cursor: null,
                        hasMoreItems: false,
                        totalCount: 3
                    },
                    error: null
                }
            }
        });
    });

    it(`list entries (sort ASC)`, async () => {
        const { fruits, vegetables, animals } = await categoryManagerHelper(categoryManager);

        const { listCategories } = useCategoryReadHandler(readOpts);

        const [result] = await listCategories({
            sort: ["savedOn_ASC"]
        });

        expect(result).toEqual({
            data: {
                listCategories: {
                    data: [
                        {
                            id: fruits.id,
                            entryId: fruits.entryId,
                            createdOn: fruits.createdOn,
                            savedOn: fruits.savedOn,
                            values: {
                                slug: fruits.values.slug,
                                title: fruits.values.title
                            }
                        },
                        {
                            id: vegetables.id,
                            entryId: vegetables.entryId,
                            createdOn: vegetables.createdOn,
                            savedOn: vegetables.savedOn,
                            values: {
                                slug: vegetables.values.slug,
                                title: vegetables.values.title
                            }
                        },
                        {
                            id: animals.id,
                            entryId: animals.entryId,
                            createdOn: animals.createdOn,
                            savedOn: animals.savedOn,
                            values: {
                                slug: animals.values.slug,
                                title: animals.values.title
                            }
                        }
                    ],
                    meta: {
                        cursor: null,
                        hasMoreItems: false,
                        totalCount: 3
                    },
                    error: null
                }
            }
        });
    });

    it(`list entries (sort DESC)`, async () => {
        const { fruits, vegetables, animals } = await categoryManagerHelper(categoryManager);

        const { listCategories } = useCategoryReadHandler(readOpts);

        const [result] = await listCategories({
            sort: ["values_title_DESC"]
        });

        expect(result).toEqual({
            data: {
                listCategories: {
                    data: [
                        {
                            id: vegetables.id,
                            entryId: vegetables.entryId,
                            createdOn: vegetables.createdOn,
                            savedOn: vegetables.savedOn,
                            values: {
                                slug: vegetables.values.slug,
                                title: vegetables.values.title
                            }
                        },
                        {
                            id: fruits.id,
                            entryId: fruits.entryId,
                            createdOn: fruits.createdOn,
                            savedOn: fruits.savedOn,
                            values: {
                                slug: fruits.values.slug,
                                title: fruits.values.title
                            }
                        },
                        {
                            id: animals.id,
                            entryId: animals.entryId,
                            createdOn: animals.createdOn,
                            savedOn: animals.savedOn,
                            values: {
                                slug: animals.values.slug,
                                title: animals.values.title
                            }
                        }
                    ],
                    meta: {
                        cursor: null,
                        hasMoreItems: false,
                        totalCount: 3
                    },
                    error: null
                }
            }
        });
    });

    it("list entries that contains given value", async () => {
        const { animals } = await categoryManagerHelper(categoryManager);

        const { listCategories } = useCategoryReadHandler(readOpts);

        const [result] = await listCategories({
            where: {
                values: {
                    title_contains: "NIMal"
                }
            }
        });

        expect(result).toEqual({
            data: {
                listCategories: {
                    data: [
                        {
                            id: animals.id,
                            entryId: animals.entryId,
                            createdOn: animals.createdOn,
                            savedOn: animals.savedOn,
                            values: {
                                slug: animals.values.slug,
                                title: animals.values.title
                            }
                        }
                    ],
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

    it("list entries that do not contains given value", async () => {
        const { vegetables, animals } = await categoryManagerHelper(categoryManager);

        const { listCategories } = useCategoryReadHandler(readOpts);

        const [result] = await listCategories({
            where: {
                values: {
                    title_not_contains: "fruits"
                }
            }
        });

        expect(result).toEqual({
            data: {
                listCategories: {
                    data: [
                        {
                            id: animals.id,
                            entryId: animals.entryId,
                            createdOn: animals.createdOn,
                            savedOn: animals.savedOn,
                            values: {
                                slug: animals.values.slug,
                                title: animals.values.title
                            }
                        },
                        {
                            id: vegetables.id,
                            entryId: vegetables.entryId,
                            createdOn: vegetables.createdOn,
                            savedOn: vegetables.savedOn,
                            values: {
                                slug: vegetables.values.slug,
                                title: vegetables.values.title
                            }
                        }
                    ],
                    meta: {
                        cursor: null,
                        hasMoreItems: false,
                        totalCount: 2
                    },
                    error: null
                }
            }
        });
    });

    it("list entries that are in given values", async () => {
        const { vegetables, animals } = await categoryManagerHelper(categoryManager);

        const { listCategories } = useCategoryReadHandler(readOpts);

        const [result] = await listCategories({
            where: {
                values: {
                    slug_in: [vegetables.values.slug, animals.values.slug]
                }
            }
        });

        expect(result).toEqual({
            data: {
                listCategories: {
                    data: [
                        {
                            id: animals.id,
                            entryId: animals.entryId,
                            createdOn: animals.createdOn,
                            savedOn: animals.savedOn,
                            values: {
                                slug: animals.values.slug,
                                title: animals.values.title
                            }
                        },
                        {
                            id: vegetables.id,
                            entryId: vegetables.entryId,
                            createdOn: vegetables.createdOn,
                            savedOn: vegetables.savedOn,
                            values: {
                                slug: vegetables.values.slug,
                                title: vegetables.values.title
                            }
                        }
                    ],
                    meta: {
                        cursor: null,
                        hasMoreItems: false,
                        totalCount: 2
                    },
                    error: null
                }
            }
        });
    });

    it("list entries that are not in given values", async () => {
        const { fruits, vegetables, animals } = await categoryManagerHelper(categoryManager);

        const { listCategories } = useCategoryReadHandler(readOpts);

        const [result] = await listCategories({
            where: {
                values: {
                    slug_not_in: [vegetables.values.slug, animals.values.slug]
                }
            }
        });

        expect(result).toEqual({
            data: {
                listCategories: {
                    data: [
                        {
                            id: fruits.id,
                            entryId: fruits.entryId,
                            createdOn: fruits.createdOn,
                            savedOn: fruits.savedOn,
                            values: {
                                slug: fruits.values.slug,
                                title: fruits.values.title
                            }
                        }
                    ],
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

    it("list entries that are created after given date", async () => {
        const { fruits, vegetables, animals } = await categoryManagerHelper(categoryManager);

        const { listCategories } = useCategoryReadHandler(readOpts);

        const date = new Date();
        date.setTime(date.getTime() - 86400000);
        const [result] = await listCategories({
            where: {
                createdOn_gt: date
            },
            sort: ["createdOn_ASC"]
        });

        expect(result).toEqual({
            data: {
                listCategories: {
                    data: [
                        {
                            id: fruits.id,
                            entryId: fruits.entryId,
                            createdOn: fruits.createdOn,
                            savedOn: fruits.savedOn,
                            values: {
                                slug: fruits.values.slug,
                                title: fruits.values.title
                            }
                        },
                        {
                            id: vegetables.id,
                            entryId: vegetables.entryId,
                            createdOn: vegetables.createdOn,
                            savedOn: vegetables.savedOn,
                            values: {
                                slug: vegetables.values.slug,
                                title: vegetables.values.title
                            }
                        },
                        {
                            id: animals.id,
                            entryId: animals.entryId,
                            createdOn: animals.createdOn,
                            savedOn: animals.savedOn,
                            values: {
                                slug: animals.values.slug,
                                title: animals.values.title
                            }
                        }
                    ],
                    meta: {
                        cursor: null,
                        hasMoreItems: false,
                        totalCount: 3
                    },
                    error: null
                }
            }
        });
    });

    it("list entries that are created after or at given date: one returned", async () => {
        const { animals } = await categoryManagerHelper(categoryManager);

        const { listCategories } = useCategoryReadHandler(readOpts);

        const [result] = await listCategories({
            where: {
                createdOn_gte: animals.createdOn
            },
            sort: ["createdOn_ASC"]
        });

        expect(result).toEqual({
            data: {
                listCategories: {
                    data: [
                        {
                            id: animals.id,
                            entryId: animals.entryId,
                            createdOn: animals.createdOn,
                            savedOn: animals.savedOn,
                            values: {
                                slug: animals.values.slug,
                                title: animals.values.title
                            }
                        }
                    ],
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

    it("list entries that are created before given date: none returned", async () => {
        const { listCategories } = useCategoryReadHandler(readOpts);

        const date = new Date();
        date.setTime(date.getTime() - 86400000 * 100);

        const [result] = await listCategories({
            where: {
                createdOn_lt: date
            },
            sort: ["createdOn_ASC"]
        });

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

    it("list entries that are created before or at given date: one returned", async () => {
        const { fruits, vegetables } = await categoryManagerHelper(categoryManager);

        const { listCategories } = useCategoryReadHandler(readOpts);

        const [result] = await listCategories({
            where: {
                savedOn_lte: vegetables.savedOn
            },
            sort: ["savedOn_ASC"]
        });

        expect(result).toEqual({
            data: {
                listCategories: {
                    data: [
                        {
                            id: fruits.id,
                            entryId: fruits.entryId,
                            createdOn: fruits.createdOn,
                            savedOn: fruits.savedOn,
                            values: {
                                slug: fruits.values.slug,
                                title: fruits.values.title
                            }
                        },
                        {
                            id: vegetables.id,
                            entryId: vegetables.entryId,
                            createdOn: vegetables.createdOn,
                            savedOn: vegetables.savedOn,
                            values: {
                                slug: vegetables.values.slug,
                                title: vegetables.values.title
                            }
                        }
                    ],
                    meta: {
                        cursor: null,
                        hasMoreItems: false,
                        totalCount: 2
                    },
                    error: null
                }
            }
        });
    });

    it("list entries that are not created between given dates", async () => {
        const { fruits, vegetables, animals } = await categoryManagerHelper(categoryManager);

        const { listCategories } = useCategoryReadHandler(readOpts);

        const from = new Date(vegetables.savedOn);
        from.setTime(from.getTime() - 5);
        const to = new Date(vegetables.savedOn);
        to.setTime(to.getTime() + 5);

        const [result] = await listCategories({
            where: {
                savedOn_not_between: [from, to]
            },
            sort: ["savedOn_ASC"]
        });

        expect(result).toEqual({
            data: {
                listCategories: {
                    data: [
                        {
                            id: fruits.id,
                            entryId: fruits.entryId,
                            createdOn: fruits.createdOn,
                            savedOn: fruits.savedOn,
                            values: {
                                slug: fruits.values.slug,
                                title: fruits.values.title
                            }
                        },
                        {
                            id: animals.id,
                            entryId: animals.entryId,
                            createdOn: animals.createdOn,
                            savedOn: animals.savedOn,
                            values: {
                                slug: animals.values.slug,
                                title: animals.values.title
                            }
                        }
                    ],
                    meta: {
                        cursor: null,
                        hasMoreItems: false,
                        totalCount: 2
                    },
                    error: null
                }
            }
        });
    });

    it("list entries that have price in given range", async () => {

        const { vegetables } = await categoryManagerHelper(categoryManager);
        const { createProduct, listProducts } = useProductManageHandler({
            ...manageOpts
        });

        const [potatoResponse] = await createProduct({
            data: {
                values: {
                    title: "Potato",
                    price: 100.05,
                    availableOn: "2020-12-25",
                    color: "white",
                    availableSizes: ["s", "m"],
                    image: "potato.jpg",
                    category: {
                        modelId: "category",
                        id: vegetables.id
                    }
                }
            }
        });
        const potato = potatoResponse.data.createProduct.data;

        await createProduct({
            data: {
                values: {
                    title: "Carrot",
                    price: 98,
                    availableOn: "2020-12-25",
                    color: "white",
                    availableSizes: ["m"],
                    image: "orange.jpg",
                    category: {
                        modelId: "category",
                        id: vegetables.id
                    }
                }
            }
        });

        const [kornResponse] = await createProduct({
            data: {
                values: {
                    title: "Korn",
                    price: 99.1,
                    availableOn: "2020-12-25",
                    color: "white",
                    availableSizes: ["m"],
                    image: "korn.jpg",
                    category: {
                        modelId: "category",
                        id: vegetables.id
                    }
                }
            }
        });
        const korn = kornResponse.data.createProduct.data;

        const [response] = await listProducts({
            where: {
                values: {
                    price_gte: 99,
                    price_lte: 107.99
                }
            }
        });

        expect(response).toEqual({
            data: {
                listProducts: {
                    data: [korn, potato],
                    meta: {
                        cursor: null,
                        hasMoreItems: false,
                        totalCount: 2
                    },
                    error: null
                }
            }
        });
    });

    it("sort entries by title", async () => {

        const { vegetables } = await categoryManagerHelper(categoryManager);
        const { createProduct, listProducts } = useProductManageHandler({
            ...manageOpts
        });

        const [potatoResponse] = await createProduct({
            data: {
                values: {
                    title: "Potato",
                    price: 100.05,
                    availableOn: "2020-12-25",
                    color: "white",
                    availableSizes: ["s", "m"],
                    image: "potato.jpg",
                    category: {
                        modelId: "category",
                        id: vegetables.id
                    }
                }
            }
        });

        const [carrotResponse] = await createProduct({
            data: {
                values: {
                    title: "Carrot",
                    price: 98,
                    availableOn: "2020-12-25",
                    color: "white",
                    availableSizes: ["m"],
                    image: "orange.jpg",
                    category: {
                        modelId: "category",
                        id: vegetables.id
                    }
                }
            }
        });

        const [kornResponse] = await createProduct({
            data: {
                values: {
                    title: "Korn",
                    price: 99.1,
                    availableOn: "2020-12-25",
                    color: "white",
                    availableSizes: ["m"],
                    image: "korn.jpg",
                    category: {
                        modelId: "category",
                        id: vegetables.id
                    }
                }
            }
        });

        const potato = potatoResponse.data.createProduct.data;
        const carrot = carrotResponse.data.createProduct.data;
        const korn = kornResponse.data.createProduct.data;

        const [responseAsc] = await listProducts({
            sort: ["values_title_ASC"]
        });

        expect(responseAsc).toEqual({
            data: {
                listProducts: {
                    data: [carrot, korn, potato],
                    meta: {
                        cursor: null,
                        hasMoreItems: false,
                        totalCount: 3
                    },
                    error: null
                }
            }
        });

        const [responseDesc] = await listProducts({
            sort: ["values_title_DESC"]
        });

        expect(responseDesc).toEqual({
            data: {
                listProducts: {
                    data: [potato, korn, carrot],
                    meta: {
                        cursor: null,
                        hasMoreItems: false,
                        totalCount: 3
                    },
                    error: null
                }
            }
        });
    });

    it("should sort products by price", async () => {

        const { vegetables } = await categoryManagerHelper(categoryManager);
        const { createProduct, listProducts } = useProductManageHandler({
            ...manageOpts
        });

        const [potatoResponse] = await createProduct({
            data: {
                values: {
                    title: "Potato",
                    price: 99.9,
                    availableOn: "2020-12-25",
                    color: "white",
                    availableSizes: ["s", "m"],
                    image: "potato.jpg",
                    category: {
                        modelId: "category",
                        id: vegetables.id
                    }
                }
            }
        });

        const [carrotResponse] = await createProduct({
            data: {
                values: {
                    title: "Carrot",
                    price: 500.1,
                    availableOn: "2020-12-25",
                    color: "white",
                    availableSizes: ["m"],
                    image: "orange.jpg",
                    category: {
                        modelId: "category",
                        id: vegetables.id
                    }
                }
            }
        });

        const [kornResponse] = await createProduct({
            data: {
                values: {
                    title: "Korn",
                    price: 300.5,
                    availableOn: "2020-12-25",
                    color: "white",
                    availableSizes: ["m"],
                    image: "korn.jpg",
                    category: {
                        modelId: "category",
                        id: vegetables.id
                    }
                }
            }
        });

        const potato = potatoResponse.data.createProduct.data;
        const carrot = carrotResponse.data.createProduct.data;
        const korn = kornResponse.data.createProduct.data;

        const [responseAsc] = await listProducts({
            sort: ["values_price_ASC"]
        });

        expect(responseAsc).toEqual({
            data: {
                listProducts: {
                    data: [potato, korn, carrot],
                    meta: {
                        cursor: null,
                        hasMoreItems: false,
                        totalCount: 3
                    },
                    error: null
                }
            }
        });

        const [responseDesc] = await listProducts({
            sort: ["values_price_DESC"]
        });

        expect(responseDesc).toEqual({
            data: {
                listProducts: {
                    data: [carrot, korn, potato],
                    meta: {
                        cursor: null,
                        hasMoreItems: false,
                        totalCount: 3
                    },
                    error: null
                }
            }
        });
    });

    it("should store and retrieve nested objects", async () => {

        const { vegetables } = await categoryManagerHelper(categoryManager);

        const { getProduct } = useProductReadHandler({ ...readOpts });

        const {
            createProduct,
            publishProduct,
            getProduct: manageGetProduct
        } = useProductManageHandler({
            ...manageOpts
        });

        const categoryValue = {
            modelId: "category",
            id: vegetables.id
        };

        const [createResponse] = await createProduct({
            data: {
                values: {
                    title: "Potato",
                    price: 99.9,
                    availableOn: "2020-12-25",
                    color: "white",
                    image: "image.png",
                    availableSizes: ["s", "m"],
                    category: categoryValue,
                    variant: {
                        name: "Variant 1",
                        price: 100,
                        category: categoryValue,
                        options: [
                            {
                                name: "Option 1",
                                price: 10,
                                category: categoryValue,
                                categories: [categoryValue]
                            },
                            {
                                name: "Option 2",
                                price: 20,
                                category: categoryValue,
                                categories: [categoryValue]
                            }
                        ]
                    }
                }
            }
        });

        expect(createResponse).toMatchObject({
            data: {
                createProduct: {
                    data: {
                        values: {
                            title: "Potato",
                            price: 99.9,
                            availableOn: "2020-12-25",
                            color: "white",
                            image: "image.png",
                            availableSizes: ["s", "m"],
                            category: {
                                ...categoryValue,
                                entryId: vegetables.entryId
                            },
                            variant: {
                                name: "Variant 1",
                                price: 100,
                                category: {
                                    ...categoryValue,
                                    entryId: vegetables.entryId
                                },
                                options: [
                                    {
                                        name: "Option 1",
                                        price: 10,
                                        category: {
                                            ...categoryValue,
                                            entryId: vegetables.entryId
                                        }
                                    },
                                    {
                                        name: "Option 2",
                                        price: 20,
                                        category: {
                                            ...categoryValue,
                                            entryId: vegetables.entryId
                                        }
                                    }
                                ]
                            }
                        }
                    },
                    error: null
                }
            }
        });

        const potato = createResponse.data.createProduct.data;
        const [getAfterCreateResponse] = await manageGetProduct({
            revision: potato.id
        });

        expect(getAfterCreateResponse).toMatchObject({
            data: {
                getProduct: {
                    data: {
                        id: potato.id,
                        values: {
                            title: "Potato",
                            price: 99.9,
                            availableOn: "2020-12-25",
                            color: "white",
                            image: "image.png",
                            availableSizes: ["s", "m"],
                            category: {
                                ...categoryValue,
                                entryId: vegetables.entryId
                            },
                            variant: {
                                name: "Variant 1",
                                price: 100,
                                category: {
                                    ...categoryValue,
                                    entryId: vegetables.entryId
                                },
                                options: [
                                    {
                                        name: "Option 1",
                                        price: 10,
                                        category: {
                                            ...categoryValue,
                                            entryId: vegetables.entryId
                                        }
                                    },
                                    {
                                        name: "Option 2",
                                        price: 20,
                                        category: {
                                            ...categoryValue,
                                            entryId: vegetables.entryId
                                        }
                                    }
                                ]
                            }
                        }
                    },
                    error: null
                }
            }
        });

        const [publishResponse] = await publishProduct({
            revision: potato.id
        });

        expect(publishResponse).toMatchObject({
            data: {
                publishProduct: {
                    data: {
                        id: potato.id,
                        meta: {
                            status: "published"
                        },
                        values: {
                            title: "Potato",
                            price: 99.9,
                            availableOn: "2020-12-25",
                            color: "white",
                            image: "image.png",
                            availableSizes: ["s", "m"],
                            category: {
                                ...categoryValue,
                                entryId: vegetables.entryId
                            },
                            variant: {
                                name: "Variant 1",
                                price: 100,
                                category: {
                                    ...categoryValue,
                                    entryId: vegetables.entryId
                                },
                                options: [
                                    {
                                        name: "Option 1",
                                        price: 10,
                                        category: {
                                            ...categoryValue,
                                            entryId: vegetables.entryId
                                        },
                                        categories: [
                                            {
                                                ...categoryValue,
                                                entryId: vegetables.entryId
                                            }
                                        ]
                                    },
                                    {
                                        name: "Option 2",
                                        price: 20,
                                        category: {
                                            ...categoryValue,
                                            entryId: vegetables.entryId
                                        },
                                        categories: [
                                            {
                                                ...categoryValue,
                                                entryId: vegetables.entryId
                                            }
                                        ]
                                    }
                                ]
                            }
                        }
                    },
                    error: null
                }
            }
        });

        const [result] = await getProduct({
            where: {
                id: potato.id
            }
        });

        expect(result.data.getProduct.data).toMatchObject({
            id: potato.id,
            values: {
                title: "Potato",
                price: 99.9,
                availableOn: "2020-12-25",
                color: "white",
                availableSizes: ["s", "m"],
                category: {
                    id: vegetables.id,
                    values: {
                        title: "Vegetables"
                    }
                },
                variant: {
                    name: "Variant 1",
                    price: 100,
                    options: [
                        { name: "Option 1", price: 10 },
                        { name: "Option 2", price: 20 }
                    ]
                }
            }
        });
    });
});
