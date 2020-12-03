import { useGqlHandler } from "./useGqlHandler";
import { createSettingsTestPartitionKey } from "./helpers";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { CmsSettingsType } from "@webiny/api-headless-cms/types";

const SETTINGS_SECONDARY_KEY = "settings";
const SETTINGS_TYPE = "cms#settings";

const insertCmsSettings = async (documentClient: DocumentClient, settings: CmsSettingsType) => {
    await documentClient
        .put({
            TableName: "HeadlessCms",
            Item: {
                PK: createSettingsTestPartitionKey(),
                SK: SETTINGS_SECONDARY_KEY,
                TYPE: SETTINGS_TYPE,
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
        expect.assertions(2);

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
        expect.assertions(1);

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

    test("cms install mutation", async () => {
        expect.assertions(4);

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
