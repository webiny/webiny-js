import { CmsContentModelGroup } from "../../src/types";
import { useContentGqlHandler } from "../utils/useContentGqlHandler";
import { useCategoryManageHandler } from "../utils/useCategoryManageHandler";
import { useCategoryReadHandler } from "../utils/useCategoryReadHandler";
import models from "./mocks/contentModels";

describe("Endpoint access", () => {
    let contentModelGroup: CmsContentModelGroup;

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
            name: "cms.contentEntry",
            rwd: "rwd"
        },
        {
            name: "cms.contentModelGroup",
            rwd: "r"
        },
        {
            name: "cms.contentModel"
        }
    ];

    const {
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

        expect(response).toEqual({
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
                    reason: `Not allowed to access "manage" endpoint.`
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

        expect(response).toEqual({
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

        expect(response).toEqual({
            data: null,
            error: {
                message: "Not authorized!",
                code: "SECURITY_NOT_AUTHORIZED",
                data: {
                    reason: `Not allowed to access "read" endpoint.`
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

        expect(response).toEqual({
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

        expect(response).toEqual({
            data: null,
            error: {
                message: "Not authorized!",
                code: "SECURITY_NOT_AUTHORIZED",
                data: {
                    reason: `Not allowed to access "preview" endpoint.`
                }
            }
        });
    });
});
