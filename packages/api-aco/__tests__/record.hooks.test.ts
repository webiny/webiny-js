import { useGraphQlHandler } from "./utils/useGraphQlHandler";

import { assignRecordLifecycleEvents, tracker } from "./mocks/lifecycle.mock";

const originalId = "record-originalId-lifecycle-events";
const type = "demo-lifecycle-events";
const title = "Record Lifecycle Events Title";
const content = "Record Lifecycle Events Content";
const folderId = "folderId-lifecycle-events";
const data = {
    tags: ["tag1", "tag2"]
};

describe("Search Record Lifecycle Events", () => {
    const { search } = useGraphQlHandler({
        plugins: [assignRecordLifecycleEvents()]
    });

    beforeEach(async () => {
        tracker.reset();
    });

    it("should trigger create lifecycle events", async () => {
        const [response] = await search.createRecord({
            data: {
                originalId,
                type,
                title,
                content,
                location: {
                    folderId
                },
                data
            }
        });

        expect(response).toMatchObject({
            data: {
                search: {
                    createRecord: {
                        data: {
                            originalId,
                            type,
                            title,
                            content,
                            location: {
                                folderId
                            },
                            data
                        },
                        error: null
                    }
                }
            }
        });

        expect(tracker.isExecutedOnce("searchRecord:beforeCreate")).toEqual(true);
        expect(tracker.isExecutedOnce("searchRecord:afterCreate")).toEqual(true);
        expect(tracker.isExecutedOnce("searchRecord:beforeUpdate")).toEqual(false);
        expect(tracker.isExecutedOnce("searchRecord:afterUpdate")).toEqual(false);
        expect(tracker.isExecutedOnce("searchRecord:beforeDelete")).toEqual(false);
        expect(tracker.isExecutedOnce("searchRecord:afterDelete")).toEqual(false);
    });

    it("should trigger update lifecycle events", async () => {
        await search.createRecord({
            data: {
                originalId,
                type,
                title,
                content,
                location: {
                    folderId
                },
                data
            }
        });

        tracker.reset();

        const [updateResponse] = await search.updateRecord({
            id: originalId,
            data: {
                title: `${title} updated`,
                content: `${content} updated`,
                location: {
                    folderId: `${folderId}-updated`
                },
                data: {
                    ...data,
                    any: "string"
                }
            }
        });

        expect(updateResponse).toMatchObject({
            data: {
                search: {
                    updateRecord: {
                        data: {
                            title: `${title} updated`,
                            content: `${content} updated`,
                            location: {
                                folderId: `${folderId}-updated`
                            },
                            data: {
                                ...data,
                                any: "string"
                            }
                        },
                        error: null
                    }
                }
            }
        });

        expect(tracker.isExecutedOnce("searchRecord:beforeCreate")).toEqual(false);
        expect(tracker.isExecutedOnce("searchRecord:afterCreate")).toEqual(false);
        expect(tracker.isExecutedOnce("searchRecord:beforeUpdate")).toEqual(true);
        expect(tracker.isExecutedOnce("searchRecord:afterUpdate")).toEqual(true);
        expect(tracker.isExecutedOnce("searchRecord:beforeDelete")).toEqual(false);
        expect(tracker.isExecutedOnce("searchRecord:afterDelete")).toEqual(false);
    });

    it("should trigger delete lifecycle events", async () => {
        await search.createRecord({
            data: {
                originalId,
                type,
                title,
                content,
                location: {
                    folderId
                },
                data
            }
        });

        tracker.reset();

        const [deleteResponse] = await search.deleteRecord({
            id: originalId
        });

        expect(deleteResponse).toMatchObject({
            data: {
                search: {
                    deleteRecord: {
                        data: true,
                        error: null
                    }
                }
            }
        });

        expect(tracker.isExecutedOnce("searchRecord:beforeCreate")).toEqual(false);
        expect(tracker.isExecutedOnce("searchRecord:afterCreate")).toEqual(false);
        expect(tracker.isExecutedOnce("searchRecord:beforeUpdate")).toEqual(false);
        expect(tracker.isExecutedOnce("searchRecord:afterUpdate")).toEqual(false);
        expect(tracker.isExecutedOnce("searchRecord:beforeDelete")).toEqual(true);
        expect(tracker.isExecutedOnce("searchRecord:afterDelete")).toEqual(true);
    });
});
