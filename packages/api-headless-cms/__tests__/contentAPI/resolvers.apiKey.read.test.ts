import { CmsContentModelGroupType } from "@webiny/api-headless-cms/types";
import { useContentGqlHandler } from "../utils/useContentGqlHandler";
import models from "./mocks/contentModels";
import { useCategoryManageHandler } from "../utils/useCategoryManageHandler";
import { useCategoryReadHandler } from "../utils/useCategoryReadHandler";
import { SecurityIdentity } from "@webiny/api-security/types";

const createIdentity = (permissions: any[] = []): SecurityIdentity => {
    return {
        id: "api123",
        displayName: "API",
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
                name: "cms.endpoint.read"
            },
            {
                name: "cms.contentModel"
            }
        ].concat(permissions)
    };
};

describe("READ - resolvers - api key", () => {
    let contentModelGroup: CmsContentModelGroupType;

    const API_TOKEN = "aToken";

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

    test("get entry", async () => {
        // Use "manage" API to create and publish entries
        const { until, createCategory, publishCategory } = useCategoryManageHandler(manageOpts);

        // Create an entry
        const [create] = await createCategory({ data: { title: "Title 1", slug: "slug-1" } });
        const category = create.data.createCategory.data;
        const { id: categoryId } = category;

        // Publish it so it becomes available in the "read" API
        await publishCategory({ revision: categoryId });

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
            Authorization: API_TOKEN
        };
        // If this `until` resolves successfully, we know entry is accessible via the "read" API
        await until(
            () => getCategory(queryArgs, headers).then(([data]) => data),
            ({ data }) => data.getCategory.data.id === categoryId
        );

        const [result] = await getCategory(queryArgs, headers);

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

    test("get entries", async () => {
        // Use "manage" API to create and publish entries
        const { until, createCategory, publishCategory } = useCategoryManageHandler(manageOpts);

        // Create an entry
        const [create] = await createCategory({ data: { title: "Title 1", slug: "slug-1" } });
        const category = create.data.createCategory.data;
        const { id: categoryId } = category;

        // Publish it so it becomes available in the "read" API
        await publishCategory({ revision: categoryId });

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
                id: categoryId
            }
        };
        const headers = {
            Authorization: API_TOKEN
        };
        // If this `until` resolves successfully, we know entry is accessible via the "read" API
        await until(
            () => listCategories(queryArgs, headers).then(([data]) => data),
            ({ data }) => data.listCategories.data[0].id === categoryId
        );

        const [result] = await listCategories(queryArgs, headers);

        expect(result).toMatchObject({
            data: {
                listCategories: {
                    data: [
                        {
                            id: category.id,
                            createdOn: category.createdOn,
                            savedOn: category.savedOn,
                            title: category.title,
                            slug: category.slug
                        }
                    ],
                    meta: {
                        cursor: /^([a-zA-Z0-9]+)$/,
                        hasMoreItems: false,
                        totalCount: 1
                    },
                    error: null
                }
            }
        });
    });

    test("cant get entry - missing whole permission", async () => {
        // Use "manage" API to create and publish entries
        const {
            until,
            createCategory,
            publishCategory,
            getCategory: getCategoryViaManager
        } = useCategoryManageHandler(manageOpts);

        // Create an entry
        const [create] = await createCategory({ data: { title: "Title 1", slug: "slug-1" } });
        const category = create.data.createCategory.data;
        const { id: categoryId } = category;

        // Publish it so it becomes available in the "read" API
        await publishCategory({ revision: categoryId });

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
            Authorization: API_TOKEN
        };
        // If this `until` resolves successfully, we know entry is accessible via the "read" API
        await until(
            () =>
                getCategoryViaManager({
                    revision: categoryId
                }).then(([data]) => data),
            ({ data }) => data.getCategory.data.id === categoryId
        );

        const [result] = await getCategory(queryArgs, headers);

        expect(result).toEqual({
            data: {
                getCategory: {
                    data: null,
                    error: {
                        code: "SECURITY_NOT_AUTHORIZED",
                        message: `Not authorized!`,
                        data: {
                            reason: `missing permission "cms.contentEntry"`
                        }
                    }
                }
            }
        });
    });

    test("cant list entries - missing whole permission", async () => {
        // Use "manage" API to create and publish entries
        const {
            until,
            createCategory,
            publishCategory,
            getCategory: getCategoryViaManager
        } = useCategoryManageHandler(manageOpts);

        // Create an entry
        const [create] = await createCategory({ data: { title: "Title 1", slug: "slug-1" } });
        const category = create.data.createCategory.data;
        const { id: categoryId } = category;

        // Publish it so it becomes available in the "read" API
        await publishCategory({ revision: categoryId });

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
            Authorization: API_TOKEN
        };
        // If this `until` resolves successfully, we know entry is accessible via the "read" API
        await until(
            () =>
                getCategoryViaManager({
                    revision: categoryId
                }).then(([data]) => data),
            ({ data }) => data.getCategory.data.id === categoryId
        );

        const [result] = await listCategories(queryArgs, headers);

        expect(result).toEqual({
            data: {
                listCategories: {
                    data: null,
                    error: {
                        code: "SECURITY_NOT_AUTHORIZED",
                        message: `Not authorized!`,
                        data: {
                            reason: `missing permission "cms.contentEntry"`
                        }
                    },
                    meta: null
                }
            }
        });
    });

    const notAllowedRwd = [["w"], ["d"], ["wd"]];

    test.each(notAllowedRwd)(`cant get entry - missing "r" permission - having "%s"`, async rwd => {
        // Use "manage" API to create and publish entries
        const {
            until,
            createCategory,
            publishCategory,
            getCategory: getCategoryViaManager
        } = useCategoryManageHandler(manageOpts);

        // Create an entry
        const [create] = await createCategory({ data: { title: "Title 1", slug: "slug-1" } });
        const category = create.data.createCategory.data;
        const { id: categoryId } = category;

        // Publish it so it becomes available in the "read" API
        await publishCategory({ revision: categoryId });

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
                id: categoryId
            }
        };
        const headers = {
            Authorization: API_TOKEN
        };
        // If this `until` resolves successfully, we know entry is accessible via the "read" API
        await until(
            () =>
                getCategoryViaManager({
                    revision: categoryId
                }).then(([data]) => data),
            ({ data }) => data.getCategory.data.id === categoryId
        );

        const [result] = await getCategory(queryArgs, headers);

        expect(result).toEqual({
            data: {
                getCategory: {
                    data: null,
                    error: {
                        code: "SECURITY_NOT_AUTHORIZED",
                        message: `Not authorized!`,
                        data: {
                            reason: `missing "cms.contentEntry" rwd "r"`
                        }
                    }
                }
            }
        });
    });

    test.each(notAllowedRwd)(
        `cant list entries - missing "r" permission - having "%s"`,
        async rwd => {
            // Use "manage" API to create and publish entries
            const {
                until,
                createCategory,
                publishCategory,
                getCategory: getCategoryViaManager
            } = useCategoryManageHandler(manageOpts);

            // Create an entry
            const [create] = await createCategory({ data: { title: "Title 1", slug: "slug-1" } });
            const category = create.data.createCategory.data;
            const { id: categoryId } = category;

            // Publish it so it becomes available in the "read" API
            await publishCategory({ revision: categoryId });

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
                    id: categoryId
                }
            };
            const headers = {
                Authorization: API_TOKEN
            };
            // If this `until` resolves successfully, we know entry is accessible via the "read" API
            await until(
                () =>
                    getCategoryViaManager({
                        revision: categoryId
                    }).then(([data]) => data),
                ({ data }) => data.getCategory.data.id === categoryId
            );

            const [result] = await listCategories(queryArgs, headers);

            expect(result).toEqual({
                data: {
                    listCategories: {
                        data: null,
                        error: {
                            code: "SECURITY_NOT_AUTHORIZED",
                            message: `Not authorized!`,
                            data: {
                                reason: `missing "cms.contentEntry" rwd "r"`
                            }
                        },
                        meta: null
                    }
                }
            });
        }
    );
});
