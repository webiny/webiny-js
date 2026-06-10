import React from "react";
import { AdminConfig } from "@webiny/app-admin";
import { useRouter } from "@webiny/app-admin";
import { AdminLayout } from "@webiny/app-admin";
import { HasPermission } from "./presentation/security/HasPermission.js";
import { TaskDefinitionsView } from "./presentation/TaskDefinitions/components/TaskDefinitionsView.js";
import { TaskExecutionsView } from "./presentation/TaskExecutions/components/TaskExecutionsView.js";
import { BackgroundTaskSettingsView } from "./presentation/BackgroundTaskSettings/components/BackgroundTaskSettingsView.js";
import { Routes } from "./routes.js";
import { ReactComponent as TaskIcon } from "@webiny/icons/task.svg";

const { Menu, Route } = AdminConfig;

export const BackgroundTaskRoutes = () => {
    const { getLink } = useRouter();

    return (
        <AdminConfig>
            <HasPermission entity="task">
                <Route
                    route={Routes.Definitions}
                    element={
                        <AdminLayout title="Task Definitions">
                            <TaskDefinitionsView />
                        </AdminLayout>
                    }
                />
                <Route
                    route={Routes.Executions}
                    element={
                        <AdminLayout title="Task Executions">
                            <TaskExecutionsView />
                        </AdminLayout>
                    }
                />
                <Menu
                    name="backgroundTasks.executions"
                    parent="dev-tools"
                    element={
                        <Menu.Link
                            text="Background Tasks"
                            badge={<Menu.Link.Badge text="BETA" />}
                            to={getLink(Routes.Executions)}
                            icon={
                                <Menu.Link.Icon
                                    label="Background Task Executions"
                                    element={<TaskIcon />}
                                />
                            }
                        />
                    }
                />
                <Route
                    route={Routes.Settings}
                    element={
                        <AdminLayout title="Background Task Settings">
                            <BackgroundTaskSettingsView />
                        </AdminLayout>
                    }
                />
                <Menu
                    name="backgroundTasks.settings"
                    parent="settings.system"
                    element={
                        <Menu.Link
                            text="Background Tasks"
                            to={getLink(Routes.Settings)}
                            badge={<Menu.Link.Badge text="BETA" />}
                        />
                    }
                />
            </HasPermission>
        </AdminConfig>
    );
};
