import { createPermissionSchema } from "@webiny/app-admin";

export const COGNITO_PERMISSIONS_SCHEMA = createPermissionSchema({
    prefix: "adminUsers",
    fullAccess: true,
    entities: [
        {
            id: "user",
            title: "Users",
            permission: "adminUsers.user",
            scopes: ["full"]
        }
    ]
});
