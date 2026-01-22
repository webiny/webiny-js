import { beforeEach, describe, expect, it } from "vitest";
import type { IdentityData } from "@webiny/api-core/features/IdentityContext";
import { useGraphQLHandler } from "../testHelpers/useGraphQLHandler";
import { useCategoryManageHandler } from "../testHelpers/useCategoryManageHandler";
import { useCategoryReadHandler } from "../testHelpers/useCategoryReadHandler";
import { setupGroupAndModels } from "~tests/testHelpers/setup.js";

const createIdentity = (permissions: any[] = []): IdentityData => {
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
    const API_TOKEN = "aToken";

    const headers = {
        authorization: API_TOKEN
    };

    const manageOpts = { path: "manage" };
    const readOpts = { path: "read" };

    const manager = useGraphQLHandler(manageOpts);

    beforeEach(async () => {
        await manager.installMutation();

        await setupGroupAndModels({
            manager,
            models: ["category"]
        });
    });

    it("create, get, list, update and delete entry", async () => {
        const identity = createIdentity([
            {
                name: "cms.contentEntry",
                rwd: "rwd"
            }
        ]);
        const { createCategory, updateCategory, getCategory, listCategories, deleteCategory } =
            useCategoryManageHandler({
                ...manageOpts,
                identity
            });

        const { listCategories: listCategoriesRead } = useCategoryReadHandler({
            ...readOpts,
            identity
        });

        const [createResponse] = await createCategory({
            variables: {
                data: {
                    values: {
                        title: "Vegetables",
                        slug: "vegetables"
                    }
                }
            },
            headers
        });

        expect(createResponse).toMatchObject({
            data: {
                createCategory: {
                    data: {
                        id: expect.any(String),
                        entryId: expect.any(String),
                        createdOn: expect.stringMatching(/^20/),
                        createdBy: {
                            id: "a1234567890",
                            displayName: "a1234567890",
                            type: "api-key"
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
                                        slug: "vegetables",
                                        title: "Vegetables"
                                    },
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
                        },
                        values: {
                            title: "Vegetables",
                            slug: "vegetables"
                        }
                    },
                    error: null
                }
            }
        });

        const category = createResponse.data.createCategory.data!;

        const [getResponse] = await getCategory({
            variables: {
                revision: category.id
            },
            headers
        });

        expect(getResponse).toMatchObject({
            data: {
                getCategory: {
                    data: {
                        id: category.id,
                        entryId: category.entryId,
                        createdOn: category.createdOn,
                        createdBy: {
                            id: "a1234567890",
                            displayName: "a1234567890",
                            type: "api-key"
                        },
                        savedOn: category.savedOn,
                        lastPublishedOn: null,
                        meta: {
                            locked: false,
                            modelId: "category",
                            revisions: [
                                {
                                    id: category.id,
                                    values: {
                                        slug: "vegetables",
                                        title: "Vegetables"
                                    },
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
                        },
                        values: {
                            title: category.values.title,
                            slug: category.values.slug
                        }
                    },
                    error: null
                }
            }
        });

        const [updateResponse] = await updateCategory({
            variables: {
                revision: category.id,
                data: {
                    values: {
                        title: "Green vegetables",
                        slug: "green-vegetables"
                    }
                }
            },
            headers
        });

        expect(updateResponse).toMatchObject({
            data: {
                updateCategory: {
                    data: {
                        id: expect.any(String),
                        entryId: expect.any(String),
                        createdOn: expect.stringMatching(/^20/),
                        createdBy: {
                            id: "a1234567890",
                            displayName: "a1234567890",
                            type: "api-key"
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
                                        slug: "green-vegetables",
                                        title: "Green vegetables"
                                    },
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
                        },
                        values: {
                            title: "Green vegetables",
                            slug: "green-vegetables"
                        }
                    },
                    error: null
                }
            }
        });

        const updatedCategory = updateResponse.data.updateCategory.data!;

        const [listResponse] = await listCategories({
            headers
        });

        expect(listResponse).toMatchObject({
            data: {
                listCategories: {
                    data: [
                        {
                            id: expect.any(String),
                            entryId: expect.any(String),
                            createdOn: updatedCategory.createdOn,
                            createdBy: {
                                id: "a1234567890",
                                displayName: "a1234567890",
                                type: "api-key"
                            },
                            savedOn: updatedCategory.savedOn,
                            lastPublishedOn: null,
                            meta: {
                                locked: false,
                                modelId: "category",
                                revisions: [
                                    {
                                        id: updatedCategory.id,
                                        values: {
                                            slug: updatedCategory.values.slug,
                                            title: updatedCategory.values.title
                                        },
                                        meta: {
                                            status: "draft",
                                            version: 1
                                        }
                                    }
                                ],
                                status: "draft",
                                version: 1,
                                title: updatedCategory.values.title,
                                data: {}
                            },
                            values: {
                                title: updatedCategory.values.title,
                                slug: updatedCategory.values.slug
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

        const [deleteResponse] = await deleteCategory({
            variables: {
                revision: updatedCategory.id
            },
            headers
        });

        expect(deleteResponse).toEqual({
            data: {
                deleteCategory: {
                    data: true,
                    error: null
                }
            }
        });

        const [listAfterDelete] = await listCategories({
            headers
        });

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
