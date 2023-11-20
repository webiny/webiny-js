import useGqlHandler from "./useGqlHandler";
import { identityA, identityB, NOT_AUTHORIZED_RESPONSE } from "./mocks";
import { SecurityIdentity, SecurityPermission } from "@webiny/api-security/types";

class Mock {
    public readonly slug: string;
    public readonly title: string;
    public readonly description: string;
    public readonly items: Record<string, string>[];
    constructor(prefix = "") {
        this.slug = `${prefix}slug`;
        this.title = `${prefix}title`;
        this.description = `${prefix}description`;
        this.items = [
            {
                [`${prefix}items`]: "items"
            }
        ];
    }
}

const defaultHandler = useGqlHandler({
    permissions: [{ name: "content.i18n" }, { name: "pb.*" }],
    identity: identityA
});

const createDefaultMenus = async () => {
    const { createMenu } = defaultHandler;
    await createMenu({ data: new Mock("list-menus-1-") });
    await createMenu({ data: new Mock("list-menus-2-") });
};

const createBMenus = async () => {
    const handler = useGqlHandler({ identity: identityB });
    await handler.createMenu({ data: new Mock("list-menus-3-") });
    await handler.createMenu({ data: new Mock("list-menus-4-") });
};

jest.setTimeout(100000);

describe("Menus Security Test", () => {
    const insufficientPermissions: [SecurityPermission[], SecurityIdentity | null][] = [
        [[], null],
        [[], identityA],
        [[{ name: "pb.menu", rwd: "wd" }], identityA],
        [[{ name: "pb.menu", rwd: "d" }], identityA],
        [[{ name: "pb.menu", rwd: "w" }], identityA],
        [[{ name: "content.i18n", locales: ["de-DE", "it-IT"] }, { name: "pb.menu" }], identityA]
    ];

    test.each(insufficientPermissions)(
        `"listMenus" only returns entries to which the identity has access to - insufficient`,
        async (permissions, identity) => {
            await createDefaultMenus();
            await createBMenus();

            const { listMenus } = useGqlHandler({ permissions, identity });
            const [response] = await listMenus();
            expect(response).toMatchObject(NOT_AUTHORIZED_RESPONSE("listMenus"));
        }
    );

    const sufficientPermissionsAll: [SecurityPermission[], SecurityIdentity | null][] = [
        [[{ name: "content.i18n" }, { name: "content.i18n" }, { name: "pb.menu" }], identityA],
        [[{ name: "content.i18n" }, { name: "pb.menu", rwd: "r" }], identityA],
        [[{ name: "content.i18n" }, { name: "pb.menu", rwd: "rw" }], identityA],
        [[{ name: "content.i18n" }, { name: "pb.menu", rwd: "rwd" }], identityA],
        [[{ name: "content.i18n" }, { name: "pb.*" }], identityA],
        [[{ name: "content.i18n", locales: ["en-US"] }, { name: "pb.menu" }], identityA]
    ];

    test.each(sufficientPermissionsAll)(
        `"listMenus" only returns entries to which the identity has access to - sufficient`,
        async (permissions, identity) => {
            await createDefaultMenus();
            await createBMenus();

            const { listMenus } = useGqlHandler({ permissions, identity });
            const [response] = await listMenus();
            expect(response).toMatchObject({
                data: {
                    pageBuilder: {
                        listMenus: {
                            data: [
                                {
                                    createdBy: identityA,
                                    createdOn: /^20/,
                                    description: "list-menus-1-description",
                                    items: [
                                        {
                                            "list-menus-1-items": "items"
                                        }
                                    ],
                                    slug: "list-menus-1-slug",
                                    title: "list-menus-1-title"
                                },
                                {
                                    createdBy: identityA,
                                    createdOn: /^20/,
                                    description: "list-menus-2-description",
                                    items: [
                                        {
                                            "list-menus-2-items": "items"
                                        }
                                    ],
                                    slug: "list-menus-2-slug",
                                    title: "list-menus-2-title"
                                },
                                {
                                    createdBy: identityB,
                                    createdOn: /^20/,
                                    description: "list-menus-3-description",
                                    items: [
                                        {
                                            "list-menus-3-items": "items"
                                        }
                                    ],
                                    slug: "list-menus-3-slug",
                                    title: "list-menus-3-title"
                                },
                                {
                                    createdBy: identityB,
                                    createdOn: /^20/,
                                    description: "list-menus-4-description",
                                    items: [
                                        {
                                            "list-menus-4-items": "items"
                                        }
                                    ],
                                    slug: "list-menus-4-slug",
                                    title: "list-menus-4-title"
                                }
                            ],
                            error: null
                        }
                    }
                }
            });
        }
    );

    test(`"listMenus" only returns entries to which the identity has access to`, async () => {
        await createDefaultMenus();
        await createBMenus();

        const identityAHandler = useGqlHandler({
            permissions: [{ name: "content.i18n" }, { name: "pb.menu", own: true }],
            identity: identityA
        });

        const [listMenusAResponse] = await identityAHandler.listMenus();
        expect(listMenusAResponse).toMatchObject({
            data: {
                pageBuilder: {
                    listMenus: {
                        data: [
                            {
                                createdBy: identityA,
                                createdOn: /^20/,
                                description: "list-menus-1-description",
                                items: [
                                    {
                                        "list-menus-1-items": "items"
                                    }
                                ],
                                slug: "list-menus-1-slug",
                                title: "list-menus-1-title"
                            },
                            {
                                createdBy: identityA,
                                createdOn: /^20/,
                                description: "list-menus-2-description",
                                items: [
                                    {
                                        "list-menus-2-items": "items"
                                    }
                                ],
                                slug: "list-menus-2-slug",
                                title: "list-menus-2-title"
                            }
                        ],
                        error: null
                    }
                }
            }
        });

        const identityBHandler = useGqlHandler({
            permissions: [{ name: "content.i18n" }, { name: "pb.menu", own: true }],
            identity: identityB
        });

        const [listMenusBResponse] = await identityBHandler.listMenus();
        expect(listMenusBResponse).toMatchObject({
            data: {
                pageBuilder: {
                    listMenus: {
                        data: [
                            {
                                createdBy: identityB,
                                createdOn: /^20/,
                                description: "list-menus-3-description",
                                items: [
                                    {
                                        "list-menus-3-items": "items"
                                    }
                                ],
                                slug: "list-menus-3-slug",
                                title: "list-menus-3-title"
                            },
                            {
                                createdBy: identityB,
                                createdOn: /^20/,
                                description: "list-menus-4-description",
                                items: [
                                    {
                                        "list-menus-4-items": "items"
                                    }
                                ],
                                slug: "list-menus-4-slug",
                                title: "list-menus-4-title"
                            }
                        ],
                        error: null
                    }
                }
            }
        });
    });

    test(`allow createMenu if identity has sufficient permissions`, async () => {
        const insufficientPermissions: [SecurityPermission[], SecurityIdentity | null][] = [
            [[], null],
            [[], identityA],
            [[{ name: "pb.menu", own: false, rwd: "r" }], identityA],
            [[{ name: "pb.menu", own: false, rwd: "rd" }], identityA],
            [
                [{ name: "content.i18n", locales: ["de-DE", "it-IT"] }, { name: "pb.menu" }],
                identityA
            ]
        ];

        for (let i = 0; i < insufficientPermissions.length; i++) {
            const [permissions, identity] = insufficientPermissions[i];
            const { createMenu } = useGqlHandler({ permissions, identity });

            const [response] = await createMenu({ data: new Mock() });
            expect(response).toMatchObject(NOT_AUTHORIZED_RESPONSE("createMenu"));
        }

        const sufficientPermissions: [SecurityPermission[], SecurityIdentity | null][] = [
            [[{ name: "content.i18n" }, { name: "pb.menu" }], identityA],
            [[{ name: "content.i18n" }, { name: "pb.menu", own: true }], identityA],
            [[{ name: "content.i18n" }, { name: "pb.menu", rwd: "w" }], identityA],
            [[{ name: "content.i18n" }, { name: "pb.menu", rwd: "rw" }], identityA],
            [[{ name: "content.i18n" }, { name: "pb.menu", rwd: "rwd" }], identityA],
            [[{ name: "content.i18n", locales: ["en-US"] }, { name: "pb.menu" }], identityA]
        ];

        for (let i = 0; i < sufficientPermissions.length; i++) {
            const [permissions, identity] = sufficientPermissions[i];
            const { createMenu } = useGqlHandler({ permissions, identity });

            const data = new Mock(`menu-create-${i}-`);
            const [response] = await createMenu({ data });
            expect(response).toMatchObject({
                data: {
                    pageBuilder: {
                        createMenu: {
                            data,
                            error: null
                        }
                    }
                }
            });
        }
    });

    test(`allow "updateMenu" if identity has sufficient permissions`, async () => {
        const { createMenu } = defaultHandler;
        const mock = new Mock("update-menu-");

        await createMenu({ data: mock });

        const insufficientPermissions: [SecurityPermission[], SecurityIdentity | null][] = [
            [[], null],
            [[], identityA],
            [[{ name: "pb.menu", rwd: "r" }], identityA],
            [[{ name: "pb.menu", rwd: "rd" }], identityA],
            [[{ name: "pb.menu", own: true }], identityB],
            [
                [{ name: "content.i18n", locales: ["de-DE", "it-IT"] }, { name: "pb.menu" }],
                identityA
            ],
            [[{ name: "content.i18n" }, { name: "pb.menu", rwd: "w" }], identityA] // will fail - missing "r"
        ];

        for (let i = 0; i < insufficientPermissions.length; i++) {
            const [permissions, identity] = insufficientPermissions[i];
            const { updateMenu } = useGqlHandler({ permissions, identity });
            const [response] = await updateMenu({ slug: mock.slug, data: mock });
            expect(response).toMatchObject(NOT_AUTHORIZED_RESPONSE("updateMenu"));
        }

        const sufficientPermissions: [SecurityPermission[], SecurityIdentity | null][] = [
            [[{ name: "content.i18n" }, { name: "pb.menu" }], identityA],
            [[{ name: "content.i18n" }, { name: "pb.menu", own: true }], identityA],
            [[{ name: "content.i18n" }, { name: "pb.menu", rwd: "rw" }], identityA],
            [[{ name: "content.i18n" }, { name: "pb.menu", rwd: "rwd" }], identityA],
            [[{ name: "content.i18n", locales: ["en-US"] }, { name: "pb.menu" }], identityA]
        ];

        for (let i = 0; i < sufficientPermissions.length; i++) {
            const [permissions, identity] = sufficientPermissions[i];
            const { updateMenu } = useGqlHandler({ permissions, identity });
            const [response] = await updateMenu({ slug: mock.slug, data: mock });
            expect(response).toMatchObject({
                data: {
                    pageBuilder: {
                        updateMenu: {
                            data: mock,
                            error: null
                        }
                    }
                }
            });
        }
    });

    test(`allow "deleteMenu" if identity has sufficient permissions`, async () => {
        const { createMenu } = defaultHandler;
        const mock = new Mock("delete-menu-");

        await createMenu({ data: mock });

        const insufficientPermissions: [SecurityPermission[], SecurityIdentity | null][] = [
            [[], null],
            [[], identityA],
            [[{ name: "content.i18n" }, { name: "pb.menu", rwd: "r" }], identityA],
            [[{ name: "content.i18n" }, { name: "pb.menu", rwd: "rw" }], identityA],
            [[{ name: "content.i18n" }, { name: "pb.menu", own: true }], identityB],
            [
                [{ name: "content.i18n", locales: ["de-DE", "it-IT"] }, { name: "pb.menu" }],
                identityA
            ],
            [[{ name: "content.i18n" }, { name: "pb.menu", rwd: "wd" }], identityA] // will fail - missing "r"
        ];

        for (let i = 0; i < insufficientPermissions.length; i++) {
            const [permissions, identity] = insufficientPermissions[i];
            const { deleteMenu } = useGqlHandler({ permissions, identity });
            const [response] = await deleteMenu({ slug: mock.slug });
            expect(response).toMatchObject(NOT_AUTHORIZED_RESPONSE("deleteMenu"));
        }

        const sufficientPermissions: [SecurityPermission[], SecurityIdentity | null][] = [
            [[{ name: "content.i18n" }, { name: "pb.menu" }], identityA],
            [[{ name: "content.i18n" }, { name: "pb.menu", own: true }], identityA],
            [[{ name: "content.i18n" }, { name: "pb.menu", rwd: "rwd" }], identityA],
            [
                [
                    { name: "content.i18n" },
                    { name: "content.i18n", locales: ["en-US"] },
                    { name: "pb.menu" }
                ],
                identityA
            ]
        ];

        for (let i = 0; i < sufficientPermissions.length; i++) {
            const [permissions, identity] = sufficientPermissions[i];
            const { createMenu, deleteMenu } = useGqlHandler({
                permissions,
                identity
            });
            const mock = new Mock(`delete-menu-${i}-`);

            await createMenu({ data: mock });
            const [response] = await deleteMenu({
                slug: mock.slug
            });
            expect(response).toMatchObject({
                data: {
                    pageBuilder: {
                        deleteMenu: {
                            data: mock,
                            error: null
                        }
                    }
                }
            });
        }
    });

    test(`allow "getMenu" if identity has sufficient permissions`, async () => {
        const { createMenu } = defaultHandler;
        const mock = new Mock("get-menu-");

        await createMenu({ data: mock });

        const insufficientPermissions: [SecurityPermission[], SecurityIdentity | null][] = [
            [[], null],
            [[], identityA],
            [[{ name: "content.i18n" }, { name: "pb.menu", rwd: "w" }], identityA],
            [[{ name: "content.i18n" }, { name: "pb.menu", rwd: "wd" }], identityA],
            [[{ name: "content.i18n" }, { name: "pb.menu", own: true }], identityB],
            [
                [{ name: "content.i18n", locales: ["de-DE", "it-IT"] }, { name: "pb.menu" }],
                identityA
            ]
        ];

        for (let i = 0; i < insufficientPermissions.length; i++) {
            const [permissions, identity] = insufficientPermissions[i];
            const { getMenu } = useGqlHandler({ permissions, identity });
            const [response] = await getMenu({ slug: mock.slug, data: mock });
            expect(response).toMatchObject(NOT_AUTHORIZED_RESPONSE("getMenu"));
        }

        const sufficientPermissions: [SecurityPermission[], SecurityIdentity | null][] = [
            [[{ name: "content.i18n" }, { name: "pb.menu" }], identityA],
            [[{ name: "content.i18n" }, { name: "pb.menu", own: true }], identityA],
            [[{ name: "content.i18n" }, { name: "pb.menu", rwd: "r" }], identityA],
            [[{ name: "content.i18n" }, { name: "pb.menu", rwd: "rw" }], identityA],
            [[{ name: "content.i18n" }, { name: "pb.menu", rwd: "rwd" }], identityA],
            [
                [
                    { name: "content.i18n" },
                    { name: "content.i18n", locales: ["en-US"] },
                    { name: "pb.menu" }
                ],
                identityA
            ]
        ];

        for (let i = 0; i < sufficientPermissions.length; i++) {
            const [permissions, identity] = sufficientPermissions[i];
            const { getMenu } = useGqlHandler({ permissions, identity });
            const [response] = await getMenu({ slug: mock.slug, data: mock });
            expect(response).toMatchObject({
                data: {
                    pageBuilder: {
                        getMenu: {
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
    });
});
