import React, { useEffect } from "react";
import { observer } from "mobx-react-lite";
import { ReactComponent as ScheduledIcon } from "@webiny/icons/access_time.svg";
import { Alert } from "@webiny/admin-ui";
import { useContainer } from "@webiny/app";
import { ContentEntryFormContent } from "@webiny/app-headless-cms/presentation/contentEntries/views/layout/index.js";
import { useContentEntryFormPresenter } from "@webiny/app-headless-cms/exports/admin/cms/entry/editor.js";
import { ScheduleActionType } from "@webiny/app-scheduler/types.js";
import { ScheduledActionsPresenter } from "~/presentation/scheduledActions/abstractions.js";
import { formatScheduledDate } from "~/utils/index.js";

/**
 * Full-width bar shown below the entry-form header (above the form content) when the entry has a
 * scheduled publish/unpublish. Positioned like the workflow bar for visual consistency.
 */
const ScheduledActionBar = observer(() => {
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
    // scheduled action (the API cancels it asynchronously), so hide the bar immediately.
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
        <Alert type={"warning"} variant={"subtle"} icon={<ScheduledIcon />}>
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
 * Decorates the content entry form layout to render the scheduled-action bar below the header,
 * above the form content (mirroring how the workflow bar is positioned).
 */
export const ScheduledActionAlertDecorator = ContentEntryFormContent.createDecorator(Original => {
    return function ContentEntryFormContentWithScheduledBar(props) {
        return (
            <>
                <ScheduledActionBar />
                <Original {...props} />
            </>
        );
    };
});
