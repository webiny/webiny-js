import type React from "react";

export interface ReviewContentRef {
    namespace: string;
    targetId: string;
    targetRevisionId: string;
    contentTypeId: string | null;
}

/*
 * The only per-app content knowledge besides gateways and cache writers (R224). Built from route
 * path strings, no hooks, so handlers can use it.
 */
export interface IReviewContentAdapter {
    canHandle(namespace: string): boolean;
    getContentUrl(ref: ReviewContentRef): string;
    getContentTypeLabel(contentTypeId: string): string | null;
    renderContentTypeIcon(contentTypeId: string): React.ReactNode;
}
