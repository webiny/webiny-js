import useGqlHandler from "./useGqlHandler";

import { assignCategoryLifecycleEvents, tracker } from "./mocks/lifecycleEvents";

const name = "Category Lifecycle Events";
const slug = "category-lifecycle-events";
const url = "/some-url/";
const layout = "some-layout";

describe("Category Lifecycle Events", () => {
    const handler = useGqlHandler({
        plugins: [assignCategoryLifecycleEvents()]
    });

    const { createCategory, updateCategory, deleteCategory } = handler;

    beforeEach(async () => {
        tracker.reset();
    });

    it("should trigger create lifecycle events", async () => {
        const [response] = await createCategory({
            data: {
                slug,
                name,
                url,
                layout
            }
        });
        expect(response).toMatchObject({
            data: {
                pageBuilder: {
                    createCategory: {
                        data: {
                            name,
                            slug,
                            url,
                            layout
                        },
                        error: null
                    }
                }
            }
        });

        expect(tracker.isExecutedOnce("category:beforeCreate")).toEqual(true);
        expect(tracker.isExecutedOnce("category:afterCreate")).toEqual(true);
        expect(tracker.isExecutedOnce("category:beforeUpdate")).toEqual(false);
        expect(tracker.isExecutedOnce("category:afterUpdate")).toEqual(false);
        expect(tracker.isExecutedOnce("category:beforeDelete")).toEqual(false);
        expect(tracker.isExecutedOnce("category:afterDelete")).toEqual(false);
    });

    it("should trigger update lifecycle events", async () => {
        await createCategory({
            data: {
                slug,
                name,
                url,
                layout
            }
        });

        tracker.reset();

        const [response] = await updateCategory({
            slug: slug,
            data: {
                slug,
                name: `${name} updated`,
                url,
                layout
            }
        });

        expect(response).toMatchObject({
            data: {
                pageBuilder: {
                    updateCategory: {
                        data: {
                            name: `${name} updated`,
                            slug,
                            url,
                            layout
                        },
                        error: null
                    }
                }
            }
        });

        expect(tracker.isExecutedOnce("category:beforeCreate")).toEqual(false);
        expect(tracker.isExecutedOnce("category:afterCreate")).toEqual(false);
        expect(tracker.isExecutedOnce("category:beforeUpdate")).toEqual(true);
        expect(tracker.isExecutedOnce("category:afterUpdate")).toEqual(true);
        expect(tracker.isExecutedOnce("category:beforeDelete")).toEqual(false);
        expect(tracker.isExecutedOnce("category:afterDelete")).toEqual(false);
    });

    it("should trigger delete lifecycle events", async () => {
        await createCategory({
            data: {
                slug,
                name,
                url,
                layout
            }
        });

        tracker.reset();

        const [response] = await deleteCategory({
            slug
        });
        expect(response).toMatchObject({
            data: {
                pageBuilder: {
                    deleteCategory: {
                        data: {
                            name,
                            slug,
                            url,
                            layout
                        },
                        error: null
                    }
                }
            }
        });

        expect(tracker.isExecutedOnce("category:beforeCreate")).toEqual(false);
        expect(tracker.isExecutedOnce("category:afterCreate")).toEqual(false);
        expect(tracker.isExecutedOnce("category:beforeUpdate")).toEqual(false);
        expect(tracker.isExecutedOnce("category:afterUpdate")).toEqual(false);
        expect(tracker.isExecutedOnce("category:beforeDelete")).toEqual(true);
        expect(tracker.isExecutedOnce("category:afterDelete")).toEqual(true);
    });
});
