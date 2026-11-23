import React, { useId } from "react";
import { BulkActionButton } from "@webiny/app-admin/components/BulkActions/index.js";
import { ReactComponent as PublishIcon } from "@webiny/icons/visibility.svg";
import { ignoreAction } from "./ignoreAction.js";

export interface PageBulkPublishBlockedProps {
    reason: string;
}

/*
 * The bulk "Publish" shown disabled, with the reason as its tooltip and for assistive technology.
 */
export const PageBulkPublishBlocked = ({ reason }: PageBulkPublishBlockedProps) => {
    const descriptionId = useId();

    return (
        <span aria-describedby={descriptionId}>
            <BulkActionButton
                text="Publish"
                tooltipContent={reason}
                icon={<PublishIcon />}
                disabled={true}
                onClick={ignoreAction}
                data-testid={"wb.page-list.bulk.publish.blocked"}
            />
            <span id={descriptionId} className={"sr-only"}>
                {reason}
            </span>
        </span>
    );
};
