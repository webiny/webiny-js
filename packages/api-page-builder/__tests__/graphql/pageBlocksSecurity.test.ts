import useGqlHandler from "./useGqlHandler";
import { identityA, identityB } from "./mocks";
import { SecurityIdentity, SecurityPermission } from "@webiny/api-security/types";
import { expectCompressed } from "./utils/expectCompressed";

class Mock {
    public name: string;
    public blockCategory: string;
    public content: { some: string };

    constructor(prefix = "") {
        this.name = `${prefix}name`;
        this.blockCategory = `block-category`;
        this.content = { some: `${prefix}content` };
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

describe("Page blocks Security Test", () => {
    const { createBlockCategory } = useGqlHandler({
        permissions: [{ name: "content.i18n" }, { name: "pb.*" }],
        identity: identityA
    });

    const { createPageBlock } = useGqlHandler({
        permissions: [{ name: "content.i18n" }, { name: "pb.*" }],
        identity: identityA
    });

    test(`"listPageBlocks" only returns entries to which the identity has access to`, async () => {
        const [createBlockCategoryResponse] = await createBlockCategory({
            data: {
                slug: `block-category`,
                name: `block-category-name`,
                icon: {
                    type: `emoji`,
                    name: `block-category-icon`,
                    value: `👍`
                },
                description: `block-category-description`
            }
        });
        expect(createBlockCategoryResponse).toMatchObject({
            data: {
                pageBuilder: {
                    createBlockCategory: {
                        data: {
                            slug: "block-category"
                        },
                        error: null
                    }
                }
            }
        });

        const [createPageBlockOneResponse] = await createPageBlock({
            data: new Mock("list-page-blocks-one-")
        });
        expect(createPageBlockOneResponse).toMatchObject({
            data: {
                pageBuilder: {
                    createPageBlock: {
                        data: {
                            id: expect.any(String)
                        },
                        error: null
                    }
                }
            }
        });
        const [createPageBlockTwoResponse] = await createPageBlock({
            data: new Mock("list-page-blocks-two-")
        });
        expect(createPageBlockTwoResponse).toMatchObject({
            data: {
                pageBuilder: {
                    createPageBlock: {
                        data: {
                            id: expect.any(String)
                        },
                        error: null
                    }
                }
            }
        });

        const identityBHandler = useGqlHandler({ identity: identityB });
        await identityBHandler.createPageBlock({
            data: new Mock("list-page-blocks-three-")
        });
        await identityBHandler.createPageBlock({
            data: new Mock("list-page-blocks-four-")
        });

        const insufficientPermissions: [SecurityPermission[], SecurityIdentity | null][] = [
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
            const { listPageBlocks } = useGqlHandler({
                permissions,
                identity
            });
            const [response] = await listPageBlocks();
            expect(response).toMatchObject(NOT_AUTHORIZED_RESPONSE("listPageBlocks"));
        }

        const sufficientPermissionsAll: [SecurityPermission[], SecurityIdentity][] = [
            [[{ name: "content.i18n" }, { name: "content.i18n" }, { name: "pb.block" }], identityA],
            [[{ name: "content.i18n" }, { name: "pb.block", rwd: "r" }], identityA],
            [[{ name: "content.i18n" }, { name: "pb.block", rwd: "rw" }], identityA],
            [[{ name: "content.i18n" }, { name: "pb.block", rwd: "rwd" }], identityA],
            [[{ name: "content.i18n" }, { name: "pb.*" }], identityA],
            [[{ name: "content.i18n", locales: ["en-US"] }, { name: "pb.block" }], identityA]
        ];

        for (let i = 0; i < sufficientPermissionsAll.length; i++) {
            const [permissions, identity] = sufficientPermissionsAll[i];
            const { listPageBlocks } = useGqlHandler({
                permissions,
                identity
            });
            const [response] = await listPageBlocks();
            expect(response).toMatchObject({
                data: {
                    pageBuilder: {
                        listPageBlocks: {
                            data: [
                                {
                                    createdBy: identityA,
                                    createdOn: /^20/,
                                    name: "list-page-blocks-one-name",
                                    blockCategory: "block-category",
                                    content: expectCompressed({
                                        some: "list-page-blocks-one-content"
                                    })
                                },
                                {
                                    createdBy: identityA,
                                    createdOn: /^20/,
                                    name: "list-page-blocks-two-name",
                                    blockCategory: "block-category",
                                    content: expectCompressed({
                                        some: "list-page-blocks-two-content"
                                    })
                                },
                                {
                                    createdBy: identityB,
                                    createdOn: /^20/,
                                    name: "list-page-blocks-three-name",
                                    blockCategory: "block-category",
                                    content: expectCompressed({
                                        some: "list-page-blocks-three-content"
                                    })
                                },
                                {
                                    createdBy: identityB,
                                    createdOn: /^20/,
                                    name: "list-page-blocks-four-name",
                                    blockCategory: "block-category",
                                    content: expectCompressed({
                                        some: "list-page-blocks-four-content"
                                    })
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

        let [response] = await identityAHandler.listPageBlocks();
        expect(response).toMatchObject({
            data: {
                pageBuilder: {
                    listPageBlocks: {
                        data: [
                            {
                                createdBy: identityA,
                                createdOn: /^20/,
                                name: "list-page-blocks-one-name",
                                blockCategory: "block-category",
                                content: expectCompressed({ some: "list-page-blocks-one-content" })
                            },
                            {
                                createdBy: identityA,
                                createdOn: /^20/,
                                name: "list-page-blocks-two-name",
                                blockCategory: "block-category",
                                content: expectCompressed({ some: "list-page-blocks-two-content" })
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

        [response] = await identityAHandler.listPageBlocks();
        expect(response).toMatchObject({
            data: {
                pageBuilder: {
                    listPageBlocks: {
                        data: [
                            {
                                createdBy: identityB,
                                createdOn: /^20/,
                                name: "list-page-blocks-three-name",
                                blockCategory: "block-category",
                                content: expectCompressed({
                                    some: "list-page-blocks-three-content"
                                })
                            },
                            {
                                createdBy: identityB,
                                createdOn: /^20/,
                                name: "list-page-blocks-four-name",
                                blockCategory: "block-category",
                                content: expectCompressed({ some: "list-page-blocks-four-content" })
                            }
                        ],
                        error: null
                    }
                }
            }
        });
    });

    test(`allow "createPageBlock" if identity has sufficient permissions`, async () => {
        await createBlockCategory({
            data: {
                slug: `block-category`,
                name: `block-category-name`,
                icon: {
                    type: `emoji`,
                    name: `block-category-icon`,
                    value: `👍`
                },
                description: `block-category-description`
            }
        });

        const insufficientPermissions: [SecurityPermission[], SecurityIdentity | null][] = [
            [[], null],
            [[], identityA],
            [[{ name: "pb.block", own: false, rwd: "r" }], identityA],
            [[{ name: "pb.block", own: false, rwd: "rd" }], identityA],
            [
                [{ name: "content.i18n", locales: ["de-DE", "it-IT"] }, { name: "pb.block" }],
                identityA
            ],
            [[{ name: "content.i18n" }, { name: "pb.block", rwd: "w" }], identityA] // will fail - missing "r"
        ];

        for (let i = 0; i < insufficientPermissions.length; i++) {
            const [permissions, identity] = insufficientPermissions[i];
            const { createPageBlock } = useGqlHandler({
                permissions,
                identity
            });

            const [response] = await createPageBlock({ data: new Mock() });
            expect(response).toMatchObject(NOT_AUTHORIZED_RESPONSE("createPageBlock"));
        }

        const sufficientPermissions: [SecurityPermission[], SecurityIdentity][] = [
            [
                [
                    { name: "content.i18n" },
                    { name: "pb.block" },
                    { name: "pb.blockCategory", rwd: "rw" }
                ],
                identityA
            ],
            [
                [
                    { name: "content.i18n" },
                    { name: "pb.block", own: true },
                    { name: "pb.blockCategory", rwd: "rw" }
                ],
                identityA
            ],
            [
                [
                    { name: "content.i18n" },
                    { name: "pb.block", rwd: "rw" },
                    { name: "pb.blockCategory", rwd: "rw" }
                ],
                identityA
            ],
            [
                [
                    { name: "content.i18n" },
                    { name: "pb.block", rwd: "rwd" },
                    { name: "pb.blockCategory", rwd: "rw" }
                ],
                identityA
            ],
            [
                [
                    { name: "content.i18n", locales: ["en-US"] },
                    { name: "pb.block" },
                    { name: "pb.blockCategory", rwd: "rw" }
                ],
                identityA
            ]
        ];

        for (let i = 0; i < sufficientPermissions.length; i++) {
            const [permissions, identity] = sufficientPermissions[i];
            const { createBlockCategory } = useGqlHandler({
                permissions,
                identity
            });
            const { createPageBlock } = useGqlHandler({
                permissions,
                identity
            });

            await createBlockCategory({
                data: {
                    slug: `block-category`,
                    name: `block-category-name`,
                    icon: {
                        type: `emoji`,
                        name: `block-category-icon`,
                        value: `👍`
                    },
                    description: `block-category-description`
                }
            });
            const data = new Mock(`page-block-create-${intAsString[i]}-`);
            const [response] = await createPageBlock({ data });
            expect(response).toMatchObject({
                data: {
                    pageBuilder: {
                        createPageBlock: {
                            data: {
                                ...data,
                                content: expectCompressed(data.content)
                            },
                            error: null
                        }
                    }
                }
            });
        }
    });

    test(`allow "updatePageBlock" if identity has sufficient permissions`, async () => {
        const mock = new Mock("update-page-block-");

        await createBlockCategory({
            data: {
                slug: `block-category`,
                name: `block-category-name`,
                icon: {
                    type: `emoji`,
                    name: `block-category-icon`,
                    value: `👍`
                },
                description: `block-category-description`
            }
        });

        const [createPageBlockResponse] = await createPageBlock({ data: mock });

        const id = createPageBlockResponse.data.pageBuilder.createPageBlock.data.id;

        const insufficientPermissions: [SecurityPermission[], SecurityIdentity | null][] = [
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
            const { updatePageBlock } = useGqlHandler({
                permissions,
                identity
            });
            const [response] = await updatePageBlock({ id, data: mock });
            expect(response).toMatchObject(NOT_AUTHORIZED_RESPONSE("updatePageBlock"));
        }

        const sufficientPermissions: [SecurityPermission[], SecurityIdentity][] = [
            [
                [
                    { name: "content.i18n" },
                    { name: "pb.block" },
                    { name: "pb.blockCategory", rwd: "rw" }
                ],
                identityA
            ],
            [
                [
                    { name: "content.i18n" },
                    { name: "pb.block", own: true },
                    { name: "pb.blockCategory", rwd: "rw" }
                ],
                identityA
            ],
            [
                [
                    { name: "content.i18n" },
                    { name: "pb.block", rwd: "rw" },
                    { name: "pb.blockCategory", rwd: "rw" }
                ],
                identityA
            ],
            [
                [
                    { name: "content.i18n" },
                    { name: "pb.block", rwd: "rwd" },
                    { name: "pb.blockCategory", rwd: "rw" }
                ],
                identityA
            ],
            [
                [
                    { name: "content.i18n", locales: ["en-US"] },
                    { name: "pb.block" },
                    { name: "pb.blockCategory", rwd: "rw" }
                ],
                identityA
            ]
        ];

        for (let i = 0; i < sufficientPermissions.length; i++) {
            const [permissions, identity] = sufficientPermissions[i];
            const { updatePageBlock } = useGqlHandler({
                permissions,
                identity
            });
            const [response] = await updatePageBlock({ id, data: mock });
            expect(response).toMatchObject({
                data: {
                    pageBuilder: {
                        updatePageBlock: {
                            data: {
                                ...mock,
                                content: expectCompressed(mock.content)
                            },
                            error: null
                        }
                    }
                }
            });
        }
    });

    const deletePageBlockInsufficientPermissions: [SecurityPermission[], SecurityIdentity][] = [
        // [[], null],
        // [[], identityA],
        [[{ name: "content.i18n" }, { name: "pb.block", rwd: "r" }], identityA],
        [[{ name: "content.i18n" }, { name: "pb.block", rwd: "rw" }], identityA],
        [[{ name: "content.i18n" }, { name: "pb.block", own: true }], identityB],
        [[{ name: "content.i18n", locales: ["de-DE", "it-IT"] }, { name: "pb.block" }], identityA],
        [[{ name: "content.i18n" }, { name: "pb.block", rwd: "wd" }], identityA] // will fail - missing "r"
    ];

    test.each(deletePageBlockInsufficientPermissions)(
        `do not allow "deletePageBlock" if identity has not sufficient permissions`,
        async (permissions, identity) => {
            const mock = new Mock("delete-page-block-");

            await createBlockCategory({
                data: {
                    slug: `block-category`,
                    name: `block-category-name`,
                    icon: {
                        type: `emoji`,
                        name: `block-category-icon`,
                        value: `👍`
                    },
                    description: `block-category-description`
                }
            });

            const [createPageBlockResponse] = await createPageBlock({ data: mock });
            const id = createPageBlockResponse.data.pageBuilder.createPageBlock.data.id;

            const { deletePageBlock } = useGqlHandler({ permissions, identity });
            const [response] = await deletePageBlock({ id });
            expect(response).toMatchObject(NOT_AUTHORIZED_RESPONSE("deletePageBlock"));
        }
    );

    const deletePageBlockSufficientPermissions: [SecurityPermission[], SecurityIdentity][] = [
        [
            [
                { name: "content.i18n" },
                { name: "pb.block" },
                { name: "pb.blockCategory", rwd: "rw" }
            ],
            identityA
        ],
        [
            [
                { name: "content.i18n" },
                { name: "pb.block", own: true },
                { name: "pb.blockCategory", rwd: "rw" }
            ],
            identityA
        ],
        [
            [
                { name: "content.i18n" },
                { name: "pb.block", rwd: "rwd" },
                { name: "pb.blockCategory", rwd: "rw" }
            ],
            identityA
        ],
        [
            [
                { name: "content.i18n" },
                { name: "content.i18n", locales: ["en-US"] },
                { name: "pb.block" },
                { name: "pb.blockCategory", rwd: "rw" }
            ],
            identityA
        ]
    ];

    test.each(deletePageBlockSufficientPermissions)(
        `allow "deletePageBlock" if identity has sufficient permissions`,
        async (permissions, identity) => {
            const mock = new Mock("delete-page-block-");

            await createBlockCategory({
                data: {
                    slug: `block-category`,
                    name: `block-category-name`,
                    icon: {
                        type: `emoji`,
                        name: `block-category-icon`,
                        value: `👍`
                    },
                    description: `block-category-description`
                }
            });

            const { createPageBlock, deletePageBlock } = useGqlHandler({
                permissions,
                identity
            });
            const [createPageBlockResponse] = await createPageBlock({ data: mock });
            const id = createPageBlockResponse.data.pageBuilder.createPageBlock.data.id;
            const [response] = await deletePageBlock({
                id
            });
            expect(response).toMatchObject({
                data: {
                    pageBuilder: {
                        deletePageBlock: {
                            data: true,
                            error: null
                        }
                    }
                }
            });
        }
    );

    const getPageBlockInsufficientPermissions: [SecurityPermission[], SecurityIdentity | null][] = [
        [[], null],
        [[], identityA],
        [[{ name: "content.i18n" }, { name: "pb.block", rwd: "w" }], identityA],
        [[{ name: "content.i18n" }, { name: "pb.block", rwd: "wd" }], identityA],
        [[{ name: "content.i18n" }, { name: "pb.block", own: true }], identityB],
        [[{ name: "content.i18n", locales: ["de-DE", "it-IT"] }, { name: "pb.block" }], identityA]
    ];

    test.each(getPageBlockInsufficientPermissions)(
        `do not allow "getPageBlock" if identity has no sufficient permissions`,
        async (permissions, identity) => {
            const mock = new Mock("get-page-block-");

            await createBlockCategory({
                data: {
                    slug: `block-category`,
                    name: `block-category-name`,
                    icon: {
                        type: `emoji`,
                        name: `block-category-icon`,
                        value: `👍`
                    },
                    description: `block-category-description`
                }
            });

            const [createPageBlockResponse] = await createPageBlock({ data: mock });
            const id = createPageBlockResponse.data.pageBuilder.createPageBlock.data.id;
            const { getPageBlock } = useGqlHandler({ permissions, identity });
            const [response] = await getPageBlock({ id, data: mock });
            expect(response).toMatchObject(NOT_AUTHORIZED_RESPONSE("getPageBlock"));
        }
    );

    const getPageBlockSufficientPermissions: [SecurityPermission[], SecurityIdentity][] = [
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

    test.each(getPageBlockSufficientPermissions)(
        `allow "getPageBlock" if identity has sufficient permissions`,
        async (permissions, identity) => {
            const mock = new Mock("get-page-block-");

            await createBlockCategory({
                data: {
                    slug: `block-category`,
                    name: `block-category-name`,
                    icon: {
                        type: `emoji`,
                        name: `block-category-icon`,
                        value: `👍`
                    },
                    description: `block-category-description`
                }
            });

            const [createPageBlockResponse] = await createPageBlock({ data: mock });
            const id = createPageBlockResponse.data.pageBuilder.createPageBlock.data.id;

            const { getPageBlock } = useGqlHandler({ permissions, identity });
            const [response] = await getPageBlock({ id, data: mock });
            expect(response).toMatchObject({
                data: {
                    pageBuilder: {
                        getPageBlock: {
                            data: {
                                ...mock,
                                content: expectCompressed(mock.content),
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
