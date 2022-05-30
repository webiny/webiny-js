import useGqlHandler from "./useGqlHandler";

import { assignBlockCategoryLifecycleEvents, tracker } from "./mocks/lifecycleEvents";

const name = "Block Category Lifecycle Events";
const slug = "block-category-lifecycle-events";

describe("Block Category Lifecycle Events", () => {
    const handler = useGqlHandler({
        plugins: [assignBlockCategoryLifecycleEvents()]
    });

    const { createBlockCategory, updateBlockCategory, deleteBlockCategory } = handler;

    beforeEach(async () => {
        tracker.reset();
    });

    it("should trigger create lifecycle events", async () => {
        const [response] = await createBlockCategory({
            data: {
                slug,
                name
            }
        });
        expect(response).toMatchObject({
            data: {
                pageBuilder: {
                    createBlockCategory: {
                        data: {
                            name,
                            slug
                        },
                        error: null
                    }
                }
            }
        });

        expect(tracker.isExecutedOnce("block-category:beforeCreate")).toEqual(true);
        expect(tracker.isExecutedOnce("block-category:afterCreate")).toEqual(true);
        expect(tracker.isExecutedOnce("block-category:beforeUpdate")).toEqual(false);
        expect(tracker.isExecutedOnce("block-category:afterUpdate")).toEqual(false);
        expect(tracker.isExecutedOnce("block-category:beforeDelete")).toEqual(false);
        expect(tracker.isExecutedOnce("block-category:afterDelete")).toEqual(false);
    });

    it("should trigger update lifecycle events", async () => {
        await createBlockCategory({
            data: {
                slug,
                name
            }
        });

        tracker.reset();

        const [response] = await updateBlockCategory({
            slug: slug,
            data: {
                slug,
                name: `${name} updated`
            }
        });

        expect(response).toMatchObject({
            data: {
                pageBuilder: {
                    updateBlockCategory: {
                        data: {
                            name: `${name} updated`,
                            slug
                        },
                        error: null
                    }
                }
            }
        });

        expect(tracker.isExecutedOnce("block-category:beforeCreate")).toEqual(false);
        expect(tracker.isExecutedOnce("block-category:afterCreate")).toEqual(false);
        expect(tracker.isExecutedOnce("block-category:beforeUpdate")).toEqual(true);
        expect(tracker.isExecutedOnce("block-category:afterUpdate")).toEqual(true);
        expect(tracker.isExecutedOnce("block-category:beforeDelete")).toEqual(false);
        expect(tracker.isExecutedOnce("block-category:afterDelete")).toEqual(false);
    });

    it("should trigger delete lifecycle events", async () => {
        await createBlockCategory({
            data: {
                slug,
                name
            }
        });

        tracker.reset();

        const [response] = await deleteBlockCategory({
            slug
        });
        expect(response).toMatchObject({
            data: {
                pageBuilder: {
                    deleteBlockCategory: {
                        data: {
                            name,
                            slug
                        },
                        error: null
                    }
                }
            }
        });

        expect(tracker.isExecutedOnce("block-category:beforeCreate")).toEqual(false);
        expect(tracker.isExecutedOnce("block-category:afterCreate")).toEqual(false);
        expect(tracker.isExecutedOnce("block-category:beforeUpdate")).toEqual(false);
        expect(tracker.isExecutedOnce("block-category:afterUpdate")).toEqual(false);
        expect(tracker.isExecutedOnce("block-category:beforeDelete")).toEqual(true);
        expect(tracker.isExecutedOnce("block-category:afterDelete")).toEqual(true);
    });
});
