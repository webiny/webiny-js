import React from "react";
import { Link } from "@webiny/admin-ui";
import type { ReviewListRowVm } from "../abstractions.js";

export interface ReviewListNameCellProps {
    row: ReviewListRowVm;
}

export const ReviewListNameCell = ({ row }: ReviewListNameCellProps) => {
    let title: React.ReactNode = row.title;
    if (row.contentUrl) {
        title = (
            <Link to={row.contentUrl} variant="secondary">
                {row.title}
            </Link>
        );
    }

    return (
        <div
            className="flex items-center gap-sm"
            data-highlighted={row.highlighted ? "" : undefined}
            data-review-id={row.reviewId}
        >
            {row.contentTypeIcon}
            {title}
        </div>
    );
};
