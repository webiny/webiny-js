import useGqlHandler from "./useGqlHandler";
import { Block } from "~/types";

import { assignBlockLifecycleEvents, tracker } from "./mocks/lifecycleEvents";

const blockCategory = "block-category-lifecycle-events";

const blockData = {
    name: "Block Lifecycle Events",
    type: "block",
    blockCategory,
    preview: { src: "https://test.com/src.jpg" },
    content: { some: "block-content" }
};

describe("Block Lifecycle Events", () => {
    const handler = useGqlHandler({
        plugins: [assignBlockLifecycleEvents()]
    });

    const { createBlock, createBlockCategory } = handler;

    const createDummyBlock = async (): Promise<Block> => {
        const [response] = await createBlock({
            data: blockData
        });

        const block = response.data?.pageBuilder?.createBlock?.data;
        if (!block) {
            throw new Error(
                response.data?.pageBuilder?.error?.message ||
                    "unknown error while creating dummy block"
            );
        }
        return block;
    };

    let dummyBlock: Block;

    beforeEach(async () => {
        await createBlockCategory({
            data: {
                slug: blockCategory,
                name: `name`
            }
        });
        dummyBlock = await createDummyBlock();
        tracker.reset();
    });

    test("should trigger create lifecycle events", async () => {
        const [response] = await createBlock({
            data: blockData
        });
        expect(response).toMatchObject({
            data: {
                pageBuilder: {
                    createBlock: {
                        data: blockData,
                        error: null
                    }
                }
            }
        });

        expect(tracker.isExecutedOnce("block:beforeCreate")).toEqual(true);
        expect(tracker.isExecutedOnce("block:afterCreate")).toEqual(true);
        expect(tracker.isExecutedOnce("block:beforeUpdate")).toEqual(false);
        expect(tracker.isExecutedOnce("block:afterUpdate")).toEqual(false);
        expect(tracker.isExecutedOnce("block:beforeDelete")).toEqual(false);
        expect(tracker.isExecutedOnce("block:afterDelete")).toEqual(false);
    });
});
