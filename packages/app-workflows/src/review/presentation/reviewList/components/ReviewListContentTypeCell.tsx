import React from "react";
import type { ReviewListRowVm } from "../abstractions.js";

export interface ReviewListContentTypeCellProps {
    row: ReviewListRowVm;
}

// One line, the type name only, so rows keep the compact height; the app shows in the Filter picker.
export const ReviewListContentTypeCell = ({ row }: ReviewListContentTypeCellProps) => {
    return <>{row.contentTypeLabel ?? ""}</>;
};
