import React from "react";
import { Link } from "@webiny/admin-ui";
import { Tag } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";
import type { ReviewWidgetRowVm } from "../abstractions.js";

export interface ReviewWidgetRowProps {
    row: ReviewWidgetRowVm;
}

// One review of a dashboard widget: title (linked when the content is reachable), step line, state.
export const ReviewWidgetRow = ({ row }: ReviewWidgetRowProps) => {
    let title: React.ReactNode = <Text className="font-medium">{row.title}</Text>;
    if (row.contentUrl) {
        title = (
            <Link to={row.contentUrl} variant="secondary">
                {row.title}
            </Link>
        );
    }

    return (
        <li className="flex items-center gap-md px-md py-sm border-b-sm border-solid border-neutral-dimmed">
            <div className="flex-1 min-w-0 flex flex-col gap-xxs">
                {title}
                <Text size="sm" className="text-neutral-strong">
                    {row.stepLine}
                </Text>
            </div>
            <Tag variant={row.stateVariant} content={row.stateLabel} />
            <Text size="sm" className="text-neutral-muted">
                {row.lastChange}
            </Text>
        </li>
    );
};
