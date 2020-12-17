import mdbid from "mdbid";
import { pick } from "lodash";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import {
    CmsContentModelGroupType,
    CmsContext,
    CmsEnvironmentAliasType,
    CmsEnvironmentType,
    DbItemTypes
} from "@webiny/api-headless-cms/types";
import { SecurityIdentity } from "@webiny/api-security";
import {
    createContentModelGroupPk,
    createEnvironmentAliasPk,
    createEnvironmentPk,
    createSettingsPk
} from "../../src/utils";

export type PermissionsArgType = {
    name: string;
    rwd?: string;
};

const INITIAL_ENVIRONMENT_ID = "5fc6590afb3cd80a5ae8a0ae";

export const getInitialEnvironmentId = () => INITIAL_ENVIRONMENT_ID;

export const identity = {
    id: "123",
    displayName: "User 123",
    type: "admin"
};

export const getInitialEnvironment = () => ({
    id: INITIAL_ENVIRONMENT_ID,
    name: "Production",
    slug: "production",
    description: "Production environment description",
    createdBy: identity
});

const getSecurityIdentity = () => {
    return new SecurityIdentity(identity);
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
            }),
            environment: "production"
        }
    } as any;
};
export const createTestContentModelGroupPk = () => createContentModelGroupPk(getDummyCmsContext());

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
        createdOn: new Date().toISOString() as any,
        savedOn: new Date().toISOString() as any,
        changedOn: null
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
        createdBy: identity,
        createdOn: new Date().toISOString() as any,
        savedOn: new Date().toISOString() as any,
        changedOn: null,
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
                    name: "cms.manage.contentModel",
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

export const createContentModelGroup = async (
    client: DocumentClient,
    environment: CmsEnvironmentType
) => {
    const model: CmsContentModelGroupType = {
        id: mdbid(),
        name: "Group",
        slug: "group",
        icon: "ico/ico",
        createdBy: identity,
        description: "description",
        environment,
        createdOn: new Date().toISOString() as any,
        changedOn: new Date().toISOString() as any
    };
    await client
        .put({
            TableName: "HeadlessCms",
            Item: {
                PK: createTestContentModelGroupPk(),
                SK: model.id,
                TYPE: DbItemTypes.CMS_CONTENT_MODEL_GROUP,
                ...model
            }
        })
        .promise();
    return model;
};

export const getModelCreateInputObject = model => {
    return pick(model, [
        "name",
        "modelId",
        "group",
        "description",
        "createdBy",
        "fields",
        "layout",
        "lockedFields",
        "titleFieldId"
    ]);
};
