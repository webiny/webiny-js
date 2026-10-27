import React from "react";
import { EmptyState } from "@webiny/admin-ui";

// The no-permission state (design README 4).
export const EditorNoPermission = () => {
    return (
        <EmptyState
            illustration={false}
            title="You don't have access to workflows"
            description="Building workflows needs the Manage workflows permission. Ask an administrator to add it to your role."
        />
    );
};
