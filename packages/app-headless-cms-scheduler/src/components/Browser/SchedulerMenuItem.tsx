import React from "react";
import { useApolloClient } from "@apollo/react-hooks";
import { useModel } from "@webiny/app-headless-cms/exports/admin/cms.js";
import { usePermissions } from "~/hooks/usePermissions.js";
import { Scheduler as BaseScheduler } from "@webiny/app-scheduler";
import { SchedulerButton } from "./SchedulerButton.js";
import { createNamespace } from "~/utils/index.js";

export const SchedulerMenuItem = () => {
    const client = useApolloClient();
    const { model } = useModel();
    const { canPublish, canUnpublish } = usePermissions();

    const namespace = createNamespace(model);

    if (!canPublish && !canUnpublish) {
        return null;
    }

    return (
        <BaseScheduler
            namespace={namespace}
            client={client}
            canPublish={canPublish}
            canUnpublish={canUnpublish}
            render={({ showScheduler }) => {
                return <SchedulerButton onClick={showScheduler} />;
            }}
        />
    );
};
