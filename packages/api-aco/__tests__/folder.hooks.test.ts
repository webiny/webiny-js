import { useGraphQlHandler } from "./utils/useGraphQlHandler";

import { assignFolderLifecycleEvents, tracker } from "./mocks/lifecycle.mock";
import { createMockAcoApp } from "~tests/mocks/app";

const title = "Folder Lifecycle Events";
const slug = "folder-lifecycle-events";
const type = "demo-lifecycle-events";

describe("Folder Lifecycle Events", () => {
    let folder1: Record<string, any>;
    let folder2: Record<string, any>;
    let aco: ReturnType<typeof useGraphQlHandler>["aco"];

    beforeEach(async () => {
        const handler = useGraphQlHandler({
            plugins: [
                assignFolderLifecycleEvents(),
                createMockAcoApp({
                    name: "Webiny",
                    apiName: "Webiny"
                })
            ]
        });

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

    beforeEach(async () => {
        tracker.reset();
    });

    it("should trigger create lifecycle events", async () => {
        const [response] = await aco.createFolder({
            data: {
                title,
                slug,
                type,
                parentId: folder1.id
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
                            parentId: folder1.id
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
                parentId: folder1.id
            }
        });

        tracker.reset();

        const [updateResponse] = await aco.updateFolder({
            id: createResponse.data.aco.createFolder.data.id,
            data: {
                title: `${title} updated`,
                slug: `${slug}-updated`,
                parentId: folder2.id
            }
        });

        expect(updateResponse).toMatchObject({
            data: {
                aco: {
                    updateFolder: {
                        data: {
                            title: `${title} updated`,
                            slug: `${slug}-updated`,
                            parentId: folder2.id
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
                parentId: folder1.id
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
