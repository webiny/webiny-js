import { useState } from "react";
import { useRoute } from "@webiny/app";

// The query parameter a notification's "View review details" link carries.
export const REVIEW_DETAILS_LINK_PARAM = "reviewId";

export interface ReviewDetailsLinkParam {
    // The `reviewId` the editor was opened with, read once on mount; `null` when there was none.
    reviewId: string | null;
    // Removes `reviewId` from the location with a history replace; nothing when it is gone.
    clear(): void;
}

const readReviewId = (params: Record<string, unknown> | undefined): string | null => {
    const value = params?.[REVIEW_DETAILS_LINK_PARAM];
    return typeof value === "string" && value.trim() !== "" ? value : null;
};

/*
 * The review details link of a notification e-mail: the content's editor URL with `reviewId`
 * (CMS entries and Website Builder pages alike). The editor opens the Review details drawer for
 * it and calls `clear` when the drawer closes, so a reload does not open it again.
 */
export const useReviewDetailsLinkParam = (): ReviewDetailsLinkParam => {
    const { route, replaceRouteParams } = useRoute();
    const [reviewId] = useState<string | null>(() => readReviewId(route?.params));
    const hasParam = readReviewId(route?.params) !== null;

    const clear = () => {
        if (!hasParam) {
            return;
        }
        replaceRouteParams((current: Record<string, unknown>) => {
            const next = { ...current };
            delete next[REVIEW_DETAILS_LINK_PARAM];
            return next;
        });
    };

    return { reviewId, clear };
};
