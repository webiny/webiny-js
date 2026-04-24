import { createPermissionSchema } from "@webiny/api-core/exports/api/security.js";

export const LANGUAGES_PERMISSIONS_SCHEMA = createPermissionSchema({
    prefix: "languages",
    fullAccess: true,
    readOnlyAccess: true
});
