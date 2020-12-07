import useGqlHandler from "./useGqlHandler";

describe("Install Test", () => {
    const { isInstalled, install, listCategories } = useGqlHandler();

    test("should be able to run isInstalled anonymously, but not install", async () => {
        const { isInstalled, install } = useGqlHandler({
            identity: null,
            permissions: []
        });

        await isInstalled().then(([res]) =>
            expect(res).toEqual({
                data: {
                    pageBuilder: {
                        isInstalled: {
                            data: false,
                            error: null
                        }
                    }
                }
            })
        );

        await install({
            data: {
                name: "My Site"
            }
        }).then(([res]) =>
            expect(res).toEqual({
                data: {
                    pageBuilder: {
                        install: null
                    }
                },
                errors: [
                    {
                        locations: [
                            {
                                column: 13,
                                line: 4
                            }
                        ],
                        message: "Not authorized!",
                        path: ["pageBuilder", "install"]
                    }
                ]
            })
        );
    });

    test("make sure installation creates initial resources and marks the app as installed", async () => {
        await isInstalled().then(([res]) =>
            expect(res).toEqual({
                data: {
                    pageBuilder: {
                        isInstalled: {
                            data: false,
                            error: null
                        }
                    }
                }
            })
        );

        await install({
            data: {
                name: "My Site"
            }
        }).then(([res]) =>
            expect(res).toEqual({
                data: {
                    pageBuilder: {
                        install: {
                            data: true,
                            error: null
                        }
                    }
                }
            })
        );

        await isInstalled().then(([res]) =>
            expect(res).toEqual({
                data: {
                    pageBuilder: {
                        isInstalled: {
                            data: true,
                            error: null
                        }
                    }
                }
            })
        );

        // 1. Installation must create the initial Static category.
        await listCategories().then(([res]) =>
            expect(res).toMatchObject({
                data: {
                    pageBuilder: {
                        listCategories: {
                            data: [
                                {
                                    slug: "static",
                                    url: "/static/",
                                    name: "Static",
                                    layout: "static",
                                    createdBy: {
                                        id: "mocked",
                                        displayName: "m"
                                    }
                                }
                            ],
                            error: null
                        }
                    }
                }
            })
        );
    });
});
