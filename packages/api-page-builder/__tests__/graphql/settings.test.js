import useGqlHandler from "./useGqlHandler";
import useHandler from "./../updateSettings/useHandler";

jest.setTimeout(15000);

describe("Settings Test", () => {
    const {
        createCategory,
        createPage,
        getSettings,
        getDefaultSettings,
        updateSettings,
        logsDb,
        until,
        listPublishedPages,
        publishPage,
        createElasticSearchIndex,
        deleteElasticSearchIndex
    } = useGqlHandler();

    beforeAll(async () => {
        await deleteElasticSearchIndex();
    });

    beforeEach(async () => {
        await createElasticSearchIndex();
        await createCategory({
            data: {
                slug: `category`,
                name: `name`,
                url: `/some-url/`,
                layout: `layout`
            }
        });
    });

    afterEach(async () => {
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
                        src: "https://d1peg08dnrinui.cloudfront.net/files/9ki1goobp-webiny_security__1_.png"
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
                                    src: "https://d1peg08dnrinui.cloudfront.net/files/9ki1goobp-webiny_security__1_.png"
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
                                    src: "https://d1peg08dnrinui.cloudfront.net/files/9ki1goobp-webiny_security__1_.png"
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
        // Let's create five pages and publish them.
        for (let i = 0; i < 5; i++) {
            const [createPageResponse] = await createPage({ category: "category" });
            await publishPage({ id: createPageResponse.data.pageBuilder.createPage.data.id });
        }

        // Wait until all are created.
        await until(
            listPublishedPages,
            ([res]) => res.data.pageBuilder.listPublishedPages.data.length === 5
        );

        // Let's use the `id` of the last log as the cursor.
        const [logs] = await logsDb.readLogs();
        const { id: cursor } = logs.pop();

        await listPublishedPages();

        // When listing published pages, settings must have been loaded from the DB only once.
        //eslint-disable-next-line jest/valid-expect-in-promise
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
                        src: "https://d1peg08dnrinui.cloudfront.net/files/9ki1goobp-webiny_security__1_.png"
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
                                pages: {
                                    home: null,
                                    notFound: null
                                },
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
                                        src: "https://d1peg08dnrinui.cloudfront.net/files/9ki1goobp-webiny_security__1_.png"
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

        // Updating settings for tenant / locale should not affect default settings. Default settings can only
        // be affected by changing default system and default tenant data.
        await updateSettings({
            data: {
                name: "test 1-UPDATED",
                websiteUrl: "https://www.test.com/-UPDATED",
                websitePreviewUrl: "https://preview.test.com/-UPDATED",
                prerendering: {
                    app: {
                        url: "https://www.app.com/-UPDATED"
                    },
                    storage: { name: "storage-name-UPDATED" }
                },
                social: {
                    facebook: "https://www.facebook.com/-UPDATED",
                    instagram: "https://www.instagram.com/-UPDATED",
                    twitter: "https://www.twitter.com/-UPDATED",
                    image: {
                        id: "1kucKwtX3vI2w6tYuPwJsvRFn9g-UPDATED",
                        src: "https://d1peg08dnrinui.cloudfront.net/files/9ki1goobp-webiny_security__1_.png-UPDATED"
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
                                pages: {
                                    home: null,
                                    notFound: null
                                },
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
                                        src: "https://d1peg08dnrinui.cloudfront.net/files/9ki1goobp-webiny_security__1_.png"
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

    test("settings special pages (notFound, home)", async () => {
        const page = await createPage({ category: "category" }).then(
            ([res]) => res.data.pageBuilder.createPage.data
        );

        await updateSettings({
            data: {
                pages: {
                    home: page.id
                }
            }
        }).then(([res]) =>
            expect(res).toEqual({
                data: {
                    pageBuilder: {
                        updateSettings: {
                            id: "T#root#L#en-US#PB#SETTINGS",
                            data: null,
                            error: {
                                code: "NOT_FOUND",
                                data: null,
                                message: "Page not found."
                            }
                        }
                    }
                }
            })
        );

        await publishPage({ id: page.id });

        const [pid] = page.id.split("#");

        await updateSettings({
            data: {
                pages: {
                    home: page.id
                }
            }
        }).then(([res]) =>
            expect(res).toMatchObject({
                data: {
                    pageBuilder: {
                        updateSettings: {
                            id: "T#root#L#en-US#PB#SETTINGS",
                            data: {
                                pages: {
                                    home: pid
                                }
                            },
                            error: null
                        }
                    }
                }
            })
        );

        await getSettings().then(([res]) =>
            expect(res).toMatchObject({
                data: {
                    pageBuilder: {
                        getSettings: {
                            id: "T#root#L#en-US#PB#SETTINGS",
                            data: {
                                pages: {
                                    home: pid
                                }
                            },
                            error: null
                        }
                    }
                }
            })
        );
    });

    test("must not be able to unset pages as special", async () => {
        const page = await createPage({ category: "category" }).then(
            ([res]) => res.data.pageBuilder.createPage.data
        );
        const [pid] = page.id.split("#");

        await publishPage({ id: page.id }).then(() =>
            updateSettings({
                data: {
                    pages: {
                        home: page.id,
                        notFound: page.id
                    }
                }
            })
        );

        await getSettings().then(([res]) =>
            expect(res).toMatchObject({
                data: {
                    pageBuilder: {
                        getSettings: {
                            id: "T#root#L#en-US#PB#SETTINGS",
                            data: {
                                pages: {
                                    home: pid,
                                    notFound: pid
                                }
                            }
                        }
                    }
                }
            })
        );

        await updateSettings({
            data: {
                pages: {
                    home: null,
                    notFound: null
                }
            }
        }).then(([res]) =>
            expect(res).toEqual({
                data: {
                    pageBuilder: {
                        updateSettings: {
                            id: "T#root#L#en-US#PB#SETTINGS",
                            data: null,
                            error: {
                                code: "CANNOT_UNSET_SPECIAL_PAGE",
                                data: null,
                                message:
                                    'Cannot unset "home" page. Please provide a new page if you want to unset current one.'
                            }
                        }
                    }
                }
            })
        );

        await getSettings().then(([res]) =>
            expect(res).toMatchObject({
                data: {
                    pageBuilder: {
                        getSettings: {
                            id: "T#root#L#en-US#PB#SETTINGS",
                            data: {
                                pages: {
                                    home: pid,
                                    notFound: pid
                                }
                            }
                        }
                    }
                }
            })
        );
    });
});
