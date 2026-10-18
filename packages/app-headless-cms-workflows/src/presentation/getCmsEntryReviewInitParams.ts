import type { CmsContentEntry } from "@webiny/app-headless-cms-common/types/index.js";
import type { CmsModel } from "@webiny/app-headless-cms-common/types/index.js";
import type { IReviewContentReloader } from "@webiny/app-workflows/review/content/IReviewContentReloader.js";
import type { TargetReviewInitParams } from "@webiny/app-workflows/review/presentation/targetReview/abstractions.js";
import type { IReviewUseCases } from "@webiny/app-workflows/review/useCases/IReviewUseCases.js";
import { createAppName } from "~/utils/appName.js";
import { getCmsEntryReviewContext } from "./getCmsEntryReviewContext.js";

export interface CmsEntryReviewInitInput {
    model: CmsModel;
    entry: CmsContentEntry;
    useCases: IReviewUseCases;
    canRequest: boolean;
    contentReloader: IReviewContentReloader;
}

export function getCmsEntryReviewInitParams(
    input: CmsEntryReviewInitInput
): TargetReviewInitParams {
    const { model, entry, useCases, canRequest, contentReloader } = input;
    const context = getCmsEntryReviewContext(model, entry, canRequest);

    return {
        ...context,
        useCases,
        target: { namespace: createAppName(model), targetRevisionId: entry.id },
        contentReloader
    };
}
