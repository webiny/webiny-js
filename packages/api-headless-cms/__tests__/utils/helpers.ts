import { pick } from "lodash";
import { SecurityIdentity } from "@webiny/api-security";

export type PermissionsArgType = {
    name: string;
    locales?: string[];
    rwd?: string;
    rcpu?: string;
};

export const identity = {
    id: "123",
    displayName: "User 123",
    type: "admin"
};

const getSecurityIdentity = () => {
    return new SecurityIdentity(identity);
};

export const createPermissions = (permissions: PermissionsArgType[]): PermissionsArgType[] => {
    if (permissions) {
        return permissions;
    }
    return [
        {
            name: "cms.settings",
            rwd: "rwd"
        },
        {
            name: "cms.contentModel",
            rwd: "rwd"
        },
        {
            name: "cms.contentModelGroup",
            rwd: "rwd"
        },
        {
            name: "cms.contentEntry",
            rwd: "rwd"
        },
        {
            name: "cms.settings"
        },
        {
            name: "cms.endpoint.read"
        },
        {
            name: "cms.endpoint.manage"
        },
        {
            name: "cms.endpoint.preview"
        },
        {
            name: "content.i18n",
            locales: ["en-US"]
        }
    ];
};

export const createIdentity = (identity?: SecurityIdentity) => {
    if (!identity) {
        return getSecurityIdentity();
    }
    return identity;
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
