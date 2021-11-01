import useGqlHandler from "./useGqlHandler";
import { identityA, identityB } from "./mocks";

function Mock(prefix = "") {
    this.slug = `${prefix}slug`;
    this.name = `${prefix}name`;
    this.url = `${prefix}url`;
    this.layout = `${prefix}layout`;
}

const NOT_AUTHORIZED_RESPONSE = operation => ({
    data: {
        pageBuilder: {
            [operation]: {
                data: null,
                error: {
                    code: "SECURITY_NOT_AUTHORIZED",
                    data: null,
                    message: "Not authorized!"
                }
            }
        }
    }
});

jest.setTimeout(100000);

describe("Categories Security Test", () => {
    const { createCategory } = useGqlHandler({
        permissions: [{ name: "content.i18n" }, { name: "pb.*" }],
        identity: identityA
    });

    test(`"listCategories" only returns entries to which the identity has access to`, async () => {
        await createCategory({ data: new Mock("list-categories-1-") });
        await createCategory({ data: new Mock("list-categories-2-") });

        const identityBHandler = useGqlHandler({ identity: identityB });
        await identityBHandler.createCategory({ data: new Mock("list-categories-3-") });
        await identityBHandler.createCategory({ data: new Mock("list-categories-4-") });

        const insufficientPermissions = [
            [[], null],
            [[], identityA],
            [[{ name: "pb.category", rwd: "wd" }], identityA],
            [[{ name: "pb.category", rwd: "d" }], identityA],
            [[{ name: "pb.category", rwd: "w" }], identityA],
            [
                [{ name: "content.i18n", locales: ["de-DE", "it-IT"] }, { name: "pb.category" }],
                identityA
            ]
        ];

        for (let i = 0; i < insufficientPermissions.length; i++) {
            const [permissions, identity] = insufficientPermissions[i];
            const { listCategories } = useGqlHandler({ permissions, identity: identity as any });
            const [response] = await listCategories();
            expect(response).toMatchObject(NOT_AUTHORIZED_RESPONSE("listCategories"));
        }

        const sufficientPermissionsAll = [
            [
                [{ name: "content.i18n" }, { name: "content.i18n" }, { name: "pb.category" }],
                identityA
            ],
            [[{ name: "content.i18n" }, { name: "pb.category", rwd: "r" }], identityA],
            [[{ name: "content.i18n" }, { name: "pb.category", rwd: "rw" }], identityA],
            [[{ name: "content.i18n" }, { name: "pb.category", rwd: "rwd" }], identityA],
            [[{ name: "content.i18n" }, { name: "pb.*" }], identityA],
            [[{ name: "content.i18n", locales: ["en-US"] }, { name: "pb.category" }], identityA]
        ];

        for (let i = 0; i < sufficientPermissionsAll.length; i++) {
            const [permissions, identity] = sufficientPermissionsAll[i];
            const { listCategories } = useGqlHandler({ permissions, identity: identity as any });
            const [response] = await listCategories();
            expect(response).toMatchObject({
                data: {
                    pageBuilder: {
                        listCategories: {
                            data: [
                                {
                                    createdBy: identityA,
                                    createdOn: /^20/,
                                    url: "list-categories-1-url",
                                    layout: "list-categories-1-layout",
                                    slug: "list-categories-1-slug",
                                    name: "list-categories-1-name"
                                },
                                {
                                    createdBy: identityA,
                                    createdOn: /^20/,
                                    url: "list-categories-2-url",
                                    layout: "list-categories-2-layout",
                                    slug: "list-categories-2-slug",
                                    name: "list-categories-2-name"
                                },
                                {
                                    createdBy: identityB,
                                    createdOn: /^20/,
                                    url: "list-categories-3-url",
                                    layout: "list-categories-3-layout",
                                    slug: "list-categories-3-slug",
                                    name: "list-categories-3-name"
                                },
                                {
                                    createdBy: identityB,
                                    createdOn: /^20/,
                                    url: "list-categories-4-url",
                                    layout: "list-categories-4-layout",
                                    slug: "list-categories-4-slug",
                                    name: "list-categories-4-name"
                                }
                            ],
                            error: null
                        }
                    }
                }
            });
        }

        let identityAHandler = useGqlHandler({
            permissions: [{ name: "content.i18n" }, { name: "pb.category", own: true }],
            identity: identityA
        });

        let [response] = await identityAHandler.listCategories();
        expect(response).toMatchObject({
            data: {
                pageBuilder: {
                    listCategories: {
                        data: [
                            {
                                createdBy: identityA,
                                createdOn: /^20/,
                                url: "list-categories-1-url",
                                layout: "list-categories-1-layout",
                                slug: "list-categories-1-slug",
                                name: "list-categories-1-name"
                            },
                            {
                                createdBy: identityA,
                                createdOn: /^20/,
                                url: "list-categories-2-url",
                                layout: "list-categories-2-layout",
                                slug: "list-categories-2-slug",
                                name: "list-categories-2-name"
                            }
                        ],
                        error: null
                    }
                }
            }
        });

        identityAHandler = useGqlHandler({
            permissions: [{ name: "content.i18n" }, { name: "pb.category", own: true }],
            identity: identityB
        });

        [response] = await identityAHandler.listCategories();
        expect(response).toMatchObject({
            data: {
                pageBuilder: {
                    listCategories: {
                        data: [
                            {
                                createdBy: identityB,
                                createdOn: /^20/,
                                url: "list-categories-3-url",
                                layout: "list-categories-3-layout",
                                slug: "list-categories-3-slug",
                                name: "list-categories-3-name"
                            },
                            {
                                createdBy: identityB,
                                createdOn: /^20/,
                                url: "list-categories-4-url",
                                layout: "list-categories-4-layout",
                                slug: "list-categories-4-slug",
                                name: "list-categories-4-name"
                            }
                        ],
                        error: null
                    }
                }
            }
        });
    });

    test(`allow createCategory if identity has sufficient permissions`, async () => {
        const insufficientPermissions = [
            [[], null],
            [[], identityA],
            [[{ name: "pb.category", own: false, rwd: "r" }], identityA],
            [[{ name: "pb.category", own: false, rwd: "rd" }], identityA],
            [
                [{ name: "content.i18n", locales: ["de-DE", "it-IT"] }, { name: "pb.category" }],
                identityA
            ]
        ];

        for (let i = 0; i < insufficientPermissions.length; i++) {
            const [permissions, identity] = insufficientPermissions[i];
            const { createCategory } = useGqlHandler({ permissions, identity: identity as any });

            const [response] = await createCategory({ data: new Mock() });
            expect(response).toMatchObject(NOT_AUTHORIZED_RESPONSE("createCategory"));
        }

        const sufficientPermissions = [
            [[{ name: "content.i18n" }, { name: "pb.category" }], identityA],
            [[{ name: "content.i18n" }, { name: "pb.category", own: true }], identityA],
            [[{ name: "content.i18n" }, { name: "pb.category", rwd: "w" }], identityA],
            [[{ name: "content.i18n" }, { name: "pb.category", rwd: "rw" }], identityA],
            [[{ name: "content.i18n" }, { name: "pb.category", rwd: "rwd" }], identityA],
            [[{ name: "content.i18n", locales: ["en-US"] }, { name: "pb.category" }], identityA]
        ];

        for (let i = 0; i < sufficientPermissions.length; i++) {
            const [permissions, identity] = sufficientPermissions[i];
            const { createCategory } = useGqlHandler({ permissions, identity: identity as any });

            const data = new Mock(`category-create-${i}-`);
            const [response] = await createCategory({ data });
            expect(response).toMatchObject({
                data: {
                    pageBuilder: {
                        createCategory: {
                            data,
                            error: null
                        }
                    }
                }
            });
        }
    });

    test(`allow "updateCategory" if identity has sufficient permissions`, async () => {
        const mock = new Mock("update-category-");

        await createCategory({ data: mock });

        const insufficientPermissions = [
            [[], null],
            [[], identityA],
            [[{ name: "pb.category", rwd: "r" }], identityA],
            [[{ name: "pb.category", rwd: "rd" }], identityA],
            [[{ name: "pb.category", own: true }], identityB],
            [
                [{ name: "content.i18n", locales: ["de-DE", "it-IT"] }, { name: "pb.category" }],
                identityA
            ],
            [[{ name: "content.i18n" }, { name: "pb.category", rwd: "w" }], identityA] // will fail - missing "r"
        ];

        for (let i = 0; i < insufficientPermissions.length; i++) {
            const [permissions, identity] = insufficientPermissions[i];
            const { updateCategory } = useGqlHandler({ permissions, identity: identity as any });
            const [response] = await updateCategory({ slug: mock.slug, data: mock });
            expect(response).toMatchObject(NOT_AUTHORIZED_RESPONSE("updateCategory"));
        }

        const sufficientPermissions = [
            [[{ name: "content.i18n" }, { name: "pb.category" }], identityA],
            [[{ name: "content.i18n" }, { name: "pb.category", own: true }], identityA],

            [[{ name: "content.i18n" }, { name: "pb.category", rwd: "rw" }], identityA],
            [[{ name: "content.i18n" }, { name: "pb.category", rwd: "rwd" }], identityA],
            [[{ name: "content.i18n", locales: ["en-US"] }, { name: "pb.category" }], identityA]
        ];

        for (let i = 0; i < sufficientPermissions.length; i++) {
            const [permissions, identity] = sufficientPermissions[i];
            const { updateCategory } = useGqlHandler({ permissions, identity: identity as any });
            const [response] = await updateCategory({ slug: mock.slug, data: mock });
            expect(response).toMatchObject({
                data: {
                    pageBuilder: {
                        updateCategory: {
                            data: mock,
                            error: null
                        }
                    }
                }
            });
        }
    });

    const deleteCategoryInsufficientPermissions = [
        // [[], null],
        // [[], identityA],
        [[{ name: "content.i18n" }, { name: "pb.category", rwd: "r" }], identityA],
        [[{ name: "content.i18n" }, { name: "pb.category", rwd: "rw" }], identityA],
        [[{ name: "content.i18n" }, { name: "pb.category", own: true }], identityB],
        [
            [{ name: "content.i18n", locales: ["de-DE", "it-IT"] }, { name: "pb.category" }],
            identityA
        ],
        [[{ name: "content.i18n" }, { name: "pb.category", rwd: "wd" }], identityA] // will fail - missing "r"
    ];

    test.each(deleteCategoryInsufficientPermissions)(
        `do not allow "deleteCategory" if identity has not sufficient permissions`,
        async (permissions: any, identity: any) => {
            const mock = new Mock("delete-category-");

            await createCategory({ data: mock });

            const { deleteCategory } = useGqlHandler({ permissions, identity });
            const [response] = await deleteCategory({ slug: mock.slug });
            expect(response).toMatchObject(NOT_AUTHORIZED_RESPONSE("deleteCategory"));
        }
    );

    const deleteCategorySufficientPermissions = [
        [[{ name: "content.i18n" }, { name: "pb.category" }], identityA],
        [[{ name: "content.i18n" }, { name: "pb.category", own: true }], identityA],
        [[{ name: "content.i18n" }, { name: "pb.category", rwd: "rwd" }], identityA],
        [
            [
                { name: "content.i18n" },
                { name: "content.i18n", locales: ["en-US"] },
                { name: "pb.category" }
            ],
            identityA
        ]
    ];
    test.each(deleteCategorySufficientPermissions)(
        `allow "deleteCategory" if identity has sufficient permissions`,
        async (permissions: any, identity: any) => {
            const mock = new Mock("delete-category-");

            const { createCategory, deleteCategory } = useGqlHandler({
                permissions,
                identity: identity as any
            });
            await createCategory({ data: mock });
            const [response] = await deleteCategory({
                slug: mock.slug
            });
            expect(response).toMatchObject({
                data: {
                    pageBuilder: {
                        deleteCategory: {
                            data: mock,
                            error: null
                        }
                    }
                }
            });
        }
    );

    const getCategoryInsufficientPermissions = [
        [[], null],
        [[], identityA],
        [[{ name: "content.i18n" }, { name: "pb.category", rwd: "w" }], identityA],
        [[{ name: "content.i18n" }, { name: "pb.category", rwd: "wd" }], identityA],
        [[{ name: "content.i18n" }, { name: "pb.category", own: true }], identityB],
        [
            [{ name: "content.i18n", locales: ["de-DE", "it-IT"] }, { name: "pb.category" }],
            identityA
        ]
    ];

    test.each(getCategoryInsufficientPermissions)(
        `do not allow "getCategory" if identity has no sufficient permissions`,
        async (permissions: any, identity: any) => {
            const mock = new Mock("get-category-");
            await createCategory({ data: mock });
            const { getCategory } = useGqlHandler({ permissions, identity });
            const [response] = await getCategory({ slug: mock.slug, data: mock });
            expect(response).toMatchObject(NOT_AUTHORIZED_RESPONSE("getCategory"));
        }
    );

    const getCategorySufficientPermissions = [
        [[{ name: "content.i18n" }, { name: "pb.category" }], identityA],
        [[{ name: "content.i18n" }, { name: "pb.category", own: true }], identityA],
        [[{ name: "content.i18n" }, { name: "pb.category", rwd: "r" }], identityA],
        [[{ name: "content.i18n" }, { name: "pb.category", rwd: "rw" }], identityA],
        [[{ name: "content.i18n" }, { name: "pb.category", rwd: "rwd" }], identityA],
        [
            [
                { name: "content.i18n" },
                { name: "content.i18n", locales: ["en-US"] },
                { name: "pb.category" }
            ],
            identityA
        ]
    ];

    test.each(getCategorySufficientPermissions)(
        `allow "getCategory" if identity has sufficient permissions`,
        async (permissions: any, identity: any) => {
            const mock = new Mock("get-category-");

            await createCategory({ data: mock });

            const { getCategory } = useGqlHandler({ permissions, identity });
            const [response] = await getCategory({ slug: mock.slug, data: mock });
            expect(response).toMatchObject({
                data: {
                    pageBuilder: {
                        getCategory: {
                            data: {
                                ...mock,
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
