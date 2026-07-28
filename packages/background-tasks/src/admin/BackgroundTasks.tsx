import React from "react";
import { AdminConfig } from "@webiny/app-admin";
import { RegisterFeature } from "@webiny/app-admin";
import { ReactComponent as TaskIcon } from "@webiny/icons/task.svg";
import { ListTasksFeature } from "./features/listTasks/index.js";
import { GetTaskFeature } from "./features/getTask/index.js";
import { DeleteTaskFeature } from "./features/deleteTask/index.js";
import { AbortTaskFeature } from "./features/abortTask/index.js";
import { ListLogsFeature } from "./features/listLogs/index.js";
import { ListDefinitionsFeature } from "./features/listDefinitions/index.js";
import { TaskPermissionsFeature } from "./features/permissions/index.js";
import { TaskExecutionsPresenterFeature } from "./presentation/TaskExecutions/index.js";
import { TaskDefinitionsPresenterFeature } from "./presentation/TaskDefinitions/index.js";
import { TaskDetailPresenterFeature } from "./presentation/TaskDetail/index.js";
import { GetBackgroundTaskSettingsFeature } from "./features/getBackgroundTaskSettings/index.js";
import { UpdateBackgroundTaskSettingsFeature } from "./features/updateBackgroundTaskSettings/index.js";
import { BackgroundTaskSettingsPresenterFeature } from "./presentation/BackgroundTaskSettings/index.js";
import { BackgroundTaskRoutes } from "./BackgroundTaskRoutes.js";
import { BACKGROUND_TASK_PERMISSIONS_SCHEMA } from "~/admin/permissions.js";

const { Security } = AdminConfig;

export const BackgroundTasks = () => {
    return (
        <>
            {/* Headless features. */}
            <RegisterFeature feature={ListTasksFeature} />
            <RegisterFeature feature={GetTaskFeature} />
            <RegisterFeature feature={DeleteTaskFeature} />
            <RegisterFeature feature={AbortTaskFeature} />
            <RegisterFeature feature={ListLogsFeature} />
            <RegisterFeature feature={ListDefinitionsFeature} />
            <RegisterFeature feature={TaskPermissionsFeature} />
            <RegisterFeature feature={GetBackgroundTaskSettingsFeature} />
            <RegisterFeature feature={UpdateBackgroundTaskSettingsFeature} />
            {/* Presentation features. */}
            <RegisterFeature feature={TaskExecutionsPresenterFeature} />
            <RegisterFeature feature={TaskDefinitionsPresenterFeature} />
            <RegisterFeature feature={TaskDetailPresenterFeature} />
            <RegisterFeature feature={BackgroundTaskSettingsPresenterFeature} />
            {/* Routes + menu. */}
            <BackgroundTaskRoutes />
            {/* Security permissions UI. */}
            <AdminConfig>
                <Security.Permissions
                    name="backgroundTasks"
                    title="Background Tasks"
                    description="Manage background task permissions."
                    icon={<TaskIcon />}
                    schema={BACKGROUND_TASK_PERMISSIONS_SCHEMA}
                />
            </AdminConfig>
        </>
    );
};
