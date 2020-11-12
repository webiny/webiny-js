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
                files: {
                    isInstalled: {
                        data: false,
                        error: null
                    }
                }
            }
        });

        [response] = await install({
            srcPrefix: "https://0c6fb883-webiny-latest-files.s3.amazonaws.com/"
        });
        expect(response).toEqual({
            data: {
                files: {
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
                files: {
                    isInstalled: {
                        data: true,
                        error: null
                    }
                }
            }
        });
    });

    test("File manager settings", async () => {
        let [response] = await getSettings();
        expect(response).toEqual({
            data: {
                files: {
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
                files: {
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
                files: {
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
                files: {
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
