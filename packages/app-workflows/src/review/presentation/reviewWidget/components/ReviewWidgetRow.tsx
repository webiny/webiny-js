import React from "react";
import { FormComponentNote } from "@webiny/admin-ui";
import { Link } from "@webiny/admin-ui";
import { List } from "@webiny/admin-ui";
import { Tag } from "@webiny/admin-ui";
import { REVIEW_TAG_ICONS } from "~/review/presentation/targetReview/components/reviewBarAppearance.js";
import type { ReviewWidgetRowVm } from "../abstractions.js";

export interface ReviewWidgetRowProps {
    row: ReviewWidgetRowVm;
}

// One review of a dashboard widget: title (linked when the content is reachable), step dot and line, state.
export const ReviewWidgetRow = ({ row }: ReviewWidgetRowProps) => {
    let title: React.ReactNode = row.title;
    if (row.contentUrl) {
        title = (
            <Link to={row.contentUrl} variant="secondary">
                {row.title}
            </Link>
        );
    }

    let stepColor: string | undefined = undefined;
    if (row.stepColor !== null) {
        stepColor = row.stepColor;
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
        <List.Item
            data-testid={`review-widget-row-${row.reviewId}`}
            title={title}
            description={stepLine}
            colorMark={stepColor}
            actions={
                <>
                    <Tag variant={row.stateVariant} content={row.stateLabel} icon={stateIcon} />
                    <FormComponentNote className="mt-0 whitespace-nowrap" text={row.lastChange} />
                </>
            }
        />
    );
};
