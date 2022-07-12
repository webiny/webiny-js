import { useCategoryManageHandler } from "../utils/useCategoryManageHandler";
import { assignEntryEvents, pubSubTracker } from "./mocks/lifecycleHooks";
import models from "./mocks/contentModels";
import { useGraphQLHandler } from "../utils/useGraphQLHandler";
import { CmsGroup, CmsModel } from "~/types";

describe("contentEntryHooks", () => {
    let contentModelGroup: CmsGroup;
    const manageOpts = { path: "manage/en-US" };

    const {
        createContentModelMutation,
        updateContentModelMutation,
        createContentModelGroupMutation
    } = useGraphQLHandler(manageOpts);

    const setupContentModel = async (model?: CmsModel) => {
        if (!model) {
            model = models.find(m => m.modelId === "category");
            if (!model) {
                throw new Error("Could not find model `category`.");
            }
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
        await setupContentModel();
        pubSubTracker.reset();
    });

    test("should execute hooks on create", async () => {
        const { createCategory } = useCategoryManageHandler({
            ...manageOpts,
            plugins: [assignEntryEvents()]
        });

        const [response] = await createCategory({
            data: {
                title: "category",
                slug: "category"
            }
        });

        expect(response).toEqual({
            data: {
                createCategory: {
                    data: expect.any(Object),
                    error: null
                }
            }
        });

        expect(pubSubTracker.isExecutedOnce("contentEntry:beforeCreate")).toEqual(true);
        expect(pubSubTracker.isExecutedOnce("contentEntry:afterCreate")).toEqual(true);
        expect(pubSubTracker.isExecutedOnce("contentEntry:beforeCreateRevisionFrom")).toEqual(
            false
        );
        expect(pubSubTracker.isExecutedOnce("contentEntry:afterCreateRevisionFrom")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentEntry:beforeUpdate")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentEntry:afterUpdate")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentEntry:beforeDelete")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentEntry:afterDelete")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentEntry:beforePublish")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentEntry:afterPublish")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentEntry:beforeUnpublish")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentEntry:afterUnpublish")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentEntry:beforeRequestChanges")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentEntry:afterRequestChanges")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentEntry:beforeRequestReview")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentEntry:afterRequestReview")).toEqual(false);
    });

    test("should execute hooks on create from revision", async () => {
        const { createCategory, createCategoryFrom } = useCategoryManageHandler({
            ...manageOpts,
            plugins: [assignEntryEvents()]
        });

        const [createResponse] = await createCategory({
            data: {
                title: "category",
                slug: "category"
            }
        });

        const { id } = createResponse.data.createCategory.data;

        pubSubTracker.reset();

        const [response] = await createCategoryFrom({
            revision: id
        });

        expect(response).toEqual({
            data: {
                createCategoryFrom: {
                    data: expect.any(Object),
                    error: null
                }
            }
        });

        expect(pubSubTracker.isExecutedOnce("contentEntry:beforeCreate")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentEntry:afterCreate")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentEntry:beforeCreateRevisionFrom")).toEqual(true);
        expect(pubSubTracker.isExecutedOnce("contentEntry:afterCreateRevisionFrom")).toEqual(true);
        expect(pubSubTracker.isExecutedOnce("contentEntry:beforeUpdate")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentEntry:afterUpdate")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentEntry:beforeDelete")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentEntry:afterDelete")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentEntry:beforePublish")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentEntry:afterPublish")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentEntry:beforeUnpublish")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentEntry:afterUnpublish")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentEntry:beforeRequestChanges")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentEntry:afterRequestChanges")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentEntry:beforeRequestReview")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentEntry:afterRequestReview")).toEqual(false);
    });

    test("should execute hooks on update", async () => {
        const { createCategory, updateCategory } = useCategoryManageHandler({
            ...manageOpts,
            plugins: [assignEntryEvents()]
        });

        const [createResponse] = await createCategory({
            data: {
                title: "category",
                slug: "category"
            }
        });

        const { id } = createResponse.data.createCategory.data;

        pubSubTracker.reset();

        const [response] = await updateCategory({
            revision: id,
            data: {
                title: "updated category",
                slug: "updated-slug"
            }
        });

        expect(response).toEqual({
            data: {
                updateCategory: {
                    data: expect.any(Object),
                    error: null
                }
            }
        });

        expect(pubSubTracker.isExecutedOnce("contentEntry:beforeCreate")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentEntry:afterCreate")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentEntry:beforeCreateRevisionFrom")).toEqual(
            false
        );
        expect(pubSubTracker.isExecutedOnce("contentEntry:afterCreateRevisionFrom")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentEntry:beforeUpdate")).toEqual(true);
        expect(pubSubTracker.isExecutedOnce("contentEntry:afterUpdate")).toEqual(true);
        expect(pubSubTracker.isExecutedOnce("contentEntry:beforeDelete")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentEntry:afterDelete")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentEntry:beforePublish")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentEntry:afterPublish")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentEntry:beforeUnpublish")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentEntry:afterUnpublish")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentEntry:beforeRequestChanges")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentEntry:afterRequestChanges")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentEntry:beforeRequestReview")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentEntry:afterRequestReview")).toEqual(false);
    });

    test("should execute hooks on delete revision", async () => {
        const { createCategory, createCategoryFrom, deleteCategory } = useCategoryManageHandler({
            ...manageOpts,
            plugins: [assignEntryEvents()]
        });

        const [createResponse] = await createCategory({
            data: {
                title: "category",
                slug: "category"
            }
        });

        const { id } = createResponse.data.createCategory.data;

        // create another category
        await createCategoryFrom({
            revision: id
        });

        pubSubTracker.reset();

        const [response] = await deleteCategory({
            revision: id
        });

        expect(response).toEqual({
            data: {
                deleteCategory: {
                    data: true,
                    error: null
                }
            }
        });

        expect(pubSubTracker.isExecutedOnce("contentEntry:beforeCreate")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentEntry:afterCreate")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentEntry:beforeCreateRevisionFrom")).toEqual(
            false
        );
        expect(pubSubTracker.isExecutedOnce("contentEntry:afterCreateRevisionFrom")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentEntry:beforeUpdate")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentEntry:afterUpdate")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentEntry:beforeDeleteRevision")).toEqual(true);
        expect(pubSubTracker.isExecutedOnce("contentEntry:afterDeleteRevision")).toEqual(true);
        expect(pubSubTracker.isExecutedOnce("contentEntry:beforeDelete")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentEntry:afterDelete")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentEntry:beforePublish")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentEntry:afterPublish")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentEntry:beforeUnpublish")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentEntry:afterUnpublish")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentEntry:beforeRequestChanges")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentEntry:afterRequestChanges")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentEntry:beforeRequestReview")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentEntry:afterRequestReview")).toEqual(false);
    });

    test("should execute hooks on delete whole entry and its versions", async () => {
        const { createCategory, deleteCategory } = useCategoryManageHandler({
            ...manageOpts,
            plugins: [assignEntryEvents()]
        });

        const [createResponse] = await createCategory({
            data: {
                title: "category",
                slug: "category"
            }
        });

        const { id: revisionId } = createResponse.data.createCategory.data;

        const id = revisionId.split("#").shift();

        pubSubTracker.reset();

        const [response] = await deleteCategory({
            revision: id
        });

        expect(response).toEqual({
            data: {
                deleteCategory: {
                    data: true,
                    error: null
                }
            }
        });

        expect(pubSubTracker.isExecutedOnce("contentEntry:beforeCreate")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentEntry:afterCreate")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentEntry:beforeCreateRevisionFrom")).toEqual(
            false
        );
        expect(pubSubTracker.isExecutedOnce("contentEntry:afterCreateRevisionFrom")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentEntry:beforeUpdate")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentEntry:afterUpdate")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentEntry:beforeDeleteRevision")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentEntry:afterDeleteRevision")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentEntry:beforeDelete")).toEqual(true);
        expect(pubSubTracker.isExecutedOnce("contentEntry:afterDelete")).toEqual(true);
        expect(pubSubTracker.isExecutedOnce("contentEntry:beforePublish")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentEntry:afterPublish")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentEntry:beforeUnpublish")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentEntry:afterUnpublish")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentEntry:beforeRequestChanges")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentEntry:afterRequestChanges")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentEntry:beforeRequestReview")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentEntry:afterRequestReview")).toEqual(false);
    });

    test("should execute hooks on publish", async () => {
        const { createCategory, publishCategory } = useCategoryManageHandler({
            ...manageOpts,
            plugins: [assignEntryEvents()]
        });

        const [createResponse] = await createCategory({
            data: {
                title: "category",
                slug: "category"
            }
        });

        const { id } = createResponse.data.createCategory.data;

        pubSubTracker.reset();

        const [response] = await publishCategory({
            revision: id
        });

        expect(response).toEqual({
            data: {
                publishCategory: {
                    data: expect.any(Object),
                    error: null
                }
            }
        });

        expect(pubSubTracker.isExecutedOnce("contentEntry:beforeCreate")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentEntry:afterCreate")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentEntry:beforeCreateRevisionFrom")).toEqual(
            false
        );
        expect(pubSubTracker.isExecutedOnce("contentEntry:afterCreateRevisionFrom")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentEntry:beforeUpdate")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentEntry:afterUpdate")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentEntry:beforeDeleteRevision")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentEntry:afterDeleteRevision")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentEntry:beforeDelete")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentEntry:afterDelete")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentEntry:beforePublish")).toEqual(true);
        expect(pubSubTracker.isExecutedOnce("contentEntry:afterPublish")).toEqual(true);
        expect(pubSubTracker.isExecutedOnce("contentEntry:beforeUnpublish")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentEntry:afterUnpublish")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentEntry:beforeRequestChanges")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentEntry:afterRequestChanges")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentEntry:beforeRequestReview")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentEntry:afterRequestReview")).toEqual(false);
    });

    test("should execute hooks on unpublish", async () => {
        const { createCategory, unpublishCategory, publishCategory } = useCategoryManageHandler({
            ...manageOpts,
            plugins: [assignEntryEvents()]
        });

        const [createResponse] = await createCategory({
            data: {
                title: "category",
                slug: "category"
            }
        });

        const { id } = createResponse.data.createCategory.data;

        await publishCategory({
            revision: id
        });

        pubSubTracker.reset();

        const [response] = await unpublishCategory({
            revision: id
        });

        expect(response).toEqual({
            data: {
                unpublishCategory: {
                    data: expect.any(Object),
                    error: null
                }
            }
        });

        expect(pubSubTracker.isExecutedOnce("contentEntry:beforeCreate")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentEntry:afterCreate")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentEntry:beforeCreateRevisionFrom")).toEqual(
            false
        );
        expect(pubSubTracker.isExecutedOnce("contentEntry:afterCreateRevisionFrom")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentEntry:beforeUpdate")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentEntry:afterUpdate")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentEntry:beforeDeleteRevision")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentEntry:afterDeleteRevision")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentEntry:beforeDelete")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentEntry:afterDelete")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentEntry:beforePublish")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentEntry:afterPublish")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentEntry:beforeUnpublish")).toEqual(true);
        expect(pubSubTracker.isExecutedOnce("contentEntry:afterUnpublish")).toEqual(true);
        expect(pubSubTracker.isExecutedOnce("contentEntry:beforeRequestChanges")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentEntry:afterRequestChanges")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentEntry:beforeRequestReview")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentEntry:afterRequestReview")).toEqual(false);
    });

    test("should execute hooks on request changes", async () => {
        const { createCategory, requestCategoryReview } = useCategoryManageHandler(manageOpts);

        const [createResponse] = await createCategory({
            data: {
                title: "category",
                slug: "category"
            }
        });

        const { id } = createResponse.data.createCategory.data;

        await requestCategoryReview({
            revision: id
        });
        const { requestCategoryChanges } = useCategoryManageHandler({
            ...manageOpts,
            identity: {
                id: "1234",
                displayName: "User 1234",
                type: "admin"
            },
            plugins: [assignEntryEvents()]
        });

        const [response] = await requestCategoryChanges({
            revision: id
        });

        expect(response).toEqual({
            data: {
                requestCategoryChanges: {
                    data: expect.any(Object),
                    error: null
                }
            }
        });

        expect(pubSubTracker.isExecutedOnce("contentEntry:beforeCreate")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentEntry:afterCreate")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentEntry:beforeCreateRevisionFrom")).toEqual(
            false
        );
        expect(pubSubTracker.isExecutedOnce("contentEntry:afterCreateRevisionFrom")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentEntry:beforeUpdate")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentEntry:afterUpdate")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentEntry:beforeDeleteRevision")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentEntry:afterDeleteRevision")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentEntry:beforeDelete")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentEntry:afterDelete")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentEntry:beforePublish")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentEntry:afterPublish")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentEntry:beforeUnpublish")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentEntry:afterUnpublish")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentEntry:beforeRequestChanges")).toEqual(true);
        expect(pubSubTracker.isExecutedOnce("contentEntry:afterRequestChanges")).toEqual(true);
        expect(pubSubTracker.isExecutedOnce("contentEntry:beforeRequestReview")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentEntry:afterRequestReview")).toEqual(false);
    });

    test("should execute hooks on request review", async () => {
        const { createCategory, requestCategoryReview } = useCategoryManageHandler({
            ...manageOpts,
            plugins: [assignEntryEvents()]
        });

        const [createResponse] = await createCategory({
            data: {
                title: "category",
                slug: "category"
            }
        });

        const { id } = createResponse.data.createCategory.data;
        pubSubTracker.reset();

        const [response] = await requestCategoryReview({
            revision: id
        });

        expect(response).toEqual({
            data: {
                requestCategoryReview: {
                    data: expect.any(Object),
                    error: null
                }
            }
        });

        expect(pubSubTracker.isExecutedOnce("contentEntry:beforeCreate")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentEntry:afterCreate")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentEntry:beforeCreateRevisionFrom")).toEqual(
            false
        );
        expect(pubSubTracker.isExecutedOnce("contentEntry:afterCreateRevisionFrom")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentEntry:beforeUpdate")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentEntry:afterUpdate")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentEntry:beforeDeleteRevision")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentEntry:afterDeleteRevision")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentEntry:beforeDelete")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentEntry:afterDelete")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentEntry:beforePublish")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentEntry:afterPublish")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentEntry:beforeUnpublish")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentEntry:afterUnpublish")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentEntry:beforeRequestChanges")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentEntry:afterRequestChanges")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentEntry:beforeRequestReview")).toEqual(true);
        expect(pubSubTracker.isExecutedOnce("contentEntry:afterRequestReview")).toEqual(true);
    });

    test("should execute hooks on get and list", async () => {
        const { createCategory, getCategory, listCategories, until } = useCategoryManageHandler({
            ...manageOpts,
            plugins: [assignEntryEvents()]
        });

        const [createResponse] = await createCategory({
            data: {
                title: "category",
                slug: "category"
            }
        });

        const category = createResponse.data.createCategory.data;
        const { id } = category;

        await until(
            () => listCategories(),
            ([response]: any) => {
                if (response.data.listCategories.data.length === 0) {
                    return false;
                }
                return response.data.listCategories.data.some((category: any) => {
                    return category.id === id;
                });
            },
            {
                name: "list categories after create"
            }
        );

        pubSubTracker.reset();

        const [getResponse] = await getCategory({
            revision: id
        });

        expect(getResponse).toEqual({
            data: {
                getCategory: {
                    data: category,
                    error: null
                }
            }
        });

        expect(pubSubTracker.isExecutedOnce("contentEntry:beforeCreate")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentEntry:afterCreate")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentEntry:beforeCreateRevisionFrom")).toEqual(
            false
        );
        expect(pubSubTracker.isExecutedOnce("contentEntry:afterCreateRevisionFrom")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentEntry:beforeUpdate")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentEntry:afterUpdate")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentEntry:beforeDeleteRevision")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentEntry:afterDeleteRevision")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentEntry:beforeDelete")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentEntry:afterDelete")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentEntry:beforePublish")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentEntry:afterPublish")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentEntry:beforeUnpublish")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentEntry:afterUnpublish")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentEntry:beforeRequestChanges")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentEntry:afterRequestChanges")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentEntry:beforeRequestReview")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentEntry:afterRequestReview")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentEntry:beforeGet")).toEqual(true);
        expect(pubSubTracker.isExecutedOnce("contentEntry:beforeList")).toEqual(false);

        pubSubTracker.reset();
        const [listResponse] = await listCategories({
            where: {
                id_in: [id]
            }
        });

        expect(listResponse).toEqual({
            data: {
                listCategories: {
                    data: [
                        {
                            ...category
                        }
                    ],
                    meta: {
                        hasMoreItems: false,
                        totalCount: 1,
                        cursor: null
                    },
                    error: null
                }
            }
        });

        expect(pubSubTracker.isExecutedOnce("contentEntry:beforeCreate")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentEntry:afterCreate")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentEntry:beforeCreateRevisionFrom")).toEqual(
            false
        );
        expect(pubSubTracker.isExecutedOnce("contentEntry:afterCreateRevisionFrom")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentEntry:beforeUpdate")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentEntry:afterUpdate")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentEntry:beforeDeleteRevision")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentEntry:afterDeleteRevision")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentEntry:beforeDelete")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentEntry:afterDelete")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentEntry:beforePublish")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentEntry:afterPublish")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentEntry:beforeUnpublish")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentEntry:afterUnpublish")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentEntry:beforeRequestChanges")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentEntry:afterRequestChanges")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentEntry:beforeRequestReview")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentEntry:afterRequestReview")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentEntry:beforeGet")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentEntry:beforeList")).toEqual(true);
    });
});
