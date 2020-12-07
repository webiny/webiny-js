import { useGqlHandler } from "../../useGqlHandler";
import { createSettingsTestPartitionKey } from "../../helpers";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { CmsSettingsType } from "@webiny/api-headless-cms/types";
import { DbItemTypes } from "@webiny/api-headless-cms/common/dbItemTypes";

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
    const {
        listEnvironmentsQuery,
        listEnvironmentAliasesQuery,
        isInstalledQuery,
        installMutation,
        documentClient
    } = useGqlHandler();

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
            environment: "environment",
            environmentAlias: "environmentAlias"
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
            environment: "environment",
            environmentAlias: "environmentAlias"
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
            environment: "environment",
            environmentAlias: "environmentAlias"
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

        const [environmentsResponse] = await listEnvironmentsQuery();
        expect(environmentsResponse.data.cms.listEnvironments.data).toHaveLength(1);

        const productionEnvironment = environmentsResponse.data.cms.listEnvironments.data.find(
            () => true
        );

        const [aliasesResponse] = await listEnvironmentAliasesQuery();
        expect(aliasesResponse.data.cms.listEnvironmentAliases.data).toHaveLength(1);

        const alias = aliasesResponse.data.cms.listEnvironmentAliases.data.find(() => true);

        expect(alias.environment.id).toEqual(productionEnvironment.id);
    });
});
