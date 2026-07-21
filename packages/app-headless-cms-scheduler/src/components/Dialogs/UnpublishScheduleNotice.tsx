import React from "react";
import { UnpublishEntryConfirmDialogExtra } from "@webiny/app-headless-cms/exports/admin/cms.js";
import { ScheduleNoticeAlert } from "./ScheduleNoticeAlert.js";

/**
 * Decorates the "Unpublish entry" dialog to warn that unpublishing now will cancel an existing
 * scheduled action for the entry.
 */
export const UnpublishScheduleNoticeDecorator = UnpublishEntryConfirmDialogExtra.createDecorator(
    Original => {
        return function UnpublishEntryScheduleNotice(props: { entryId: string }) {
            return (
                <>
                    <ScheduleNoticeAlert targetId={props.entryId} verb={"Unpublishing"} />
                    <Original {...props} />
                </>
            );
        };
    }
);
