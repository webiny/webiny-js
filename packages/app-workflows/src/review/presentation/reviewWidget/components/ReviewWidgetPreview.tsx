import React from "react";
import { List } from "@webiny/admin-ui";
import { SegmentedControl } from "@webiny/admin-ui";
import { Widget } from "@webiny/admin-ui";
import { ReactComponent as ArrowForwardIcon } from "@webiny/icons/arrow_forward.svg";
import type { ReviewWidgetRowVm } from "../abstractions.js";
import { ReviewWidgetRow } from "./ReviewWidgetRow.js";

export interface ReviewWidgetPreviewProps {
    title: string;
    icon: React.ReactElement;
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
export const ReviewWidgetPreview = ({
    title,
    icon,
    showSegment,
    rows
}: ReviewWidgetPreviewProps) => {
    let segment: React.ReactNode = null;
    if (showSegment) {
        segment = <SegmentedControl items={SEGMENTS} value={"assignedToMe"} onChange={noop} />;
    }

    return (
        <Widget
            variant="base"
            outline
            elevation="sm"
            title={title}
            icon={<Widget.Icon icon={icon} label={`${title} icon`} />}
            padding="sm"
            bodyPadding={false}
            headerActions={segment}
            footerEndActions={
                <Widget.Action
                    variant="ghost"
                    size="sm"
                    icon={<ArrowForwardIcon />}
                    iconPosition="end"
                    text="View all"
                />
            }
        >
            <List>
                {rows.map(row => (
                    <ReviewWidgetRow key={row.reviewId} row={row} />
                ))}
            </List>
        </Widget>
    );
};
