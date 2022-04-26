import useGqlHandler from "./useGqlHandler";

import { assignPageLifecycleEvents, tracker } from "./mocks/lifecycleEvents";
import { PageData } from "./graphql/pages";

const categorySlug = "category-lifecycle-events";

describe("Page Lifecycle Events", () => {
    const handler = useGqlHandler({
        plugins: [assignPageLifecycleEvents()]
    });

    const handler2 = useGqlHandler({
        plugins: [assignPageLifecycleEvents()],
        identity: {
            id: "secondaryAdmin",
            type: "admin",
            displayName: "Admin 2"
        }
    });

    const {
        createCategory,
        createPage,
        deletePage,
        updatePage,
        publishPage,
        unpublishPage,
        requestReview
    } = handler;

    const { requestChanges, createCategory: createCategoryDifferentIdentity } = handler2;

    const createDummyPage = async (): Promise<PageData> => {
        const [response] = await createPage({
            category: categorySlug
        });

        const page = response.data?.pageBuilder?.createPage?.data;
        if (!page) {
            throw new Error(
                response.data?.pageBuilder?.error?.message ||
                    "unknown error while creating dummy page"
            );
        }
        return page;
    };

    let dummyPage: PageData;

    beforeEach(async () => {
        await createCategory({
            data: {
                slug: categorySlug,
                name: `name`,
                url: `/some-url/`,
                layout: `layout`
            }
        });
        dummyPage = await createDummyPage();
        tracker.reset();
    });

    it("should trigger create lifecycle events", async () => {
        const page = await createDummyPage();
        expect(page).toMatchObject({
            category: {
                slug: categorySlug
            }
        });

        expect(tracker.isExecutedOnce("page:beforeCreate")).toEqual(true);
        expect(tracker.isExecutedOnce("page:afterCreate")).toEqual(true);
        expect(tracker.isExecutedOnce("page:beforeCreateFrom")).toEqual(false);
        expect(tracker.isExecutedOnce("page:afterCreateFrom")).toEqual(false);
        expect(tracker.isExecutedOnce("page:beforeUpdate")).toEqual(false);
        expect(tracker.isExecutedOnce("page:afterUpdate")).toEqual(false);
        expect(tracker.isExecutedOnce("page:beforeDelete")).toEqual(false);
        expect(tracker.isExecutedOnce("page:afterDelete")).toEqual(false);
        expect(tracker.isExecutedOnce("page:beforePublish")).toEqual(false);
        expect(tracker.isExecutedOnce("page:afterPublish")).toEqual(false);
        expect(tracker.isExecutedOnce("page:beforeUnpublish")).toEqual(false);
        expect(tracker.isExecutedOnce("page:afterUnpublish")).toEqual(false);
        expect(tracker.isExecutedOnce("page:beforeRequestChanges")).toEqual(false);
        expect(tracker.isExecutedOnce("page:afterRequestChanges")).toEqual(false);
        expect(tracker.isExecutedOnce("page:beforeRequestReview")).toEqual(false);
        expect(tracker.isExecutedOnce("page:afterRequestReview")).toEqual(false);
    });

    it("should trigger update lifecycle events", async () => {
        const [response] = await updatePage({
            id: dummyPage.id,
            data: {
                title: "dummy-page"
            }
        });
        expect(response).toMatchObject({
            data: {
                pageBuilder: {
                    updatePage: {
                        data: {
                            title: "dummy-page",
                            category: {
                                slug: categorySlug
                            }
                        },
                        error: null
                    }
                }
            }
        });

        expect(tracker.isExecutedOnce("page:beforeCreate")).toEqual(false);
        expect(tracker.isExecutedOnce("page:afterCreate")).toEqual(false);
        expect(tracker.isExecutedOnce("page:beforeCreateFrom")).toEqual(false);
        expect(tracker.isExecutedOnce("page:afterCreateFrom")).toEqual(false);
        expect(tracker.isExecutedOnce("page:beforeUpdate")).toEqual(true);
        expect(tracker.isExecutedOnce("page:afterUpdate")).toEqual(true);
        expect(tracker.isExecutedOnce("page:beforeDelete")).toEqual(false);
        expect(tracker.isExecutedOnce("page:afterDelete")).toEqual(false);
        expect(tracker.isExecutedOnce("page:beforePublish")).toEqual(false);
        expect(tracker.isExecutedOnce("page:afterPublish")).toEqual(false);
        expect(tracker.isExecutedOnce("page:beforeUnpublish")).toEqual(false);
        expect(tracker.isExecutedOnce("page:afterUnpublish")).toEqual(false);
        expect(tracker.isExecutedOnce("page:beforeRequestChanges")).toEqual(false);
        expect(tracker.isExecutedOnce("page:afterRequestChanges")).toEqual(false);
        expect(tracker.isExecutedOnce("page:beforeRequestReview")).toEqual(false);
        expect(tracker.isExecutedOnce("page:afterRequestReview")).toEqual(false);
    });

    it("should trigger create from lifecycle events", async () => {
        const [response] = await createPage({
            from: dummyPage.id
        });
        expect(response).toMatchObject({
            data: {
                pageBuilder: {
                    createPage: {
                        data: {
                            createdFrom: dummyPage.id,
                            category: {
                                slug: categorySlug
                            }
                        },
                        error: null
                    }
                }
            }
        });

        expect(tracker.isExecutedOnce("page:beforeCreate")).toEqual(false);
        expect(tracker.isExecutedOnce("page:afterCreate")).toEqual(false);
        expect(tracker.isExecutedOnce("page:beforeCreateFrom")).toEqual(true);
        expect(tracker.isExecutedOnce("page:afterCreateFrom")).toEqual(true);
        expect(tracker.isExecutedOnce("page:beforeUpdate")).toEqual(false);
        expect(tracker.isExecutedOnce("page:afterUpdate")).toEqual(false);
        expect(tracker.isExecutedOnce("page:beforeDelete")).toEqual(false);
        expect(tracker.isExecutedOnce("page:afterDelete")).toEqual(false);
        expect(tracker.isExecutedOnce("page:beforePublish")).toEqual(false);
        expect(tracker.isExecutedOnce("page:afterPublish")).toEqual(false);
        expect(tracker.isExecutedOnce("page:beforeUnpublish")).toEqual(false);
        expect(tracker.isExecutedOnce("page:afterUnpublish")).toEqual(false);
        expect(tracker.isExecutedOnce("page:beforeRequestChanges")).toEqual(false);
        expect(tracker.isExecutedOnce("page:afterRequestChanges")).toEqual(false);
        expect(tracker.isExecutedOnce("page:beforeRequestReview")).toEqual(false);
        expect(tracker.isExecutedOnce("page:afterRequestReview")).toEqual(false);
    });

    it("should trigger delete lifecycle events", async () => {
        const [response] = await deletePage({
            id: dummyPage.id
        });
        expect(response).toMatchObject({
            data: {
                pageBuilder: {
                    deletePage: {
                        data: {
                            latestPage: null,
                            page: {
                                id: dummyPage.id,
                                category: {
                                    slug: categorySlug
                                }
                            }
                        },
                        error: null
                    }
                }
            }
        });

        expect(tracker.isExecutedOnce("page:beforeCreate")).toEqual(false);
        expect(tracker.isExecutedOnce("page:afterCreate")).toEqual(false);
        expect(tracker.isExecutedOnce("page:beforeCreateFrom")).toEqual(false);
        expect(tracker.isExecutedOnce("page:afterCreateFrom")).toEqual(false);
        expect(tracker.isExecutedOnce("page:beforeUpdate")).toEqual(false);
        expect(tracker.isExecutedOnce("page:afterUpdate")).toEqual(false);
        expect(tracker.isExecutedOnce("page:beforeDelete")).toEqual(true);
        expect(tracker.isExecutedOnce("page:afterDelete")).toEqual(true);
        expect(tracker.isExecutedOnce("page:beforePublish")).toEqual(false);
        expect(tracker.isExecutedOnce("page:afterPublish")).toEqual(false);
        expect(tracker.isExecutedOnce("page:beforeUnpublish")).toEqual(false);
        expect(tracker.isExecutedOnce("page:afterUnpublish")).toEqual(false);
        expect(tracker.isExecutedOnce("page:beforeRequestChanges")).toEqual(false);
        expect(tracker.isExecutedOnce("page:afterRequestChanges")).toEqual(false);
        expect(tracker.isExecutedOnce("page:beforeRequestReview")).toEqual(false);
        expect(tracker.isExecutedOnce("page:afterRequestReview")).toEqual(false);
    });

    it("should trigger publish lifecycle events", async () => {
        const [response] = await publishPage({
            id: dummyPage.id
        });
        expect(response).toMatchObject({
            data: {
                pageBuilder: {
                    publishPage: {
                        data: {
                            id: dummyPage.id,
                            status: "published",
                            category: {
                                slug: categorySlug
                            }
                        },
                        error: null
                    }
                }
            }
        });

        expect(tracker.isExecutedOnce("page:beforeCreate")).toEqual(false);
        expect(tracker.isExecutedOnce("page:afterCreate")).toEqual(false);
        expect(tracker.isExecutedOnce("page:beforeCreateFrom")).toEqual(false);
        expect(tracker.isExecutedOnce("page:afterCreateFrom")).toEqual(false);
        expect(tracker.isExecutedOnce("page:beforeUpdate")).toEqual(false);
        expect(tracker.isExecutedOnce("page:afterUpdate")).toEqual(false);
        expect(tracker.isExecutedOnce("page:beforeDelete")).toEqual(false);
        expect(tracker.isExecutedOnce("page:afterDelete")).toEqual(false);
        expect(tracker.isExecutedOnce("page:beforePublish")).toEqual(true);
        expect(tracker.isExecutedOnce("page:afterPublish")).toEqual(true);
        expect(tracker.isExecutedOnce("page:beforeUnpublish")).toEqual(false);
        expect(tracker.isExecutedOnce("page:afterUnpublish")).toEqual(false);
        expect(tracker.isExecutedOnce("page:beforeRequestChanges")).toEqual(false);
        expect(tracker.isExecutedOnce("page:afterRequestChanges")).toEqual(false);
        expect(tracker.isExecutedOnce("page:beforeRequestReview")).toEqual(false);
        expect(tracker.isExecutedOnce("page:afterRequestReview")).toEqual(false);
    });

    it("should trigger unpublish lifecycle events", async () => {
        await publishPage({
            id: dummyPage.id
        });
        tracker.reset();

        const [response] = await unpublishPage({
            id: dummyPage.id
        });
        expect(response).toMatchObject({
            data: {
                pageBuilder: {
                    unpublishPage: {
                        data: {
                            id: dummyPage.id,
                            status: "unpublished",
                            category: {
                                slug: categorySlug
                            }
                        },
                        error: null
                    }
                }
            }
        });

        expect(tracker.isExecutedOnce("page:beforeCreate")).toEqual(false);
        expect(tracker.isExecutedOnce("page:afterCreate")).toEqual(false);
        expect(tracker.isExecutedOnce("page:beforeCreateFrom")).toEqual(false);
        expect(tracker.isExecutedOnce("page:afterCreateFrom")).toEqual(false);
        expect(tracker.isExecutedOnce("page:beforeUpdate")).toEqual(false);
        expect(tracker.isExecutedOnce("page:afterUpdate")).toEqual(false);
        expect(tracker.isExecutedOnce("page:beforeDelete")).toEqual(false);
        expect(tracker.isExecutedOnce("page:afterDelete")).toEqual(false);
        expect(tracker.isExecutedOnce("page:beforePublish")).toEqual(false);
        expect(tracker.isExecutedOnce("page:afterPublish")).toEqual(false);
        expect(tracker.isExecutedOnce("page:beforeUnpublish")).toEqual(true);
        expect(tracker.isExecutedOnce("page:afterUnpublish")).toEqual(true);
        expect(tracker.isExecutedOnce("page:beforeRequestChanges")).toEqual(false);
        expect(tracker.isExecutedOnce("page:afterRequestChanges")).toEqual(false);
        expect(tracker.isExecutedOnce("page:beforeRequestReview")).toEqual(false);
        expect(tracker.isExecutedOnce("page:afterRequestReview")).toEqual(false);
    });

    it("should trigger request review lifecycle events", async () => {
        const [response] = await requestReview({
            id: dummyPage.id
        });
        expect(response).toMatchObject({
            data: {
                pageBuilder: {
                    requestReview: {
                        data: {
                            id: dummyPage.id,
                            status: "reviewRequested",
                            category: {
                                slug: categorySlug
                            }
                        },
                        error: null
                    }
                }
            }
        });

        expect(tracker.isExecutedOnce("page:beforeCreate")).toEqual(false);
        expect(tracker.isExecutedOnce("page:afterCreate")).toEqual(false);
        expect(tracker.isExecutedOnce("page:beforeCreateFrom")).toEqual(false);
        expect(tracker.isExecutedOnce("page:afterCreateFrom")).toEqual(false);
        expect(tracker.isExecutedOnce("page:beforeUpdate")).toEqual(false);
        expect(tracker.isExecutedOnce("page:afterUpdate")).toEqual(false);
        expect(tracker.isExecutedOnce("page:beforeDelete")).toEqual(false);
        expect(tracker.isExecutedOnce("page:afterDelete")).toEqual(false);
        expect(tracker.isExecutedOnce("page:beforePublish")).toEqual(false);
        expect(tracker.isExecutedOnce("page:afterPublish")).toEqual(false);
        expect(tracker.isExecutedOnce("page:beforeUnpublish")).toEqual(false);
        expect(tracker.isExecutedOnce("page:afterUnpublish")).toEqual(false);
        expect(tracker.isExecutedOnce("page:beforeRequestChanges")).toEqual(false);
        expect(tracker.isExecutedOnce("page:afterRequestChanges")).toEqual(false);
        expect(tracker.isExecutedOnce("page:beforeRequestReview")).toEqual(true);
        expect(tracker.isExecutedOnce("page:afterRequestReview")).toEqual(true);
    });

    it("should trigger request changes lifecycle events", async () => {
        const [requestReviewResponse] = await requestReview({
            id: dummyPage.id
        });

        expect(requestReviewResponse).toMatchObject({
            data: {
                pageBuilder: {
                    requestReview: {
                        data: {
                            id: dummyPage.id,
                            status: "reviewRequested",
                            category: {
                                slug: categorySlug
                            }
                        },
                        error: null
                    }
                }
            }
        });

        await createCategoryDifferentIdentity({
            data: {
                slug: categorySlug,
                name: `name`,
                url: `/some-url/`,
                layout: `layout`
            }
        });

        tracker.reset();

        const [response] = await requestChanges({
            id: dummyPage.id
        });
        expect(response).toMatchObject({
            data: {
                pageBuilder: {
                    requestChanges: {
                        data: {
                            id: dummyPage.id,
                            status: "changesRequested",
                            category: {
                                slug: categorySlug
                            }
                        },
                        error: null
                    }
                }
            }
        });

        expect(tracker.isExecutedOnce("page:beforeCreate")).toEqual(false);
        expect(tracker.isExecutedOnce("page:afterCreate")).toEqual(false);
        expect(tracker.isExecutedOnce("page:beforeCreateFrom")).toEqual(false);
        expect(tracker.isExecutedOnce("page:afterCreateFrom")).toEqual(false);
        expect(tracker.isExecutedOnce("page:beforeUpdate")).toEqual(false);
        expect(tracker.isExecutedOnce("page:afterUpdate")).toEqual(false);
        expect(tracker.isExecutedOnce("page:beforeDelete")).toEqual(false);
        expect(tracker.isExecutedOnce("page:afterDelete")).toEqual(false);
        expect(tracker.isExecutedOnce("page:beforePublish")).toEqual(false);
        expect(tracker.isExecutedOnce("page:afterPublish")).toEqual(false);
        expect(tracker.isExecutedOnce("page:beforeUnpublish")).toEqual(false);
        expect(tracker.isExecutedOnce("page:afterUnpublish")).toEqual(false);
        expect(tracker.isExecutedOnce("page:beforeRequestChanges")).toEqual(true);
        expect(tracker.isExecutedOnce("page:afterRequestChanges")).toEqual(true);
        expect(tracker.isExecutedOnce("page:beforeRequestReview")).toEqual(false);
        expect(tracker.isExecutedOnce("page:afterRequestReview")).toEqual(false);
    });
});
