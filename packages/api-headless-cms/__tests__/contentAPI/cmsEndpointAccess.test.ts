import { CmsContentModelGroupType } from "@webiny/api-headless-cms/types";
import { useContentGqlHandler } from "../utils/useContentGqlHandler";
import { useCategoryManageHandler } from "../utils/useCategoryManageHandler";
import { useCategoryReadHandler } from "../utils/useCategoryReadHandler";
import models from "./mocks/contentModels";

describe("MANAGE - Resolvers", () => {
    let contentModelGroup: CmsContentModelGroupType;

    const esCmsIndex = "root-headless-cms";

    const manageOpts = { path: "manage/en-US" };
    const readOpts = { path: "read/en-US" };
    const previewOpts = { path: "preview/en-US" };
    const defaultPermissions = [
        {
            name: "content.i18n",
            locales: ["en-US"]
        },
        {
            name: "cms.settings"
        },
        {
            name: "cms.manage.contentModelEntry",
            rwd: "rwd"
        }
    ];

    const {
        elasticSearch,
        createContentModelMutation,
        updateContentModelMutation,
        createContentModelGroupMutation
    } = useContentGqlHandler(manageOpts);

    // This function is not directly within `beforeEach` as we don't always setup the same content model.
    // We call this function manually at the beginning of each test, where needed.
    const setupContentModel = async (model = null) => {
        if (!model) {
            model = models.find(m => m.modelId === "category");
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

        // Create initial record
        const [create] = await createContentModelMutation({
            data: {
                name: model.name,
                modelId: model.modelId,
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
                fields: model.fields,
                layout: model.layout
            }
        });

        if (update.errors) {
            console.error(`[beforeEach] ${update.errors[0].message}`);
            process.exit(1);
        }
    };

    beforeEach(async () => {
        try {
            await elasticSearch.indices.create({ index: esCmsIndex });
        } catch {}
    });

    afterEach(async () => {
        try {
            await elasticSearch.indices.delete({ index: esCmsIndex });
        } catch {}
    });

    test(`user has access to manage endpoint`, async () => {
        await setupContentModel();
        const { listCategories } = useCategoryManageHandler({
            ...manageOpts,
            permissions: [
                ...defaultPermissions,
                {
                    name: `cms.endpoint.manage`
                }
            ]
        });

        const [response] = await listCategories();

        expect(response).toMatchObject({
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

    test(`user does not have access to manage endpoint`, async () => {
        await setupContentModel();
        const { listCategories } = useCategoryManageHandler({
            ...manageOpts,
            permissions: [
                ...defaultPermissions,
                {
                    name: "cms.endpoint.read"
                },
                {
                    name: "cms.endpoint.preview"
                }
            ]
        });
        const [response] = await listCategories();

        expect(response).toEqual({
            data: null,
            error: {
                message: "Not authorized!",
                code: "SECURITY_NOT_AUTHORIZED",
                data: {
                    position: "endpoint access"
                }
            }
        });
    });

    test(`user has access to read endpoint`, async () => {
        await setupContentModel();
        const { listCategories } = useCategoryReadHandler({
            ...readOpts,
            permissions: [
                ...defaultPermissions,
                {
                    name: `cms.endpoint.read`
                }
            ]
        });

        const [response] = await listCategories();

        expect(response).toMatchObject({
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

    test(`user does not have access to read endpoint`, async () => {
        await setupContentModel();
        const { listCategories } = useCategoryReadHandler({
            ...readOpts,
            permissions: [
                ...defaultPermissions,
                {
                    name: `cms.endpoint.preview`
                },
                {
                    name: `cms.endpoint.manage`
                }
            ]
        });

        const [response] = await listCategories();

        expect(response).toMatchObject({
            data: null,
            error: {
                message: "Not authorized!",
                code: "SECURITY_NOT_AUTHORIZED",
                data: {
                    position: "endpoint access"
                }
            }
        });
    });

    test(`user has access to preview endpoint`, async () => {
        await setupContentModel();
        const { listCategories } = useCategoryReadHandler({
            ...previewOpts,
            permissions: [
                ...defaultPermissions,
                {
                    name: `cms.endpoint.preview`
                }
            ]
        });

        const [response] = await listCategories();

        expect(response).toMatchObject({
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

    test(`user does not have access to preview endpoint`, async () => {
        await setupContentModel();
        const { listCategories } = useCategoryReadHandler({
            ...previewOpts,
            permissions: [
                ...defaultPermissions,
                {
                    name: `cms.endpoint.read`
                },
                {
                    name: `cms.endpoint.manage`
                }
            ]
        });

        const [response] = await listCategories();

        expect(response).toMatchObject({
            data: null,
            error: {
                message: "Not authorized!",
                code: "SECURITY_NOT_AUTHORIZED",
                data: {
                    position: "endpoint access"
                }
            }
        });
    });
});
