import type { AuditAction } from "~/types.js";

export const auditAction: AuditAction = {
    app: {
        app: "cms",
        displayName: "CMS",
        entities: []
    },
    action: {
        type: "CREATE",
        displayName: "Create"
    },
    entity: {
        type: "user",
        displayName: "Users",
        actions: [
            {
                type: "CREATE",
                displayName: "Create"
            },
            {
                type: "UPDATE",
                displayName: "Update"
            },
            {
                type: "DELETE",
                displayName: "Delete"
            }
        ]
    }
};
