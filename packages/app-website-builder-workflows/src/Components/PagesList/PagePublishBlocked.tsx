import React, { useId } from "react";
import { Tooltip } from "@webiny/admin-ui";
import { OptionsMenuItem } from "@webiny/app-admin";
import { ReactComponent as PublishIcon } from "@webiny/icons/visibility.svg";
import { ignoreAction } from "./ignoreAction.js";

export interface PagePublishBlockedProps {
    reason: string;
}

/*
 * The row's "Publish" shown disabled, with the reason on hover and for assistive technology (the
 * same pattern as the blocked "Move").
 */
export const PagePublishBlocked = ({ reason }: PagePublishBlockedProps) => {
    const descriptionId = useId();

    return (
        <span aria-describedby={descriptionId}>
            <Tooltip
                content={reason}
                trigger={
                    <OptionsMenuItem
                        icon={<PublishIcon />}
                        label={"Publish"}
                        disabled={true}
                        onAction={ignoreAction}
                        data-testid={"wb.page-list.page-action.publish.blocked"}
                    />
                }
            />
            <span id={descriptionId} className={"sr-only"}>
                {reason}
            </span>
        </span>
    );
};
