import React from "react";
import { useModel } from "@webiny/app-headless-cms/exports/admin/cms.js";
import { usePermissions } from "~/hooks/usePermissions.js";
import { Scheduler as BaseScheduler } from "@webiny/app-scheduler";
import { SchedulerButton } from "./SchedulerButton.js";
import { useScheduledActionsPresenter } from "~/hooks/useScheduledActionsPresenter.js";
import { createNamespace } from "~/utils/index.js";

export const SchedulerMenuItem = () => {
    const { model } = useModel();
    const { canPublish, canUnpublish } = usePermissions();
    const scheduledActions = useScheduledActionsPresenter();

    const namespace = createNamespace(model);

    if (!canPublish && !canUnpublish) {
        return null;
    }

    return (
        <BaseScheduler
            namespace={namespace}
            canPublish={canPublish}
            canUnpublish={canUnpublish}
            // The scheduler overlay opens on top of the entries list, so the list stays mounted and
            // its cached scheduled actions go stale when one is cancelled here. Reload on close so the
            // "Live" column reflects any cancellations before the user sees the list again.
            onClose={() => scheduledActions.loadForModel(model.modelId)}
            render={({ showScheduler }) => {
                return <SchedulerButton onClick={showScheduler} />;
            }}
        />
    );
};
