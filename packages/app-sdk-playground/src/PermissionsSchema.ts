import { createPermissionSchema } from "@webiny/app-admin";

export const DEV_TOOLS_PERMISSIONS_SCHEMA = createPermissionSchema({
    prefix: "dev-tools",
    fullAccess: true,
    entities: [
        {
            id: "sdk-playground",
            title: "SDK Playground",
            permission: "dev-tools.sdk-playground.*",
            scopes: ["full"]
        },
        {
            id: "frontend-settings",
            title: "Frontend Settings",
            permission: "dev-tools.frontend-settings.*",
            scopes: ["full"]
        },
        /*
         * Gated on an exact match: Dev Tools full access does not turn debug capture on, so this
         * entity has to be granted on its own.
         */
        {
            id: "debug",
            title: "Debugger",
            permission: "dev-tools.debug",
            scopes: ["full"]
        }
    ]
});
