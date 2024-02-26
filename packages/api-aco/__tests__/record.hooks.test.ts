import { useGraphQlHandler } from "./utils/useGraphQlHandler";
import { assignRecordLifecycleEvents, tracker } from "./mocks/lifecycle.mock";
import { createMockAcoApp } from "~tests/mocks/app";

jest.retryTimes(0);

const id = "id-lifecycle-events";
const type = "demo-lifecycle-events";
const title = "Record Lifecycle Events Title";
const content = "Record Lifecycle Events Content";

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
    beforeEach(async () => {
        tracker.reset();
    });

    let folder1: Record<string, any>;
    let folder2: Record<string, any>;
    let search: ReturnType<typeof useGraphQlHandler>["search"];
    let aco: ReturnType<typeof useGraphQlHandler>["aco"];

    beforeEach(async () => {
        const handler = useGraphQlHandler({
            plugins: [
                createMockAcoApp({
                    name: "WebinyApp",
                    apiName: "Webiny"
                }),
                assignRecordLifecycleEvents()
            ]
        });

        search = handler.search;
        aco = handler.aco;

        folder1 = await aco
            .createFolder({
                data: {
                    title: "Folder 1",
                    slug: "folder-1",
                    type: "cms:acoSearchRecord-webiny"
                }
            })
            .then(([response]) => {
                return response.data.aco.createFolder.data;
            });

        folder2 = await aco
            .createFolder({
                data: {
                    title: "Folder 2",
                    slug: "folder-2",
                    type: "cms:acoSearchRecord-webiny"
                }
            })
            .then(([response]) => {
                return response.data.aco.createFolder.data;
            });
    });

    it("should trigger create lifecycle events", async () => {
        const [response] = await search.createRecord({
            data: {
                id,
                type,
                title,
                content,
                location: {
                    folderId: folder1.id
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
                                folderId: folder1.id
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
        expect(tracker.isExecuted("searchRecord:beforeUpdate")).toEqual(false);
        expect(tracker.isExecuted("searchRecord:afterUpdate")).toEqual(false);
        expect(tracker.isExecuted("searchRecord:beforeMove")).toEqual(false);
        expect(tracker.isExecuted("searchRecord:afterMove")).toEqual(false);
        expect(tracker.isExecuted("searchRecord:beforeDelete")).toEqual(false);
        expect(tracker.isExecuted("searchRecord:afterDelete")).toEqual(false);
    });

    it("should trigger update lifecycle events", async () => {
        await search.createRecord({
            data: {
                id,
                type,
                title,
                content,
                location: {
                    folderId: folder1.id
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
                    folderId: folder2.id
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
                                folderId: folder2.id
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

        expect(tracker.isExecuted("searchRecord:beforeCreate")).toEqual(false);
        expect(tracker.isExecuted("searchRecord:afterCreate")).toEqual(false);
        expect(tracker.isExecutedOnce("searchRecord:beforeUpdate")).toEqual(true);
        expect(tracker.isExecutedOnce("searchRecord:afterUpdate")).toEqual(true);
        expect(tracker.isExecuted("searchRecord:beforeMove")).toEqual(false);
        expect(tracker.isExecuted("searchRecord:afterMove")).toEqual(false);
        expect(tracker.isExecuted("searchRecord:beforeDelete")).toEqual(false);
        expect(tracker.isExecuted("searchRecord:afterDelete")).toEqual(false);
    });

    it("should trigger move lifecycle events", async () => {
        await search.createRecord({
            data: {
                id,
                type,
                title,
                content,
                location: {
                    folderId: folder1.id
                },
                data
            }
        });

        tracker.reset();

        const [moveResponse] = await search.moveRecord({
            id,
            folderId: folder2.id
        });

        expect(moveResponse).toMatchObject({
            data: {
                search: {
                    moveRecord: {
                        data: true,
                        error: null
                    }
                }
            }
        });

        expect(tracker.isExecuted("searchRecord:beforeCreate")).toEqual(false);
        expect(tracker.isExecuted("searchRecord:afterCreate")).toEqual(false);
        expect(tracker.isExecuted("searchRecord:beforeUpdate")).toEqual(false);
        expect(tracker.isExecuted("searchRecord:afterUpdate")).toEqual(false);
        expect(tracker.isExecutedOnce("searchRecord:beforeMove")).toEqual(true);
        expect(tracker.isExecutedOnce("searchRecord:afterMove")).toEqual(true);
        expect(tracker.isExecuted("searchRecord:beforeDelete")).toEqual(false);
        expect(tracker.isExecuted("searchRecord:afterDelete")).toEqual(false);

        const [movedRecord] = await search.getRecord({
            id
        });
        expect(movedRecord).toMatchObject({
            data: {
                search: {
                    getRecord: {
                        data: {
                            id,
                            location: {
                                folderId: folder2.id
                            }
                        },
                        error: null
                    }
                }
            }
        });
    });

    it("should trigger delete lifecycle events", async () => {
        await search.createRecord({
            data: {
                id,
                type,
                title,
                content,
                location: {
                    folderId: folder1.id
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

        expect(tracker.isExecuted("searchRecord:beforeCreate")).toEqual(false);
        expect(tracker.isExecuted("searchRecord:afterCreate")).toEqual(false);
        expect(tracker.isExecuted("searchRecord:beforeUpdate")).toEqual(false);
        expect(tracker.isExecuted("searchRecord:afterUpdate")).toEqual(false);
        expect(tracker.isExecuted("searchRecord:beforeMove")).toEqual(false);
        expect(tracker.isExecuted("searchRecord:afterMove")).toEqual(false);
        expect(tracker.isExecutedOnce("searchRecord:beforeDelete")).toEqual(true);
        expect(tracker.isExecutedOnce("searchRecord:afterDelete")).toEqual(true);
    });
});
