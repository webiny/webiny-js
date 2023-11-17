import useGqlHandler from "./useGqlHandler";

import { assignPageElementLifecycleEvents, tracker } from "./mocks/lifecycleEvents";

const name = "Page Element";
const type = "block";
const content = {
    contentTest: true
};
const updatedContent = {
    ...content,
    updated: true
};

describe("Page Element Lifecycle Events", () => {
    const handler = useGqlHandler({
        plugins: [assignPageElementLifecycleEvents()]
    });

    const { createPageElement, updatePageElement, deletePageElement } = handler;

    beforeEach(async () => {
        tracker.reset();
    });

    it("should trigger create lifecycle events", async () => {
        const [response] = await createPageElement({
            data: {
                name,
                type,
                content
            }
        });
        expect(response).toMatchObject({
            data: {
                pageBuilder: {
                    createPageElement: {
                        data: {
                            id: expect.any(String),
                            name,
                            type,
                            content
                        },
                        error: null
                    }
                }
            }
        });

        expect(tracker.isExecutedOnce("pageElement:beforeCreate")).toEqual(true);
        expect(tracker.isExecutedOnce("pageElement:afterCreate")).toEqual(true);
        expect(tracker.isExecutedOnce("pageElement:beforeUpdate")).toEqual(false);
        expect(tracker.isExecutedOnce("pageElement:afterUpdate")).toEqual(false);
        expect(tracker.isExecutedOnce("pageElement:beforeDelete")).toEqual(false);
        expect(tracker.isExecutedOnce("pageElement:afterDelete")).toEqual(false);
    });

    it("should trigger update lifecycle events", async () => {
        const [createResponse] = await createPageElement({
            data: {
                name,
                type,
                content
            }
        });

        const pageElement = createResponse.data.pageBuilder.createPageElement.data;

        tracker.reset();

        const [response] = await updatePageElement({
            id: pageElement.id,
            data: {
                name,
                type,
                content: updatedContent
            }
        });
        expect(response).toMatchObject({
            data: {
                pageBuilder: {
                    updatePageElement: {
                        data: {
                            id: expect.any(String),
                            name,
                            type,
                            content: updatedContent
                        },
                        error: null
                    }
                }
            }
        });

        expect(tracker.isExecutedOnce("pageElement:beforeCreate")).toEqual(false);
        expect(tracker.isExecutedOnce("pageElement:afterCreate")).toEqual(false);
        expect(tracker.isExecutedOnce("pageElement:beforeUpdate")).toEqual(true);
        expect(tracker.isExecutedOnce("pageElement:afterUpdate")).toEqual(true);
        expect(tracker.isExecutedOnce("pageElement:beforeDelete")).toEqual(false);
        expect(tracker.isExecutedOnce("pageElement:afterDelete")).toEqual(false);
    });

    it("should trigger delete lifecycle events", async () => {
        const [createResponse] = await createPageElement({
            data: {
                name,
                type,
                content
            }
        });

        const pageElement = createResponse.data.pageBuilder.createPageElement.data;

        tracker.reset();

        const [response] = await deletePageElement({
            id: pageElement.id
        });

        expect(response).toMatchObject({
            data: {
                pageBuilder: {
                    deletePageElement: {
                        data: true,
                        error: null
                    }
                }
            }
        });

        expect(tracker.isExecutedOnce("pageElement:beforeCreate")).toEqual(false);
        expect(tracker.isExecutedOnce("pageElement:afterCreate")).toEqual(false);
        expect(tracker.isExecutedOnce("pageElement:beforeUpdate")).toEqual(false);
        expect(tracker.isExecutedOnce("pageElement:afterUpdate")).toEqual(false);
        expect(tracker.isExecutedOnce("pageElement:beforeDelete")).toEqual(true);
        expect(tracker.isExecutedOnce("pageElement:afterDelete")).toEqual(true);
    });
});
