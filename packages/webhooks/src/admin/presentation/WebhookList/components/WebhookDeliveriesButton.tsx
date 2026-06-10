import React from "react";
import { useRouter } from "@webiny/app-admin";
import { Button } from "@webiny/admin-ui";
import { ReactComponent as ListIcon } from "@webiny/icons/list.svg";
import { Routes } from "~/admin/routes.js";

export const WebhookDeliveriesButton = () => {
    const { goToRoute } = useRouter();

    return (
        <Button
            variant="secondary"
            onClick={() => goToRoute(Routes.Deliveries)}
            icon={<ListIcon />}
        >
            All Deliveries
        </Button>
    );
};
