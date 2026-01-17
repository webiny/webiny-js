import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CmsEntryListParams, CmsGroup } from "~/types/index.js";
import { useGraphQLHandler } from "../testHelpers/useGraphQLHandler";
import { useCategoryManageHandler } from "../testHelpers/useCategoryManageHandler";
import { useCategoryReadHandler } from "../testHelpers/useCategoryReadHandler";
import { useProductManageHandler } from "../testHelpers/useProductManageHandler";
import { setupGroupAndModels } from "~tests/testHelpers/setup.js";
import type { IManageQueryBaseResponse } from "~tests/testHelpers/types.js";
import type { ICategoryResponseValues } from "~tests/testHelpers/category/manage/types.js";

interface CreateCategoriesResult {
    fruits: IManageQueryBaseResponse<ICategoryResponseValues>;
    vegetables: IManageQueryBaseResponse<ICategoryResponseValues>;
    animals: IManageQueryBaseResponse<ICategoryResponseValues>;
    trees: IManageQueryBaseResponse<ICategoryResponseValues>;
}

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
        name: "cms.endpoint.manage"
    }
];

vi.setConfig({
    testTimeout: 100_000
});

describe("MANAGE - Resolvers", () => {
    let contentModelGroup: CmsGroup;

    const manageOpts = { path: "manage" };
    const readOpts = { path: "read" };

    const manager = useGraphQLHandler(manageOpts);

    beforeEach(async () => {
        const result = await setupGroupAndModels({
            manager,
            models: ["category", "product"]
        });
        contentModelGroup = result.group;
    });

    const createCategories = async (): Promise<CreateCategoriesResult> => {
        // Use "manage" API to create and publish entries
        const { createCategory } = useCategoryManageHandler(manageOpts);

        const values: Record<string, string> = {
            animals: "Animals",
            fruits: "Fruits",
            trees: "Trees",
            vegetables: "Vegetables"
        };
        const categories: Partial<CreateCategoriesResult> = {};
        for (const slug in values) {
            const title = values[slug];
            const [response] = await createCategory({
                variables: {
                    data: {
                        values: {
                            title,
                            slug
                        }
                    }
                }
            });
            categories[slug as keyof CreateCategoriesResult] = response.data.createCategory.data!;
        }

        return categories as CreateCategoriesResult;
    };

    it(`get category`, async () => {
        const { createCategory, getCategory } = useCategoryManageHandler(manageOpts);

        const [create] = await createCategory({
            variables: {
                data: {
                    values: {
                        title: "Hardware",
                        slug: "hardware"
                    }
                }
            }
        });

        const { id, entryId } = create.data.createCategory.data!;

        const [response] = await getCategory({
            variables: {
                revision: id
            }
        });

        expect(response.data.getCategory.data).toMatchObject({
            id,
            entryId,
            createdOn: expect.stringMatching(/^20/),
            createdBy: {
                id: "id-12345678",
                displayName: "John Doe",
                type: "admin"
            },
            savedOn: expect.stringMatching(/^20/),
            lastPublishedOn: null,
            meta: {
                title: "Hardware",
                modelId: "category",
                version: 1,
                locked: false,
                status: "draft",
                revisions: [
                    {
                        id: expect.any(String),
                        meta: {
                            status: "draft",
                            version: 1
                        },
                        values: {
                            title: "Hardware",
                            slug: "hardware"
                        }
                    }
                ],
                data: {}
            },
            values: {
                title: "Hardware",
                slug: "hardware"
            }
        });
    });

    it(`error when getting category without specific groups and models permissions`, async () => {
        const { createCategory } = useCategoryManageHandler(manageOpts);

        const [create] = await createCategory({
            variables: {
                data: {
                    values: {
                        title: "Hardware",
                        slug: "hardware"
                    }
                }
            }
        });

        const { id } = create.data.createCategory.data!;

        const { getCategory } = useCategoryManageHandler({
            ...manageOpts,
            permissions: createPermissions({
                groups: [contentModelGroup.id],
                models: ["someOtherModelId"]
            })
        });

        const [response] = await getCategory({
            variables: {
                revision: id
            }
        });

        expect(response.data.getCategory.data).toEqual(null);
        expect(response.data.getCategory.error).toMatchObject({
            code: "Cms/Entry/NotAuthorized",
            message: 'Not allowed to access "category" entries.',
            data: null
        });
    });

    it(`get category with specific groups and models permissions`, async () => {
        const { createCategory } = useCategoryManageHandler(manageOpts);

        const [create] = await createCategory({
            variables: {
                data: {
                    values: {
                        title: "Hardware",
                        slug: "hardware"
                    }
                }
            }
        });

        const { id, entryId } = create.data.createCategory.data!;

        const permissions = createPermissions({
            groups: [contentModelGroup.id],
            models: ["category"]
        });
        const { getCategory } = useCategoryManageHandler({
            ...manageOpts,
            permissions
        });

        const [response] = await getCategory({
            variables: {
                revision: id
            }
        });

        expect(response.data.getCategory.error).toBeNull();

        expect(response.data.getCategory.data).toMatchObject({
            id,
            entryId,
            createdOn: expect.stringMatching(/^20/),
            createdBy: {
                id: "id-12345678",
                displayName: "John Doe",
                type: "admin"
            },
            savedOn: expect.stringMatching(/^20/),
            lastPublishedOn: null,
            meta: {
                title: "Hardware",
                modelId: "category",
                version: 1,
                locked: false,
                status: "draft",
                revisions: [
                    {
                        id: expect.any(String),
                        meta: {
                            status: "draft",
                            version: 1
                        },
                        values: {
                            title: "Hardware",
                            slug: "hardware"
                        }
                    }
                ],
                data: {}
            },
            values: {
                title: "Hardware",
                slug: "hardware"
            }
        });
    });

    it(`list categories (no parameters)`, async () => {
        // Use "manage" API to create and publish entries
        const { createCategory, publishCategory, listCategories } =
            useCategoryManageHandler(manageOpts);

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
        const [publish] = await publishCategory({
            variables: {
                revision: id
            }
        });

        const { data: publishedCategory, error } = publish.data.publishCategory;
        expect(error).toBeNull();

        const [response] = await listCategories();

        expect(response).toMatchObject({
            data: {
                listCategories: {
                    data: [
                        {
                            id: category.id,
                            entryId: category.entryId,
                            createdOn: category.createdOn,
                            createdBy: {
                                id: "id-12345678",
                                displayName: "John Doe",
                                type: "admin"
                            },
                            savedOn: publishedCategory!.savedOn,
                            lastPublishedOn: expect.stringMatching(/^20/),
                            meta: {
                                locked: true,
                                modelId: "category",
                                revisions: [
                                    {
                                        id: expect.any(String),
                                        values: {
                                            slug: "slug-1",
                                            title: "Title 1"
                                        },
                                        meta: {
                                            version: 1,
                                            status: "published"
                                        }
                                    }
                                ],
                                status: "published",
                                title: "Title 1",
                                version: 1,
                                data: {}
                            },
                            values: {
                                title: category.values.title,
                                slug: category.values.slug
                            }
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

    it("get entries by given ids", async () => {
        // Use "manage" API to create and publish entries
        const { createCategory, getCategoriesByIds } = useCategoryManageHandler(manageOpts);

        const [fruitsResponse] = await createCategory({
            variables: {
                data: {
                    values: {
                        title: "Fruits",
                        slug: "fruits"
                    }
                }
            }
        });
        const fruits = fruitsResponse.data.createCategory.data!;
        await createCategory({
            variables: {
                data: {
                    values: {
                        title: "Vegetables",
                        slug: "vegetables"
                    }
                }
            }
        });

        const [animalsResponse] = await createCategory({
            variables: {
                data: {
                    values: {
                        title: "Animals",
                        slug: "animals"
                    }
                }
            }
        });
        const animals = animalsResponse.data.createCategory.data!;
        await createCategory({
            variables: {
                data: {
                    values: {
                        title: "Trees",
                        slug: "trees"
                    }
                }
            }
        });

        const [response] = await getCategoriesByIds({
            variables: {
                revisions: [fruits.id, animals.id]
            }
        });

        expect(response).toMatchObject({
            data: {
                getCategoriesByIds: {
                    data: [fruits, animals],
                    error: null
                }
            }
        });
    });

    it(`should create category`, async () => {
        const { createCategory } = useCategoryManageHandler(manageOpts);
        const [create1] = await createCategory({
            variables: {
                data: {
                    values: {
                        title: "Hardware",
                        slug: "hardware"
                    }
                }
            }
        });

        const category1 = create1.data.createCategory.data;

        expect(category1).toMatchObject({
            id: expect.any(String),
            entryId: expect.any(String),
            createdOn: expect.stringMatching(/^20/),
            createdBy: {
                id: "id-12345678",
                displayName: "John Doe",
                type: "admin"
            },
            savedOn: expect.stringMatching(/^20/),
            lastPublishedOn: null,
            meta: {
                title: "Hardware",
                modelId: "category",
                version: 1,
                locked: false,
                status: "draft",
                revisions: [
                    {
                        id: expect.any(String),
                        values: {
                            title: "Hardware",
                            slug: "hardware"
                        },
                        meta: {
                            version: 1,
                            status: "draft"
                        }
                    }
                ],
                data: {}
            },
            values: {
                title: "Hardware",
                slug: "hardware"
            }
        });
    });

    it(`should return validation error`, async () => {
        const { createCategory } = useCategoryManageHandler(manageOpts);

        const [response] = await createCategory({
            variables: {
                data: {
                    values: {
                        title: "Hardware",
                        slug: ""
                    }
                }
            }
        });

        expect(response).toMatchObject({
            data: {
                createCategory: {
                    data: null,
                    error: {
                        code: "Cms/Entry/ValidationError",
                        data: [
                            {
                                error: "This field is required",
                                storageId: "text@slug",
                                id: "slug",
                                fieldId: "slug",
                                parents: []
                            }
                        ],
                        message: "Validation failed."
                    }
                }
            }
        });
    });

    it(`should create an entry (fields without validation)`, async () => {
        const { createCategory, listCategories } = useCategoryManageHandler(manageOpts);
        const [result] = await createCategory({
            variables: {
                data: {
                    values: {
                        title: "Hardware",
                        slug: "hardware"
                    }
                }
            }
        });

        const category = result.data.createCategory.data!;

        expect(category).toMatchObject({
            id: expect.any(String),
            entryId: expect.any(String),
            createdOn: expect.stringMatching(/^20/),
            createdBy: {
                id: "id-12345678",
                displayName: "John Doe",
                type: "admin"
            },
            savedOn: expect.stringMatching(/^20/),
            lastPublishedOn: null,
            meta: {
                title: category.values.title,
                modelId: "category",
                version: 1,
                locked: false,
                status: "draft",
                revisions: [
                    {
                        id: expect.any(String),
                        values: {
                            title: category.values.title,
                            slug: category.values.slug
                        },
                        meta: {
                            status: "draft",
                            version: 1
                        }
                    }
                ],
                data: {}
            },
            values: {
                title: category.values.title,
                slug: category.values.slug
            }
        });

        const [listResponse] = await listCategories();

        expect(listResponse).toMatchObject({
            data: {
                listCategories: {
                    data: [
                        {
                            id: category.id
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

    it(`create category revision`, async () => {
        const { createCategory, createCategoryFrom, listCategories } =
            useCategoryManageHandler(manageOpts);

        const [create] = await createCategory({
            variables: {
                data: {
                    values: {
                        title: "Hardware",
                        slug: "hardware"
                    }
                }
            }
        });
        const { id } = create.data.createCategory.data!;

        const [revision] = await createCategoryFrom({
            variables: {
                revision: id
            }
        });

        const newEntry = revision.data.createCategoryFrom.data!;
        expect(revision).toMatchObject({
            data: {
                createCategoryFrom: {
                    data: {
                        id: expect.any(String),
                        entryId: expect.any(String),
                        savedOn: expect.stringMatching(/^20/),
                        createdOn: expect.stringMatching(/^20/),
                        createdBy: {
                            id: "id-12345678",
                            displayName: "John Doe",
                            type: "admin"
                        },
                        lastPublishedOn: null,
                        meta: {
                            locked: false,
                            modelId: "category",
                            revisions: [
                                {
                                    id: expect.any(String),
                                    values: {
                                        slug: "hardware",
                                        title: "Hardware"
                                    },
                                    meta: {
                                        status: "draft",
                                        version: 2
                                    }
                                },
                                {
                                    id: expect.any(String),
                                    values: {
                                        slug: "hardware",
                                        title: "Hardware"
                                    },
                                    meta: {
                                        status: "draft",
                                        version: 1
                                    }
                                }
                            ],
                            status: "draft",
                            title: "Hardware",
                            version: 2,
                            data: {}
                        },
                        values: {
                            title: "Hardware",
                            slug: "hardware"
                        }
                    },
                    error: null
                }
            }
        });

        const [response] = await listCategories();

        expect(response).toMatchObject({
            data: {
                listCategories: {
                    data: [newEntry],
                    meta: {
                        hasMoreItems: false,
                        totalCount: 1,
                        cursor: null
                    },
                    error: null
                }
            }
        });
    });

    it(`update category`, async () => {
        const { createCategory, updateCategory, listCategories } =
            useCategoryManageHandler(manageOpts);
        const [create] = await createCategory({
            variables: {
                data: {
                    values: {
                        title: "Hardware",
                        slug: "hardware"
                    }
                }
            }
        });

        const createdCategory = create.data.createCategory.data!;

        const [response] = await updateCategory({
            variables: {
                revision: createdCategory.id,
                data: {
                    values: {
                        title: "New title",
                        slug: "hardware-store"
                    }
                }
            }
        });

        expect(response).toMatchObject({
            data: {
                updateCategory: {
                    data: {
                        id: expect.any(String),
                        entryId: expect.any(String),
                        createdOn: expect.stringMatching(/^20/),
                        createdBy: {
                            id: "id-12345678",
                            displayName: "John Doe",
                            type: "admin"
                        },
                        savedOn: expect.stringMatching(/^20/),
                        lastPublishedOn: null,
                        meta: {
                            locked: false,
                            modelId: "category",
                            revisions: [
                                {
                                    id: expect.any(String),
                                    values: {
                                        title: "New title",
                                        slug: "hardware-store"
                                    },
                                    meta: {
                                        status: "draft",
                                        version: 1
                                    }
                                }
                            ],
                            title: "New title",
                            status: "draft",
                            version: 1,
                            data: {}
                        },
                        values: {
                            title: "New title",
                            slug: "hardware-store"
                        }
                    },
                    error: null
                }
            }
        });

        const updatedCategory = response.data.updateCategory.data!;

        const createdOn = new Date(create.data.createCategory.data!.savedOn).getTime();
        const updatedOn = new Date(updatedCategory.savedOn).getTime();
        expect(createdOn).toBeLessThan(updatedOn);

        const [listResponse] = await listCategories();

        expect(listResponse).toMatchObject({
            data: {
                listCategories: {
                    data: [
                        {
                            id: updatedCategory.id,
                            savedOn: updatedCategory.savedOn,
                            values: {
                                slug: "hardware-store",
                                title: "New title"
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

    it(`delete category`, async () => {
        const { createCategory, createCategoryFrom, getCategory, listCategories, deleteCategory } =
            useCategoryManageHandler(manageOpts);

        const [revision1] = await createCategory({
            variables: {
                data: {
                    values: {
                        title: "Hardware",
                        slug: "hardware"
                    }
                }
            }
        });

        const rev1Category = revision1.data.createCategory.data!;
        const { id } = revision1.data.createCategory.data!;
        // Create 2 more revisions
        const [revision2] = await createCategoryFrom({
            variables: {
                revision: id
            }
        });

        expect(revision2).toMatchObject({
            data: {
                createCategoryFrom: {
                    data: {
                        id: `${rev1Category.entryId}#0002`,
                        meta: {
                            version: 2
                        }
                    },
                    error: null
                }
            }
        });

        const rev2Category = revision2.data.createCategoryFrom.data!;
        const { id: id2 } = rev2Category;

        const [revision3] = await createCategoryFrom({
            variables: {
                revision: id
            }
        });

        expect(revision3).toMatchObject({
            data: {
                createCategoryFrom: {
                    data: {
                        id: `${rev2Category.entryId}#0003`,
                        meta: {
                            version: 3
                        }
                    },
                    error: null
                }
            }
        });
        const { id: id3 } = revision3.data.createCategoryFrom.data!;

        // Delete latest revision
        const [deleteId3Response] = await deleteCategory({
            variables: {
                revision: id3
            }
        });

        expect(deleteId3Response).toEqual({
            data: {
                deleteCategory: {
                    data: true,
                    error: null
                }
            }
        });

        // Make sure revision #2 is now "latest"
        const [list2] = await listCategories();
        const data2 = list2.data.listCategories.data!;
        expect(data2.length).toBe(1);
        expect(data2[0].id).toEqual(id2);
        expect(data2[0].meta.version).toEqual(2);

        // Delete revision #1; Revision #2 should still be "latest"
        const [deleteIdResponse] = await deleteCategory({
            variables: {
                revision: id
            }
        });

        expect(deleteIdResponse).toEqual({
            data: {
                deleteCategory: {
                    data: true,
                    error: null
                }
            }
        });

        // Get revision #2 and verify it's the only remaining revision of this form
        const [get] = await getCategory({
            variables: {
                revision: id2
            }
        });
        const { meta } = get.data.getCategory.data!;
        expect(meta.version).toBe(2);
        expect(meta.revisions.length).toBe(1);
        expect(meta.revisions[0].id).toEqual(id2);
    });

    it(`publish and unpublish a category`, async () => {
        const { createCategory, createCategoryFrom, publishCategory, unpublishCategory } =
            useCategoryManageHandler(manageOpts);

        const { listCategories: listPublishedCategories } = useCategoryReadHandler(readOpts);

        const [revision1] = await createCategory({
            variables: {
                data: {
                    values: {
                        title: "Hardware",
                        slug: "hardware"
                    }
                }
            }
        });

        const { id } = revision1.data.createCategory.data!;

        // Create 2 more revisions
        const [revision2] = await createCategoryFrom({
            variables: {
                revision: id
            }
        });

        expect(revision2).toEqual({
            data: {
                createCategoryFrom: {
                    data: expect.any(Object),
                    error: null
                }
            }
        });

        const [revision3] = await createCategoryFrom({
            variables: {
                revision: id
            }
        });

        expect(revision3).toEqual({
            data: {
                createCategoryFrom: {
                    data: expect.any(Object),
                    error: null
                }
            }
        });

        const { id: id3 } = revision3.data.createCategoryFrom.data!;

        // Publish latest revision
        const [res] = await publishCategory({
            variables: {
                revision: id3
            }
        });

        expect(res).toEqual({
            data: {
                publishCategory: {
                    data: expect.any(Object),
                    error: null
                }
            }
        });

        const [unpublish] = await unpublishCategory({
            variables: {
                revision: id3
            }
        });

        expect(unpublish).toEqual({
            data: {
                unpublishCategory: {
                    data: expect.any(Object),
                    error: null
                }
            }
        });

        expect(unpublish.data.unpublishCategory.data!.meta.status).toBe("unpublished");

        // Publish the latest revision again
        const [publish2] = await publishCategory({
            variables: {
                revision: id3
            }
        });

        expect(publish2).toEqual({
            data: {
                publishCategory: {
                    data: expect.any(Object),
                    error: null
                }
            }
        });

        const [listResponse] = await listPublishedCategories();

        expect(listResponse).toMatchObject({
            data: {
                listCategories: {
                    data: [
                        {
                            id: id3
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

    it(`list categories (contains, not_contains, in, not_in)`, async () => {
        const { animals, fruits, vegetables, trees } = await createCategories();
        const { listCategories } = useCategoryManageHandler(manageOpts);

        const defaultQueryVars: CmsEntryListParams = {
            sort: ["values_title_ASC"]
        };

        const [listResponse] = await listCategories({
            variables: defaultQueryVars
        });

        expect(listResponse).toMatchObject({
            data: {
                listCategories: {
                    data: [animals, fruits, trees, vegetables],
                    meta: {
                        hasMoreItems: false,
                        totalCount: 4,
                        cursor: null
                    },
                    error: null
                }
            }
        });

        const [listContainsResponse] = await listCategories({
            variables: {
                ...defaultQueryVars,
                where: {
                    values: {
                        title_contains: "ree"
                    }
                }
            }
        });

        expect(listContainsResponse).toMatchObject({
            data: {
                listCategories: {
                    data: [trees],
                    meta: {
                        hasMoreItems: false,
                        totalCount: 1,
                        cursor: null
                    },
                    error: null
                }
            }
        });

        const [listNotContainsResponse] = await listCategories({
            variables: {
                ...defaultQueryVars,
                where: {
                    values: {
                        title_not_contains: "uit"
                    }
                }
            }
        });
        expect(listNotContainsResponse).toMatchObject({
            data: {
                listCategories: {
                    data: [animals, trees, vegetables],
                    meta: {
                        hasMoreItems: false,
                        totalCount: 3,
                        cursor: null
                    },
                    error: null
                }
            }
        });

        const [listNotContainsEResponse] = await listCategories({
            variables: {
                ...defaultQueryVars,
                where: {
                    values: {
                        title_not_contains: "e"
                    }
                }
            }
        });
        expect(listNotContainsEResponse).toMatchObject({
            data: {
                listCategories: {
                    data: [animals, fruits],
                    meta: {
                        hasMoreItems: false,
                        totalCount: 2,
                        cursor: null
                    },
                    error: null
                }
            }
        });

        const [listInResponse] = await listCategories({
            variables: {
                ...defaultQueryVars,
                where: {
                    id_in: [animals.id, vegetables.id]
                },
                sort: ["savedOn_ASC"]
            }
        });

        expect(listInResponse).toMatchObject({
            data: {
                listCategories: {
                    data: [animals, vegetables],
                    meta: {
                        hasMoreItems: false,
                        totalCount: 2,
                        cursor: null
                    },
                    error: null
                }
            }
        });

        const [listNotInResponse] = await listCategories({
            variables: {
                ...defaultQueryVars,
                where: {
                    id_not_in: [trees.id, vegetables.id]
                }
            }
        });

        expect(listNotInResponse).toEqual({
            data: {
                listCategories: {
                    data: [animals, fruits],
                    meta: {
                        hasMoreItems: false,
                        totalCount: 2,
                        cursor: null
                    },
                    error: null
                }
            }
        });
    });

    it("should store and retrieve nested objects", async () => {
        const { vegetables } = await createCategories();

        const { createProduct, listProducts } = useProductManageHandler({
            ...manageOpts
        });

        const [createPotatoResponse] = await createProduct({
            data: {
                values: {
                    title: "Potato",
                    price: 99.9,
                    availableOn: "2020-12-25",
                    color: "white",
                    inStock: true,
                    itemsInStock: 101,
                    image: "image.png",
                    richText: [
                        {
                            type: "p"
                        }
                    ],
                    availableSizes: ["s", "m"],
                    category: {
                        modelId: "category",
                        id: vegetables.id
                    },
                    variant: {
                        name: "Variant 1",
                        price: 100,
                        images: ["testImage.jpg", "testImage2.jpg"],
                        category: {
                            modelId: "category",
                            id: vegetables.id
                        },
                        options: [
                            {
                                name: "Option 1",
                                price: 10,
                                image: "testImageOption1.jpg",
                                category: {
                                    modelId: "category",
                                    id: vegetables.id
                                },
                                categories: [
                                    {
                                        modelId: "category",
                                        id: vegetables.id
                                    }
                                ],
                                longText: []
                            },
                            {
                                name: "Option 2",
                                price: 20,
                                image: "testImageOption2.jpg",
                                category: {
                                    modelId: "category",
                                    id: vegetables.id
                                },
                                categories: [
                                    {
                                        modelId: "category",
                                        id: vegetables.id
                                    }
                                ],
                                longText: ["long text"]
                            }
                        ]
                    }
                }
            }
        });

        expect(createPotatoResponse.errors).toBeUndefined();
        expect(createPotatoResponse.data.createProduct.error).toBeNull();

        expect(createPotatoResponse).toEqual({
            data: {
                createProduct: {
                    data: {
                        id: expect.any(String),
                        entryId: expect.any(String),
                        createdBy: expect.any(Object),
                        meta: expect.any(Object),
                        createdOn: expect.stringMatching(/^20/),
                        modifiedOn: null,
                        savedOn: expect.stringMatching(/^20/),
                        firstPublishedOn: null,
                        lastPublishedOn: null,
                        values: {
                            title: "Potato",
                            price: 99.9,
                            availableOn: "2020-12-25",
                            color: "white",
                            inStock: true,
                            itemsInStock: 101,
                            image: "image.png",
                            richText: [
                                {
                                    type: "p"
                                }
                            ],
                            availableSizes: ["s", "m"],
                            category: {
                                modelId: "category",
                                id: vegetables.id,
                                entryId: vegetables.entryId
                            },
                            variant: {
                                name: "Variant 1",
                                price: 100,
                                images: ["testImage.jpg", "testImage2.jpg"],
                                category: {
                                    modelId: "category",
                                    id: vegetables.id,
                                    entryId: vegetables.entryId
                                },
                                options: [
                                    {
                                        name: "Option 1",
                                        price: 10,
                                        image: "testImageOption1.jpg",
                                        category: {
                                            modelId: "category",
                                            id: vegetables.id,
                                            entryId: vegetables.entryId
                                        },
                                        categories: [
                                            {
                                                modelId: "category",
                                                id: vegetables.id,
                                                entryId: vegetables.entryId
                                            }
                                        ],
                                        longText: []
                                    },
                                    {
                                        name: "Option 2",
                                        price: 20,
                                        image: "testImageOption2.jpg",
                                        category: {
                                            modelId: "category",
                                            id: vegetables.id,
                                            entryId: vegetables.entryId
                                        },
                                        categories: [
                                            {
                                                modelId: "category",
                                                id: vegetables.id,
                                                entryId: vegetables.entryId
                                            }
                                        ],
                                        longText: ["long text"]
                                    }
                                ]
                            }
                        }
                    },
                    error: null
                }
            }
        });

        const potato = createPotatoResponse.data.createProduct.data;

        const [listResponse] = await listProducts();

        expect(listResponse).toEqual({
            data: {
                listProducts: {
                    data: [
                        {
                            ...potato
                        }
                    ],
                    meta: {
                        totalCount: 1,
                        hasMoreItems: false,
                        cursor: null
                    },
                    error: null
                }
            }
        });
    });

    it("should have all entry revisions published", async () => {
        const { getCategory, createCategory, publishCategory, createCategoryFrom, listCategories } =
            useCategoryManageHandler(manageOpts);

        const { getCategory: getReadCategory } = useCategoryReadHandler(readOpts);

        const title = "Webiny Serverless Framework";
        const slug = "webiny-serverless-framework";
        const [createWebinyResponse] = await createCategory({
            variables: {
                data: {
                    values: {
                        title,
                        slug
                    }
                }
            }
        });

        expect(createWebinyResponse).toMatchObject({
            data: {
                createCategory: {
                    data: {
                        id: expect.any(String),
                        meta: {
                            status: "draft",
                            version: 1
                        },
                        values: {
                            title,
                            slug
                        }
                    },
                    error: null
                }
            }
        });

        const [publishWebinyResponse] = await publishCategory({
            variables: {
                revision: createWebinyResponse.data.createCategory.data!.id
            }
        });

        const createdWebinyCategory = createWebinyResponse.data.createCategory.data!;

        expect(publishWebinyResponse).toMatchObject({
            data: {
                publishCategory: {
                    data: {
                        ...createdWebinyCategory,
                        modifiedBy: {
                            id: "id-12345678",
                            displayName: "John Doe",
                            type: "admin"
                        },
                        modifiedOn: expect.any(String),
                        firstPublishedOn: expect.any(String),
                        lastPublishedOn: expect.any(String),
                        meta: {
                            ...createdWebinyCategory.meta,
                            locked: true,
                            status: "published",
                            revisions: createdWebinyCategory.meta.revisions.map((rev: any) => {
                                return {
                                    ...rev,
                                    meta: {
                                        ...rev.meta,
                                        status: "published"
                                    }
                                };
                            })
                        },
                        savedOn: expect.any(String)
                    },
                    error: null
                }
            }
        });
        const webiny = publishWebinyResponse.data.publishCategory.data!;
        /**
         * Only publish categories with these versions.
         * Rest should be draft.
         * This is to test if unpublished updated works correctly.
         */
        const publishCategoriesList = [1, 3, 6];
        for (let i = 0; i < 5; i++) {
            const [response] = await createCategoryFrom({
                variables: {
                    revision: webiny.id
                }
            });

            expect(response).toMatchObject({
                data: {
                    createCategoryFrom: {
                        data: {
                            ...webiny,
                            modifiedOn: expect.stringMatching(/^20/),
                            lastPublishedOn: expect.stringMatching(/^20/),
                            meta: {
                                ...webiny.meta,
                                locked: false,
                                status: "draft",
                                version: i + 2,
                                revisions: expect.any(Array)
                            },
                            id: expect.stringMatching(`${webiny.entryId}#000`),
                            createdOn: expect.any(String),
                            savedOn: expect.any(String)
                        },
                        error: null
                    }
                }
            });

            const createdCategory = response.data.createCategoryFrom.data!;
            if (publishCategoriesList.includes(createdCategory.meta.version) === false) {
                continue;
            }

            const [publishResponse] = await publishCategory({
                variables: {
                    revision: response.data.createCategoryFrom.data!.id
                }
            });

            expect(publishResponse).toMatchObject({
                data: {
                    publishCategory: {
                        data: {
                            ...createdCategory,
                            modifiedOn: expect.any(String),
                            lastPublishedOn: expect.any(String),
                            meta: {
                                ...createdCategory.meta,
                                locked: true,
                                status: "published",
                                revisions: expect.any(Array)
                            },
                            savedOn: expect.any(String)
                        },
                        error: null
                    }
                }
            });
        }

        const [listResponse] = await listCategories();

        expect(listResponse).toMatchObject({
            data: {
                listCategories: {
                    data: [
                        {
                            entryId: webiny.entryId,
                            meta: {
                                version: 6,
                                status: "published"
                            }
                        }
                    ],
                    meta: {
                        hasMoreItems: false,
                        cursor: null,
                        totalCount: 1
                    },
                    error: null
                }
            }
        });

        const id = `${webiny.entryId}#0006`;

        const [getResponse] = await getCategory({
            variables: {
                revision: id
            }
        });

        expect(getResponse).toMatchObject({
            data: {
                getCategory: {
                    data: {
                        id,
                        createdBy: expect.any(Object),
                        entryId: webiny.entryId,
                        createdOn: expect.stringMatching(/^20/),
                        savedOn: expect.stringMatching(/^20/),
                        lastPublishedOn: expect.stringMatching(/^20/),
                        values: {
                            title,
                            slug
                        },
                        meta: {
                            locked: true,
                            modelId: "category",
                            revisions: [
                                {
                                    id: `${webiny.entryId}#0006`,
                                    meta: {
                                        status: "published",
                                        version: 6
                                    },
                                    values: {
                                        title,
                                        slug
                                    }
                                },
                                {
                                    id: `${webiny.entryId}#0005`,
                                    meta: {
                                        status: "draft",
                                        version: 5
                                    },
                                    values: {
                                        title,
                                        slug
                                    }
                                },
                                {
                                    id: `${webiny.entryId}#0004`,
                                    meta: {
                                        status: "draft",
                                        version: 4
                                    },
                                    values: {
                                        title,
                                        slug
                                    }
                                },
                                {
                                    id: `${webiny.entryId}#0003`,
                                    meta: {
                                        status: "unpublished",
                                        version: 3
                                    },
                                    values: {
                                        title,
                                        slug
                                    }
                                },
                                {
                                    id: `${webiny.entryId}#0002`,
                                    meta: {
                                        status: "draft",
                                        version: 2
                                    },
                                    values: {
                                        title,
                                        slug
                                    }
                                },
                                {
                                    id: `${webiny.entryId}#0001`,
                                    meta: {
                                        status: "unpublished",
                                        version: 1
                                    },
                                    values: {
                                        title,
                                        slug
                                    }
                                }
                            ],
                            status: "published",
                            title,
                            version: 6,
                            data: {}
                        }
                    },
                    error: null
                }
            }
        });
        /**
         * Should get the version 6 as the published version
         */
        const [getReadCategoryResponse] = await getReadCategory({
            where: {
                entryId: webiny.entryId
            }
        });

        expect(getReadCategoryResponse).toMatchObject({
            data: {
                getCategory: {
                    data: {
                        id: `${webiny.entryId}#0006`,
                        entryId: webiny.entryId,
                        savedOn: expect.stringMatching(/^20/),
                        createdOn: expect.stringMatching(/^20/),
                        values: {
                            slug,
                            title
                        }
                    },
                    error: null
                }
            }
        });
    });

    it("should get latest, published or exact category", async () => {
        const { getCategory, createCategory, createCategoryFrom } =
            useCategoryManageHandler(manageOpts);

        const title = "Webiny Serverless Framework";
        const slug = "webiny-serverless-framework";
        const [createWebinyResponse] = await createCategory({
            variables: {
                data: {
                    values: {
                        title,
                        slug
                    },
                    status: "published"
                }
            }
        });

        const webiny = createWebinyResponse.data.createCategory.data!;

        const [response] = await createCategoryFrom({
            variables: {
                revision: webiny.id
            }
        });

        expect(response).toMatchObject({
            data: {
                createCategoryFrom: {
                    data: {
                        entryId: webiny.entryId,
                        meta: {
                            status: "draft",
                            version: 2
                        }
                    },
                    error: null
                }
            }
        });

        const [exactResponse] = await getCategory({
            variables: {
                revision: webiny.id
            }
        });
        expect(exactResponse).toMatchObject({
            data: {
                getCategory: {
                    data: {
                        id: webiny.id,
                        meta: {
                            status: "published",
                            version: 1
                        }
                    },
                    error: null
                }
            }
        });

        const [publishedResponse] = await getCategory({
            variables: {
                entryId: webiny.entryId,
                status: "published"
            }
        });

        expect(publishedResponse).toMatchObject({
            data: {
                getCategory: {
                    data: {
                        id: webiny.id,
                        meta: {
                            status: "published",
                            version: 1
                        }
                    },
                    error: null
                }
            }
        });

        const [publishedWithIdResponse] = await getCategory({
            variables: {
                entryId: webiny.id,
                status: "published"
            }
        });

        expect(publishedWithIdResponse).toMatchObject({
            data: {
                getCategory: {
                    data: {
                        id: webiny.id,
                        meta: {
                            status: "published",
                            version: 1
                        }
                    },
                    error: null
                }
            }
        });

        const [latestResponse] = await getCategory({
            variables: {
                entryId: webiny.entryId
            }
        });

        expect(latestResponse).toMatchObject({
            data: {
                getCategory: {
                    data: {
                        entryId: webiny.entryId,
                        meta: {
                            status: "draft",
                            version: 2
                        }
                    },
                    error: null
                }
            }
        });

        const [latestWithIdResponse] = await getCategory({
            variables: {
                entryId: webiny.id
            }
        });

        expect(latestWithIdResponse).toMatchObject({
            data: {
                getCategory: {
                    data: {
                        entryId: webiny.entryId,
                        meta: {
                            status: "draft",
                            version: 2
                        }
                    },
                    error: null
                }
            }
        });

        const [latest2Response] = await getCategory({
            variables: {
                entryId: webiny.entryId
            }
        });

        expect(latest2Response).toMatchObject({
            data: {
                getCategory: {
                    data: {
                        entryId: webiny.entryId,
                        meta: {
                            status: "draft",
                            version: 2
                        }
                    },
                    error: null
                }
            }
        });
    });
});
