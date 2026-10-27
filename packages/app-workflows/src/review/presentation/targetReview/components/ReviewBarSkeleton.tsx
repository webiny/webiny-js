import React from "react";
import { Skeleton } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";
import { cn } from "@webiny/admin-ui";
import { REVIEW_BAR_FRAME_CLASSES } from "./reviewBarAppearance.js";
import type { ReviewBarLayout } from "./ReviewBarLayout.js";

export interface ReviewBarSkeletonProps {
    layout?: ReviewBarLayout;
}

// The bar while the review status loads (QBZ-1): a tile, two lines and the loading text.
export const ReviewBarSkeleton = ({ layout = "card" }: ReviewBarSkeletonProps) => {
    return (
        <div
            data-role="review-bar-skeleton"
            role="status"
            aria-busy="true"
            className={cn("flex items-center gap-sm-plus", REVIEW_BAR_FRAME_CLASSES[layout])}
        >
            <Skeleton type={"area"} className={"h-[32px] w-[32px] shrink-0"} />
            <div className={"flex grow flex-col gap-xs"}>
                <Skeleton type={"text"} size={"sm"} className={"w-1/3"} />
                <Skeleton type={"text"} size={"xs"} className={"w-2/3"} />
            </div>
            <Text size={"sm"} className={"text-neutral-muted"}>
                {"Loading review status…"}
            </Text>
        </div>
    );
};
