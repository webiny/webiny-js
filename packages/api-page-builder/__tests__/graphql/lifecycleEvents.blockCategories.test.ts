import useGqlHandler from "./useGqlHandler";

import { assignBlockCategoryLifecycleEvents, tracker } from "./mocks/lifecycleEvents";

const name = "Block Category Lifecycle Events";
const slug = "block-category-lifecycle-events";
const icon = {
    type: "emoji",
    name: "block-category-icon",
    value: "👍"
};
const description = "Block Category Description";

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
                name,
                icon,
                description
            }
        });
        expect(response).toMatchObject({
            data: {
                pageBuilder: {
                    createBlockCategory: {
                        data: {
                            name,
                            slug,
                            icon,
                            description
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
                name,
                icon,
                description
            }
        });

        tracker.reset();

        const [response] = await updateBlockCategory({
            slug: slug,
            data: {
                slug,
                name: `${name} updated`,
                icon: {
                    type: `emoji`,
                    name: `${icon}-updated`,
                    value: `👍`
                },
                description: `${name} Updated`
            }
        });

        expect(response).toMatchObject({
            data: {
                pageBuilder: {
                    updateBlockCategory: {
                        data: {
                            name: `${name} updated`,
                            slug,
                            icon: {
                                type: `emoji`,
                                name: `${icon}-updated`,
                                value: `👍`
                            },
                            description: `${name} Updated`
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
                name,
                icon,
                description
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
                            slug,
                            icon,
                            description
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
