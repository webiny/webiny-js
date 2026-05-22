import React from "react";
import { useRouter } from "@webiny/app-admin";
import { Button } from "@webiny/admin-ui";
import { ReactComponent as AddIcon } from "@webiny/icons/add.svg";
import { HasPermission } from "~/admin/presentation/security/HasPermission.js";
import { Routes } from "~/admin/routes.js";

export const CreateWebhookButton = () => {
    const { goToRoute } = useRouter();

    return (
        <HasPermission entity="webhook" action="edit">
            <Button
                variant="primary"
                onClick={() => goToRoute(Routes.Form, { id: "new" })}
                icon={<AddIcon />}
            >
                Create Webhook
            </Button>
        </HasPermission>
    );
};
