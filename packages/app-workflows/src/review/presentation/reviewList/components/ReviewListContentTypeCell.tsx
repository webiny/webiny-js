import React from "react";
import { FormComponentNote } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";
import type { ReviewListRowVm } from "../abstractions.js";

export interface ReviewListContentTypeCellProps {
    row: ReviewListRowVm;
}

export const ReviewListContentTypeCell = ({ row }: ReviewListContentTypeCellProps) => {
    return (
        <div>
            <Text as="div">{row.contentTypeLabel ?? ""}</Text>
            <FormComponentNote className="mt-0" text={row.contentTypeApp} />
        </div>
    );
};
