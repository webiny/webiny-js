import useGqlHandler from "./useGqlHandler";
import { PageBlock } from "~/types";

import { assignPageBlockLifecycleEvents, tracker } from "./mocks/lifecycleEvents";

const blockCategory = "block-category-lifecycle-events";

const pageBlockData = {
    name: "Page Block Lifecycle Events",
    blockCategory,
    content: { some: "page-block-content" }
};

describe("Page Block Lifecycle Events", () => {
    const handler = useGqlHandler({
        plugins: [assignPageBlockLifecycleEvents()]
    });

    const { createPageBlock, updatePageBlock, deletePageBlock, createBlockCategory } = handler;

    const createDummyPageBlock = async (): Promise<PageBlock> => {
        const [response] = await createPageBlock({
            data: pageBlockData
        });

        const pageBlock = response.data?.pageBuilder?.createPageBlock?.data;
        if (!pageBlock) {
            throw new Error(
                response.data?.pageBuilder?.error?.message ||
                    "unknown error while creating dummy pageBlock"
            );
        }
        return pageBlock;
    };

    let dummyPageBlock: PageBlock;

    beforeEach(async () => {
        await createBlockCategory({
            data: {
                slug: blockCategory,
                name: `name`,
                icon: {
                    type: `emoji`,
                    name: `icon`,
                    value: `👍`
                },
                description: `description`
            }
        });
        // eslint-disable-next-line
        dummyPageBlock = await createDummyPageBlock();
        tracker.reset();
    });

    test("should trigger create lifecycle events", async () => {
        const [response] = await createPageBlock({
            data: pageBlockData
        });
        expect(response).toMatchObject({
            data: {
                pageBuilder: {
                    createPageBlock: {
                        data: {
                            ...pageBlockData,
                            content: {
                                compression: "gzip",
                                value: expect.any(String)
                            }
                        },
                        error: null
                    }
                }
            }
        });

        expect(tracker.isExecutedOnce("pageBlock:beforeCreate")).toEqual(true);
        expect(tracker.isExecutedOnce("pageBlock:afterCreate")).toEqual(true);
        expect(tracker.isExecutedOnce("pageBlock:beforeUpdate")).toEqual(false);
        expect(tracker.isExecutedOnce("pageBlock:afterUpdate")).toEqual(false);
        expect(tracker.isExecutedOnce("pageBlock:beforeDelete")).toEqual(false);
        expect(tracker.isExecutedOnce("pageBlock:afterDelete")).toEqual(false);
    });

    test("should trigger update lifecycle events", async () => {
        const [response] = await updatePageBlock({
            id: dummyPageBlock.id,
            data: {
                name: `${pageBlockData.name} Updated`
            }
        });
        expect(response).toMatchObject({
            data: {
                pageBuilder: {
                    updatePageBlock: {
                        data: {
                            ...pageBlockData,
                            name: `${pageBlockData.name} Updated`,
                            content: {
                                compression: "gzip",
                                value: expect.any(String)
                            }
                        },
                        error: null
                    }
                }
            }
        });

        expect(tracker.isExecutedOnce("pageBlock:beforeCreate")).toEqual(false);
        expect(tracker.isExecutedOnce("pageBlock:afterCreate")).toEqual(false);
        expect(tracker.isExecutedOnce("pageBlock:beforeUpdate")).toEqual(true);
        expect(tracker.isExecutedOnce("pageBlock:afterUpdate")).toEqual(true);
        expect(tracker.isExecutedOnce("pageBlock:beforeDelete")).toEqual(false);
        expect(tracker.isExecutedOnce("pageBlock:afterDelete")).toEqual(false);
    });

    test("should trigger delete lifecycle events", async () => {
        const [response] = await deletePageBlock({
            id: dummyPageBlock.id
        });
        expect(response).toMatchObject({
            data: {
                pageBuilder: {
                    deletePageBlock: {
                        data: true,
                        error: null
                    }
                }
            }
        });

        expect(tracker.isExecutedOnce("pageBlock:beforeCreate")).toEqual(false);
        expect(tracker.isExecutedOnce("pageBlock:afterCreate")).toEqual(false);
        expect(tracker.isExecutedOnce("pageBlock:beforeUpdate")).toEqual(false);
        expect(tracker.isExecutedOnce("pageBlock:afterUpdate")).toEqual(false);
        expect(tracker.isExecutedOnce("pageBlock:beforeDelete")).toEqual(true);
        expect(tracker.isExecutedOnce("pageBlock:afterDelete")).toEqual(true);
    });
});
