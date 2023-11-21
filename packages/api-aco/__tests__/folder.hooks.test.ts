import { useGraphQlHandler } from "./utils/useGraphQlHandler";

import { assignFolderLifecycleEvents, tracker } from "./mocks/lifecycle.mock";

const title = "Folder Lifecycle Events";
const slug = "folder-lifecycle-events";
const type = "demo-lifecycle-events";
const parentId = "folderId-lifecycle-events";

describe("Folder Lifecycle Events", () => {
    const { aco } = useGraphQlHandler({
        plugins: [assignFolderLifecycleEvents()]
    });

    beforeEach(async () => {
        tracker.reset();
    });

    it("should trigger create lifecycle events", async () => {
        const [response] = await aco.createFolder({
            data: {
                title,
                slug,
                type,
                parentId
            }
        });

        expect(response).toMatchObject({
            data: {
                aco: {
                    createFolder: {
                        data: {
                            title,
                            slug,
                            type,
                            parentId
                        },
                        error: null
                    }
                }
            }
        });

        expect(tracker.isExecutedOnce("folder:beforeCreate")).toEqual(true);
        expect(tracker.isExecutedOnce("folder:afterCreate")).toEqual(true);
        expect(tracker.isExecutedOnce("folder:beforeUpdate")).toEqual(false);
        expect(tracker.isExecutedOnce("folder:afterUpdate")).toEqual(false);
        expect(tracker.isExecutedOnce("folder:beforeDelete")).toEqual(false);
        expect(tracker.isExecutedOnce("folder:afterDelete")).toEqual(false);
    });

    it("should trigger update lifecycle events", async () => {
        const [createResponse] = await aco.createFolder({
            data: {
                title,
                slug,
                type,
                parentId
            }
        });

        tracker.reset();

        const [updateResponse] = await aco.updateFolder({
            id: createResponse.data.aco.createFolder.data.id,
            data: {
                title: `${title} updated`,
                slug: `${slug}-updated`,
                parentId: `${parentId}-updated`
            }
        });

        expect(updateResponse).toMatchObject({
            data: {
                aco: {
                    updateFolder: {
                        data: {
                            title: `${title} updated`,
                            slug: `${slug}-updated`,
                            parentId: `${parentId}-updated`
                        },
                        error: null
                    }
                }
            }
        });

        expect(tracker.isExecutedOnce("folder:beforeCreate")).toEqual(false);
        expect(tracker.isExecutedOnce("folder:afterCreate")).toEqual(false);
        expect(tracker.isExecutedOnce("folder:beforeUpdate")).toEqual(true);
        expect(tracker.isExecutedOnce("folder:afterUpdate")).toEqual(true);
        expect(tracker.isExecutedOnce("folder:beforeDelete")).toEqual(false);
        expect(tracker.isExecutedOnce("folder:afterDelete")).toEqual(false);
    });

    it("should trigger delete lifecycle events", async () => {
        const [createResponse] = await aco.createFolder({
            data: {
                title,
                slug,
                type,
                parentId
            }
        });

        tracker.reset();

        const [deleteResponse] = await aco.deleteFolder({
            id: createResponse.data.aco.createFolder.data.id
        });
        expect(deleteResponse).toMatchObject({
            data: {
                aco: {
                    deleteFolder: {
                        data: true,
                        error: null
                    }
                }
            }
        });

        expect(tracker.isExecutedOnce("folder:beforeCreate")).toEqual(false);
        expect(tracker.isExecutedOnce("folder:afterCreate")).toEqual(false);
        expect(tracker.isExecutedOnce("folder:beforeUpdate")).toEqual(false);
        expect(tracker.isExecutedOnce("folder:afterUpdate")).toEqual(false);
        expect(tracker.isExecutedOnce("folder:beforeDelete")).toEqual(true);
        expect(tracker.isExecutedOnce("folder:afterDelete")).toEqual(true);
    });
});
