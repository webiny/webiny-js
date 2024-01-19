import useGqlHandler from "./useGqlHandler";
import { identityA, identityB } from "./mocks";
import { SecurityIdentity, SecurityPermission } from "@webiny/api-security/types";
import { Icon } from "~/types";

class Mock {
    public slug: string;
    public name: string;
    public icon: Icon;
    public description: string;

    constructor(prefix = "") {
        this.slug = `${prefix}slug`;
        this.name = `${prefix}name`;
        (this.icon = {
            type: `emoji`,
            name: `${prefix}icon`,
            value: `👍`
        }),
            (this.description = `${prefix}description`);
    }
}

const NOT_AUTHORIZED_RESPONSE = (operation: string) => ({
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

        const insufficientPermissions: [SecurityPermission[], SecurityIdentity | null][] = [
            [[], null],
            [[], identityA],
            [[{ name: "pb.blockCategory", rwd: "wd" }], identityA],
            [[{ name: "pb.blockCategory", rwd: "d" }], identityA],
            [[{ name: "pb.blockCategory", rwd: "w" }], identityA],
            [
                [
                    { name: "content.i18n", locales: ["de-DE", "it-IT"] },
                    { name: "pb.blockCategory" }
                ],
                identityA
            ]
        ];

        for (let i = 0; i < insufficientPermissions.length; i++) {
            const [permissions, identity] = insufficientPermissions[i];
            const { listBlockCategories } = useGqlHandler({
                permissions,
                identity
            });
            const [response] = await listBlockCategories();
            expect(response).toMatchObject(NOT_AUTHORIZED_RESPONSE("listBlockCategories"));
        }

        const sufficientPermissionsAll: [SecurityPermission[], SecurityIdentity][] = [
            [
                [{ name: "content.i18n" }, { name: "content.i18n" }, { name: "pb.blockCategory" }],
                identityA
            ],
            [[{ name: "content.i18n" }, { name: "pb.blockCategory", rwd: "r" }], identityA],
            [[{ name: "content.i18n" }, { name: "pb.blockCategory", rwd: "rw" }], identityA],
            [[{ name: "content.i18n" }, { name: "pb.blockCategory", rwd: "rwd" }], identityA],
            [[{ name: "content.i18n" }, { name: "pb.*" }], identityA],
            [
                [{ name: "content.i18n", locales: ["en-US"] }, { name: "pb.blockCategory" }],
                identityA
            ]
        ];

        for (let i = 0; i < sufficientPermissionsAll.length; i++) {
            const [permissions, identity] = sufficientPermissionsAll[i];
            const { listBlockCategories } = useGqlHandler({
                permissions,
                identity
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
                                    name: "list-block-categories-one-name",
                                    icon: {
                                        type: "emoji",
                                        name: "list-block-categories-one-icon",
                                        value: "👍"
                                    },
                                    description: "list-block-categories-one-description"
                                },
                                {
                                    createdBy: identityA,
                                    createdOn: /^20/,
                                    slug: "list-block-categories-two-slug",
                                    name: "list-block-categories-two-name",
                                    icon: {
                                        type: "emoji",
                                        name: "list-block-categories-two-icon",
                                        value: "👍"
                                    },
                                    description: "list-block-categories-two-description"
                                },
                                {
                                    createdBy: identityB,
                                    createdOn: /^20/,
                                    slug: "list-block-categories-three-slug",
                                    name: "list-block-categories-three-name",
                                    icon: {
                                        type: "emoji",
                                        name: "list-block-categories-three-icon",
                                        value: "👍"
                                    },
                                    description: "list-block-categories-three-description"
                                },
                                {
                                    createdBy: identityB,
                                    createdOn: /^20/,
                                    slug: "list-block-categories-four-slug",
                                    name: "list-block-categories-four-name",
                                    icon: {
                                        type: "emoji",
                                        name: "list-block-categories-four-icon",
                                        value: "👍"
                                    },
                                    description: "list-block-categories-four-description"
                                }
                            ],
                            error: null
                        }
                    }
                }
            });
        }

        let identityAHandler = useGqlHandler({
            permissions: [{ name: "content.i18n" }, { name: "pb.blockCategory", own: true }],
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
                                name: "list-block-categories-one-name",
                                icon: {
                                    type: "emoji",
                                    name: "list-block-categories-one-icon",
                                    value: "👍"
                                },
                                description: "list-block-categories-one-description"
                            },
                            {
                                createdBy: identityA,
                                createdOn: /^20/,
                                slug: "list-block-categories-two-slug",
                                name: "list-block-categories-two-name",
                                icon: {
                                    type: "emoji",
                                    name: "list-block-categories-two-icon",
                                    value: "👍"
                                },
                                description: "list-block-categories-two-description"
                            }
                        ],
                        error: null
                    }
                }
            }
        });

        identityAHandler = useGqlHandler({
            permissions: [{ name: "content.i18n" }, { name: "pb.blockCategory", own: true }],
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
                                name: "list-block-categories-three-name",
                                icon: {
                                    type: "emoji",
                                    name: "list-block-categories-three-icon",
                                    value: "👍"
                                },
                                description: "list-block-categories-three-description"
                            },
                            {
                                createdBy: identityB,
                                createdOn: /^20/,
                                slug: "list-block-categories-four-slug",
                                name: "list-block-categories-four-name",
                                icon: {
                                    type: "emoji",
                                    name: "list-block-categories-four-icon",
                                    value: "👍"
                                },
                                description: "list-block-categories-four-description"
                            }
                        ],
                        error: null
                    }
                }
            }
        });
    });

    test(`allow createBlockCategory if identity has sufficient permissions`, async () => {
        const insufficientPermissions: [SecurityPermission[], SecurityIdentity | null][] = [
            [[], null],
            [[], identityA],
            [[{ name: "pb.blockCategory", own: false, rwd: "r" }], identityA],
            [[{ name: "pb.blockCategory", own: false, rwd: "rd" }], identityA],
            [
                [
                    { name: "content.i18n", locales: ["de-DE", "it-IT"] },
                    { name: "pb.blockCategory" }
                ],
                identityA
            ]
        ];

        for (let i = 0; i < insufficientPermissions.length; i++) {
            const [permissions, identity] = insufficientPermissions[i];
            const { createBlockCategory } = useGqlHandler({
                permissions,
                identity
            });

            const [response] = await createBlockCategory({ data: new Mock() });
            expect(response).toMatchObject(NOT_AUTHORIZED_RESPONSE("createBlockCategory"));
        }

        const sufficientPermissions: [SecurityPermission[], SecurityIdentity][] = [
            [[{ name: "content.i18n" }, { name: "pb.blockCategory" }], identityA],
            [[{ name: "content.i18n" }, { name: "pb.blockCategory", own: true }], identityA],
            [[{ name: "content.i18n" }, { name: "pb.blockCategory", rwd: "w" }], identityA],
            [[{ name: "content.i18n" }, { name: "pb.blockCategory", rwd: "rw" }], identityA],
            [[{ name: "content.i18n" }, { name: "pb.blockCategory", rwd: "rwd" }], identityA],
            [
                [{ name: "content.i18n", locales: ["en-US"] }, { name: "pb.blockCategory" }],
                identityA
            ]
        ];

        for (let i = 0; i < sufficientPermissions.length; i++) {
            const [permissions, identity] = sufficientPermissions[i];
            const { createBlockCategory } = useGqlHandler({
                permissions,
                identity
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

        const insufficientPermissions: [SecurityPermission[], SecurityIdentity | null][] = [
            [[], null],
            [[], identityA],
            [[{ name: "pb.blockCategory", rwd: "r" }], identityA],
            [[{ name: "pb.blockCategory", rwd: "rd" }], identityA],
            [[{ name: "pb.blockCategory", own: true }], identityB],
            [
                [
                    { name: "content.i18n", locales: ["de-DE", "it-IT"] },
                    { name: "pb.blockCategory" }
                ],
                identityA
            ],
            [[{ name: "content.i18n" }, { name: "pb.blockCategory", rwd: "w" }], identityA] // will fail - missing "r"
        ];

        for (let i = 0; i < insufficientPermissions.length; i++) {
            const [permissions, identity] = insufficientPermissions[i];
            const { updateBlockCategory } = useGqlHandler({
                permissions,
                identity
            });
            const [response] = await updateBlockCategory({ slug: mock.slug, data: mock });
            expect(response).toMatchObject(NOT_AUTHORIZED_RESPONSE("updateBlockCategory"));
        }

        const sufficientPermissions: [SecurityPermission[], SecurityIdentity][] = [
            [[{ name: "content.i18n" }, { name: "pb.blockCategory" }], identityA],
            [[{ name: "content.i18n" }, { name: "pb.blockCategory", own: true }], identityA],

            [[{ name: "content.i18n" }, { name: "pb.blockCategory", rwd: "rw" }], identityA],
            [[{ name: "content.i18n" }, { name: "pb.blockCategory", rwd: "rwd" }], identityA],
            [
                [{ name: "content.i18n", locales: ["en-US"] }, { name: "pb.blockCategory" }],
                identityA
            ]
        ];

        for (let i = 0; i < sufficientPermissions.length; i++) {
            const [permissions, identity] = sufficientPermissions[i];
            const { updateBlockCategory } = useGqlHandler({
                permissions,
                identity
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

    const deleteBlockCategoryInsufficientPermissions: [SecurityPermission[], SecurityIdentity][] = [
        // [[], null],
        // [[], identityA],
        [[{ name: "content.i18n" }, { name: "pb.blockCategory", rwd: "r" }], identityA],
        [[{ name: "content.i18n" }, { name: "pb.blockCategory", rwd: "rw" }], identityA],
        [[{ name: "content.i18n" }, { name: "pb.blockCategory", own: true }], identityB],
        [
            [{ name: "content.i18n", locales: ["de-DE", "it-IT"] }, { name: "pb.blockCategory" }],
            identityA
        ],
        [[{ name: "content.i18n" }, { name: "pb.blockCategory", rwd: "wd" }], identityA] // will fail - missing "r"
    ];

    test.each(deleteBlockCategoryInsufficientPermissions)(
        `do not allow "deleteBlockCategory" if identity has not sufficient permissions`,
        async (permissions, identity) => {
            const mock = new Mock("delete-block-category-");

            await createBlockCategory({ data: mock });

            const { deleteBlockCategory } = useGqlHandler({ permissions, identity });
            const [response] = await deleteBlockCategory({ slug: mock.slug });
            expect(response).toMatchObject(NOT_AUTHORIZED_RESPONSE("deleteBlockCategory"));
        }
    );

    const deleteBlockCategorySufficientPermissions: [SecurityPermission[], SecurityIdentity][] = [
        [
            [
                { name: "content.i18n" },
                { name: "pb.blockCategory" },
                { name: "pb.block", rwd: "r" }
            ],
            identityA
        ],
        [
            [
                { name: "content.i18n" },
                { name: "pb.blockCategory", own: true },
                { name: "pb.block", rwd: "r" }
            ],
            identityA
        ],
        [
            [
                { name: "content.i18n" },
                { name: "pb.blockCategory", rwd: "rwd" },
                { name: "pb.block", rwd: "r" }
            ],
            identityA
        ],
        [
            [
                { name: "content.i18n" },
                { name: "content.i18n", locales: ["en-US"] },
                { name: "pb.blockCategory" },
                { name: "pb.block", rwd: "r" }
            ],
            identityA
        ]
    ];
    test.each(deleteBlockCategorySufficientPermissions)(
        `allow "deleteBlockCategory" if identity has sufficient permissions`,
        async (permissions, identity) => {
            const mock = new Mock("delete-block-category-");

            const { createBlockCategory, deleteBlockCategory } = useGqlHandler({
                permissions,
                identity
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

    const getBlockCategoryInsufficientPermissions: [
        SecurityPermission[],
        SecurityIdentity | null
    ][] = [
        [[], null],
        [[], identityA],
        [[{ name: "content.i18n" }, { name: "pb.blockCategory", rwd: "w" }], identityA],
        [[{ name: "content.i18n" }, { name: "pb.blockCategory", rwd: "wd" }], identityA],
        [[{ name: "content.i18n" }, { name: "pb.blockCategory", own: true }], identityB],
        [
            [{ name: "content.i18n", locales: ["de-DE", "it-IT"] }, { name: "pb.blockCategory" }],
            identityA
        ]
    ];

    test.each(getBlockCategoryInsufficientPermissions)(
        `do not allow "getBlockCategory" if identity has no sufficient permissions`,
        async (permissions, identity) => {
            const mock = new Mock("get-block-category-");
            await createBlockCategory({ data: mock });
            const { getBlockCategory } = useGqlHandler({ permissions, identity });
            const [response] = await getBlockCategory({ slug: mock.slug, data: mock });
            expect(response).toMatchObject(NOT_AUTHORIZED_RESPONSE("getBlockCategory"));
        }
    );

    const getBlockCategorySufficientPermissions: [SecurityPermission[], SecurityIdentity][] = [
        [[{ name: "content.i18n" }, { name: "pb.blockCategory" }], identityA],
        [[{ name: "content.i18n" }, { name: "pb.blockCategory", own: true }], identityA],
        [[{ name: "content.i18n" }, { name: "pb.blockCategory", rwd: "r" }], identityA],
        [[{ name: "content.i18n" }, { name: "pb.blockCategory", rwd: "rw" }], identityA],
        [[{ name: "content.i18n" }, { name: "pb.blockCategory", rwd: "rwd" }], identityA],
        [
            [
                { name: "content.i18n" },
                { name: "content.i18n", locales: ["en-US"] },
                { name: "pb.blockCategory" }
            ],
            identityA
        ]
    ];

    test.each(getBlockCategorySufficientPermissions)(
        `allow "getBlockCategory" if identity has sufficient permissions`,
        async (permissions, identity) => {
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
