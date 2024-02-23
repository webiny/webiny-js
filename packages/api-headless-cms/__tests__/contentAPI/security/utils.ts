import {SecurityIdentity, SecurityPermission} from "@webiny/api-security/types";

export const identityA: SecurityIdentity = { id: "a", type: "admin", displayName: "A" };
export const identityB: SecurityIdentity = { id: "b", type: "admin", displayName: "B" };
export const identityC: SecurityIdentity = { id: "c", type: "admin", displayName: "C" };
export const identityD: SecurityIdentity = { id: "d", type: "admin", displayName: "D" };

export interface SetPermissionsParams {
    groups: {
        rwd?: string;
        own?: boolean;
        groups?: Record<string, any>;
    };
    models?: {
        rwd?: string;
        own?: boolean;
        models?: Record<string, any>;
    };
    entries?: {
        rwd?: string;
        own?: boolean;
        pw?: string;
    };
}

export class CmsTestPermissions {
    private readonly src: string;
    private permissions: SecurityPermission[];

    constructor(params?: SetPermissionsParams) {
        const randomId = Math.random().toString(36).substring(7);
        this.src = `role:${randomId}`;

        this.permissions = [];

        if (params) {
            this.setPermissions(params);
        }
    }

    getPermissions() {
        return this.permissions;
    }

    setPermissions(params: SetPermissionsParams) {
        this.permissions = [
            { _src: this.src, name: "cms.endpoint.read" },
            { _src: this.src, name: "cms.endpoint.manage" },
            { _src: this.src, name: "cms.endpoint.preview" },
            {
                _src: this.src,
                name: "cms.contentModelGroup",
                own: params.groups.own,
                rwd: params.groups.rwd || "r"
            },
            {
                _src: this.src,
                name: "cms.contentModel",
                own: params.models?.own,
                rwd: params.models?.rwd || "r",
                models: params.models?.models
            },
            {
                _src: this.src,
                name: "cms.contentEntry",
                own: params.entries?.own,
                rwd: params.entries?.rwd || "r",
                pw: params.entries?.pw
            }
        ];
    }
}

export const expectNotAuthorized = (
    testData: Record<string, any>,
    errorData?: Record<string, any>
) => {
    expect(testData).toEqual({
        data: null,
        error: {
            code: "SECURITY_NOT_AUTHORIZED",
            data: errorData || null,
            message: "Not authorized!"
        }
    });
};
