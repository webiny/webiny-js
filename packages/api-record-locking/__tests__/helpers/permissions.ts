export interface PermissionsArg {
    name: string;
    locales?: string[];
    models?: Record<string, any>;
    groups?: Record<string, any>;
    rwd?: string;
    pw?: string;
    own?: boolean;
    _src?: string;
}

export const createPermissions = (permissions?: PermissionsArg[]): PermissionsArg[] => {
    if (permissions) {
        return permissions;
    }
    return [
        {
            name: "cms.settings"
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
            rwd: "rwd",
            pw: "rcpu"
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
            locales: ["en-US", "de-DE"]
        }
    ];
};
