import {
    createEnvironmentAliasPk,
    createEnvironmentPk,
    createSettingsPk
} from "@webiny/api-headless-cms/plugins/crud/partitionKeys";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { CmsEnvironmentType } from "@webiny/api-headless-cms/types";
import { SecurityIdentity } from "@webiny/api-security";

export type PermissionsArgType = {
    name: string;
    rwd?: string;
};

const INITIAL_ENVIRONMENT_ID = "5fc6590afb3cd80a5ae8a0ae";

export const getInitialEnvironmentId = () => INITIAL_ENVIRONMENT_ID;
export const getInitialEnvironment = () => ({
    id: INITIAL_ENVIRONMENT_ID,
    name: "initial Environment",
    slug: "initial-environment",
    description: "initial environment description"
});
const getDummyContext = (): any => ({
    security: {
        getTenant: () => ({
            id: "root",
            name: "Root",
            parent: null
        })
    },
    i18nContent: {
        locale: {
            code: "en-US"
        }
    }
});
export const createEnvironmentTestPartitionKey = () => createEnvironmentPk(getDummyContext());
export const createEnvironmentAliasTestPartitionKey = () =>
    createEnvironmentAliasPk(getDummyContext());
export const createSettingsTestPartitionKey = () => createSettingsPk(getDummyContext());

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
                    name: "cms.manage.setting",
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
            return new SecurityIdentity({
                id: "1234567890",
                displayName: "userName123",
                login: "login",
                type: "type"
            });
        }
        return identity;
    };
};
