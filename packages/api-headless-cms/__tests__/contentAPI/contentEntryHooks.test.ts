import { beforeEach, describe, expect, it } from "vitest";
import { useCategoryManageHandler } from "../testHelpers/useCategoryManageHandler";
import { assignEntryEvents, pubSubTracker } from "./mocks/lifecycleHooks";
import { useGraphQLHandler } from "../testHelpers/useGraphQLHandler";
import { setupGroupAndModels } from "~tests/testHelpers/setup.js";

describe("contentEntryHooks", () => {
    const manageOpts = { path: "manage" };

    const manager = useGraphQLHandler(manageOpts);

    beforeEach(async () => {
        await setupGroupAndModels({
            manager,
            models: ["category"]
        });
        pubSubTracker.reset();
    });

    it("should execute hooks on create", async () => {
        const { createCategory } = useCategoryManageHandler({
            ...manageOpts,
            plugins: [assignEntryEvents()]
        });

        const [response] = await createCategory({
            variables: {
                data: {
                    values: {
                        title: "category",
                        slug: "category"
                    }
                }
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
    });

    it("should execute hooks on create from revision", async () => {
        const { createCategory, createCategoryFrom } = useCategoryManageHandler({
            ...manageOpts,
            plugins: [assignEntryEvents()]
        });

        const [createResponse] = await createCategory({
            variables: {
                data: {
                    values: {
                        title: "category",
                        slug: "category"
                    }
                }
            }
        });

        const { id } = createResponse.data.createCategory.data!;

        pubSubTracker.reset();

        const [response] = await createCategoryFrom({
            variables: {
                revision: id
            }
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
    });

    it("should execute hooks on update", async () => {
        const { createCategory, updateCategory } = useCategoryManageHandler({
            ...manageOpts,
            plugins: [assignEntryEvents()]
        });

        const [createResponse] = await createCategory({
            variables: {
                data: {
                    values: {
                        title: "category",
                        slug: "category"
                    }
                }
            }
        });

        const { id } = createResponse.data.createCategory.data!;

        pubSubTracker.reset();

        const [response] = await updateCategory({
            variables: {
                revision: id,
                data: {
                    values: {
                        title: "updated category",
                        slug: "updated-slug"
                    }
                }
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
    });

    it("should execute hooks on delete revision", async () => {
        const { createCategory, createCategoryFrom, deleteCategory } = useCategoryManageHandler({
            ...manageOpts,
            plugins: [assignEntryEvents()]
        });

        const [createResponse] = await createCategory({
            variables: {
                data: {
                    values: {
                        title: "category",
                        slug: "category"
                    }
                }
            }
        });

        const { id } = createResponse.data.createCategory.data!;

        // create another category
        await createCategoryFrom({
            variables: {
                revision: id
            }
        });

        pubSubTracker.reset();

        const [response] = await deleteCategory({
            variables: {
                revision: id
            }
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
    });

    it("should execute hooks on delete whole entry and its versions", async () => {
        const { createCategory, deleteCategory } = useCategoryManageHandler({
            ...manageOpts,
            plugins: [assignEntryEvents()]
        });

        const [createResponse] = await createCategory({
            variables: {
                data: {
                    values: {
                        title: "category",
                        slug: "category"
                    }
                }
            }
        });

        const { entryId: id } = createResponse.data.createCategory.data!;

        pubSubTracker.reset();

        const [response] = await deleteCategory({
            variables: {
                revision: id
            }
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
    });

    it("should execute hooks on publish", async () => {
        const { createCategory, publishCategory } = useCategoryManageHandler({
            ...manageOpts,
            plugins: [assignEntryEvents()]
        });

        const [createResponse] = await createCategory({
            variables: {
                data: {
                    values: {
                        title: "category",
                        slug: "category"
                    }
                }
            }
        });

        const { id } = createResponse.data.createCategory.data!;

        pubSubTracker.reset();

        const [response] = await publishCategory({
            variables: {
                revision: id
            }
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
    });

    it("should execute hooks on unpublish", async () => {
        const { createCategory, unpublishCategory, publishCategory } = useCategoryManageHandler({
            ...manageOpts,
            plugins: [assignEntryEvents()]
        });

        const [createResponse] = await createCategory({
            variables: {
                data: {
                    values: {
                        title: "category",
                        slug: "category"
                    }
                }
            }
        });

        const { id } = createResponse.data.createCategory.data!;

        await publishCategory({
            variables: {
                revision: id
            }
        });

        pubSubTracker.reset();

        const [response] = await unpublishCategory({
            variables: {
                revision: id
            }
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
    });
});
