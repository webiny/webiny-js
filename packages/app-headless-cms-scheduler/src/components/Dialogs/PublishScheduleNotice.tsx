import React from "react";
import { PublishEntryConfirmDialogExtra } from "@webiny/app-headless-cms/exports/admin/cms.js";
import type { CmsContentEntry } from "@webiny/app-headless-cms-common/types/index.js";
import { ScheduleNoticeAlert } from "./ScheduleNoticeAlert.js";

/**
 * Decorates the "Publish entry" dialog to warn that publishing now will cancel an existing
 * scheduled action for the entry.
 */
export const PublishScheduleNoticeDecorator = PublishEntryConfirmDialogExtra.createDecorator(
    Original => {
        return function PublishEntryScheduleNotice(props: { entry: CmsContentEntry }) {
            return (
                <>
                    <ScheduleNoticeAlert targetId={props.entry?.id} verb={"Publishing"} />
                    <Original {...props} />
                </>
            );
        };
    }
);
