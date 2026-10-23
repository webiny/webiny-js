import React from "react";
import { AdminConfig } from "@webiny/app-admin";
import { useRouter } from "@webiny/app-admin";
import type { Route } from "@webiny/app/features/router/Route.js";
import { useWorkflowsPermission } from "~/presentation/permissions/useWorkflowsPermission.js";

export interface WorkflowEditorMenuProps {
    name: string;
    parent: string;
    route: Route<any>;
}

// The "Workflows" menu item of one app, shown only with the workflows `editor` permission (D162).
export const WorkflowEditorMenu = ({ name, parent, route }: WorkflowEditorMenuProps) => {
    const router = useRouter();
    const permission = useWorkflowsPermission();
    const { Menu } = AdminConfig;

    if (!permission.editor) {
        return null;
    }

    return (
        <AdminConfig>
            <Menu
                name={name}
                parent={parent}
                pinnable={true}
                element={<Menu.Link text="Workflows" to={router.getLink(route)} pinnable={true} />}
            />
        </AdminConfig>
    );
};
