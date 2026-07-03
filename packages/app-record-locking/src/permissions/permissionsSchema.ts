import { createPermissionSchema } from "@webiny/app-admin";

export const RECORD_LOCKING_PERMISSIONS_SCHEMA = createPermissionSchema({
    prefix: "recordLocking",
    fullAccess: { canForceUnlock: true }
});
