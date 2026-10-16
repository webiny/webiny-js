import React from "react";
import { Skeleton } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";

// The bar while the review status loads (QBZ-1): a tile, two lines and the loading text.
export const ReviewBarSkeleton = () => {
    return (
        <div
            data-role="review-bar-skeleton"
            role="status"
            aria-busy="true"
            className={
                "mx-md my-md flex items-center gap-sm-plus rounded-lg bg-neutral-base p-md shadow-sm"
            }
        >
            <Skeleton type={"area"} className={"h-[32px] w-[32px] shrink-0"} />
            <div className={"flex grow flex-col gap-xs"}>
                <Skeleton type={"text"} size={"sm"} className={"w-1/3"} />
                <Skeleton type={"text"} size={"xs"} className={"w-2/3"} />
            </div>
            <Text size={"sm"}>{"Loading review status…"}</Text>
        </div>
    );
};
