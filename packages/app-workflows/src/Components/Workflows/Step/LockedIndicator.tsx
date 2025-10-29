import React from "react";
import { ReactComponent as LockIcon } from "@webiny/icons/lock.svg";
import { Tooltip } from "@webiny/admin-ui";

export interface ILockedIndicatorProps {
    content: string;
}

export const LockedIndicator = ({ content }: ILockedIndicatorProps) => {
    return (
        <Tooltip.Provider>
            <Tooltip
                trigger={<LockIcon />}
                content={content}
                align="center"
                side="top"
                showArrow={true}
            />
        </Tooltip.Provider>
    );
};
