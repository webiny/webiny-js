import React from "react";
import { useRouter } from "@webiny/app-admin";
import { Button } from "@webiny/admin-ui";
import { ReactComponent as TaskIcon } from "@webiny/icons/task.svg";
import { Routes } from "~/admin/routes.js";

export const TaskExecutionsButton = () => {
    const { goToRoute } = useRouter();

    return (
        <Button
            variant="secondary"
            onClick={() => goToRoute(Routes.Executions)}
            icon={<TaskIcon />}
        >
            Task Executions
        </Button>
    );
};
