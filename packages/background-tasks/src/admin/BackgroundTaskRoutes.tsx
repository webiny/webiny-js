import React from "react";
import { AdminConfig } from "@webiny/app-admin";
import { useRouter } from "@webiny/app-admin";
import { AdminLayout } from "@webiny/app-admin";
import { HasPermission } from "./presentation/security/HasPermission.js";
import { TaskListView } from "./presentation/TaskList/components/TaskListView.js";
import { Routes } from "./routes.js";

const { Menu, Route } = AdminConfig;

export const BackgroundTaskRoutes = () => {
    const { getLink } = useRouter();

    return (
        <AdminConfig>
            <HasPermission entity="task">
                <Route
                    route={Routes.List}
                    element={
                        <AdminLayout title="Background Tasks">
                            <TaskListView />
                        </AdminLayout>
                    }
                />
                <Menu
                    name="backgroundTasks.list"
                    parent="dev-tools"
                    element={<Menu.Link text="Background Tasks" to={getLink(Routes.List)} />}
                />
            </HasPermission>
        </AdminConfig>
    );
};
