import useGqlHandler from "./useGqlHandler";

import { assignMenuLifecycleEvents, tracker } from "./mocks/lifecycleEvents";

const id = "menu-lifecycle-events";
const slug = "menu-lifecycle-events";
const title = "Menu Lifecycle Events";
const description = "Menu Description";
const items: any[] = [];

describe("Menu Lifecycle Events", () => {
    const handler = useGqlHandler({
        plugins: [assignMenuLifecycleEvents()]
    });

    const { createMenu, updateMenu, deleteMenu } = handler;

    beforeEach(async () => {
        tracker.reset();
    });

    it("should trigger create lifecycle events", async () => {
        const [response] = await createMenu({
            data: {
                id,
                title,
                slug,
                description,
                items
            }
        });
        expect(response).toMatchObject({
            data: {
                pageBuilder: {
                    createMenu: {
                        data: {
                            title,
                            slug,
                            items,
                            description
                        },
                        error: null
                    }
                }
            }
        });

        expect(tracker.isExecutedOnce("menu:beforeCreate")).toEqual(true);
        expect(tracker.isExecutedOnce("menu:afterCreate")).toEqual(true);
        expect(tracker.isExecutedOnce("menu:beforeUpdate")).toEqual(false);
        expect(tracker.isExecutedOnce("menu:afterUpdate")).toEqual(false);
        expect(tracker.isExecutedOnce("menu:beforeDelete")).toEqual(false);
        expect(tracker.isExecutedOnce("menu:afterDelete")).toEqual(false);
    });

    it("should trigger update lifecycle events", async () => {
        await createMenu({
            data: {
                id,
                title,
                slug,
                description,
                items
            }
        });
        tracker.reset();

        const [response] = await updateMenu({
            slug: slug,
            data: {
                slug,
                title: `${title} updated`
            }
        });

        expect(response).toMatchObject({
            data: {
                pageBuilder: {
                    updateMenu: {
                        data: {
                            title: `${title} updated`,
                            slug
                        },
                        error: null
                    }
                }
            }
        });

        expect(tracker.isExecutedOnce("menu:beforeCreate")).toEqual(false);
        expect(tracker.isExecutedOnce("menu:afterCreate")).toEqual(false);
        expect(tracker.isExecutedOnce("menu:beforeUpdate")).toEqual(true);
        expect(tracker.isExecutedOnce("menu:afterUpdate")).toEqual(true);
        expect(tracker.isExecutedOnce("menu:beforeDelete")).toEqual(false);
        expect(tracker.isExecutedOnce("menu:afterDelete")).toEqual(false);
    });

    it("should trigger delete lifecycle events", async () => {
        await createMenu({
            data: {
                id,
                title,
                slug,
                description,
                items
            }
        });
        tracker.reset();

        const [response] = await deleteMenu({
            slug
        });
        expect(response).toMatchObject({
            data: {
                pageBuilder: {
                    deleteMenu: {
                        data: {
                            title,
                            items,
                            description,
                            slug
                        },
                        error: null
                    }
                }
            }
        });

        expect(tracker.isExecutedOnce("menu:beforeCreate")).toEqual(false);
        expect(tracker.isExecutedOnce("menu:afterCreate")).toEqual(false);
        expect(tracker.isExecutedOnce("menu:beforeUpdate")).toEqual(false);
        expect(tracker.isExecutedOnce("menu:afterUpdate")).toEqual(false);
        expect(tracker.isExecutedOnce("menu:beforeDelete")).toEqual(true);
        expect(tracker.isExecutedOnce("menu:afterDelete")).toEqual(true);
    });
});
