import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { CmsSettingsType, DbItemTypes } from "@webiny/api-headless-cms/types";
import { useAdminGqlHandler } from "../utils/useAdminGqlHandler";
import { createSettingsTestPartitionKey } from "../utils/helpers";

const SETTINGS_SECONDARY_KEY = "settings";

const insertCmsSettings = async (documentClient: DocumentClient, settings: CmsSettingsType) => {
    await documentClient
        .put({
            TableName: "HeadlessCms",
            Item: {
                PK: createSettingsTestPartitionKey(),
                SK: SETTINGS_SECONDARY_KEY,
                TYPE: DbItemTypes.CMS_SETTINGS,
                ...settings
            }
        })
        .promise();
};

describe("Settings crud test", () => {
    const { isInstalledQuery, installMutation, documentClient } = useAdminGqlHandler();

    test("cms is not installed", async () => {
        const [response] = await isInstalledQuery();
        expect(response).toEqual({
            data: {
                cms: {
                    isInstalled: {
                        data: false,
                        error: null
                    }
                }
            }
        });
        await insertCmsSettings(documentClient, {
            isInstalled: false,
            contentModelLastChange: new Date()
        });
        const [afterInsertResponse] = await isInstalledQuery();
        expect(afterInsertResponse).toEqual({
            data: {
                cms: {
                    isInstalled: {
                        data: false,
                        error: null
                    }
                }
            }
        });
    });

    test("cms is installed", async () => {
        await insertCmsSettings(documentClient, {
            isInstalled: true,
            contentModelLastChange: new Date()
        });

        const [response] = await isInstalledQuery();
        expect(response).toEqual({
            data: {
                cms: {
                    isInstalled: {
                        data: true,
                        error: null
                    }
                }
            }
        });
    });

    test("cms is already installed", async () => {
        await insertCmsSettings(documentClient, {
            isInstalled: true,
            contentModelLastChange: new Date()
        });

        const [response] = await installMutation();
        expect(response).toEqual({
            data: {
                cms: {
                    install: {
                        data: null,
                        error: {
                            message: "The app is already installed.",
                            code: "CMS_INSTALLATION_ERROR"
                        }
                    }
                }
            }
        });
    });

    test("cms install", async () => {
        const [response] = await installMutation();
        expect(response).toEqual({
            data: {
                cms: {
                    install: {
                        data: true,
                        error: null
                    }
                }
            }
        });

        const [isInstalledResponse] = await isInstalledQuery();
        expect(isInstalledResponse).toEqual({
            data: {
                cms: {
                    isInstalled: {
                        data: true,
                        error: null
                    }
                }
            }
        });
    });
});
