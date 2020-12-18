import mdbid from "mdbid";
import { pick } from "lodash";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { CmsContentModelGroupType, CmsContext, DbItemTypes } from "@webiny/api-headless-cms/types";
import { SecurityIdentity } from "@webiny/api-security";
import { createContentModelGroupPk, createSettingsPk } from "../../src/utils";

export type PermissionsArgType = {
    name: string;
    rwd?: string;
};

export const identity = {
    id: "123",
    displayName: "User 123",
    type: "admin"
};

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
        cms: {
            getLocale: () => ({
                code: "en-US"
            })
        }
    } as any;
};
export const createTestContentModelGroupPk = () => createContentModelGroupPk(getDummyCmsContext());

export const createSettingsTestPartitionKey = () => createSettingsPk(getDummyCmsContext());

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

export const createContentModelGroup = async (client: DocumentClient) => {
    const model: CmsContentModelGroupType = {
        id: mdbid(),
        name: "Group",
        slug: "group",
        icon: "ico/ico",
        createdBy: identity,
        description: "description",
        createdOn: new Date().toISOString() as any,
        savedOn: new Date().toISOString() as any
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
