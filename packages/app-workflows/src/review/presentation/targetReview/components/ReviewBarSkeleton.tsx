import React from "react";
import { Skeleton } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";
import { ReviewBarFrame } from "./ReviewBarFrame.js";
import type { ReviewBarLayout } from "./ReviewBarLayout.js";

export interface ReviewBarSkeletonProps {
    layout?: ReviewBarLayout;
}

// The bar while the review status loads (QBZ-1): a tile, two lines and the loading text.
export const ReviewBarSkeleton = ({ layout = "card" }: ReviewBarSkeletonProps) => {
    return (
        <ReviewBarFrame
            layout={layout}
            data-role="review-bar-skeleton"
            role="status"
            aria-busy="true"
        >
            <div className={"flex items-center gap-sm-plus"}>
                <Skeleton type={"area"} size={"xl"} className={"w-xl shrink-0"} />
                <div className={"flex grow flex-col gap-xs"}>
                    <Skeleton type={"text"} size={"sm"} className={"w-1/3"} />
                    <Skeleton type={"text"} size={"xs"} className={"w-2/3"} />
                </div>
                <Text size={"sm"}>{"Loading review status…"}</Text>
            </div>
        </ReviewBarFrame>
    );
};
