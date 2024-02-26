import { mdbid } from "@webiny/utils";
import useGqlHandler from "./useGqlHandler";
import { identityA, identityB, NOT_AUTHORIZED_RESPONSE } from "./mocks";
import { Category } from "~/types";
import { SecurityIdentity, SecurityPermission } from "@webiny/api-security/types";

const defaultHandler = useGqlHandler({
    permissions: [{ name: "content.i18n" }, { name: "pb.*" }],
    identity: identityA
});

jest.setTimeout(100000);

describe("Pages Security Test", () => {
    const { createCategory, until } = useGqlHandler();

    let initialCategory: Category;

    beforeEach(async () => {
        await createCategory({
            data: {
                slug: `category`,
                name: `name`,
                url: `/some-url/`,
                layout: `layout`
            }
        }).then(([res]) => (initialCategory = res.data.pageBuilder.createCategory.data));
    });

    test(`"listPages" only returns entries to which the identity has access to`, async () => {
        const { createPage } = defaultHandler;
        await createPage({ category: initialCategory.slug });
        await createPage({ category: initialCategory.slug });

        const identityBHandler = useGqlHandler({ identity: identityB });
        await identityBHandler.createPage({ category: initialCategory.slug });
        await identityBHandler.createPage({ category: initialCategory.slug });

        const insufficientPermissions: [SecurityPermission[], SecurityIdentity | null][] = [
            [[], null],
            [[], identityA],
            [[{ name: "pb.page", rwd: "wd" }], identityA],
            [[{ name: "pb.page", rwd: "d" }], identityA],
            [[{ name: "pb.page", rwd: "w" }], identityA],
            [
                [{ name: "content.i18n", locales: ["de-DE", "it-IT"] }, { name: "pb.page" }],
                identityA
            ]
        ];

        await until(
            () => useGqlHandler().listPages({ sort: ["createdOn_DESC"] }),
            ([res]: any) => res.data.pageBuilder.listPages.data.length === 4
        );

        for (let i = 0; i < insufficientPermissions.length; i++) {
            const [permissions, identity] = insufficientPermissions[i];
            const { listPages } = useGqlHandler({
                permissions,
                identity
            });
            const [response] = await listPages({ sort: ["createdOn_DESC"] });
            expect(response).toMatchObject(NOT_AUTHORIZED_RESPONSE("listPages"));
        }

        const sufficientPermissionsAll: [SecurityPermission[], SecurityIdentity | null][] = [
            [[{ name: "content.i18n" }, { name: "content.i18n" }, { name: "pb.page" }], identityA],
            [[{ name: "content.i18n" }, { name: "pb.page", rwd: "r" }], identityA],
            [[{ name: "content.i18n" }, { name: "pb.page", rwd: "rw" }], identityA],
            [[{ name: "content.i18n" }, { name: "pb.page", rwd: "rwd" }], identityA],
            [[{ name: "content.i18n" }, { name: "pb.*" }], identityA],
            [[{ name: "content.i18n", locales: ["en-US"] }, { name: "pb.page" }], identityA]
        ];

        for (let i = 0; i < sufficientPermissionsAll.length; i++) {
            const [permissions, identity] = sufficientPermissionsAll[i];
            const { listPages } = useGqlHandler({
                permissions,
                identity
            });
            const [response] = await listPages({ sort: ["createdOn_DESC"] });
            expect(response).toMatchObject({
                data: {
                    pageBuilder: {
                        listPages: {
                            data: [
                                {
                                    status: "draft",
                                    locked: false,
                                    publishedOn: null,
                                    createdBy: identityB
                                },
                                {
                                    status: "draft",
                                    locked: false,
                                    publishedOn: null,
                                    createdBy: identityB
                                },
                                {
                                    status: "draft",
                                    locked: false,
                                    publishedOn: null,
                                    createdBy: identityA
                                },
                                {
                                    status: "draft",
                                    locked: false,
                                    publishedOn: null,
                                    createdBy: identityA
                                }
                            ],
                            error: null
                        }
                    }
                }
            });
        }

        let identityAHandler = useGqlHandler({
            permissions: [{ name: "content.i18n" }, { name: "pb.page", own: true }],
            identity: identityA
        });

        let [response] = await identityAHandler.listPages({ sort: ["createdOn_DESC"] });
        expect(response).toMatchObject({
            data: {
                pageBuilder: {
                    listPages: {
                        data: [
                            {
                                createdBy: identityA,
                                status: "draft",
                                locked: false,
                                publishedOn: null
                            },
                            {
                                createdBy: identityA,
                                status: "draft",
                                locked: false,
                                publishedOn: null
                            }
                        ],
                        error: null
                    }
                }
            }
        });

        identityAHandler = useGqlHandler({
            permissions: [{ name: "content.i18n" }, { name: "pb.page", own: true }],
            identity: identityB
        });

        [response] = await identityAHandler.listPages({ sort: ["createdOn_DESC"] });
        expect(response).toMatchObject({
            data: {
                pageBuilder: {
                    listPages: {
                        data: [
                            {
                                createdBy: identityB,
                                status: "draft",
                                locked: false,
                                publishedOn: null
                            },
                            {
                                createdBy: identityB,
                                status: "draft",
                                locked: false,
                                publishedOn: null
                            }
                        ],
                        error: null
                    }
                }
            }
        });
    });

    test(`allow createPage if identity has sufficient permissions`, async () => {
        const insufficientPermissions: [SecurityPermission[], SecurityIdentity | null][] = [
            [[], null],
            [[], identityA],
            [[{ name: "pb.page", own: false, rwd: "r" }], identityA],
            [[{ name: "pb.page", own: false, rwd: "rd" }], identityA],
            [
                [{ name: "content.i18n", locales: ["de-DE", "it-IT"] }, { name: "pb.page" }],
                identityA
            ],
            [[{ name: "content.i18n" }, { name: "pb.page", own: true, rwd: "r" }], identityA],
            [
                [
                    { name: "content.i18n" },
                    { name: "pb.page", own: true, rwd: "r" },
                    { name: "pb.category", own: true }
                ],
                identityA
            ]
        ];

        for (let i = 0; i < insufficientPermissions.length; i++) {
            const [permissions, identity] = insufficientPermissions[i];
            const { createPage } = useGqlHandler({
                permissions,
                identity
            });

            const [response] = await createPage({ category: initialCategory.slug });
            expect(response).toMatchObject(NOT_AUTHORIZED_RESPONSE("createPage"));
        }

        const sufficientPermissions: [SecurityPermission[], SecurityIdentity | null][] = [
            [[{ name: "content.i18n" }, { name: "pb.page" }], identityA],

            // This is an interesting case - we needed to add `{ name: "pb.category", rwd: "r" }`, because otherwise,
            // we'd get SECURITY_NOT_AUTHORIZED error. This is because when creating a page, a category is being
            // loaded, and for that, we also need proper permissions. Without the added permission object, the
            // category load would fail because it's not owned by provided `identityA`. If we added the `own: true`
            // to it, we'd again get SECURITY_NOT_AUTHORIZED error. This is what is tested above.
            // This has also been added in the delete test, below.
            [
                [
                    { name: "content.i18n" },
                    { name: "pb.page", own: true },
                    { name: "pb.category", rwd: "r" } // This needed to be added.
                ],
                identityA
            ],
            [[{ name: "content.i18n" }, { name: "pb.page", rwd: "w" }], identityA],
            [[{ name: "content.i18n" }, { name: "pb.page", rwd: "rw" }], identityA],
            [[{ name: "content.i18n" }, { name: "pb.page", rwd: "rwd" }], identityA],
            [[{ name: "content.i18n", locales: ["en-US"] }, { name: "pb.page" }], identityA]
        ];

        for (let i = 0; i < sufficientPermissions.length; i++) {
            const [permissions, identity] = sufficientPermissions[i];
            const { createPage } = useGqlHandler({
                permissions,
                identity
            });

            const [response] = await createPage({ category: initialCategory.slug });
            expect(response).toMatchObject({
                data: {
                    pageBuilder: {
                        createPage: {
                            data: {
                                status: "draft"
                            },
                            error: null
                        }
                    }
                }
            });
        }
    });

    const pageUpdateInsufficientPermissions: [SecurityPermission[], SecurityIdentity | null][] = [
        [[], null],
        [[], identityA],
        [[{ name: "pb.page", rwd: "r" }], identityA],
        [[{ name: "pb.page", rwd: "rd" }], identityA],
        [[{ name: "pb.page", own: true }], identityB],
        [[{ name: "content.i18n", locales: ["de-DE", "it-IT"] }, { name: "pb.page" }], identityA]
    ];

    test.each(pageUpdateInsufficientPermissions)(
        `do not allow "updatePage" if identity has no sufficient permissions`,
        async (permissions, identity) => {
            const { createPage } = defaultHandler;

            const page = await createPage({ category: initialCategory.slug }).then(
                ([res]) => res.data.pageBuilder.createPage.data
            );
            const { updatePage } = useGqlHandler({ permissions, identity });
            const [response] = await updatePage({
                id: page.id,
                data: {
                    title: `${page.title}-UPDATED`
                }
            });
            expect(response).toMatchObject(NOT_AUTHORIZED_RESPONSE("updatePage"));
        }
    );

    const updatePageSufficientPermissions: [SecurityPermission[], SecurityIdentity | null][] = [
        [[{ name: "content.i18n" }, { name: "pb.page" }], identityA],
        [[{ name: "content.i18n" }, { name: "pb.page", own: true }], identityA],
        [[{ name: "content.i18n" }, { name: "pb.page", rwd: "w" }], identityA],
        [[{ name: "content.i18n" }, { name: "pb.page", rwd: "rw" }], identityA],
        [[{ name: "content.i18n" }, { name: "pb.page", rwd: "rwd" }], identityA],
        [[{ name: "content.i18n", locales: ["en-US"] }, { name: "pb.page" }], identityA]
    ];

    test.each(updatePageSufficientPermissions)(
        `allow "updatePage" if identity has sufficient permissions`,
        async (permissions, identity) => {
            const { createPage } = defaultHandler;

            const page = await createPage({ category: initialCategory.slug }).then(
                ([res]) => res.data.pageBuilder.createPage.data
            );

            const id = mdbid();

            const { updatePage } = useGqlHandler({
                permissions,
                identity
            });
            const [response] = await updatePage({
                id: page.id,
                data: { title: `${page.title}-UPDATED-${id}` }
            });
            expect(response).toMatchObject({
                data: {
                    pageBuilder: {
                        updatePage: {
                            data: {
                                title: `${page.title}-UPDATED-${id}`
                            },
                            error: null
                        }
                    }
                }
            });
        }
    );

    test(`allow "deletePage" if identity has sufficient permissions`, async () => {
        const { createPage } = defaultHandler;
        const page = await createPage({ category: initialCategory.slug }).then(
            ([res]) => res.data.pageBuilder.createPage.data
        );

        const insufficientPermissions: [SecurityPermission[], SecurityIdentity | null][] = [
            [[], null],
            [[], identityA],
            [[{ name: "content.i18n" }, { name: "pb.page", rwd: "r" }], identityA],
            [[{ name: "content.i18n" }, { name: "pb.page", rwd: "rw" }], identityA],
            [[{ name: "content.i18n" }, { name: "pb.page", own: true }], identityB],
            [
                [{ name: "content.i18n", locales: ["de-DE", "it-IT"] }, { name: "pb.page" }],
                identityA
            ]
        ];

        for (let i = 0; i < insufficientPermissions.length; i++) {
            const [permissions, identity] = insufficientPermissions[i];
            const { deletePage } = useGqlHandler({
                permissions,
                identity
            });
            const [response] = await deletePage({ id: page.id });
            expect(response).toMatchObject(NOT_AUTHORIZED_RESPONSE("deletePage"));
        }

        const sufficientPermissions: [SecurityPermission[], SecurityIdentity | null][] = [
            [[{ name: "content.i18n" }, { name: "pb.page" }], identityA],
            [
                [
                    { name: "content.i18n" },
                    { name: "pb.page", own: true },
                    // Added this because the category is not owned by current user.
                    { name: "pb.category", rwd: "r" }
                ],
                identityA
            ],
            [[{ name: "content.i18n" }, { name: "pb.page", rwd: "wd" }], identityA],
            [[{ name: "content.i18n" }, { name: "pb.page", rwd: "rwd" }], identityA],
            [
                [
                    { name: "content.i18n" },
                    { name: "content.i18n", locales: ["en-US"] },
                    { name: "pb.page" }
                ],
                identityA
            ]
        ];

        for (let i = 0; i < sufficientPermissions.length; i++) {
            const [permissions, identity] = sufficientPermissions[i];
            const { createPage, deletePage } = useGqlHandler({
                permissions,
                identity
            });

            const page = await createPage({ category: initialCategory.slug }).then(
                ([res]) => res.data.pageBuilder.createPage.data
            );
            const [response] = await deletePage({
                id: page.id
            });

            expect(response).toMatchObject({
                data: {
                    pageBuilder: {
                        deletePage: {
                            data: {
                                page: {
                                    id: page.id
                                }
                            },
                            error: null
                        }
                    }
                }
            });
        }
    });

    const getPageInsufficientPermissions: [SecurityPermission[], SecurityIdentity | null][] = [
        [[], null],
        [[], identityA],
        [[{ name: "content.i18n" }, { name: "pb.page", rwd: "w" }], identityA],
        [[{ name: "content.i18n" }, { name: "pb.page", rwd: "wd" }], identityA],
        [[{ name: "content.i18n" }, { name: "pb.page", own: true }], identityB],
        [[{ name: "content.i18n", locales: ["de-DE", "it-IT"] }, { name: "pb.page" }], identityA]
    ];

    test.each(getPageInsufficientPermissions)(
        `do not allow "getPage" if identity has no sufficient permissions`,
        async (permissions, identity) => {
            const { createPage } = defaultHandler;
            const page = await createPage({ category: initialCategory.slug }).then(
                ([res]) => res.data.pageBuilder.createPage.data
            );

            const { getPage } = useGqlHandler({ permissions, identity });
            const [response] = await getPage({ id: page.id });
            expect(response).toMatchObject(NOT_AUTHORIZED_RESPONSE("getPage"));
        }
    );

    const getPageSufficientPermissions: [SecurityPermission[], SecurityIdentity | null][] = [
        [[{ name: "content.i18n" }, { name: "pb.page" }], identityA],
        [[{ name: "content.i18n" }, { name: "pb.page", own: true }], identityA],
        [[{ name: "content.i18n" }, { name: "pb.page", rwd: "r" }], identityA],
        [[{ name: "content.i18n" }, { name: "pb.page", rwd: "rw" }], identityA],
        [[{ name: "content.i18n" }, { name: "pb.page", rwd: "rwd" }], identityA],
        [
            [
                { name: "content.i18n" },
                { name: "content.i18n", locales: ["en-US"] },
                { name: "pb.page" }
            ],
            identityA
        ]
    ];

    test.each(getPageSufficientPermissions)(
        `allow "getPage" if identity has sufficient permissions`,
        async (permissions, identity) => {
            const { createPage } = defaultHandler;
            const page = await createPage({ category: initialCategory.slug }).then(
                ([res]) => res.data.pageBuilder.createPage.data
            );

            const { getPage } = useGqlHandler({ permissions, identity });
            const [response] = await getPage({ id: page.id });
            expect(response).toMatchObject({
                data: {
                    pageBuilder: {
                        getPage: {
                            data: {
                                status: "draft",
                                locked: false,
                                publishedOn: null,
                                createdBy: identityA,
                                createdOn: /^20/
                            },
                            error: null
                        }
                    }
                }
            });
        }
    );
});
