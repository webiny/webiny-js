import type React from "react";
import type { ReviewContentRef } from "~/review/content/IReviewContentAdapter.js";
import type { ReviewListRow } from "~/review/domain/types.js";
import type { IReviewRowBinding } from "./abstractions.js";
import type { IReviewRowProvider } from "./abstractions.js";

export interface ResolvedRowBinding {
    binding: IReviewRowBinding | null;
    contentUrl: string | null;
    contentTypeLabel: string | null;
    contentTypeIcon: React.ReactNode;
}

/*
 * The app binding of a row and what it gives the row: the content URL and the content type label.
 * An unbound namespace (or no provider) gives nothing, so its row has no link and no actions (R206).
 * Shared by the list and the widget presenters.
 */
export const resolveRowBinding = (
    provider: IReviewRowProvider | null,
    row: ReviewListRow
): ResolvedRowBinding => {
    const binding = provider ? provider.getBinding(row.namespace) : null;
    if (!binding) {
        return { binding: null, contentUrl: null, contentTypeLabel: null, contentTypeIcon: null };
    }

    const ref: ReviewContentRef = {
        namespace: row.namespace,
        targetId: row.targetId,
        targetRevisionId: row.targetRevisionId,
        contentTypeId: row.contentTypeId
    };

    let contentTypeLabel: string | null = null;
    let contentTypeIcon: React.ReactNode = null;
    if (row.contentTypeId) {
        contentTypeLabel = binding.getContentTypeLabel(row.contentTypeId);
        contentTypeIcon = binding.renderContentTypeIcon(row.contentTypeId);
    }

    return { binding, contentUrl: binding.getContentUrl(ref), contentTypeLabel, contentTypeIcon };
};
