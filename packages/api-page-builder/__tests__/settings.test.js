import useGqlHandler from "./useGqlHandler";

describe("CRUD Test", () => {
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
                                twitter: null
                            }
                        },
                        error: null
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
                    twitter: "https://www.twitter.com"
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
                                twitter: "https://www.twitter.com"
                            }
                        },
                        error: null
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
                                twitter: "https://www.twitter.com"
                            }
                        },
                        error: null
                    }
                }
            }
        });
    });
});
