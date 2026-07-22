import React, { useEffect } from "react";
import { observer } from "mobx-react-lite";
import { ReactComponent as ScheduledIcon } from "@webiny/icons/access_time.svg";
import { Alert } from "@webiny/admin-ui";
import { useContainer } from "@webiny/app";
import { ContentEntryForm } from "@webiny/app-headless-cms/exports/admin/cms/entry/editor.js";
import { useContentEntryFormPresenter } from "@webiny/app-headless-cms/exports/admin/cms/entry/editor.js";
import { ScheduleActionType } from "@webiny/app-scheduler/types.js";
import { ScheduledActionsPresenter } from "~/presentation/scheduledActions/abstractions.js";
import { formatScheduledDate } from "~/utils/index.js";

/**
 * Info alert shown above the content entry form when the entry has a scheduled publish/unpublish.
 * Loads the open entry's scheduled action into ScheduledActionsPresenter and reads it back.
 */
const ScheduledActionAlertBar = observer(() => {
    const formPresenter = useContentEntryFormPresenter();
    const container = useContainer();
    const presenter = React.useMemo(
        () => container.resolve(ScheduledActionsPresenter),
        [container]
    );

    const vm = formPresenter.vm;
    const entryId = vm.entry?.id;
    const modelId = vm.model?.modelId;

    useEffect(() => {
        if (entryId && modelId) {
            presenter.loadForEntry(modelId, entryId);
        }
    }, [presenter, entryId, modelId]);

    const scheduled = entryId ? presenter.getScheduledAction(entryId) : undefined;

    // Reconcile against the entry's current status: a direct publish/unpublish supersedes the
    // scheduled action (the API cancels it asynchronously), so hide the banner immediately.
    const status = vm.entry?.meta?.status;
    const redundant =
        !!scheduled &&
        (scheduled.actionType === ScheduleActionType.unpublish
            ? status === "unpublished"
            : status === "published");

    if (!scheduled || redundant) {
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
