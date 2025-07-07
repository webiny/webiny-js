import React from "react";
import { Margin } from "./Margin";
import { Padding } from "./Padding";

export const MarginPaddingControl = ({ elementId }: { elementId: string }) => {
    return (
        <div className="wby-bg-neutral-light wby-text-neutral-strong wby-w-full wby-rounded-md wby-border-sm wby-border-neutral-muted">
            <Margin elementId={elementId}>
                <Padding elementId={elementId} />
            </Margin>
        </div>
    );
};
