import React from "react";
import { Link } from "@webiny/admin-ui";
import { Tag } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";
import { REVIEW_TAG_ICONS } from "~/review/presentation/targetReview/components/reviewBarAppearance.js";
import type { ReviewWidgetRowVm } from "../abstractions.js";

export interface ReviewWidgetRowProps {
    row: ReviewWidgetRowVm;
}

// One review of a dashboard widget: title (linked when the content is reachable), step dot and line, state.
export const ReviewWidgetRow = ({ row }: ReviewWidgetRowProps) => {
    let title: React.ReactNode = <Text className="font-medium">{row.title}</Text>;
    if (row.contentUrl) {
        title = (
            <Link to={row.contentUrl} variant="secondary">
                {row.title}
            </Link>
        );
    }

    let stepDot: React.ReactNode = null;
    if (row.stepColor !== null) {
        stepDot = (
            <span
                data-testid="review-widget-step-dot"
                className="inline-block size-[8px] shrink-0 rounded-full"
                style={{ backgroundColor: row.stepColor }}
            />
        );
    }

    const stepParts: string[] = [];
    if (row.stepTitle) {
        stepParts.push(row.stepTitle);
    }
    if (row.contentType) {
        stepParts.push(row.contentType);
    }
    let stepLine = stepParts.join(" · ");
    if (stepLine && row.app) {
        stepLine = `${stepLine} (${row.app})`;
    }

    let stateIcon: React.ReactElement | undefined = undefined;
    if (row.stateIcon) {
        const StateIcon = REVIEW_TAG_ICONS[row.stateIcon];
        stateIcon = <StateIcon />;
    }

    return (
        <li
            data-testid={`review-widget-row-${row.reviewId}`}
            className="flex items-center gap-md px-md py-sm border-b-sm border-solid border-neutral-dimmed"
        >
            <div className="flex-1 min-w-0 flex flex-col gap-xxs">
                {title}
                <div className="flex items-center gap-xs">
                    {stepDot}
                    <Text size="sm" className="text-neutral-strong">
                        {stepLine}
                    </Text>
                </div>
            </div>
            <Tag variant={row.stateVariant} content={row.stateLabel} icon={stateIcon} />
            <Text size="sm" className="text-neutral-muted">
                {row.lastChange}
            </Text>
        </li>
    );
};
