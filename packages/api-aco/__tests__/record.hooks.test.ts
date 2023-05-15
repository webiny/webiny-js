import { useGraphQlHandler } from "./utils/useGraphQlHandler";

import { assignRecordLifecycleEvents, tracker } from "./mocks/lifecycle.mock";
import { createMockAcoApp } from "~tests/mocks/app";

const id = "id-lifecycle-events";
const type = "demo-lifecycle-events";
const title = "Record Lifecycle Events Title";
const content = "Record Lifecycle Events Content";
const folderId = "folderId-lifecycle-events";

const data = {
    someText: "Some strange title",
    identity: {
        id: "theJohnDoeUserId",
        displayName: "John Doe",
        type: "admin"
    },
    customCreatedOn: new Date("2023-05-15").toISOString(),
    customVersion: 18,
    customLocked: false
};
const tags = ["tag1", "tag2"];

describe("Search Record Lifecycle Events", () => {
    const { search } = useGraphQlHandler({
        plugins: [
            createMockAcoApp({
                name: "WebinyApp",
                apiName: "Webiny"
            }),
            assignRecordLifecycleEvents()
        ]
    });

    beforeEach(async () => {
        tracker.reset();
    });

    it("should trigger create lifecycle events", async () => {
        const [response] = await search.createRecord({
            data: {
                id,
                type,
                title,
                content,
                location: {
                    folderId
                },
                data,
                tags
            }
        });

        expect(response).toMatchObject({
            data: {
                search: {
                    createRecord: {
                        data: {
                            id,
                            type,
                            title,
                            content,
                            location: {
                                folderId
                            },
                            data,
                            tags
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
                id,
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
            id,
            data: {
                title: `${title} updated`,
                content: `${content} updated`,
                location: {
                    folderId: `${folderId}-updated`
                },
                data: {
                    ...data,
                    someText: "Some even stranger title"
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
                                someText: "Some even stranger title"
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
                id,
                type,
                title,
                content,
                location: {
                    folderId
                },
                data,
                tags
            }
        });

        tracker.reset();

        const [deleteResponse] = await search.deleteRecord({
            id
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
