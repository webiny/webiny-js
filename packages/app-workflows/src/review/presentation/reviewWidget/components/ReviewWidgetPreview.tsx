import React from "react";
import { SegmentedControl } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";
import type { ReviewWidgetRowVm } from "../abstractions.js";
import { ReviewWidgetRow } from "./ReviewWidgetRow.js";

export interface ReviewWidgetPreviewProps {
    title: string;
    showSegment: boolean;
    rows: ReviewWidgetRowVm[];
}

const SEGMENTS = [
    { label: "Assigned to me", value: "assignedToMe" },
    { label: "Team pool", value: "pool" }
];

const noop = () => {
    return;
};

/*
 * The review widget card with sample rows, for the dashboard "Add widget" drawer. The real widget
 * loads reviews, which the drawer must not do for a picture.
 */
export const ReviewWidgetPreview = ({ title, showSegment, rows }: ReviewWidgetPreviewProps) => {
    let segment: React.ReactNode = null;
    if (showSegment) {
        segment = <SegmentedControl items={SEGMENTS} value={"assignedToMe"} onChange={noop} />;
    }

    return (
        <div className="flex flex-col min-h-[300px] rounded-lg bg-neutral-base">
            <div className="flex items-center gap-md px-md py-sm">
                <Text className="flex-1 font-semibold">{title}</Text>
                {segment}
            </div>
            <div className="flex-1 flex flex-col border-t-sm border-solid border-neutral-dimmed">
                <ul className="list-none m-0 p-0">
                    {rows.map(row => (
                        <ReviewWidgetRow key={row.reviewId} row={row} />
                    ))}
                </ul>
            </div>
            <div className="px-md py-sm text-right">
                <Text>View all →</Text>
            </div>
        </div>
    );
};
