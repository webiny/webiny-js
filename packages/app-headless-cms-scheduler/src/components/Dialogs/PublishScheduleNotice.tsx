import React from "react";
import { observer } from "mobx-react-lite";
import { Alert } from "@webiny/admin-ui";
import { PublishEntryConfirmDialogExtra } from "@webiny/app-headless-cms/exports/admin/cms.js";
import { ScheduleActionType } from "@webiny/app-scheduler/types.js";
import type { CmsContentEntry } from "@webiny/app-headless-cms-common/types/index.js";
import { formatScheduledDate } from "~/utils/index.js";
import { scheduledActionsStore } from "../Browser/ScheduledActionsStore.js";

/**
 * Decorates the "Publish entry" dialog to warn that publishing now will cancel an existing
 * scheduled action for the entry (the API cancels it on publish).
 *
 * The dialog renders outside the model context, so the scheduled action is read from the store the
 * Live column already populated for the current list (looked up by the entry's target id).
 */
export const PublishScheduleNoticeDecorator = PublishEntryConfirmDialogExtra.createDecorator(
    Original => {
        return observer(function PublishEntryScheduleNotice(props: { entry: CmsContentEntry }) {
            const scheduled = props.entry?.id
                ? scheduledActionsStore.getActionByTargetId(props.entry.id)
                : undefined;

            if (!scheduled) {
                return <Original {...props} />;
            }

            const goLiveOn = scheduled.publishOn || scheduled.unpublishOn;
            const actionLabel =
                scheduled.actionType === ScheduleActionType.unpublish ? "unpublish" : "publish";

            return (
                <>
                    <Alert type={"warning"} variant={"subtle"} className={"mb-md"}>
                        This entry has a {actionLabel} scheduled
                        {goLiveOn ? ` for ${formatScheduledDate(goLiveOn)}` : ""}. Publishing now
                        will cancel it.
                    </Alert>
                    <Original {...props} />
                </>
            );
        });
    }
);
