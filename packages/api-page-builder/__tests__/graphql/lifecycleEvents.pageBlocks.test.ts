import useGqlHandler from "./useGqlHandler";
import { PageBlock } from "~/types";

import { assignPageBlockLifecycleEvents, tracker } from "./mocks/lifecycleEvents";

const blockCategory = "block-category-lifecycle-events";

const pageBlockData = {
    name: "Block Lifecycle Events",
    blockCategory,
    preview: { src: "https://test.com/src.jpg" },
    content: { some: "block-content" }
};

describe("PageBlock Lifecycle Events", () => {
    const handler = useGqlHandler({
        plugins: [assignPageBlockLifecycleEvents()]
    });

    const { createPageBlock, createBlockCategory } = handler;

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
                name: `name`
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
                        data: pageBlockData,
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
});
