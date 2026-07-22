import React from "react";
import { useNamedConfirmationDialog } from "@webiny/app-admin";
import { UnpublishEntryConfirmDialog } from "@webiny/app-headless-cms/exports/admin/cms.js";
import { ScheduleNoticeAlert } from "./ScheduleNoticeAlert.js";

/**
 * Decorates the "Unpublish entry" dialog to warn (via its `beforeContent` prop) that unpublishing
 * now will cancel an existing scheduled action for the entry.
 */
export const UnpublishScheduleNoticeDecorator = UnpublishEntryConfirmDialog.createDecorator(
    Original => {
        return function UnpublishEntryConfirmDialogWithNotice(props) {
            const { params } = useNamedConfirmationDialog<{ entryId: string }>();
            return (
                <Original
                    {...props}
                    beforeContent={
                        <>
                            {props.beforeContent}
                            <ScheduleNoticeAlert targetId={params.entryId} verb={"Unpublishing"} />
                        </>
                    }
                />
            );
        };
    }
);
