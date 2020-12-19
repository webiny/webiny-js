import { pick } from "lodash";
import { SecurityIdentity } from "@webiny/api-security";

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

export const until = async (execute, until, options = { tries: 5, wait: 300 }) => {
    const tries = options.tries ?? 5;
    const wait = options.wait ?? 300;

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
        `Tried ${tries} times but failed. Last result that was received: ${JSON.stringify(
            result,
            null,
            2
        )}`
    );
};
