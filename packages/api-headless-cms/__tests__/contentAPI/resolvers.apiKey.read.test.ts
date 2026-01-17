import { beforeEach, describe, expect, it } from "vitest";
import { useGraphQLHandler } from "../testHelpers/useGraphQLHandler";
import { useCategoryManageHandler } from "../testHelpers/useCategoryManageHandler";
import { useCategoryReadHandler } from "../testHelpers/useCategoryReadHandler";
import type { IdentityData } from "@webiny/api-core/features/IdentityContext";
import { setupGroupAndModels } from "~tests/testHelpers/setup.js";

const createIdentity = (permissions: any[] = []): IdentityData => {
    return {
        id: "a1234567890",
        displayName: "API",
        type: "api-key",
        permissions: [
            {
                name: "content.i18n",
                locales: ["en-US"]
            },
            {
                name: "cms.endpoint.read"
            },
            {
                name: "cms.contentModelGroup",
                rwd: "r"
            },
            {
                name: "cms.contentModel",
                rwd: "r"
            }
        ].concat(permissions)
    };
};

describe("READ - resolvers - api key", () => {
    const API_TOKEN = "aToken";

    const manageOpts = {
        path: "manage"
    };
    const readOpts = { path: "read", permissions: [] };

    const manager = useGraphQLHandler(manageOpts);

    beforeEach(async () => {
        await setupGroupAndModels({
            manager,
            models: ["category"]
        });
    });

    it("get entry", async () => {
        // Use "manage" API to create and publish entries
        const { createCategory, publishCategory } = useCategoryManageHandler(manageOpts);

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
        const { id: categoryId } = category;

        // Publish it so it becomes available in the "read" API
        const [publishedCategoryResponse] = await publishCategory({
            variables: {
                revision: categoryId
            }
        });

        const publishedCategory = publishedCategoryResponse.data.publishCategory.data!;

        // See if entries are available via "read" API
        const { getCategory } = useCategoryReadHandler({
            ...readOpts,
            identity: createIdentity([
                {
                    name: "cms.contentEntry",
                    rwd: "r"
                }
            ])
        });

        const queryArgs = {
            where: {
                id: categoryId
            }
        };
        const headers = {
            authorization: API_TOKEN
        };

        const [result] = await getCategory(queryArgs, headers);

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

    it("get entries", async () => {
        // Use "manage" API to create and publish entries
        const { createCategory } = useCategoryManageHandler(manageOpts);

        // Create an entry
        const [create] = await createCategory({
            variables: {
                data: {
                    values: {
                        title: "Title 1",
                        slug: "slug-1"
                    },
                    status: "published"
                }
            }
        });
        const category = create.data.createCategory.data!;

        // See if entries are available via "read" API
        const { listCategories } = useCategoryReadHandler({
            ...readOpts,
            identity: createIdentity([
                {
                    name: "cms.contentEntry",
                    rwd: "r"
                }
            ])
        });

        const queryArgs = {
            where: {
                id: category.id
            }
        };
        const headers = {
            authorization: API_TOKEN
        };

        const [result] = await listCategories(queryArgs, headers);

        expect(result).toEqual({
            data: {
                listCategories: {
                    data: [
                        {
                            id: category.id,
                            entryId: category.entryId,
                            createdOn: category.createdOn,
                            savedOn: category.savedOn,
                            values: {
                                title: category.values.title,
                                slug: category.values.slug
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

    it("cant get entry - missing whole permission", async () => {
        // Use "manage" API to create and publish entries
        const { createCategory, publishCategory } = useCategoryManageHandler(manageOpts);

        // Create an entry
        const [create] = await createCategory({
            variables: {
                data: {
                    values: {
                        title: "Title 1",
                        slug: "slug-1"
                    },
                    status: "published"
                }
            }
        });
        const category = create.data.createCategory.data!;
        const { id: categoryId } = category;

        // See if entries are available via "read" API
        const { getCategory } = useCategoryReadHandler({
            ...readOpts,
            identity: createIdentity()
        });

        const queryArgs = {
            where: {
                id: categoryId
            }
        };
        const headers = {
            authorization: API_TOKEN
        };

        const [result] = await getCategory(queryArgs, headers);

        expect(result).toMatchObject({
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

    it("cant list entries - missing whole permission", async () => {
        // Use "manage" API to create and publish entries
        const { createCategory, publishCategory } = useCategoryManageHandler(manageOpts);

        // Create an entry
        const [create] = await createCategory({
            variables: {
                data: {
                    values: {
                        title: "Title 1",
                        slug: "slug-1"
                    },
                    status: "published"
                }
            }
        });
        const category = create.data.createCategory.data!;
        const { id: categoryId } = category;

        // See if entries are available via "read" API
        const { listCategories } = useCategoryReadHandler({
            ...readOpts,
            identity: createIdentity()
        });

        const queryArgs = {
            where: {
                id: categoryId
            }
        };
        const headers = {
            authorization: API_TOKEN
        };

        const [result] = await listCategories(queryArgs, headers);

        expect(result).toMatchObject({
            data: {
                listCategories: {
                    data: null,
                    error: {
                        code: "Cms/Entry/NotAuthorized",
                        message: 'Not allowed to access "category" entries.'
                    },
                    meta: null
                }
            }
        });
    });

    const notAllowedRwd = [["w"], ["d"], ["wd"]];

    it.each(notAllowedRwd)(`cant get entry - missing "r" permission - having "%s"`, async rwd => {
        // Use "manage" API to create and publish entries
        const { createCategory, publishCategory } = useCategoryManageHandler(manageOpts);

        // Create an entry
        const [create] = await createCategory({
            variables: {
                data: {
                    values: {
                        title: "Title 1",
                        slug: "slug-1"
                    },
                    status: "published"
                }
            }
        });
        const category = create.data.createCategory.data!;

        // See if entries are available via "read" API
        const { getCategory } = useCategoryReadHandler({
            ...readOpts,
            identity: createIdentity([
                {
                    name: "cms.contentEntry",
                    rwd: rwd
                }
            ])
        });

        const queryArgs = {
            where: {
                id: category.id
            }
        };
        const headers = {
            authorization: API_TOKEN
        };

        const [result] = await getCategory(queryArgs, headers);

        expect(result).toMatchObject({
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

    it.each(notAllowedRwd)(
        `cant list entries - missing "r" permission - having "%s"`,
        async rwd => {
            // Use "manage" API to create and publish entries
            const { createCategory } = useCategoryManageHandler(manageOpts);

            // Create an entry
            const [create] = await createCategory({
                variables: {
                    data: {
                        values: {
                            title: "Title 1",
                            slug: "slug-1"
                        },
                        status: "published"
                    }
                }
            });
            const category = create.data.createCategory.data!;

            // See if entries are available via "read" API
            const { listCategories } = useCategoryReadHandler({
                ...readOpts,
                identity: createIdentity([
                    {
                        name: "cms.contentEntry",
                        rwd: rwd
                    }
                ])
            });

            const queryArgs = {
                where: {
                    id: category.id
                }
            };
            const headers = {
                authorization: API_TOKEN
            };

            const [result] = await listCategories(queryArgs, headers);

            expect(result).toMatchObject({
                data: {
                    listCategories: {
                        data: null,
                        error: {
                            code: "Cms/Entry/NotAuthorized",
                            message: 'Not allowed to access "category" entries.'
                        },
                        meta: null
                    }
                }
            });
        }
    );
});
