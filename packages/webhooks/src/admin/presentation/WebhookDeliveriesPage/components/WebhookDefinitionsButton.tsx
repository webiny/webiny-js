import React from "react";
import { useRouter } from "@webiny/app-admin";
import { Button } from "@webiny/admin-ui";
import { ReactComponent as ListIcon } from "@webiny/icons/list.svg";
import { Routes } from "~/admin/routes.js";

export const WebhookDefinitionsButton = () => {
    const { goToRoute } = useRouter();

    return (
        <Button variant="secondary" onClick={() => goToRoute(Routes.List)} icon={<ListIcon />}>
            Webhooks
        </Button>
    );
};
