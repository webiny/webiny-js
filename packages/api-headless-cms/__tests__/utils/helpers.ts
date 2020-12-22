import { pick } from "lodash";
import { SecurityIdentity } from "@webiny/api-security";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { CmsContentModelGroupType } from "@webiny/api-headless-cms/types";
import contentModelGroup from "../contentAPI/mocks/contentModelGroup";

export const createContentModelGroup = async (
    client: DocumentClient
): Promise<CmsContentModelGroupType> => {
    const model: CmsContentModelGroupType = {
        ...contentModelGroup,
        createdBy: identity,
        createdOn: new Date(),
        savedOn: new Date()
    };

    await client.put({
        TableName: "HeadlessCms",
        Item: {
            TYPE: "cms.group",
            ...model
        }
    });
    return model;
};

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

type UntilOptions = {
    name?: string;
    tries?: number;
    wait?: number;
};

export const until = async (execute, until, options: UntilOptions = {}) => {
    const { name = "NO_NAME", tries = 5, wait = 300 } = options;

    let result;
    let triesCount = 0;

    while (true) {
        result = await execute();

        let done;
        try {
            done = await until(result);
        } catch {}

        if (done) {
            return result;
        }

        triesCount++;
        if (triesCount === tries) {
            break;
        }

        // Wait.
        await new Promise(resolve => {
            setTimeout(() => resolve(), wait);
        });
    }

    throw new Error(
        `[${name}] Tried ${tries} times but failed. Last result that was received: ${JSON.stringify(
            result,
            null,
            2
        )}`
    );
};
