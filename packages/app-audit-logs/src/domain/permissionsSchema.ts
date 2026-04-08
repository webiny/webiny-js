import { createPermissionSchema } from "@webiny/app-admin";

export const AL_PERMISSIONS_SCHEMA = createPermissionSchema({
    prefix: "al",
    fullAccess: true
});
