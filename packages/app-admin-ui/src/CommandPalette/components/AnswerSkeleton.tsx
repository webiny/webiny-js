import React from "react";
import { Skeleton } from "@webiny/admin-ui";

/**
 * Stands in for the answer while the request is in flight. Staggered widths read as prose rather
 * than as a progress bar, which is honest: we cannot show real progress without streaming.
 */
export const AnswerSkeleton = () => (
    <div className="flex flex-col gap-xs">
        <Skeleton type="text" size="xs" className="w-[78%]" />
        <Skeleton type="text" size="xs" className="w-[92%]" />
        <Skeleton type="text" size="xs" className="w-[54%]" />
    </div>
);
