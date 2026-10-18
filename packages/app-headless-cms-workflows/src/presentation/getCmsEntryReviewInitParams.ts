import type { CmsContentEntry } from "@webiny/app-headless-cms-common/types/index.js";
import type { CmsModel } from "@webiny/app-headless-cms-common/types/index.js";
import type { TargetReviewInitParams } from "@webiny/app-workflows/review/presentation/targetReview/abstractions.js";
import type { IReviewUseCases } from "@webiny/app-workflows/review/useCases/IReviewUseCases.js";
import { createAppName } from "~/utils/appName.js";
import { getCmsEntryReviewContext } from "./getCmsEntryReviewContext.js";

export interface CmsEntryReviewInitInput {
    model: CmsModel;
    entry: CmsContentEntry;
    useCases: IReviewUseCases;
    canRequest: boolean;
}

export function getCmsEntryReviewInitParams(
    input: CmsEntryReviewInitInput
): TargetReviewInitParams {
    const { model, entry, useCases, canRequest } = input;
    const context = getCmsEntryReviewContext(model, entry, canRequest);

    return {
        ...context,
        useCases,
        target: { namespace: createAppName(model), targetRevisionId: entry.id },
        // Task 17 replaces this with the CMS content reloader.
        contentReloader: null
    };
}
