import useGqlHandler from "./useGqlHandler";

jest.setTimeout(100000);
jest.retryTimes(0);

describe("Settings Test", () => {
    const {
        createCategory,
        createPage,
        getSettings,
        getDefaultSettings,
        updateSettings,
        until,
        listPublishedPages,
        publishPage
    } = useGqlHandler();

    beforeEach(async () => {
        await createCategory({
            data: {
                slug: `category`,
                name: `name`,
                url: `/some-url/`,
                layout: `layout`
            }
        });
    });

    test("get and update settings", async () => {
        // 1. Should return default settings.
        const [getResponse] = await getSettings();
        expect(getResponse).toEqual({
            data: {
                pageBuilder: {
                    getSettings: {
                        data: null,
                        error: null
                    }
                }
            }
        });

        // 2. Updating existing settings should immediately return the updated ones.
        const [updateResponse] = await updateSettings({
            data: {
                name: "test 1",
                websiteUrl: "https://www.test.com/",
                websitePreviewUrl: "https://preview.test.com/",
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

        expect(updateResponse).toMatchObject({
            data: {
                pageBuilder: {
                    updateSettings: {
                        data: {
                            name: "test 1",
                            websiteUrl: "https://www.test.com",
                            websitePreviewUrl: "https://preview.test.com",
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
                        error: null
                    }
                }
            }
        });

        // 3. Finally, getting the settings again should return the updated ones.
        const [response] = await getSettings();
        expect(response).toMatchObject({
            data: {
                pageBuilder: {
                    getSettings: {
                        data: {
                            name: "test 1",
                            websiteUrl: "https://www.test.com",
                            websitePreviewUrl: "https://preview.test.com",
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
                        error: null
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
            ([res]: any) => res.data.pageBuilder.listPublishedPages.data.length === 5
        );

        await listPublishedPages();
    });

    test("must return default settings", async () => {
        await getSettings().then(([res]) =>
            expect(res).toEqual({
                data: {
                    pageBuilder: {
                        getSettings: {
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
                            data: {
                                websitePreviewUrl: "https://www.test.com",
                                websiteUrl: "https://www.test.com"
                            },
                            error: null
                        }
                    }
                }
            })
        );

        // Updating settings for tenant / locale should not affect default settings. Default settings can only
        // be affected by deploying the `website` app, which contains the Prerendering Service.
        await updateSettings({
            data: {
                name: "test 1-UPDATED",
                websiteUrl: "https://www.test.com/-UPDATED",
                websitePreviewUrl: "https://preview.test.com/-UPDATED",
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
                                websitePreviewUrl: "https://www.test.com",
                                websiteUrl: "https://www.test.com"
                            },
                            error: null
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

        /**
         * Should have no settings yet
         */
        const [settingsResponse] = await getSettings();
        expect(settingsResponse).toEqual({
            data: {
                pageBuilder: {
                    getSettings: {
                        data: null,
                        error: null
                    }
                }
            }
        });

        const [updateSettingsResponse] = await updateSettings({
            data: {
                pages: {
                    home: page.id
                }
            }
        });
        expect(updateSettingsResponse).toEqual({
            data: {
                pageBuilder: {
                    updateSettings: {
                        data: null,
                        error: {
                            code: "NOT_FOUND",
                            data: null,
                            message: "Page not found."
                        }
                    }
                }
            }
        });

        const [publishPageResponse] = await publishPage({ id: page.id });

        expect(publishPageResponse).toMatchObject({
            data: {
                pageBuilder: {
                    publishPage: {
                        data: {
                            id: page.id,
                            status: "published"
                        },
                        error: null
                    }
                }
            }
        });

        const [pid] = page.id.split("#");

        const [updateSettingsAfterPublishResponse] = await updateSettings({
            data: {
                pages: {
                    home: page.id
                }
            }
        });

        expect(updateSettingsAfterPublishResponse).toMatchObject({
            data: {
                pageBuilder: {
                    updateSettings: {
                        data: {
                            pages: {
                                home: pid
                            }
                        },
                        error: null
                    }
                }
            }
        });

        await getSettings().then(([res]) =>
            expect(res).toMatchObject({
                data: {
                    pageBuilder: {
                        getSettings: {
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
