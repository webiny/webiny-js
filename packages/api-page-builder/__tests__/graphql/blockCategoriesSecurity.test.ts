import useGqlHandler from "./useGqlHandler";
import { identityA, identityB } from "./mocks";

function Mock(prefix = "") {
    this.slug = `${prefix}slug`;
    this.name = `${prefix}name`;
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

const intAsString = [
    "zero",
    "one",
    "two",
    "three",
    "four",
    "five",
    "six",
    "seven",
    "eight",
    "nine",
    "ten"
];

describe("Block Categories Security Test", () => {
    const { createBlockCategory } = useGqlHandler({
        permissions: [{ name: "content.i18n" }, { name: "pb.*" }],
        identity: identityA
    });

    test(`"listBlockCategories" only returns entries to which the identity has access to`, async () => {
        await createBlockCategory({ data: new Mock("list-block-categories-one-") });
        await createBlockCategory({ data: new Mock("list-block-categories-two-") });

        const identityBHandler = useGqlHandler({ identity: identityB });
        await identityBHandler.createBlockCategory({
            data: new Mock("list-block-categories-three-")
        });
        await identityBHandler.createBlockCategory({
            data: new Mock("list-block-categories-four-")
        });

        const insufficientPermissions = [
            [[], null],
            [[], identityA],
            [[{ name: "pb.block", rwd: "wd" }], identityA],
            [[{ name: "pb.block", rwd: "d" }], identityA],
            [[{ name: "pb.block", rwd: "w" }], identityA],
            [
                [{ name: "content.i18n", locales: ["de-DE", "it-IT"] }, { name: "pb.block" }],
                identityA
            ]
        ];

        for (let i = 0; i < insufficientPermissions.length; i++) {
            const [permissions, identity] = insufficientPermissions[i];
            const { listBlockCategories } = useGqlHandler({
                permissions,
                identity: identity as any
            });
            const [response] = await listBlockCategories();
            expect(response).toMatchObject(NOT_AUTHORIZED_RESPONSE("listBlockCategories"));
        }

        const sufficientPermissionsAll = [
            [[{ name: "content.i18n" }, { name: "content.i18n" }, { name: "pb.block" }], identityA],
            [[{ name: "content.i18n" }, { name: "pb.block", rwd: "r" }], identityA],
            [[{ name: "content.i18n" }, { name: "pb.block", rwd: "rw" }], identityA],
            [[{ name: "content.i18n" }, { name: "pb.block", rwd: "rwd" }], identityA],
            [[{ name: "content.i18n" }, { name: "pb.*" }], identityA],
            [[{ name: "content.i18n", locales: ["en-US"] }, { name: "pb.block" }], identityA]
        ];

        for (let i = 0; i < sufficientPermissionsAll.length; i++) {
            const [permissions, identity] = sufficientPermissionsAll[i];
            const { listBlockCategories } = useGqlHandler({
                permissions,
                identity: identity as any
            });
            const [response] = await listBlockCategories();
            expect(response).toMatchObject({
                data: {
                    pageBuilder: {
                        listBlockCategories: {
                            data: [
                                {
                                    createdBy: identityA,
                                    createdOn: /^20/,
                                    slug: "list-block-categories-one-slug",
                                    name: "list-block-categories-one-name"
                                },
                                {
                                    createdBy: identityA,
                                    createdOn: /^20/,
                                    slug: "list-block-categories-two-slug",
                                    name: "list-block-categories-two-name"
                                },
                                {
                                    createdBy: identityB,
                                    createdOn: /^20/,
                                    slug: "list-block-categories-three-slug",
                                    name: "list-block-categories-three-name"
                                },
                                {
                                    createdBy: identityB,
                                    createdOn: /^20/,
                                    slug: "list-block-categories-four-slug",
                                    name: "list-block-categories-four-name"
                                }
                            ],
                            error: null
                        }
                    }
                }
            });
        }

        let identityAHandler = useGqlHandler({
            permissions: [{ name: "content.i18n" }, { name: "pb.block", own: true }],
            identity: identityA
        });

        let [response] = await identityAHandler.listBlockCategories();
        expect(response).toMatchObject({
            data: {
                pageBuilder: {
                    listBlockCategories: {
                        data: [
                            {
                                createdBy: identityA,
                                createdOn: /^20/,
                                slug: "list-block-categories-one-slug",
                                name: "list-block-categories-one-name"
                            },
                            {
                                createdBy: identityA,
                                createdOn: /^20/,
                                slug: "list-block-categories-two-slug",
                                name: "list-block-categories-two-name"
                            }
                        ],
                        error: null
                    }
                }
            }
        });

        identityAHandler = useGqlHandler({
            permissions: [{ name: "content.i18n" }, { name: "pb.block", own: true }],
            identity: identityB
        });

        [response] = await identityAHandler.listBlockCategories();
        expect(response).toMatchObject({
            data: {
                pageBuilder: {
                    listBlockCategories: {
                        data: [
                            {
                                createdBy: identityB,
                                createdOn: /^20/,
                                slug: "list-block-categories-three-slug",
                                name: "list-block-categories-three-name"
                            },
                            {
                                createdBy: identityB,
                                createdOn: /^20/,
                                slug: "list-block-categories-four-slug",
                                name: "list-block-categories-four-name"
                            }
                        ],
                        error: null
                    }
                }
            }
        });
    });

    test(`allow createBlockCategory if identity has sufficient permissions`, async () => {
        const insufficientPermissions = [
            [[], null],
            [[], identityA],
            [[{ name: "pb.block", own: false, rwd: "r" }], identityA],
            [[{ name: "pb.block", own: false, rwd: "rd" }], identityA],
            [
                [{ name: "content.i18n", locales: ["de-DE", "it-IT"] }, { name: "pb.block" }],
                identityA
            ]
        ];

        for (let i = 0; i < insufficientPermissions.length; i++) {
            const [permissions, identity] = insufficientPermissions[i];
            const { createBlockCategory } = useGqlHandler({
                permissions,
                identity: identity as any
            });

            const [response] = await createBlockCategory({ data: new Mock() });
            expect(response).toMatchObject(NOT_AUTHORIZED_RESPONSE("createBlockCategory"));
        }

        const sufficientPermissions = [
            [[{ name: "content.i18n" }, { name: "pb.block" }], identityA],
            [[{ name: "content.i18n" }, { name: "pb.block", own: true }], identityA],
            [[{ name: "content.i18n" }, { name: "pb.block", rwd: "w" }], identityA],
            [[{ name: "content.i18n" }, { name: "pb.block", rwd: "rw" }], identityA],
            [[{ name: "content.i18n" }, { name: "pb.block", rwd: "rwd" }], identityA],
            [[{ name: "content.i18n", locales: ["en-US"] }, { name: "pb.block" }], identityA]
        ];

        for (let i = 0; i < sufficientPermissions.length; i++) {
            const [permissions, identity] = sufficientPermissions[i];
            const { createBlockCategory } = useGqlHandler({
                permissions,
                identity: identity as any
            });

            const data = new Mock(`block-category-create-${intAsString[i]}-`);
            const [response] = await createBlockCategory({ data });
            expect(response).toMatchObject({
                data: {
                    pageBuilder: {
                        createBlockCategory: {
                            data,
                            error: null
                        }
                    }
                }
            });
        }
    });

    test(`allow "updateBlockCategory" if identity has sufficient permissions`, async () => {
        const mock = new Mock("update-block-category-");

        await createBlockCategory({ data: mock });

        const insufficientPermissions = [
            [[], null],
            [[], identityA],
            [[{ name: "pb.block", rwd: "r" }], identityA],
            [[{ name: "pb.block", rwd: "rd" }], identityA],
            [[{ name: "pb.block", own: true }], identityB],
            [
                [{ name: "content.i18n", locales: ["de-DE", "it-IT"] }, { name: "pb.block" }],
                identityA
            ],
            [[{ name: "content.i18n" }, { name: "pb.block", rwd: "w" }], identityA] // will fail - missing "r"
        ];

        for (let i = 0; i < insufficientPermissions.length; i++) {
            const [permissions, identity] = insufficientPermissions[i];
            const { updateBlockCategory } = useGqlHandler({
                permissions,
                identity: identity as any
            });
            const [response] = await updateBlockCategory({ slug: mock.slug, data: mock });
            expect(response).toMatchObject(NOT_AUTHORIZED_RESPONSE("updateBlockCategory"));
        }

        const sufficientPermissions = [
            [[{ name: "content.i18n" }, { name: "pb.block" }], identityA],
            [[{ name: "content.i18n" }, { name: "pb.block", own: true }], identityA],

            [[{ name: "content.i18n" }, { name: "pb.block", rwd: "rw" }], identityA],
            [[{ name: "content.i18n" }, { name: "pb.block", rwd: "rwd" }], identityA],
            [[{ name: "content.i18n", locales: ["en-US"] }, { name: "pb.block" }], identityA]
        ];

        for (let i = 0; i < sufficientPermissions.length; i++) {
            const [permissions, identity] = sufficientPermissions[i];
            const { updateBlockCategory } = useGqlHandler({
                permissions,
                identity: identity as any
            });
            const [response] = await updateBlockCategory({ slug: mock.slug, data: mock });
            expect(response).toMatchObject({
                data: {
                    pageBuilder: {
                        updateBlockCategory: {
                            data: mock,
                            error: null
                        }
                    }
                }
            });
        }
    });

    const deleteBlockCategoryInsufficientPermissions = [
        // [[], null],
        // [[], identityA],
        [[{ name: "content.i18n" }, { name: "pb.block", rwd: "r" }], identityA],
        [[{ name: "content.i18n" }, { name: "pb.block", rwd: "rw" }], identityA],
        [[{ name: "content.i18n" }, { name: "pb.block", own: true }], identityB],
        [[{ name: "content.i18n", locales: ["de-DE", "it-IT"] }, { name: "pb.block" }], identityA],
        [[{ name: "content.i18n" }, { name: "pb.block", rwd: "wd" }], identityA] // will fail - missing "r"
    ];

    test.each(deleteBlockCategoryInsufficientPermissions)(
        `do not allow "deleteBlockCategory" if identity has not sufficient permissions`,
        async (permissions: any, identity: any) => {
            const mock = new Mock("delete-block-category-");

            await createBlockCategory({ data: mock });

            const { deleteBlockCategory } = useGqlHandler({ permissions, identity });
            const [response] = await deleteBlockCategory({ slug: mock.slug });
            expect(response).toMatchObject(NOT_AUTHORIZED_RESPONSE("deleteBlockCategory"));
        }
    );

    const deleteBlockCategorySufficientPermissions = [
        [[{ name: "content.i18n" }, { name: "pb.block" }], identityA],
        [[{ name: "content.i18n" }, { name: "pb.block", own: true }], identityA],
        [[{ name: "content.i18n" }, { name: "pb.block", rwd: "rwd" }], identityA],
        [
            [
                { name: "content.i18n" },
                { name: "content.i18n", locales: ["en-US"] },
                { name: "pb.block" }
            ],
            identityA
        ]
    ];
    test.each(deleteBlockCategorySufficientPermissions)(
        `allow "deleteBlockCategory" if identity has sufficient permissions`,
        async (permissions: any, identity: any) => {
            const mock = new Mock("delete-block-category-");

            const { createBlockCategory, deleteBlockCategory } = useGqlHandler({
                permissions,
                identity: identity as any
            });
            await createBlockCategory({ data: mock });
            const [response] = await deleteBlockCategory({
                slug: mock.slug
            });
            expect(response).toMatchObject({
                data: {
                    pageBuilder: {
                        deleteBlockCategory: {
                            data: mock,
                            error: null
                        }
                    }
                }
            });
        }
    );

    const getBlockCategoryInsufficientPermissions = [
        [[], null],
        [[], identityA],
        [[{ name: "content.i18n" }, { name: "pb.block", rwd: "w" }], identityA],
        [[{ name: "content.i18n" }, { name: "pb.block", rwd: "wd" }], identityA],
        [[{ name: "content.i18n" }, { name: "pb.block", own: true }], identityB],
        [[{ name: "content.i18n", locales: ["de-DE", "it-IT"] }, { name: "pb.block" }], identityA]
    ];

    test.each(getBlockCategoryInsufficientPermissions)(
        `do not allow "getBlockCategory" if identity has no sufficient permissions`,
        async (permissions: any, identity: any) => {
            const mock = new Mock("get-block-category-");
            await createBlockCategory({ data: mock });
            const { getBlockCategory } = useGqlHandler({ permissions, identity });
            const [response] = await getBlockCategory({ slug: mock.slug, data: mock });
            expect(response).toMatchObject(NOT_AUTHORIZED_RESPONSE("getBlockCategory"));
        }
    );

    const getBlockCategorySufficientPermissions = [
        [[{ name: "content.i18n" }, { name: "pb.block" }], identityA],
        [[{ name: "content.i18n" }, { name: "pb.block", own: true }], identityA],
        [[{ name: "content.i18n" }, { name: "pb.block", rwd: "r" }], identityA],
        [[{ name: "content.i18n" }, { name: "pb.block", rwd: "rw" }], identityA],
        [[{ name: "content.i18n" }, { name: "pb.block", rwd: "rwd" }], identityA],
        [
            [
                { name: "content.i18n" },
                { name: "content.i18n", locales: ["en-US"] },
                { name: "pb.block" }
            ],
            identityA
        ]
    ];

    test.each(getBlockCategorySufficientPermissions)(
        `allow "getBlockCategory" if identity has sufficient permissions`,
        async (permissions: any, identity: any) => {
            const mock = new Mock("get-block-category-");

            await createBlockCategory({ data: mock });

            const { getBlockCategory } = useGqlHandler({ permissions, identity });
            const [response] = await getBlockCategory({ slug: mock.slug, data: mock });
            expect(response).toMatchObject({
                data: {
                    pageBuilder: {
                        getBlockCategory: {
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
