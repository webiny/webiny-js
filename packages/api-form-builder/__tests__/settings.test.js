import useGqlHandler from "./useGqlHandler";

describe("Settings Test", () => {
    const { getSettings, updateSettings, install, isInstalled } = useGqlHandler();

    test(`Should not be able to get & update settings before "install"`, async () => {
        // Should not have any settings without install
        let [response] = await getSettings();

        expect(response).toEqual({
            data: {
                formBuilder: {
                    getSettings: {
                        data: null,
                        error: {
                            code: "NOT_FOUND",
                            data: null,
                            message: `"Form Builder" settings not found!`
                        }
                    }
                }
            }
        });

        [response] = await updateSettings({ data: { domain: "main" } });
        expect(response).toEqual({
            data: {
                formBuilder: {
                    updateSettings: {
                        data: null,
                        error: {
                            code: "NOT_FOUND",
                            data: null,
                            message: '"Form Builder" settings not found!'
                        }
                    }
                }
            }
        });
    });

    test("Should be able to install `Form Builder`", async () => {
        // "isInstalled" should return false prior "install"
        let [response] = await isInstalled();

        expect(response).toEqual({
            data: {
                formBuilder: {
                    version: null
                }
            }
        });

        // Let's install the `Form builder`
        [response] = await install({ domain: "http://localhost:3001" });

        expect(response).toEqual({
            data: {
                formBuilder: {
                    install: {
                        data: true,
                        error: null
                    }
                }
            }
        });

        // "isInstalled" should return true after "install"
        [response] = await isInstalled();

        expect(response).toEqual({
            data: {
                formBuilder: {
                    version: expect.any(String)
                }
            }
        });
    });

    test(`Should be able to get & update settings after "install"`, async () => {
        // Let's install the `Form builder`
        let [response] = await install({ domain: "http://localhost:3001" });

        expect(response).toEqual({
            data: {
                formBuilder: {
                    install: {
                        data: true,
                        error: null
                    }
                }
            }
        });

        // Should not have any settings without install
        [response] = await getSettings();

        expect(response).toEqual({
            data: {
                formBuilder: {
                    getSettings: {
                        data: {
                            domain: "http://localhost:3001",
                            reCaptcha: {
                                enabled: null,
                                secretKey: null,
                                siteKey: null
                            }
                        },
                        error: null
                    }
                }
            }
        });

        [response] = await updateSettings({ data: { domain: "http://localhost:5001" } });
        expect(response).toEqual({
            data: {
                formBuilder: {
                    updateSettings: {
                        data: {
                            domain: "http://localhost:5001",
                            reCaptcha: {
                                enabled: null,
                                secretKey: null,
                                siteKey: null
                            }
                        },
                        error: null
                    }
                }
            }
        });
    });
});
