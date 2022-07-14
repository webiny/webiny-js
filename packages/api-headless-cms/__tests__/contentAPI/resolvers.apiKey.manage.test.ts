import { SecurityIdentity } from "@webiny/api-security/types";
import { CmsGroup } from "~/types";
import { useGraphQLHandler } from "../utils/useGraphQLHandler";
import models from "./mocks/contentModels";
import { useCategoryManageHandler } from "../utils/useCategoryManageHandler";
import { useCategoryReadHandler } from "../utils/useCategoryReadHandler";

const createIdentity = (permissions: any[] = []): SecurityIdentity => {
    return {
        id: "a1234567890",
        displayName: "a1234567890",
        type: "api-key",
        permissions: [
            {
                name: "cms.settings",
                rwd: "r"
            },
            {
                name: "content.i18n",
                locales: ["en-US"]
            },
            {
                name: "cms.endpoint.manage"
            },
            {
                name: "cms.endpoint.read"
            },
            {
                name: "cms.contentModelGroup",
                rwd: "r"
            },
            {
                name: "cms.contentModel"
            }
        ].concat(permissions)
    };
};

describe("MANAGE - resolvers - api key", () => {
    let contentModelGroup: CmsGroup;

    const API_TOKEN = "aToken";

    const headers = {
        authorization: API_TOKEN
    };

    const manageOpts = { path: "manage/en-US" };
    const readOpts = { path: "read/en-US" };

    const {
        createContentModelMutation,
        updateContentModelMutation,
        createContentModelGroupMutation,
        installMutation
    } = useGraphQLHandler(manageOpts);

    beforeEach(async () => {
        await installMutation();

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
        if (!category) {
            throw new Error(`Could not find model "category".`);
        }

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

    test("create, get, list, update and delete entry", async () => {
        const identity = createIdentity([
            {
                name: "cms.contentEntry",
                rwd: "rwd"
            }
        ]);
        const {
            until,
            createCategory,
            updateCategory,
            getCategory,
            listCategories,
            deleteCategory
        } = useCategoryManageHandler({
            ...manageOpts,
            identity
        });

        const { listCategories: listCategoriesRead } = useCategoryReadHandler({
            ...readOpts,
            identity
        });

        const [createResponse] = await createCategory(
            {
                data: {
                    title: "Vegetables",
                    slug: "vegetables"
                }
            },
            headers
        );

        expect(createResponse).toEqual({
            data: {
                createCategory: {
                    data: {
                        id: expect.any(String),
                        entryId: expect.any(String),
                        title: "Vegetables",
                        slug: "vegetables",
                        createdOn: expect.stringMatching(/^20/),
                        createdBy: {
                            id: "a1234567890",
                            displayName: "a1234567890",
                            type: "api-key"
                        },
                        savedOn: expect.stringMatching(/^20/),
                        meta: {
                            locked: false,
                            modelId: "category",
                            publishedOn: null,
                            revisions: [
                                {
                                    id: expect.any(String),
                                    slug: "vegetables",
                                    title: "Vegetables",
                                    meta: {
                                        status: "draft",
                                        version: 1
                                    }
                                }
                            ],
                            status: "draft",
                            version: 1,
                            title: "Vegetables",
                            data: {}
                        }
                    },
                    error: null
                }
            }
        });

        const category = createResponse.data.createCategory.data;

        // If this `until` resolves successfully, we know entry is accessible via the "read" API
        await until(
            () => listCategories({}, headers).then(([data]) => data),
            ({ data }: any) => data.listCategories.data[0].id === category.id,
            { name: "create category" }
        );

        const [getResponse] = await getCategory(
            {
                revision: category.id
            },
            headers
        );

        expect(getResponse).toEqual({
            data: {
                getCategory: {
                    data: {
                        id: category.id,
                        entryId: category.entryId,
                        title: category.title,
                        slug: category.slug,
                        createdOn: category.createdOn,
                        createdBy: {
                            id: "a1234567890",
                            displayName: "a1234567890",
                            type: "api-key"
                        },
                        savedOn: category.savedOn,
                        meta: {
                            locked: false,
                            modelId: "category",
                            publishedOn: null,
                            revisions: [
                                {
                                    id: category.id,
                                    slug: "vegetables",
                                    title: "Vegetables",
                                    meta: {
                                        status: "draft",
                                        version: 1
                                    }
                                }
                            ],
                            status: "draft",
                            version: 1,
                            title: "Vegetables",
                            data: {}
                        }
                    },
                    error: null
                }
            }
        });

        const [updateResponse] = await updateCategory(
            {
                revision: category.id,
                data: {
                    title: "Green vegetables",
                    slug: "green-vegetables"
                }
            },
            headers
        );

        expect(updateResponse).toEqual({
            data: {
                updateCategory: {
                    data: {
                        id: expect.any(String),
                        entryId: expect.any(String),
                        title: "Green vegetables",
                        slug: "green-vegetables",
                        createdOn: expect.stringMatching(/^20/),
                        createdBy: {
                            id: "a1234567890",
                            displayName: "a1234567890",
                            type: "api-key"
                        },
                        savedOn: expect.stringMatching(/^20/),
                        meta: {
                            locked: false,
                            modelId: "category",
                            publishedOn: null,
                            revisions: [
                                {
                                    id: expect.any(String),
                                    slug: "green-vegetables",
                                    title: "Green vegetables",
                                    meta: {
                                        status: "draft",
                                        version: 1
                                    }
                                }
                            ],
                            status: "draft",
                            version: 1,
                            title: "Green vegetables",
                            data: {}
                        }
                    },
                    error: null
                }
            }
        });

        const updatedCategory = updateResponse.data.updateCategory.data;

        // If this `until` resolves successfully, we know entry is accessible via the "read" API
        const listResponse = await until(
            () => listCategories({}, headers).then(([data]) => data),
            ({ data }: any) => data.listCategories.data[0].slug === updatedCategory.slug,
            { name: `waiting for green-vegetables slug on list categories` }
        );

        expect(listResponse).toEqual({
            data: {
                listCategories: {
                    data: [
                        {
                            id: expect.any(String),
                            entryId: expect.any(String),
                            title: updatedCategory.title,
                            slug: updatedCategory.slug,
                            createdOn: updatedCategory.createdOn,
                            createdBy: {
                                id: "a1234567890",
                                displayName: "a1234567890",
                                type: "api-key"
                            },
                            savedOn: updatedCategory.savedOn,
                            meta: {
                                locked: false,
                                modelId: "category",
                                publishedOn: null,
                                revisions: [
                                    {
                                        id: updatedCategory.id,
                                        slug: updatedCategory.slug,
                                        title: updatedCategory.title,
                                        meta: {
                                            status: "draft",
                                            version: 1
                                        }
                                    }
                                ],
                                status: "draft",
                                version: 1,
                                title: updatedCategory.title,
                                data: {}
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

        const [deleteResponse] = await deleteCategory(
            {
                revision: updatedCategory.id
            },
            headers
        );

        expect(deleteResponse).toEqual({
            data: {
                deleteCategory: {
                    data: true,
                    error: null
                }
            }
        });
        /**
         * There should be no categories in the manage API.
         */
        await until(
            () => listCategories({}, headers).then(([data]) => data),
            ({ data }: any) => {
                return data.listCategories.data.length === 0;
            },
            { name: "after delete list categories" }
        );

        const [listAfterDelete] = await listCategories({}, headers);

        expect(listAfterDelete).toEqual({
            data: {
                listCategories: {
                    data: [],
                    error: null,
                    meta: {
                        hasMoreItems: false,
                        totalCount: 0,
                        cursor: null
                    }
                }
            }
        });
        /**
         * There should be no categories in the read API.
         */
        await until(
            () => listCategoriesRead({}, headers).then(([data]) => data),
            ({ data }: any) => data.listCategories.data.length === 0,
            { name: "after delete list read categories" }
        );

        const [listReadAfterDelete] = await listCategoriesRead({}, headers);

        expect(listReadAfterDelete).toEqual({
            data: {
                listCategories: {
                    data: [],
                    error: null,
                    meta: {
                        hasMoreItems: false,
                        totalCount: 0,
                        cursor: null
                    }
                }
            }
        });
    });
});
