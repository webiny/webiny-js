import { useFeature } from "@webiny/app";
import type { CmsEntryReview } from "./CmsEntryReview.js";
import { CmsEntryReviewFeature } from "./feature.js";

export function useCmsEntryReview(): CmsEntryReview.Interface {
    return useFeature(CmsEntryReviewFeature).session;
}
