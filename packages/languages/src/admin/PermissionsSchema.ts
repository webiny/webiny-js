import { createPermissionSchema } from "@webiny/app-admin";

export const LANGUAGES_PERMISSIONS_SCHEMA = createPermissionSchema({
    prefix: "languages",
    fullAccess: true,
    readOnlyAccess: true
});
