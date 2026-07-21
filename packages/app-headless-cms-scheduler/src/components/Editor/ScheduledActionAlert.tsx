import React, { useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { ReactComponent as ScheduledIcon } from "@webiny/icons/access_time.svg";
import { Alert } from "@webiny/admin-ui";
import { useContainer } from "@webiny/app";
import { ContentEntryForm } from "@webiny/app-headless-cms/exports/admin/cms/entry/editor.js";
import { useContentEntryFormPresenter } from "@webiny/app-headless-cms/exports/admin/cms/entry/editor.js";
import { GetScheduledActionGateway } from "@webiny/app-scheduler/features/getScheduledAction/abstractions.js";
import { ScheduleActionType } from "@webiny/app-scheduler/types.js";
import type { SchedulerEntry } from "@webiny/app-scheduler/types.js";
import { createNamespace, formatScheduledDate } from "~/utils/index.js";
import { schedulerMutationSignal } from "../schedulerMutationSignal.js";

/**
 * Info alert shown above the content entry form when the entry has a scheduled publish/unpublish.
 * Reads the scheduled action for the current entry via the scheduler read gateway.
 */
const ScheduledActionAlertBar = observer(() => {
    const presenter = useContentEntryFormPresenter();
    const container = useContainer();
    const [scheduled, setScheduled] = useState<SchedulerEntry | null>(null);

    const vm = presenter.vm;
    const entryId = vm.entry?.id;
    const modelId = vm.model?.modelId;
    // Refetch whenever a schedule/cancel bumps the signal (e.g. scheduling from this editor).
    const version = schedulerMutationSignal.version;

    useEffect(() => {
        if (!entryId || !modelId) {
            setScheduled(null);
            return;
        }

        let cancelled = false;
        const gateway = container.resolve(GetScheduledActionGateway);
        gateway
            .execute({ namespace: createNamespace({ modelId }), id: entryId })
            .then(result => {
                if (!cancelled) {
                    setScheduled(result);
                }
            })
            .catch(error => {
                console.error(error);
                if (!cancelled) {
                    setScheduled(null);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [container, entryId, modelId, version]);

    if (!scheduled) {
        return null;
    }

    const goLiveOn = scheduled.publishOn || scheduled.unpublishOn;
    const actionLabel =
        scheduled.actionType === ScheduleActionType.unpublish ? "unpublish" : "publish";

    return (
        <Alert type={"warning"} variant={"subtle"} icon={<ScheduledIcon />} className={"mb-md"}>
            {goLiveOn ? (
                <>
                    This entry is scheduled to {actionLabel} on{" "}
                    <strong>{formatScheduledDate(goLiveOn)}</strong>.
                </>
            ) : (
                <>This entry is scheduled to {actionLabel}.</>
            )}
        </Alert>
    );
});

/**
 * Decorates the content entry form to render the scheduled-action alert above the form body.
 */
export const ScheduledActionAlertDecorator = ContentEntryForm.createDecorator(Original => {
    return function ContentEntryFormWithScheduledAlert() {
        return (
            <>
                <ScheduledActionAlertBar />
                <Original />
            </>
        );
    };
});
