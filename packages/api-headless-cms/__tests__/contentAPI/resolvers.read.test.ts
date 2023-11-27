import { CmsGroup } from "~/types";
import { GraphQLHandlerParams, useGraphQLHandler } from "../testHelpers/useGraphQLHandler";
import models from "./mocks/contentModels";
import { useCategoryManageHandler } from "../testHelpers/useCategoryManageHandler";
import { useCategoryReadHandler } from "../testHelpers/useCategoryReadHandler";
import { useProductManageHandler } from "../testHelpers/useProductManageHandler";
import { useProductReadHandler } from "../testHelpers/useProductReadHandler";

const createPermissions = ({ groups, models }: { groups?: string[]; models?: string[] }) => [
    {
        name: "cms.settings"
    },
    {
        name: "cms.contentModelGroup",
        rwd: "r",
        groups: groups ? { "en-US": groups } : undefined
    },
    {
        name: "cms.contentModel",
        rwd: "r",
        models: models ? { "en-US": models } : undefined
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
    },
    {
        name: "content.i18n",
        locales: ["en-US"]
    }
];

const categoryManagerHelper = async (manageOpts: GraphQLHandlerParams) => {
    // Use "manage" API to create and publish entries
    const { createCategory, publishCategory } = useCategoryManageHandler(manageOpts);

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
    const [publishedFruitsResponse] = await publishCategory({ revision: fruits.id });
    const [publishedVegetablesResponse] = await publishCategory({ revision: vegetables.id });
    const [publishedAnimalsResponse] = await publishCategory({ revision: animals.id });

    return {
        fruits: publishedFruitsResponse.data.publishCategory.data,
        vegetables: publishedVegetablesResponse.data.publishCategory.data,
        animals: publishedAnimalsResponse.data.publishCategory.data,
        createCategory,
        publishCategory
    };
};

jest.setTimeout(100000);

describe("READ - Resolvers", () => {
    let contentModelGroup: CmsGroup;

    const manageOpts = { path: "manage/en-US" };
    const readOpts = { path: "read/en-US" };

    const {
        createContentModelMutation,
        updateContentModelMutation,
        createContentModelGroupMutation
    } = useGraphQLHandler(manageOpts);

    const setupModel = async (name: string, group: CmsGroup) => {
        const targetModel = models.find(m => m.modelId === name);
        if (!targetModel) {
            throw new Error(`Could not find model "${name}".`);
        }

        // Create initial record
        const [create] = await createContentModelMutation({
            data: {
                name: targetModel.name,
                modelId: targetModel.modelId,
                singularApiName: targetModel.singularApiName,
                pluralApiName: targetModel.pluralApiName,
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
            process.exit(update.errors[0].message);
        }

        if (update.data.updateContentModel.error) {
            console.error(`[beforeEach] ${update.data.updateContentModel.error.message}`);
            process.exit(update.data.updateContentModel.error.message);
        }
        return targetModel;
    };

    beforeEach(async () => {
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

    test("should return a record by id", async () => {
        // Use "manage" API to create and publish entries
        const { createCategory, publishCategory } = useCategoryManageHandler(manageOpts);

        // Create an entry
        const [create] = await createCategory({ data: { title: "Title 1", slug: "slug-1" } });

        expect(create).toEqual({
            data: {
                createCategory: {
                    data: expect.any(Object),
                    error: null
                }
            }
        });

        const category = create.data.createCategory.data;
        const { id: categoryId } = category;

        // Publish it so it becomes available in the "read" API
        const [publishResponse] = await publishCategory({ revision: categoryId });

        const publishedCategory = publishResponse.data.publishCategory.data;

        // See if entries are available via "read" API
        const { getCategory } = useCategoryReadHandler(readOpts);

        const [result] = await getCategory({
            where: {
                id: categoryId
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
        const { createCategory, publishCategory } = useCategoryManageHandler(manageOpts);

        // Create an entry
        const [create] = await createCategory({ data: { title: "Title 1", slug: "slug-1" } });
        const category = create.data.createCategory.data;
        const { id } = category;

        // Publish it so it becomes available in the "read" API
        const [publishResponse] = await publishCategory({ revision: id });

        const publishedCategory = publishResponse.data.publishCategory.data;

        // See if entries are available via "read" API
        const { listCategories } = useCategoryReadHandler(readOpts);

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

    test(`list entries with specific group and model permissions`, async () => {
        // Use "manage" API to create and publish entries
        const { createCategory, publishCategory } = useCategoryManageHandler(manageOpts);

        // Create an entry
        const [create] = await createCategory({ data: { title: "Title 1", slug: "slug-1" } });
        const category = create.data.createCategory.data;
        const { id } = category;

        // Publish it so it becomes available in the "read" API
        const [publishedCategoryResponse] = await publishCategory({ revision: id });

        const publishedCategory = publishedCategoryResponse.data.publishCategory.data;

        // See if entries are available via "read" API
        const { listCategories } = useCategoryReadHandler({
            ...readOpts,
            permissions: createPermissions({
                groups: [contentModelGroup.id],
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
                            title: category.title,
                            slug: category.slug,
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

    test(`should return an error when getting entry without specific group permissions`, async () => {
        // Use "manage" API to create and publish entries
        const { createCategory, publishCategory } = useCategoryManageHandler(manageOpts);

        // Create an entry
        const [create] = await createCategory({ data: { title: "Title 1", slug: "slug-1" } });
        const category = create.data.createCategory.data;
        const { id } = category;

        // Publish it so it becomes available in the "read" API
        await publishCategory({ revision: id });

        // See if entries are available via "read" API
        const { getCategory } = useCategoryReadHandler({
            ...readOpts,
            permissions: createPermissions({
                groups: ["someOtherGroupId"]
            })
        });

        const [response] = await getCategory({
            where: {
                id
            }
        });

        expect(response).toEqual({
            data: {
                getCategory: {
                    data: null,
                    error: {
                        code: "SECURITY_NOT_AUTHORIZED",
                        data: {
                            reason: 'Not allowed to access model "category".'
                        },
                        message: "Not authorized!"
                    }
                }
            }
        });
    });

    test(`should return an error when getting entry without specific model permissions`, async () => {
        // Use "manage" API to create and publish entries
        const { createCategory, publishCategory } = useCategoryManageHandler(manageOpts);

        // Create an entry
        const [create] = await createCategory({ data: { title: "Title 1", slug: "slug-1" } });
        const category = create.data.createCategory.data;
        const { id } = category;

        // Publish it so it becomes available in the "read" API
        await publishCategory({ revision: id });

        // See if entries are available via "read" API
        const { getCategory } = useCategoryReadHandler({
            ...readOpts,
            permissions: createPermissions({
                models: ["someOtherModelId"]
            })
        });

        const [response] = await getCategory({ where: { id } });

        expect(response).toEqual({
            data: {
                getCategory: {
                    data: null,
                    error: {
                        code: "SECURITY_NOT_AUTHORIZED",
                        data: {
                            reason: 'Not allowed to access model "category".'
                        },
                        message: "Not authorized!"
                    }
                }
            }
        });
    });

    test(`list entries (limit)`, async () => {
        const { vegetables, animals } = await categoryManagerHelper(manageOpts);

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
        const { fruits, vegetables, animals } = await categoryManagerHelper(manageOpts);

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
                            createdOn: fruits.createdOn,
                            savedOn: fruits.savedOn,
                            slug: fruits.slug,
                            title: fruits.title
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
                        cursor: null,
                        hasMoreItems: false,
                        totalCount: 3
                    },
                    error: null
                }
            }
        });
    });

    test(`list entries (sort ASC)`, async () => {
        const { fruits, vegetables, animals } = await categoryManagerHelper(manageOpts);

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
                        cursor: null,
                        hasMoreItems: false,
                        totalCount: 3
                    },
                    error: null
                }
            }
        });
    });

    test(`list entries (sort DESC)`, async () => {
        const { fruits, vegetables, animals } = await categoryManagerHelper(manageOpts);

        const { listCategories } = useCategoryReadHandler(readOpts);

        const [result] = await listCategories({
            sort: ["title_DESC"]
        });

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
                        cursor: null,
                        hasMoreItems: false,
                        totalCount: 3
                    },
                    error: null
                }
            }
        });
    });

    test("list entries that contains given value", async () => {
        const { animals } = await categoryManagerHelper(manageOpts);

        const { listCategories } = useCategoryReadHandler(readOpts);

        const [result] = await listCategories({
            where: {
                title_contains: "NIMal"
            }
        });

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
                        cursor: null,
                        hasMoreItems: false,
                        totalCount: 1
                    },
                    error: null
                }
            }
        });
    });

    test("list entries that do not contains given value", async () => {
        const { vegetables, animals } = await categoryManagerHelper(manageOpts);

        const { listCategories } = useCategoryReadHandler(readOpts);

        const [result] = await listCategories({
            where: {
                title_not_contains: "fruits"
            }
        });

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
                        cursor: null,
                        hasMoreItems: false,
                        totalCount: 2
                    },
                    error: null
                }
            }
        });
    });

    test("list entries that are in given values", async () => {
        const { vegetables, animals } = await categoryManagerHelper(manageOpts);

        const { listCategories } = useCategoryReadHandler(readOpts);

        const [result] = await listCategories({
            where: {
                slug_in: [vegetables.slug, animals.slug]
            }
        });

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
                        cursor: null,
                        hasMoreItems: false,
                        totalCount: 2
                    },
                    error: null
                }
            }
        });
    });

    test("list entries that are not in given values", async () => {
        const { fruits, vegetables, animals } = await categoryManagerHelper(manageOpts);

        const { listCategories } = useCategoryReadHandler(readOpts);

        const [result] = await listCategories({
            where: {
                slug_not_in: [vegetables.slug, animals.slug]
            }
        });

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
                        cursor: null,
                        hasMoreItems: false,
                        totalCount: 1
                    },
                    error: null
                }
            }
        });
    });

    test("list entries that are created after given date", async () => {
        const { fruits, vegetables, animals } = await categoryManagerHelper(manageOpts);

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
                        cursor: null,
                        hasMoreItems: false,
                        totalCount: 3
                    },
                    error: null
                }
            }
        });
    });

    test("list entries that are created after or at given date: one returned", async () => {
        const { animals } = await categoryManagerHelper(manageOpts);

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
                            createdOn: animals.createdOn,
                            savedOn: animals.savedOn,
                            slug: animals.slug,
                            title: animals.title
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

    test("list entries that are created before given date: none returned", async () => {
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

    test("list entries that are created before or at given date: one returned", async () => {
        const { fruits, vegetables } = await categoryManagerHelper(manageOpts);

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
                        cursor: null,
                        hasMoreItems: false,
                        totalCount: 2
                    },
                    error: null
                }
            }
        });
    });

    test("list entries that are not created between given dates", async () => {
        const { fruits, vegetables, animals } = await categoryManagerHelper(manageOpts);

        const { listCategories } = useCategoryReadHandler(readOpts);

        const from = new Date(vegetables.savedOn);
        from.setTime(from.getTime() - 10);
        const to = new Date(vegetables.savedOn);
        to.setTime(to.getTime() + 10);

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
                        cursor: null,
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
        const { createProduct, listProducts } = useProductManageHandler({
            ...manageOpts
        });

        const [potatoResponse] = await createProduct({
            data: {
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
        });
        const potato = potatoResponse.data.createProduct.data;

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
                    id: vegetables.id
                }
            }
        });

        const [kornResponse] = await createProduct({
            data: {
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
        });
        const korn = kornResponse.data.createProduct.data;

        const [response] = await listProducts({
            where: {
                price_gte: 99,
                price_lte: 107.99
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

    test("sort entries by title", async () => {
        await setupModel("product", contentModelGroup);

        const { vegetables } = await categoryManagerHelper({
            ...manageOpts
        });
        const { createProduct, listProducts } = useProductManageHandler({
            ...manageOpts
        });

        const [potatoResponse] = await createProduct({
            data: {
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
        });

        const [carrotResponse] = await createProduct({
            data: {
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
        });

        const [kornResponse] = await createProduct({
            data: {
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
        });

        const potato = potatoResponse.data.createProduct.data;
        const carrot = carrotResponse.data.createProduct.data;
        const korn = kornResponse.data.createProduct.data;

        const [responseAsc] = await listProducts({
            sort: ["title_ASC"]
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
            sort: ["title_DESC"]
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

    test("should sort products by price", async () => {
        await setupModel("product", contentModelGroup);

        const { vegetables } = await categoryManagerHelper({
            ...manageOpts
        });
        const { createProduct, listProducts } = useProductManageHandler({
            ...manageOpts
        });

        const [potatoResponse] = await createProduct({
            data: {
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
        });

        const [carrotResponse] = await createProduct({
            data: {
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
        });

        const [kornResponse] = await createProduct({
            data: {
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
        });

        const potato = potatoResponse.data.createProduct.data;
        const carrot = carrotResponse.data.createProduct.data;
        const korn = kornResponse.data.createProduct.data;

        const [responseAsc] = await listProducts({
            sort: ["price_ASC"]
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
            sort: ["price_DESC"]
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

    test("should store and retrieve nested objects", async () => {
        await setupModel("product", contentModelGroup);

        const { vegetables } = await categoryManagerHelper({
            ...manageOpts
        });

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
        });

        expect(createResponse).toMatchObject({
            data: {
                createProduct: {
                    data: {
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
                    },
                    error: null
                }
            }
        });

        const [publishResponse] = await publishProduct({ revision: potato.id });

        expect(publishResponse).toMatchObject({
            data: {
                publishProduct: {
                    data: {
                        id: potato.id,
                        meta: {
                            status: "published"
                        },
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
            title: "Potato",
            price: 99.9,
            availableOn: "2020-12-25",
            color: "white",
            availableSizes: ["s", "m"],
            category: {
                id: vegetables.id,
                title: "Vegetables"
            },
            variant: {
                name: "Variant 1",
                price: 100,
                options: [
                    { name: "Option 1", price: 10 },
                    { name: "Option 2", price: 20 }
                ]
            }
        });
    });
});
