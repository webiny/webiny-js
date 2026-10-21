import React from "react";
import { Button } from "@webiny/admin-ui";

export interface ReviewListNoticeProps {
    message: string;
    onShow: () => void;
}

// "New reviews are available." with Show (QBZ-71, QBZ-86).
export const ReviewListNotice = ({ message, onShow }: ReviewListNoticeProps) => {
    return (
        <div
            role="status"
            className="flex items-center gap-sm px-md py-xs mb-sm rounded-md bg-primary-subtle text-md text-neutral-primary"
        >
            <span className="flex-1">{message}</span>
            <Button size="sm" variant="tertiary" text="Show" onClick={onShow} />
        </div>
    );
};
