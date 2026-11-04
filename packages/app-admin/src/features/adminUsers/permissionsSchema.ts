import { createPermissionSchema } from "~/permissions/index.js";

export const ADMIN_USERS_PERMISSIONS_SCHEMA = createPermissionSchema({
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
