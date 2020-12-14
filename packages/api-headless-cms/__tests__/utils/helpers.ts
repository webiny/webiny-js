import { createEnvironmentAliasPk, createEnvironmentPk, createSettingsPk } from "../../src/utils";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import {
    CmsContext,
    CmsEnvironmentAliasType,
    CmsEnvironmentType,
    DbItemTypes
} from "@webiny/api-headless-cms/types";
import { SecurityIdentity } from "@webiny/api-security";

export type PermissionsArgType = {
    name: string;
    rwd?: string;
};

const INITIAL_ENVIRONMENT_ID = "5fc6590afb3cd80a5ae8a0ae";

export const getInitialEnvironmentId = () => INITIAL_ENVIRONMENT_ID;

export const getInitialEnvironment = () => ({
    id: INITIAL_ENVIRONMENT_ID,
    name: "Production",
    slug: "production",
    description: "Production environment description",
    createdBy: {
        id: "1234567890",
        name: "userName123"
    }
});

const getSecurityIdentity = () => {
    return new SecurityIdentity({
        id: "1234567890",
        displayName: "userName123",
        login: "login",
        type: "type"
    });
};

const getDummyCmsContext = (): CmsContext => {
    return {
        security: {
            getIdentity: () => {
                return getSecurityIdentity();
            },
            getTenant: () => ({
                id: "root",
                name: "Root",
                parent: null
            })
        },
        environment: {
            slug: "production"
        },
        cms: {
            getLocale: () => ({
                code: "en-US"
            })
        }
    } as any;
};

export const createEnvironmentTestPartitionKey = () => createEnvironmentPk(getDummyCmsContext());

export const createEnvironmentAliasTestPartitionKey = () => {
    return createEnvironmentAliasPk(getDummyCmsContext());
};

export const createSettingsTestPartitionKey = () => createSettingsPk(getDummyCmsContext());

export const deleteInitialEnvironment = async (documentClient: DocumentClient): Promise<void> => {
    await documentClient
        .delete({
            TableName: "HeadlessCms",
            Key: {
                PK: createEnvironmentTestPartitionKey(),
                SK: getInitialEnvironmentId()
            }
        })
        .promise();
};

export const createInitialEnvironment = async (
    documentClient: DocumentClient
): Promise<CmsEnvironmentType> => {
    const model: CmsEnvironmentType = {
        ...getInitialEnvironment(),
        createdOn: new Date()
    };
    await documentClient
        .put({
            TableName: "HeadlessCms",
            Item: {
                PK: createEnvironmentTestPartitionKey(),
                SK: getInitialEnvironmentId(),
                TYPE: DbItemTypes.CMS_ENVIRONMENT,
                ...model
            }
        })
        .promise();
    return model;
};

export const createInitialAliasEnvironment = async (
    documentClient: DocumentClient,
    env: CmsEnvironmentType
): Promise<CmsEnvironmentAliasType> => {
    const id = "5fc6590afb3cd80a5ae8a0af";
    const model: CmsEnvironmentAliasType = {
        id,
        name: "Production alias",
        slug: "production",
        createdBy: {
            id: "1234567890",
            name: "userName123"
        },
        createdOn: new Date(),
        environment: env
    };
    await documentClient
        .put({
            TableName: "HeadlessCms",
            Item: {
                PK: createEnvironmentAliasTestPartitionKey(),
                SK: id,
                TYPE: DbItemTypes.CMS_ENVIRONMENT_ALIAS,
                ...model
            }
        })
        .promise();
    return model;
};

export const fetchInitialEnvironment = async (
    documentClient: DocumentClient
): Promise<CmsEnvironmentType> => {
    const response = await documentClient
        .get({
            TableName: "HeadlessCms",
            Key: {
                PK: createEnvironmentTestPartitionKey(),
                SK: getInitialEnvironmentId()
            }
        })
        .promise();
    if (!response || !response.Item) {
        throw new Error(`Missing initial environment "${getInitialEnvironmentId()}".`);
    }
    return (response.Item as unknown) as CmsEnvironmentType;
};

export const createGetPermissions = (permissions: PermissionsArgType[]) => {
    return (): PermissionsArgType[] => {
        if (!permissions) {
            return [
                {
                    name: "cms.manage.settings",
                    rwd: "rwd"
                },
                {
                    name: "*"
                }
            ];
        }
        return permissions;
    };
};

export const createAuthenticate = (identity?: SecurityIdentity) => {
    return (): SecurityIdentity => {
        if (!identity) {
            return getSecurityIdentity();
        }
        return identity;
    };
};
