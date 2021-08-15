import useGqlHandler from "./useGqlHandler";
import { SecurityIdentity } from "@webiny/api-security";

const identityA = new SecurityIdentity({
    id: "a",
    login: "a",
    type: "test",
    displayName: "Aa"
});

describe("Files settings test", () => {
    const { install, isInstalled, getSettings, updateSettings } = useGqlHandler({
        permissions: [{ name: "*" }],
        identity: identityA
    });

    test("install File manager", async () => {
        let [response] = await isInstalled({});
        expect(response).toEqual({
            data: {
                fileManager: {
                    version: null
                }
            }
        });

        [response] = await install({
            srcPrefix: "https://0c6fb883-webiny-latest-files.s3.amazonaws.com/"
        });
        expect(response).toEqual({
            data: {
                fileManager: {
                    install: {
                        data: true,
                        error: null
                    }
                }
            }
        });

        [response] = await isInstalled({});
        expect(response).toEqual({
            data: {
                fileManager: {
                    version: expect.any(String)
                }
            }
        });
    });

    test('should able to get and update "File manager" settings', async () => {
        // Let's first install the app.
        const [installResponse] = await install({
            srcPrefix: "https://0c6fb883-webiny-latest-files.s3.amazonaws.com/"
        });

        expect(installResponse).toEqual({
            data: {
                fileManager: {
                    install: {
                        data: true,
                        error: null
                    }
                }
            }
        });

        let [response] = await getSettings();
        expect(response).toEqual({
            data: {
                fileManager: {
                    getSettings: {
                        data: {
                            uploadMinFileSize: 0,
                            uploadMaxFileSize: 26214401
                        },
                        error: null
                    }
                }
            }
        });

        [response] = await updateSettings({ data: { uploadMinFileSize: -1111 } });
        expect(response).toEqual({
            data: {
                fileManager: {
                    updateSettings: {
                        data: null,
                        error: {
                            code: "VALIDATION_FAILED_INVALID_FIELDS",
                            message: "Validation failed.",
                            data: {
                                invalidFields: {
                                    uploadMinFileSize: {
                                        code: "VALIDATION_FAILED_INVALID_FIELD",
                                        data: null,
                                        message: "Value needs to be greater than or equal to 0."
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        [response] = await updateSettings({
            data: { uploadMinFileSize: 1024 }
        });
        expect(response).toEqual({
            data: {
                fileManager: {
                    updateSettings: {
                        data: {
                            uploadMinFileSize: 1024,
                            uploadMaxFileSize: 26214401
                        },
                        error: null
                    }
                }
            }
        });

        [response] = await getSettings({});
        expect(response).toEqual({
            data: {
                fileManager: {
                    getSettings: {
                        data: {
                            uploadMinFileSize: 1024,
                            uploadMaxFileSize: 26214401
                        },
                        error: null
                    }
                }
            }
        });
    });
});
