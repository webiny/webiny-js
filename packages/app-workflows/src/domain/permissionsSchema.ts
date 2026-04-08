import { createPermissionSchema } from "@webiny/app-admin";

export const WORKFLOWS_PERMISSIONS_SCHEMA = createPermissionSchema({
    prefix: "workflows",
    fullAccess: { editor: true }
});
