import { CmsContentModelGroup } from "../../src/types";
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
                name: "content.i18n",
                locales: ["en-US"]
            },
            {
                name: "cms.endpoint.preview"
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

describe("PREVIEW - resolvers - api key", () => {
    let contentModelGroup: CmsContentModelGroup;

    const API_TOKEN = "aToken";

    const manageOpts = {
        path: "manage/en-US"
    };
    const previewOpts = { path: "preview/en-US", permissions: [] };

    const {
        createContentModelMutation,
        updateContentModelMutation,
        createContentModelGroupMutation
    } = useContentGqlHandler(manageOpts);

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

    test("get entry", async () => {
        // Use "manage" API to create and publish entries
        const { until, createCategory } = useCategoryManageHandler(manageOpts);

        // Create an entry
        const [create] = await createCategory({ data: { title: "Title 1", slug: "slug-1" } });
        const category = create.data.createCategory.data;
        const { id: categoryId } = category;

        // We don't need to publish the entry for it to become available on "preview" API

        // See if entry is available via "preview" API
        const { getCategory } = useCategoryReadHandler({
            ...previewOpts,
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
                        entryId: category.entryId,
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
        const { until, createCategory } = useCategoryManageHandler(manageOpts);

        // Create an entry
        const [create] = await createCategory({ data: { title: "Title 1", slug: "slug-1" } });
        const category = create.data.createCategory.data;
        const { id: categoryId } = category;

        // We don't need to publish the entry for it to become available on "preview" API

        // See if entries are available via "preview" API
        const { listCategories } = useCategoryReadHandler({
            ...previewOpts,
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

        expect(result).toEqual({
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
                        cursor: null,
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
            getCategory: getCategoryViaManager
        } = useCategoryManageHandler(manageOpts);

        // Create an entry
        const [create] = await createCategory({ data: { title: "Title 1", slug: "slug-1" } });
        const category = create.data.createCategory.data;
        const { id: categoryId } = category;

        // We don't need to publish the entry for it to become available on "preview" API

        // See if entries are available via "preview" API
        const { getCategory } = useCategoryReadHandler({
            ...previewOpts,
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
                            reason: `Missing permission "cms.contentEntry".`
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
            getCategory: getCategoryViaManager
        } = useCategoryManageHandler(manageOpts);

        // Create an entry
        const [create] = await createCategory({ data: { title: "Title 1", slug: "slug-1" } });
        const category = create.data.createCategory.data;
        const { id: categoryId } = category;

        // We don't need to publish the entry for it to become available on "preview" API

        // See if entries are available via "preview" API
        const { listCategories } = useCategoryReadHandler({
            ...previewOpts,
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
                            reason: `Missing permission "cms.contentEntry".`
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
            getCategory: getCategoryViaManager
        } = useCategoryManageHandler(manageOpts);

        // Create an entry
        const [create] = await createCategory({ data: { title: "Title 1", slug: "slug-1" } });
        const category = create.data.createCategory.data;
        const { id: categoryId } = category;

        // We don't need to publish the entry for it to become available on "preview" API

        // See if entries are available via "preview" API
        const { getCategory } = useCategoryReadHandler({
            ...previewOpts,
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
                            reason: `Not allowed to perform "read" on "cms.contentEntry".`
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
                getCategory: getCategoryViaManager
            } = useCategoryManageHandler(manageOpts);

            // Create an entry
            const [create] = await createCategory({ data: { title: "Title 1", slug: "slug-1" } });
            const category = create.data.createCategory.data;
            const { id: categoryId } = category;

            // We don't need to publish the entry for it to become available on "preview" API

            // See if entries are available via "preview" API
            const { listCategories } = useCategoryReadHandler({
                ...previewOpts,
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
                                reason: `Not allowed to perform "read" on "cms.contentEntry".`
                            }
                        },
                        meta: null
                    }
                }
            });
        }
    );
});
