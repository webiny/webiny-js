import useGqlHandler from "./useGqlHandler";
import useHandler from "./../updateSettings/useHandler";

jest.setTimeout(15000);

describe("Settings Test", () => {
    const {
        db,
        createCategory,
        createPage,
        getSettings,
        getDefaultSettings,
        updateSettings,
        logsDb,
        until,
        listPublishedPages,
        publishPage,
        deleteElasticSearchIndex
    } = useGqlHandler();

    beforeEach(async () => {
        await deleteElasticSearchIndex();
    });

    test("get and update settings", async () => {
        // 1. Should return default settings.
        let [response] = await getSettings();
        expect(response).toEqual({
            data: {
                pageBuilder: {
                    getSettings: {
                        data: null,
                        error: null,
                        id: "T#root#L#en-US#PB#SETTINGS"
                    }
                }
            }
        });

        // 2. Updating existing settings should immediately return the updated ones.
        [response] = await updateSettings({
            data: {
                name: "test 1",
                websiteUrl: "https://www.test.com/",
                websitePreviewUrl: "https://preview.test.com/",
                prerendering: {
                    app: {
                        url: "https://www.app.com/"
                    },
                    storage: { name: "storage-name" }
                },
                social: {
                    facebook: "https://www.facebook.com/",
                    instagram: "https://www.instagram.com/",
                    twitter: "https://www.twitter.com/",
                    image: {
                        id: "1kucKwtX3vI2w6tYuPwJsvRFn9g",
                        src:
                            "https://d1peg08dnrinui.cloudfront.net/files/9ki1goobp-webiny_security__1_.png"
                    }
                }
            }
        });

        expect(response).toMatchObject({
            data: {
                pageBuilder: {
                    updateSettings: {
                        data: {
                            name: "test 1",
                            websiteUrl: "https://www.test.com",
                            websitePreviewUrl: "https://preview.test.com",
                            prerendering: {
                                app: {
                                    url: "https://www.app.com"
                                },
                                storage: { name: "storage-name" }
                            },
                            social: {
                                instagram: "https://www.instagram.com/",
                                facebook: "https://www.facebook.com/",
                                twitter: "https://www.twitter.com/",
                                image: {
                                    id: "1kucKwtX3vI2w6tYuPwJsvRFn9g",
                                    src:
                                        "https://d1peg08dnrinui.cloudfront.net/files/9ki1goobp-webiny_security__1_.png"
                                }
                            }
                        },
                        error: null,
                        id: "T#root#L#en-US#PB#SETTINGS"
                    }
                }
            }
        });

        // 3. Finally, getting the settings again should return the updated ones.
        [response] = await getSettings();
        expect(response).toMatchObject({
            data: {
                pageBuilder: {
                    getSettings: {
                        data: {
                            name: "test 1",
                            websiteUrl: "https://www.test.com",
                            websitePreviewUrl: "https://preview.test.com",
                            prerendering: {
                                app: {
                                    url: "https://www.app.com"
                                },
                                storage: { name: "storage-name" }
                            },
                            social: {
                                instagram: "https://www.instagram.com/",
                                facebook: "https://www.facebook.com/",
                                twitter: "https://www.twitter.com/",
                                image: {
                                    id: "1kucKwtX3vI2w6tYuPwJsvRFn9g",
                                    src:
                                        "https://d1peg08dnrinui.cloudfront.net/files/9ki1goobp-webiny_security__1_.png"
                                }
                            }
                        },
                        error: null,
                        id: "T#root#L#en-US#PB#SETTINGS"
                    }
                }
            }
        });
    });

    test("ensure we don't overload settings when listing pages", async () => {
        await createCategory({
            data: {
                slug: `category`,
                name: `name`,
                url: `/some-url/`,
                layout: `layout`
            }
        });

        // Let's create five pages and publish them.
        for (let i = 0; i < 5; i++) {
            createPage({ category: "category" }).then(([res]) =>
                publishPage({ id: res.data.pageBuilder.createPage.data.id })
            );
        }

        // Wait until all are created.
        await until(
            listPublishedPages,
            ([res]) => res.data.pageBuilder.listPublishedPages.data.length === 5
        );

        // Let's use the `id` of the last log as the cursor.
        let [logs] = await logsDb.readLogs();
        let { id: cursor } = logs.pop();

        await listPublishedPages();

        // When listing published pages, settings must have been loaded from the DB only once.
        await logsDb
            .readLogs()
            .then(([logs]) => logs.filter(item => item.id > cursor && item.operation === "read"))
            .then(logs => logs.filter(item => item.query.PK === "T#root#L#en-US#PB#SETTINGS"))
            .then(logs => expect(logs.length).toBe(1));
    });

    test("must return default settings", async () => {
        await getSettings().then(([res]) =>
            expect(res).toEqual({
                data: {
                    pageBuilder: {
                        getSettings: {
                            id: "T#root#L#en-US#PB#SETTINGS",
                            data: null,
                            error: null
                        }
                    }
                }
            })
        );

        await getDefaultSettings().then(([res]) =>
            expect(res).toEqual({
                data: {
                    pageBuilder: {
                        getDefaultSettings: {
                            id: "PB#SETTINGS",
                            data: null,
                            error: null
                        }
                    }
                }
            })
        );

        const { handler } = useHandler();
        await handler({
            data: {
                name: "test 1",
                websiteUrl: "https://www.test.com/",
                websitePreviewUrl: "https://preview.test.com/",
                prerendering: {
                    app: {
                        url: "https://www.app.com/"
                    },
                    storage: { name: "storage-name" }
                },
                social: {
                    facebook: "https://www.facebook.com/",
                    instagram: "https://www.instagram.com/",
                    twitter: "https://www.twitter.com/",
                    image: {
                        id: "1kucKwtX3vI2w6tYuPwJsvRFn9g",
                        src:
                            "https://d1peg08dnrinui.cloudfront.net/files/9ki1goobp-webiny_security__1_.png"
                    }
                }
            }
        });

        await getDefaultSettings().then(([res]) =>
            expect(res).toEqual({
                data: {
                    pageBuilder: {
                        getDefaultSettings: {
                            data: {
                                name: "test 1",
                                prerendering: {
                                    app: {
                                        url: "https://www.app.com"
                                    },
                                    storage: {
                                        name: "storage-name"
                                    }
                                },
                                social: {
                                    facebook: "https://www.facebook.com/",
                                    image: {
                                        id: "1kucKwtX3vI2w6tYuPwJsvRFn9g",
                                        src:
                                            "https://d1peg08dnrinui.cloudfront.net/files/9ki1goobp-webiny_security__1_.png"
                                    },
                                    instagram: "https://www.instagram.com/",
                                    twitter: "https://www.twitter.com/"
                                },
                                websitePreviewUrl: "https://preview.test.com",
                                websiteUrl: "https://www.test.com"
                            },
                            error: null,
                            id: "PB#SETTINGS"
                        }
                    }
                }
            })
        );
    });
});
