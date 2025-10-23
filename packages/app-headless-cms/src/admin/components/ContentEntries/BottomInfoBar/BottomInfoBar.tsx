import React from "react";
import { Separator } from "@webiny/admin-ui";
import { ListMeta } from "./ListMeta.js";
import { ListStatus } from "./ListStatus.js";

interface BottomInfoBarProps {
    loading: boolean;
    loadingMore: boolean;
    totalCount: number;
    currentCount: number;
}

export const BottomInfoBar = (props: BottomInfoBarProps) => {
    return (
        <div className="sticky bottom-0 z-5 bg-neutral-base w-full transform translate-z-0 overflow-hidden">
            <Separator />
            <div
                className={
                    "h-xl px-md py-sm flex items-center justify-between"
                }
            >
                <ListMeta
                    loading={props.loading}
                    totalCount={props.totalCount}
                    currentCount={props.currentCount}
                />
                <ListStatus loading={props.loadingMore} />
            </div>
        </div>
    );
};
