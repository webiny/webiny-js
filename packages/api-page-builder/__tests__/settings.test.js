import useGqlHandler from "./useGqlHandler";

describe("Settings Test", () => {
    const { getSettings, updateSettings } = useGqlHandler();

    test("get and update settings", async () => {
        // 1. Should return default settings.
        let [response] = await getSettings();
        expect(response).toEqual({
            data: {
                pageBuilder: {
                    getSettings: {
                        data: {
                            domain: null,
                            name: null,
                            social: {
                                facebook: null,
                                instagram: null,
                                twitter: null,
                                image: null
                            }
                        },
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
                domain: "https://www.test.com",
                social: {
                    facebook: "https://www.facebook.com",
                    instagram: "https://www.instagram.com",
                    twitter: "https://www.twitter.com",
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
                            domain: "https://www.test.com",
                            social: {
                                instagram: "https://www.instagram.com",
                                facebook: "https://www.facebook.com",
                                twitter: "https://www.twitter.com",
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
                            domain: "https://www.test.com",
                            social: {
                                instagram: "https://www.instagram.com",
                                facebook: "https://www.facebook.com",
                                twitter: "https://www.twitter.com",
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
});
