import React from "react";
import { useRouter } from "@webiny/app-admin";
import { Button } from "@webiny/admin-ui";
import { ReactComponent as ListIcon } from "@webiny/icons/list.svg";
import { Routes } from "~/admin/routes.js";

export const TaskDefinitionsButton = () => {
    const { goToRoute } = useRouter();

    return (
        <Button
            variant="secondary"
            onClick={() => goToRoute(Routes.Definitions)}
            icon={<ListIcon />}
        >
            Task Definitions
        </Button>
    );
};
