import useGqlHandler from "./useGqlHandler";
import { SecurityIdentity } from "@webiny/api-security";

function Mock(prefix) {
    this.slug = `${prefix}slug`;
    this.title = `${prefix}title`;
    this.description = `${prefix}description`;
    this.items = { [`${prefix}items`]: "items" };
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

const identityA = new SecurityIdentity({
    id: "a",
    login: "a",
    type: "test",
    displayName: "Aa"
});

const identityB = new SecurityIdentity({
    id: "b",
    login: "b",
    type: "test",
    displayName: "Bb"
});

const defaultHandler = useGqlHandler({
    permissions: [{ name: "content.i18n" }, { name: "pb.*" }],
    identity: identityA
});

describe("Menus Security Test", () => {
    test(`"listMenus" only returns entries to which the identity has access to`, async () => {
        const { createMenu } = defaultHandler;
        await createMenu({ data: new Mock("list-menus-1-") });
        await createMenu({ data: new Mock("list-menus-2-") });

        const identityBHandler = useGqlHandler({ identity: identityB });
        await identityBHandler.createMenu({ data: new Mock("list-menus-3-") });
        await identityBHandler.createMenu({ data: new Mock("list-menus-4-") });

        const insufficientPermissions = [
            [[], null],
            [[], identityA],
            [[{ name: "pb.menu", rwd: "wd" }], identityA],
            [[{ name: "pb.menu", rwd: "d" }], identityA],
            [[{ name: "pb.menu", rwd: "w" }], identityA],
            [
                [{ name: "content.i18n", locales: ["de-DE", "it-IT"] }, { name: "pb.menu" }],
                identityA
            ]
        ];

        for (let i = 0; i < insufficientPermissions.length; i++) {
            const [permissions, identity] = insufficientPermissions[i];
            const { listMenus } = useGqlHandler({ permissions, identity });
            const [response] = await listMenus();
            expect(response).toMatchObject(NOT_AUTHORIZED_RESPONSE("listMenus"));
        }

        const sufficientPermissionsAll = [
            [[{ name: "content.i18n" }, { name: "content.i18n" }, { name: "pb.menu" }], identityA],
            [[{ name: "content.i18n" }, { name: "pb.menu", rwd: "r" }], identityA],
            [[{ name: "content.i18n" }, { name: "pb.menu", rwd: "rw" }], identityA],
            [[{ name: "content.i18n" }, { name: "pb.menu", rwd: "rwd" }], identityA],
            [[{ name: "content.i18n" }, { name: "pb.*" }], identityA],
            [[{ name: "content.i18n", locales: ["en-US"] }, { name: "pb.menu" }], identityA]
        ];

        for (let i = 0; i < sufficientPermissionsAll.length; i++) {
            const [permissions, identity] = sufficientPermissionsAll[i];
            const { listMenus } = useGqlHandler({ permissions, identity });
            const [response] = await listMenus();
            expect(response).toMatchObject({
                data: {
                    pageBuilder: {
                        listMenus: {
                            data: [
                                {
                                    createdBy: {
                                        displayName: "Aa",
                                        id: "a"
                                    },
                                    createdOn: /^20/,
                                    description: "list-menus-1-description",
                                    items: {
                                        "list-menus-1-items": "items"
                                    },
                                    slug: "list-menus-1-slug",
                                    title: "list-menus-1-title"
                                },
                                {
                                    createdBy: {
                                        displayName: "Aa",
                                        id: "a"
                                    },
                                    createdOn: /^20/,
                                    description: "list-menus-2-description",
                                    items: {
                                        "list-menus-2-items": "items"
                                    },
                                    slug: "list-menus-2-slug",
                                    title: "list-menus-2-title"
                                },
                                {
                                    createdBy: {
                                        displayName: "Bb",
                                        id: "b"
                                    },
                                    createdOn: /^20/,
                                    description: "list-menus-3-description",
                                    items: {
                                        "list-menus-3-items": "items"
                                    },
                                    slug: "list-menus-3-slug",
                                    title: "list-menus-3-title"
                                },
                                {
                                    createdBy: {
                                        displayName: "Bb",
                                        id: "b"
                                    },
                                    createdOn: /^20/,
                                    description: "list-menus-4-description",
                                    items: {
                                        "list-menus-4-items": "items"
                                    },
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

        let identityAHandler = useGqlHandler({
            permissions: [{ name: "content.i18n" }, { name: "pb.menu", own: true }],
            identity: identityA
        });

        let [response] = await identityAHandler.listMenus();
        expect(response).toMatchObject({
            data: {
                pageBuilder: {
                    listMenus: {
                        data: [
                            {
                                createdBy: {
                                    displayName: "Aa",
                                    id: "a"
                                },
                                createdOn: /^20/,
                                description: "list-menus-1-description",
                                items: {
                                    "list-menus-1-items": "items"
                                },
                                slug: "list-menus-1-slug",
                                title: "list-menus-1-title"
                            },
                            {
                                createdBy: {
                                    displayName: "Aa",
                                    id: "a"
                                },
                                createdOn: /^20/,
                                description: "list-menus-2-description",
                                items: {
                                    "list-menus-2-items": "items"
                                },
                                slug: "list-menus-2-slug",
                                title: "list-menus-2-title"
                            }
                        ],
                        error: null
                    }
                }
            }
        });

        identityAHandler = useGqlHandler({
            permissions: [{ name: "content.i18n" }, { name: "pb.menu", own: true }],
            identity: identityB
        });

        [response] = await identityAHandler.listMenus();
        expect(response).toMatchObject({
            data: {
                pageBuilder: {
                    listMenus: {
                        data: [
                            {
                                createdBy: {
                                    displayName: "Bb",
                                    id: "b"
                                },
                                createdOn: /^20/,
                                description: "list-menus-3-description",
                                items: {
                                    "list-menus-3-items": "items"
                                },
                                slug: "list-menus-3-slug",
                                title: "list-menus-3-title"
                            },
                            {
                                createdBy: {
                                    displayName: "Bb",
                                    id: "b"
                                },
                                createdOn: /^20/,
                                description: "list-menus-4-description",
                                items: {
                                    "list-menus-4-items": "items"
                                },
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
        const insufficientPermissions = [
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

        const sufficientPermissions = [
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

        const insufficientPermissions = [
            [[], null],
            [[], identityA],
            [[{ name: "pb.menu", rwd: "r" }], identityA],
            [[{ name: "pb.menu", rwd: "rd" }], identityA],
            [[{ name: "pb.menu", own: true }], identityB],
            [
                [{ name: "content.i18n", locales: ["de-DE", "it-IT"] }, { name: "pb.menu" }],
                identityA
            ]
        ];

        for (let i = 0; i < insufficientPermissions.length; i++) {
            const [permissions, identity] = insufficientPermissions[i];
            const { updateMenu } = useGqlHandler({ permissions, identity });
            const [response] = await updateMenu({ slug: mock.slug, data: mock });
            expect(response).toMatchObject(NOT_AUTHORIZED_RESPONSE("updateMenu"));
        }

        const sufficientPermissions = [
            [[{ name: "content.i18n" }, { name: "pb.menu" }], identityA],
            [[{ name: "content.i18n" }, { name: "pb.menu", own: true }], identityA],
            [[{ name: "content.i18n" }, { name: "pb.menu", rwd: "w" }], identityA],
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

        const insufficientPermissions = [
            [[], null],
            [[], identityA],
            [[{ name: "content.i18n" }, { name: "pb.menu", rwd: "r" }], identityA],
            [[{ name: "content.i18n" }, { name: "pb.menu", rwd: "rw" }], identityA],
            [[{ name: "content.i18n" }, { name: "pb.menu", own: true }], identityB],
            [
                [{ name: "content.i18n", locales: ["de-DE", "it-IT"] }, { name: "pb.menu" }],
                identityA
            ]
        ];

        for (let i = 0; i < insufficientPermissions.length; i++) {
            const [permissions, identity] = insufficientPermissions[i];
            const { deleteMenu } = useGqlHandler({ permissions, identity });
            const [response] = await deleteMenu({ slug: mock.slug });
            expect(response).toMatchObject(NOT_AUTHORIZED_RESPONSE("deleteMenu"));
        }

        const sufficientPermissions = [
            [[{ name: "content.i18n" }, { name: "pb.menu" }], identityA],
            [[{ name: "content.i18n" }, { name: "pb.menu", own: true }], identityA],
            [[{ name: "content.i18n" }, { name: "pb.menu", rwd: "wd" }], identityA],
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
            const { createMenu, deleteMenu } = useGqlHandler({ permissions, identity });
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

        const insufficientPermissions = [
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

        const sufficientPermissions = [
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
                                createdBy: {
                                    displayName: "Aa",
                                    id: "a"
                                },
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
