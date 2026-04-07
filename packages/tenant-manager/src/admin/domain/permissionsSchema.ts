import { createPermissionSchema } from "@webiny/app-admin";

export const TM_PERMISSIONS_SCHEMA = createPermissionSchema({
    prefix: "tm",
    fullAccess: true
});
