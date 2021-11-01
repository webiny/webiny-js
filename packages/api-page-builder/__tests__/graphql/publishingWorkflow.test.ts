import useGqlHandler from "./useGqlHandler";
import { identityA, identityB, NOT_AUTHORIZED_RESPONSE } from "./mocks";
import { SecurityIdentity } from "@webiny/api-security";
import { Page } from "~/types";

jest.setTimeout(100000);

describe("publishing workflow", () => {
    const {
        createCategory,
        createPage,
        getPage,
        publishPage,
        requestReview,
        requestChanges,
        listPages,
        updatePage,
        until
    } = useGqlHandler();

    const handlerA = useGqlHandler({
        identity: identityA
    });

    const handlerB = useGqlHandler({
        identity: identityB
    });

    const createInitialData = async () => {
        const pages: Page[] = [];
        const category = await createCategory({
            data: {
                slug: `category`,
                name: `name`,
                url: `/some-url/`,
                layout: `layout`
            }
        }).then(([res]) => res.data.pageBuilder.createCategory.data);

        const letters = ["a", "z", "b"];
        for (const letter of letters) {
            const [response] = await createPage({ category: "category" });
            const { id } = response.data.pageBuilder.createPage.data;
            const [updatePageResponse] = await updatePage({
                id,
                data: {
                    title: `page-${letter}`
                }
            });
            pages.push(updatePageResponse.data.pageBuilder.updatePage.data);
        }

        return {
            category,
            pages
        };
    };

    test("simple workflow test (check request review and request changes)", async () => {
        const { category } = await createInitialData();
        const pageFromA = await handlerA
            .createPage({ category: category.slug })
            .then(([res]) => res.data.pageBuilder.createPage.data);

        expect(pageFromA.status).toBe("draft");

        await handlerA.requestReview({ id: pageFromA.id }).then(([res]) =>
            expect(res).toMatchObject({
                data: {
                    pageBuilder: {
                        requestReview: { data: { id: pageFromA.id, status: "reviewRequested" } }
                    }
                }
            })
        );

        await handlerB.requestChanges({ id: pageFromA.id }).then(([res]) =>
            expect(res).toMatchObject({
                data: {
                    pageBuilder: {
                        requestChanges: { data: { id: pageFromA.id, status: "changesRequested" } }
                    }
                }
            })
        );

        await handlerB.getPage({ id: pageFromA.id }).then(([res]) =>
            expect(res).toMatchObject({
                data: {
                    pageBuilder: {
                        getPage: { data: { id: pageFromA.id, status: "changesRequested" } }
                    }
                }
            })
        );
    });

    test("page should change status accordingly", async () => {
        const { pages } = await createInitialData();

        const [requestReviewResponse] = await requestReview({ id: pages[0].id });

        expect(requestReviewResponse).toMatchObject({
            data: {
                pageBuilder: {
                    requestReview: {
                        data: {
                            status: "reviewRequested"
                        }
                    }
                }
            }
        });

        const [getPageResponse] = await getPage({ id: pages[0].id });

        expect(getPageResponse).toMatchObject({
            data: {
                pageBuilder: {
                    getPage: {
                        data: {
                            status: "reviewRequested"
                        }
                    }
                }
            }
        });

        await until(
            listPages,
            ([res]) => res.data.pageBuilder.listPages.data[2].status === "reviewRequested",
            {
                name: "after request review and get that page was done",
                wait: 400,
                tries: 30
            }
        );

        const [publishPageResponse] = await publishPage({ id: pages[0].id });

        expect(publishPageResponse).toMatchObject({
            data: {
                pageBuilder: {
                    publishPage: {
                        data: {
                            status: "published"
                        }
                    }
                }
            }
        });

        const [afterPublishGetResponse] = await getPage({ id: pages[0].id });

        expect(afterPublishGetResponse).toMatchObject({
            data: {
                pageBuilder: {
                    getPage: {
                        data: {
                            id: pages[0].id,
                            status: "published"
                        },
                        error: null
                    }
                }
            }
        });

        await until(
            listPages,
            ([res]) => res.data.pageBuilder.listPages.data[2].status === "published",
            {
                name: "after request review, list pages and get that page was done"
            }
        );
    });

    test("can't request review if it has already been requested", async () => {
        const { pages } = await createInitialData();

        await requestReview({ id: pages[0].id });
        const [response] = await requestReview({ id: pages[0].id });
        expect(response).toEqual({
            data: {
                pageBuilder: {
                    requestReview: {
                        data: null,
                        error: {
                            code: "REQUEST_REVIEW_ERROR",
                            data: null,
                            message:
                                "Cannot request review - page is not a draft nor a change request has been issued."
                        }
                    }
                }
            }
        });
    });

    test("can't request changes on own page", async () => {
        const { pages } = await createInitialData();

        await requestReview({ id: pages[0].id });
        const [response] = await requestChanges({ id: pages[0].id });
        expect(response).toEqual({
            data: {
                pageBuilder: {
                    requestChanges: {
                        data: null,
                        error: {
                            code: "REQUESTED_CHANGES_ON_PAGE_REVISION_YOU_CREATED",
                            data: null,
                            message: "Cannot request changes on page revision you created."
                        }
                    }
                }
            }
        });
    });

    test("can't request changes on page not in review", async () => {
        const { pages } = await createInitialData();

        await requestReview({ id: pages[0].id });
        const [response] = await requestChanges({ id: pages[0].id });

        expect(response).toEqual({
            data: {
                pageBuilder: {
                    requestChanges: {
                        data: null,
                        error: {
                            code: "REQUESTED_CHANGES_ON_PAGE_REVISION_YOU_CREATED",
                            data: null,
                            message: "Cannot request changes on page revision you created."
                        }
                    }
                }
            }
        });
    });

    const publishSufficientPermission = [
        [[{ name: "content.i18n" }, { name: "pb.page" }], identityA],
        [[{ name: "content.i18n" }, { name: "pb.page" }], identityB],
        [[{ name: "content.i18n", locales: ["en-US"] }, { name: "pb.page" }], identityA],
        [[{ name: "content.i18n", locales: ["en-US"] }, { name: "pb.page" }], identityB],
        [[{ name: "content.i18n" }, { name: "pb.page", pw: "p" }], identityA],
        [[{ name: "content.i18n" }, { name: "pb.page", pw: "p" }], identityB],
        [[{ name: "content.i18n" }, { name: "pb.page", own: true, pw: "p" }], identityA]
    ];

    test.each(publishSufficientPermission)(
        "should be able to publish if has permission",
        async (permissions: any, identity: SecurityIdentity) => {
            const { category } = await createInitialData();

            // Create page with identityA.
            const page = await handlerA
                .createPage({ category: category.slug })
                .then(([res]) => res.data.pageBuilder.createPage.data);

            // Publish page with specific identity and permissions.

            const { publishPage } = useGqlHandler({ permissions, identity });

            const [response] = await publishPage({ id: page.id });
            expect(response).toMatchObject({
                data: {
                    pageBuilder: { publishPage: { data: { id: page.id, status: "published" } } }
                }
            });
        }
    );

    const publishInsufficientPermissions = [
        [[], null],
        [[], identityA],
        [[{ name: "content.i18n" }, { name: "pb.page", pw: "rcu" }], identityA],
        [
            [
                { name: "content.i18n", locales: ["en-US"] },
                { name: "pb.page", pw: "rcu" }
            ],
            identityA
        ],
        [
            [
                { name: "content.i18n", locales: ["en-US"] },
                { name: "pb.page", pw: "rcu" }
            ],
            identityB
        ],
        // Although the user has all of the `rcpu`, he can only perform these on own records.
        [
            [
                { name: "content.i18n", locales: ["en-US"] },
                { name: "pb.page", own: true, pw: "rpcu" }
            ],
            identityB
        ]
    ];

    test.each(publishInsufficientPermissions)(
        "should not be able to publish if no permission",
        async (permissions: any, identity: SecurityIdentity) => {
            const { category } = await createInitialData();

            // Create page with identityA.
            const page = await handlerA
                .createPage({ category: category.slug })
                .then(([res]) => res.data.pageBuilder.createPage.data);

            // Publish page with specific identity and permissions.

            const { publishPage } = useGqlHandler({ permissions, identity });

            const [response] = await publishPage({ id: page.id });
            expect(response).toMatchObject(NOT_AUTHORIZED_RESPONSE("publishPage"));
        }
    );

    const unpublishSufficientPermissions = [
        [[{ name: "content.i18n" }, { name: "pb.page" }], identityA],
        [[{ name: "content.i18n" }, { name: "pb.page" }], identityB],
        [[{ name: "content.i18n", locales: ["en-US"] }, { name: "pb.page" }], identityA],
        [[{ name: "content.i18n", locales: ["en-US"] }, { name: "pb.page" }], identityB],
        [[{ name: "content.i18n" }, { name: "pb.page", pw: "u" }], identityA],
        [[{ name: "content.i18n" }, { name: "pb.page", pw: "u" }], identityB],
        [[{ name: "content.i18n" }, { name: "pb.page", own: true, pw: "u" }], identityA]
    ];

    test.each(unpublishSufficientPermissions)(
        "should be able to unpublish if has permission",
        async (permissions: any, identity: SecurityIdentity) => {
            const { category } = await createInitialData();

            // Create page with identityA.
            const [createResponse] = await handlerA.createPage({ category: category.slug });

            const page = createResponse.data.pageBuilder.createPage.data;
            await handlerA.publishPage({ id: page.id });

            // Unpublish page with specific identity and permissions.
            const { unpublishPage } = useGqlHandler({ permissions, identity });

            const [response] = await unpublishPage({ id: page.id });

            expect(response).toMatchObject({
                data: {
                    pageBuilder: {
                        unpublishPage: { data: { id: page.id, status: "unpublished" } }
                    }
                }
            });
        }
    );
    const unpublishInsufficientPermissions = [
        [[], null],
        [[], identityA],
        // Has all, except access to `en-EN` (has `de-DE`).
        [
            [
                { name: "content.i18n", locales: ["de-DE"] },
                { name: "pb.page", pw: "rcpu" }
            ],
            identityA
        ],
        [[{ name: "content.i18n" }, { name: "pb.page", pw: "rcp" }], identityA],
        [
            [
                { name: "content.i18n", locales: ["en-US"] },
                { name: "pb.page", pw: "rcp" }
            ],
            identityA
        ],
        [
            [
                { name: "content.i18n", locales: ["en-US"] },
                { name: "pb.page", pw: "rcp" }
            ],
            identityB
        ],
        // Although the user has all of the `rcpu`, he can only perform these on own records.
        [
            [
                { name: "content.i18n", locales: ["en-US"] },
                { name: "pb.page", own: true, pw: "rpcu" }
            ],
            identityB
        ]
    ];

    test.each(unpublishInsufficientPermissions)(
        "should not be able to unpublish if no permission",
        async (permissions, identity: SecurityIdentity) => {
            const { category } = await createInitialData();

            // Create page with identityA.
            const [createResponse] = await handlerA.createPage({ category: category.slug });

            const page = createResponse.data.pageBuilder.createPage.data;

            await handlerA.publishPage({ id: page.id });

            // Unpublish page with specific identity and permissions.

            const { unpublishPage } = useGqlHandler({ permissions, identity });

            const [response] = await unpublishPage({ id: page.id });

            expect(response).toEqual(NOT_AUTHORIZED_RESPONSE("unpublishPage"));
        }
    );

    const requestReviewSufficientPermission = [
        [[{ name: "content.i18n" }, { name: "pb.page" }], identityA],
        [[{ name: "content.i18n" }, { name: "pb.page" }], identityB],
        [[{ name: "content.i18n", locales: ["en-US"] }, { name: "pb.page" }], identityA],
        [[{ name: "content.i18n", locales: ["en-US"] }, { name: "pb.page" }], identityB],
        [[{ name: "content.i18n" }, { name: "pb.page", pw: "r" }], identityA],
        [[{ name: "content.i18n" }, { name: "pb.page", pw: "r" }], identityB],
        [[{ name: "content.i18n" }, { name: "pb.page", own: true, pw: "r" }], identityA]
    ];

    test.each(requestReviewSufficientPermission)(
        "should be able to request review if has permission",
        async (permissions, identity: SecurityIdentity) => {
            const { category } = await createInitialData();

            // Create page with identityA.
            const page = await handlerA
                .createPage({ category: category.slug })
                .then(([res]) => res.data.pageBuilder.createPage.data);

            // request review on page with specific identity and permissions.

            const { requestReview } = useGqlHandler({ permissions, identity });

            const [response] = await requestReview({ id: page.id });

            expect(response).toMatchObject({
                data: {
                    pageBuilder: {
                        requestReview: { data: { id: page.id, status: "reviewRequested" } }
                    }
                }
            });
        }
    );

    const requestReviewInsufficientPermissions = [
        [[], null],
        [[], identityA],
        [[{ name: "content.i18n" }, { name: "pb.page", pw: "cpu" }], identityA],
        [
            [
                { name: "content.i18n", locales: ["en-US"] },
                { name: "pb.page", pw: "cpu" }
            ],
            identityA
        ],
        [
            [
                { name: "content.i18n", locales: ["en-US"] },
                { name: "pb.page", pw: "cpu" }
            ],
            identityB
        ],
        // Although the user has all of the `rcpu`, he can only perform these on own records.
        [
            [
                { name: "content.i18n", locales: ["en-US"] },
                { name: "pb.page", own: true, pw: "rpcu" }
            ],
            identityB
        ]
    ];

    test.each(requestReviewInsufficientPermissions)(
        "should not be able to request review if no permission",
        async (permissions, identity: SecurityIdentity) => {
            const { category } = await createInitialData();

            // Create page with identityA.
            const page = await handlerA
                .createPage({ category: category.slug })
                .then(([res]) => res.data.pageBuilder.createPage.data);

            // request review page with specific identity and permissions.
            const { requestReview } = useGqlHandler({ permissions, identity });

            const [response] = await requestReview({ id: page.id });

            expect(response).toMatchObject(NOT_AUTHORIZED_RESPONSE("requestReview"));
        }
    );

    const requestChangesSufficientPermissions = [
        [[{ name: "content.i18n" }, { name: "pb.page" }], identityB],
        [[{ name: "content.i18n", locales: ["en-US"] }, { name: "pb.page" }], identityB],
        [[{ name: "content.i18n" }, { name: "pb.page", pw: "c" }], identityB]
    ];

    test.each(requestChangesSufficientPermissions)(
        "should be able to request changes if has permission",
        async (permissions, identity: SecurityIdentity) => {
            const { category } = await createInitialData();
            // Create page with identityA.
            const page = await handlerA
                .createPage({ category: category.slug })
                .then(async ([res]) => {
                    return res.data.pageBuilder.createPage.data;
                });
            await handlerA.requestReview({ id: page.id });

            // request changes on page with specific identity and permissions.
            const { requestChanges } = useGqlHandler({ permissions, identity });

            const [response] = await requestChanges({ id: page.id });

            expect(response).toMatchObject({
                data: {
                    pageBuilder: {
                        requestChanges: { data: { id: page.id, status: "changesRequested" } }
                    }
                }
            });
        }
    );

    const requestChangesInsufficientPermissions = [
        [[], null],
        [[], identityA],
        [[{ name: "content.i18n", locales: ["de-DE"] }, { name: "pb.page" }], identityB],
        [
            [
                { name: "content.i18n", locales: ["de-DE"] },
                { name: "pb.page", pw: "rcpu" }
            ],
            identityB
        ],
        [[{ name: "content.i18n" }, { name: "pb.page", pw: "rpu" }], identityB],
        [[{ name: "content.i18n" }, { name: "pb.page", pw: "rcpu", own: true }], identityB]
    ];

    test.each(requestChangesInsufficientPermissions)(
        "should not be able to request changes if no permission",
        async (permissions, identity: SecurityIdentity) => {
            const { category } = await createInitialData();
            // Create page with identityA.
            const page = await handlerA
                .createPage({ category: category.slug })
                .then(async ([res]) => {
                    return res.data.pageBuilder.createPage.data;
                });
            await handlerA.requestReview({ id: page.id });

            // request changes with specific identity and permissions.
            const { requestChanges } = useGqlHandler({ permissions, identity });

            const [response] = await requestChanges({ id: page.id });

            expect(response).toEqual(NOT_AUTHORIZED_RESPONSE("requestChanges"));
        }
    );
});
