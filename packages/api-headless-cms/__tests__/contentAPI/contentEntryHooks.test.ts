import { useCategoryManageHandler } from "../utils/useCategoryManageHandler";
import { contentEntryHooks, hooksTracker } from "./mocks/lifecycleHooks";
import models from "./mocks/contentModels";
import { useContentGqlHandler } from "../utils/useContentGqlHandler";
import { CmsContentModelGroup } from "~/types";

describe("contentEntryHooks", () => {
    let contentModelGroup: CmsContentModelGroup;
    const manageOpts = { path: "manage/en-US" };

    const {
        createContentModelMutation,
        updateContentModelMutation,
        createContentModelGroupMutation
    } = useContentGqlHandler(manageOpts);

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
        await setupContentModel();
        hooksTracker.reset();
    });

    test("should execute hooks on create", async () => {
        const { createCategory } = useCategoryManageHandler(manageOpts, [contentEntryHooks()]);

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

        expect(hooksTracker.isExecutedOnce("contentEntry:beforeCreate")).toEqual(true);
        expect(hooksTracker.isExecutedOnce("contentEntry:afterCreate")).toEqual(true);
        expect(hooksTracker.isExecutedOnce("contentEntry:beforeCreateRevisionFrom")).toEqual(false);
        expect(hooksTracker.isExecutedOnce("contentEntry:afterCreateRevisionFrom")).toEqual(false);
        expect(hooksTracker.isExecutedOnce("contentEntry:beforeUpdate")).toEqual(false);
        expect(hooksTracker.isExecutedOnce("contentEntry:afterUpdate")).toEqual(false);
        expect(hooksTracker.isExecutedOnce("contentEntry:beforeDelete")).toEqual(false);
        expect(hooksTracker.isExecutedOnce("contentEntry:afterDelete")).toEqual(false);
        expect(hooksTracker.isExecutedOnce("contentEntry:beforePublish")).toEqual(false);
        expect(hooksTracker.isExecutedOnce("contentEntry:afterPublish")).toEqual(false);
        expect(hooksTracker.isExecutedOnce("contentEntry:beforeUnpublish")).toEqual(false);
        expect(hooksTracker.isExecutedOnce("contentEntry:afterUnpublish")).toEqual(false);
        expect(hooksTracker.isExecutedOnce("contentEntry:beforeRequestChanges")).toEqual(false);
        expect(hooksTracker.isExecutedOnce("contentEntry:afterRequestChanges")).toEqual(false);
        expect(hooksTracker.isExecutedOnce("contentEntry:beforeRequestReview")).toEqual(false);
        expect(hooksTracker.isExecutedOnce("contentEntry:afterRequestReview")).toEqual(false);
    });

    test("should execute hooks on create from revision", async () => {
        const { createCategory, createCategoryFrom } = useCategoryManageHandler(manageOpts, [
            contentEntryHooks()
        ]);

        const [createResponse] = await createCategory({
            data: {
                title: "category",
                slug: "category"
            }
        });

        const { id } = createResponse.data.createCategory.data;

        hooksTracker.reset();

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

        expect(hooksTracker.isExecutedOnce("contentEntry:beforeCreate")).toEqual(false);
        expect(hooksTracker.isExecutedOnce("contentEntry:afterCreate")).toEqual(false);
        expect(hooksTracker.isExecutedOnce("contentEntry:beforeCreateRevisionFrom")).toEqual(true);
        expect(hooksTracker.isExecutedOnce("contentEntry:afterCreateRevisionFrom")).toEqual(true);
        expect(hooksTracker.isExecutedOnce("contentEntry:beforeUpdate")).toEqual(false);
        expect(hooksTracker.isExecutedOnce("contentEntry:afterUpdate")).toEqual(false);
        expect(hooksTracker.isExecutedOnce("contentEntry:beforeDelete")).toEqual(false);
        expect(hooksTracker.isExecutedOnce("contentEntry:afterDelete")).toEqual(false);
        expect(hooksTracker.isExecutedOnce("contentEntry:beforePublish")).toEqual(false);
        expect(hooksTracker.isExecutedOnce("contentEntry:afterPublish")).toEqual(false);
        expect(hooksTracker.isExecutedOnce("contentEntry:beforeUnpublish")).toEqual(false);
        expect(hooksTracker.isExecutedOnce("contentEntry:afterUnpublish")).toEqual(false);
        expect(hooksTracker.isExecutedOnce("contentEntry:beforeRequestChanges")).toEqual(false);
        expect(hooksTracker.isExecutedOnce("contentEntry:afterRequestChanges")).toEqual(false);
        expect(hooksTracker.isExecutedOnce("contentEntry:beforeRequestReview")).toEqual(false);
        expect(hooksTracker.isExecutedOnce("contentEntry:afterRequestReview")).toEqual(false);
    });

    test("should execute hooks on update", async () => {
        const { createCategory, updateCategory } = useCategoryManageHandler(manageOpts, [
            contentEntryHooks()
        ]);

        const [createResponse] = await createCategory({
            data: {
                title: "category",
                slug: "category"
            }
        });

        const { id } = createResponse.data.createCategory.data;

        hooksTracker.reset();

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

        expect(hooksTracker.isExecutedOnce("contentEntry:beforeCreate")).toEqual(false);
        expect(hooksTracker.isExecutedOnce("contentEntry:afterCreate")).toEqual(false);
        expect(hooksTracker.isExecutedOnce("contentEntry:beforeCreateRevisionFrom")).toEqual(false);
        expect(hooksTracker.isExecutedOnce("contentEntry:afterCreateRevisionFrom")).toEqual(false);
        expect(hooksTracker.isExecutedOnce("contentEntry:beforeUpdate")).toEqual(true);
        expect(hooksTracker.isExecutedOnce("contentEntry:afterUpdate")).toEqual(true);
        expect(hooksTracker.isExecutedOnce("contentEntry:beforeDelete")).toEqual(false);
        expect(hooksTracker.isExecutedOnce("contentEntry:afterDelete")).toEqual(false);
        expect(hooksTracker.isExecutedOnce("contentEntry:beforePublish")).toEqual(false);
        expect(hooksTracker.isExecutedOnce("contentEntry:afterPublish")).toEqual(false);
        expect(hooksTracker.isExecutedOnce("contentEntry:beforeUnpublish")).toEqual(false);
        expect(hooksTracker.isExecutedOnce("contentEntry:afterUnpublish")).toEqual(false);
        expect(hooksTracker.isExecutedOnce("contentEntry:beforeRequestChanges")).toEqual(false);
        expect(hooksTracker.isExecutedOnce("contentEntry:afterRequestChanges")).toEqual(false);
        expect(hooksTracker.isExecutedOnce("contentEntry:beforeRequestReview")).toEqual(false);
        expect(hooksTracker.isExecutedOnce("contentEntry:afterRequestReview")).toEqual(false);
    });

    test("should execute hooks on delete revision", async () => {
        const { createCategory, createCategoryFrom, deleteCategory, sleep } =
            useCategoryManageHandler(manageOpts, [contentEntryHooks()]);

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

        // wait for data to be come available
        await sleep(1000);

        hooksTracker.reset();

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

        expect(hooksTracker.isExecutedOnce("contentEntry:beforeCreate")).toEqual(false);
        expect(hooksTracker.isExecutedOnce("contentEntry:afterCreate")).toEqual(false);
        expect(hooksTracker.isExecutedOnce("contentEntry:beforeCreateRevisionFrom")).toEqual(false);
        expect(hooksTracker.isExecutedOnce("contentEntry:afterCreateRevisionFrom")).toEqual(false);
        expect(hooksTracker.isExecutedOnce("contentEntry:beforeUpdate")).toEqual(false);
        expect(hooksTracker.isExecutedOnce("contentEntry:afterUpdate")).toEqual(false);
        expect(hooksTracker.isExecutedOnce("contentEntry:beforeDeleteRevision")).toEqual(true);
        expect(hooksTracker.isExecutedOnce("contentEntry:afterDeleteRevision")).toEqual(true);
        expect(hooksTracker.isExecutedOnce("contentEntry:beforeDelete")).toEqual(false);
        expect(hooksTracker.isExecutedOnce("contentEntry:afterDelete")).toEqual(false);
        expect(hooksTracker.isExecutedOnce("contentEntry:beforePublish")).toEqual(false);
        expect(hooksTracker.isExecutedOnce("contentEntry:afterPublish")).toEqual(false);
        expect(hooksTracker.isExecutedOnce("contentEntry:beforeUnpublish")).toEqual(false);
        expect(hooksTracker.isExecutedOnce("contentEntry:afterUnpublish")).toEqual(false);
        expect(hooksTracker.isExecutedOnce("contentEntry:beforeRequestChanges")).toEqual(false);
        expect(hooksTracker.isExecutedOnce("contentEntry:afterRequestChanges")).toEqual(false);
        expect(hooksTracker.isExecutedOnce("contentEntry:beforeRequestReview")).toEqual(false);
        expect(hooksTracker.isExecutedOnce("contentEntry:afterRequestReview")).toEqual(false);
    });

    test("should execute hooks on delete whole entry and its versions", async () => {
        const { createCategory, deleteCategory, sleep } = useCategoryManageHandler(manageOpts, [
            contentEntryHooks()
        ]);

        const [createResponse] = await createCategory({
            data: {
                title: "category",
                slug: "category"
            }
        });

        await sleep(2000);

        const { id: revisionId } = createResponse.data.createCategory.data;

        const id = revisionId.split("#").shift();

        hooksTracker.reset();

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

        expect(hooksTracker.isExecutedOnce("contentEntry:beforeCreate")).toEqual(false);
        expect(hooksTracker.isExecutedOnce("contentEntry:afterCreate")).toEqual(false);
        expect(hooksTracker.isExecutedOnce("contentEntry:beforeCreateRevisionFrom")).toEqual(false);
        expect(hooksTracker.isExecutedOnce("contentEntry:afterCreateRevisionFrom")).toEqual(false);
        expect(hooksTracker.isExecutedOnce("contentEntry:beforeUpdate")).toEqual(false);
        expect(hooksTracker.isExecutedOnce("contentEntry:afterUpdate")).toEqual(false);
        expect(hooksTracker.isExecutedOnce("contentEntry:beforeDeleteRevision")).toEqual(false);
        expect(hooksTracker.isExecutedOnce("contentEntry:afterDeleteRevision")).toEqual(false);
        expect(hooksTracker.isExecutedOnce("contentEntry:beforeDelete")).toEqual(true);
        expect(hooksTracker.isExecutedOnce("contentEntry:afterDelete")).toEqual(true);
        expect(hooksTracker.isExecutedOnce("contentEntry:beforePublish")).toEqual(false);
        expect(hooksTracker.isExecutedOnce("contentEntry:afterPublish")).toEqual(false);
        expect(hooksTracker.isExecutedOnce("contentEntry:beforeUnpublish")).toEqual(false);
        expect(hooksTracker.isExecutedOnce("contentEntry:afterUnpublish")).toEqual(false);
        expect(hooksTracker.isExecutedOnce("contentEntry:beforeRequestChanges")).toEqual(false);
        expect(hooksTracker.isExecutedOnce("contentEntry:afterRequestChanges")).toEqual(false);
        expect(hooksTracker.isExecutedOnce("contentEntry:beforeRequestReview")).toEqual(false);
        expect(hooksTracker.isExecutedOnce("contentEntry:afterRequestReview")).toEqual(false);
    });

    test("should execute hooks on publish", async () => {
        const { createCategory, publishCategory } = useCategoryManageHandler(manageOpts, [
            contentEntryHooks()
        ]);

        const [createResponse] = await createCategory({
            data: {
                title: "category",
                slug: "category"
            }
        });

        const { id } = createResponse.data.createCategory.data;

        hooksTracker.reset();

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

        expect(hooksTracker.isExecutedOnce("contentEntry:beforeCreate")).toEqual(false);
        expect(hooksTracker.isExecutedOnce("contentEntry:afterCreate")).toEqual(false);
        expect(hooksTracker.isExecutedOnce("contentEntry:beforeCreateRevisionFrom")).toEqual(false);
        expect(hooksTracker.isExecutedOnce("contentEntry:afterCreateRevisionFrom")).toEqual(false);
        expect(hooksTracker.isExecutedOnce("contentEntry:beforeUpdate")).toEqual(false);
        expect(hooksTracker.isExecutedOnce("contentEntry:afterUpdate")).toEqual(false);
        expect(hooksTracker.isExecutedOnce("contentEntry:beforeDeleteRevision")).toEqual(false);
        expect(hooksTracker.isExecutedOnce("contentEntry:afterDeleteRevision")).toEqual(false);
        expect(hooksTracker.isExecutedOnce("contentEntry:beforeDelete")).toEqual(false);
        expect(hooksTracker.isExecutedOnce("contentEntry:afterDelete")).toEqual(false);
        expect(hooksTracker.isExecutedOnce("contentEntry:beforePublish")).toEqual(true);
        expect(hooksTracker.isExecutedOnce("contentEntry:afterPublish")).toEqual(true);
        expect(hooksTracker.isExecutedOnce("contentEntry:beforeUnpublish")).toEqual(false);
        expect(hooksTracker.isExecutedOnce("contentEntry:afterUnpublish")).toEqual(false);
        expect(hooksTracker.isExecutedOnce("contentEntry:beforeRequestChanges")).toEqual(false);
        expect(hooksTracker.isExecutedOnce("contentEntry:afterRequestChanges")).toEqual(false);
        expect(hooksTracker.isExecutedOnce("contentEntry:beforeRequestReview")).toEqual(false);
        expect(hooksTracker.isExecutedOnce("contentEntry:afterRequestReview")).toEqual(false);
    });

    test("should execute hooks on unpublish", async () => {
        const { createCategory, unpublishCategory, publishCategory } = useCategoryManageHandler(
            manageOpts,
            [contentEntryHooks()]
        );

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

        hooksTracker.reset();

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

        expect(hooksTracker.isExecutedOnce("contentEntry:beforeCreate")).toEqual(false);
        expect(hooksTracker.isExecutedOnce("contentEntry:afterCreate")).toEqual(false);
        expect(hooksTracker.isExecutedOnce("contentEntry:beforeCreateRevisionFrom")).toEqual(false);
        expect(hooksTracker.isExecutedOnce("contentEntry:afterCreateRevisionFrom")).toEqual(false);
        expect(hooksTracker.isExecutedOnce("contentEntry:beforeUpdate")).toEqual(false);
        expect(hooksTracker.isExecutedOnce("contentEntry:afterUpdate")).toEqual(false);
        expect(hooksTracker.isExecutedOnce("contentEntry:beforeDeleteRevision")).toEqual(false);
        expect(hooksTracker.isExecutedOnce("contentEntry:afterDeleteRevision")).toEqual(false);
        expect(hooksTracker.isExecutedOnce("contentEntry:beforeDelete")).toEqual(false);
        expect(hooksTracker.isExecutedOnce("contentEntry:afterDelete")).toEqual(false);
        expect(hooksTracker.isExecutedOnce("contentEntry:beforePublish")).toEqual(false);
        expect(hooksTracker.isExecutedOnce("contentEntry:afterPublish")).toEqual(false);
        expect(hooksTracker.isExecutedOnce("contentEntry:beforeUnpublish")).toEqual(true);
        expect(hooksTracker.isExecutedOnce("contentEntry:afterUnpublish")).toEqual(true);
        expect(hooksTracker.isExecutedOnce("contentEntry:beforeRequestChanges")).toEqual(false);
        expect(hooksTracker.isExecutedOnce("contentEntry:afterRequestChanges")).toEqual(false);
        expect(hooksTracker.isExecutedOnce("contentEntry:beforeRequestReview")).toEqual(false);
        expect(hooksTracker.isExecutedOnce("contentEntry:afterRequestReview")).toEqual(false);
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
        const { requestCategoryChanges } = useCategoryManageHandler(
            {
                ...manageOpts,
                identity: {
                    id: "1234",
                    displayName: "User 1234",
                    type: "admin"
                }
            },
            [contentEntryHooks()]
        );

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

        expect(hooksTracker.isExecutedOnce("contentEntry:beforeCreate")).toEqual(false);
        expect(hooksTracker.isExecutedOnce("contentEntry:afterCreate")).toEqual(false);
        expect(hooksTracker.isExecutedOnce("contentEntry:beforeCreateRevisionFrom")).toEqual(false);
        expect(hooksTracker.isExecutedOnce("contentEntry:afterCreateRevisionFrom")).toEqual(false);
        expect(hooksTracker.isExecutedOnce("contentEntry:beforeUpdate")).toEqual(false);
        expect(hooksTracker.isExecutedOnce("contentEntry:afterUpdate")).toEqual(false);
        expect(hooksTracker.isExecutedOnce("contentEntry:beforeDeleteRevision")).toEqual(false);
        expect(hooksTracker.isExecutedOnce("contentEntry:afterDeleteRevision")).toEqual(false);
        expect(hooksTracker.isExecutedOnce("contentEntry:beforeDelete")).toEqual(false);
        expect(hooksTracker.isExecutedOnce("contentEntry:afterDelete")).toEqual(false);
        expect(hooksTracker.isExecutedOnce("contentEntry:beforePublish")).toEqual(false);
        expect(hooksTracker.isExecutedOnce("contentEntry:afterPublish")).toEqual(false);
        expect(hooksTracker.isExecutedOnce("contentEntry:beforeUnpublish")).toEqual(false);
        expect(hooksTracker.isExecutedOnce("contentEntry:afterUnpublish")).toEqual(false);
        expect(hooksTracker.isExecutedOnce("contentEntry:beforeRequestChanges")).toEqual(true);
        expect(hooksTracker.isExecutedOnce("contentEntry:afterRequestChanges")).toEqual(true);
        expect(hooksTracker.isExecutedOnce("contentEntry:beforeRequestReview")).toEqual(false);
        expect(hooksTracker.isExecutedOnce("contentEntry:afterRequestReview")).toEqual(false);
    });

    test("should execute hooks on request review", async () => {
        const { createCategory, requestCategoryReview } = useCategoryManageHandler(manageOpts, [
            contentEntryHooks()
        ]);

        const [createResponse] = await createCategory({
            data: {
                title: "category",
                slug: "category"
            }
        });

        const { id } = createResponse.data.createCategory.data;
        hooksTracker.reset();

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

        expect(hooksTracker.isExecutedOnce("contentEntry:beforeCreate")).toEqual(false);
        expect(hooksTracker.isExecutedOnce("contentEntry:afterCreate")).toEqual(false);
        expect(hooksTracker.isExecutedOnce("contentEntry:beforeCreateRevisionFrom")).toEqual(false);
        expect(hooksTracker.isExecutedOnce("contentEntry:afterCreateRevisionFrom")).toEqual(false);
        expect(hooksTracker.isExecutedOnce("contentEntry:beforeUpdate")).toEqual(false);
        expect(hooksTracker.isExecutedOnce("contentEntry:afterUpdate")).toEqual(false);
        expect(hooksTracker.isExecutedOnce("contentEntry:beforeDeleteRevision")).toEqual(false);
        expect(hooksTracker.isExecutedOnce("contentEntry:afterDeleteRevision")).toEqual(false);
        expect(hooksTracker.isExecutedOnce("contentEntry:beforeDelete")).toEqual(false);
        expect(hooksTracker.isExecutedOnce("contentEntry:afterDelete")).toEqual(false);
        expect(hooksTracker.isExecutedOnce("contentEntry:beforePublish")).toEqual(false);
        expect(hooksTracker.isExecutedOnce("contentEntry:afterPublish")).toEqual(false);
        expect(hooksTracker.isExecutedOnce("contentEntry:beforeUnpublish")).toEqual(false);
        expect(hooksTracker.isExecutedOnce("contentEntry:afterUnpublish")).toEqual(false);
        expect(hooksTracker.isExecutedOnce("contentEntry:beforeRequestChanges")).toEqual(false);
        expect(hooksTracker.isExecutedOnce("contentEntry:afterRequestChanges")).toEqual(false);
        expect(hooksTracker.isExecutedOnce("contentEntry:beforeRequestReview")).toEqual(true);
        expect(hooksTracker.isExecutedOnce("contentEntry:afterRequestReview")).toEqual(true);
    });
});
