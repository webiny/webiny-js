import React, { useId } from "react";
import { BulkActionButton } from "@webiny/app-admin/components/BulkActions/index.js";
import { ReactComponent as PublishIcon } from "@webiny/icons/visibility.svg";
import { ignoreAction } from "../ignoreAction.js";

export interface BulkPublishBlockedProps {
    reason: string;
}

/*
 * The bulk "Publish" shown disabled, with the reason as its tooltip and for assistive technology.
 */
export const BulkPublishBlocked = ({ reason }: BulkPublishBlockedProps) => {
    const descriptionId = useId();

    return (
        <span aria-describedby={descriptionId}>
            <BulkActionButton
                text="Publish"
                tooltipContent={reason}
                icon={<PublishIcon />}
                disabled={true}
                onClick={ignoreAction}
                data-testid={"cms.bulk.publish.blocked"}
            />
            <span id={descriptionId} className={"sr-only"}>
                {reason}
            </span>
        </span>
    );
};
