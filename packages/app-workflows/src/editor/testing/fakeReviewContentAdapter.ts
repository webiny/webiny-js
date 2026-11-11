import { vi } from "vitest";
import type { IReviewContentAdapter } from "~/review/content/IReviewContentAdapter.js";
import type { ReviewContentRef } from "~/review/content/IReviewContentAdapter.js";

// A content adapter that handles every target and links it under `/content`.
export const createFakeContentAdapter = (): IReviewContentAdapter => {
    return {
        canHandle: vi.fn().mockReturnValue(true),
        getContentUrl: vi.fn((ref: ReviewContentRef) => {
            return `/content/${ref.targetId}/${ref.targetRevisionId}`;
        }),
        getContentTypeLabel: vi.fn().mockReturnValue(null),
        renderContentTypeIcon: vi.fn().mockReturnValue(null)
    };
};
