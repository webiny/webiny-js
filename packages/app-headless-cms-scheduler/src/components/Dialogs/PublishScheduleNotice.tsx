import React from "react";
import { useNamedConfirmationDialog } from "@webiny/app-admin";
import { PublishEntryConfirmDialog } from "@webiny/app-headless-cms/exports/admin/cms.js";
import type { CmsContentEntry } from "@webiny/app-headless-cms-common/types/index.js";
import { ScheduleNoticeAlert } from "./ScheduleNoticeAlert.js";

/**
 * Decorates the "Publish entry" dialog to warn (via its `beforeContent` prop) that publishing now
 * will cancel an existing scheduled action for the entry.
 */
export const PublishScheduleNoticeDecorator = PublishEntryConfirmDialog.createDecorator(
    Original => {
        return function PublishEntryConfirmDialogWithNotice(props) {
            const { params } = useNamedConfirmationDialog<{ entry: CmsContentEntry }>();
            return (
                <Original
                    {...props}
                    beforeContent={
                        <>
                            {props.beforeContent}
                            <ScheduleNoticeAlert targetId={params.entry?.id} verb={"Publishing"} />
                        </>
                    }
                />
            );
        };
    }
);
