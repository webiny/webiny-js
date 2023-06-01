import { SecurityIdentity } from "@webiny/api-security/types";
import useGqlHandler from "~tests/utils/useGqlHandler";

const identityA: SecurityIdentity = {
    id: "a",
    type: "test",
    displayName: "Aa"
};
describe("Files settings test", () => {
    const { install, isInstalled, getSettings, updateSettings } = useGqlHandler({
        identity: identityA
    });

    test("install File manager", async () => {
        const [isInstalledResponse] = await isInstalled({});
        expect(isInstalledResponse).toEqual({
            data: {
                fileManager: {
                    version: null
                }
            }
        });

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

        const [afterInstallIsInstalledResponse] = await isInstalled({});
        expect(afterInstallIsInstalledResponse).toEqual({
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

        const [getSettingsResponse] = await getSettings();
        expect(getSettingsResponse).toEqual({
            data: {
                fileManager: {
                    getSettings: {
                        data: {
                            uploadMinFileSize: 0,
                            uploadMaxFileSize: 10737418240
                        },
                        error: null
                    }
                }
            }
        });

        const [updateInvalidMinFileSize] = await updateSettings({
            data: { uploadMinFileSize: -1111 }
        });
        expect(updateInvalidMinFileSize).toEqual({
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

        const [updateMinFileSizeSettingsReponse] = await updateSettings({
            data: { uploadMinFileSize: 1024 }
        });
        expect(updateMinFileSizeSettingsReponse).toEqual({
            data: {
                fileManager: {
                    updateSettings: {
                        data: {
                            uploadMinFileSize: 1024,
                            uploadMaxFileSize: 10737418240
                        },
                        error: null
                    }
                }
            }
        });

        const [getSettingsAfterUpdateResponse] = await getSettings({});
        expect(getSettingsAfterUpdateResponse).toEqual({
            data: {
                fileManager: {
                    getSettings: {
                        data: {
                            uploadMinFileSize: 1024,
                            uploadMaxFileSize: 10737418240
                        },
                        error: null
                    }
                }
            }
        });
    });
});
