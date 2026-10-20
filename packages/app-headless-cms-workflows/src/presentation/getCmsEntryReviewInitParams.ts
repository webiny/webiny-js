import type { CmsContentEntry } from "@webiny/app-headless-cms-common/types/index.js";
import type { CmsModel } from "@webiny/app-headless-cms-common/types/index.js";
import type { IReviewContentReloader } from "@webiny/app-workflows/review/content/IReviewContentReloader.js";
import type { TargetReviewInitParams } from "@webiny/app-workflows/review/presentation/targetReview/abstractions.js";
import { createAppName } from "~/utils/appName.js";
import { getCmsEntryReviewContext } from "./getCmsEntryReviewContext.js";

export interface CmsEntryReviewInitInput {
    model: CmsModel;
    entry: CmsContentEntry;
    canRequest: boolean;
    contentReloader: IReviewContentReloader;
}

export function getCmsEntryReviewInitParams(
    input: CmsEntryReviewInitInput
): TargetReviewInitParams {
    const { model, entry, canRequest, contentReloader } = input;
    const context = getCmsEntryReviewContext(model, entry, canRequest);

    return {
        ...context,
        target: { namespace: createAppName(model), targetRevisionId: entry.id },
        contentReloader
    };
}
