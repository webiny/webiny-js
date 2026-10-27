import type { CmsModel } from "@webiny/api-headless-cms/types/index.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { ReviewModelProvider as ReviewModelProviderAbstraction } from "~/domain/review/abstractions/ReviewModelProvider.js";
import { REVIEW_MODEL_ID } from "~/constants.js";

/** Same contract as `WorkflowModelProvider`: no memoization, no `withoutAuthorization`. */
class ReviewModelProviderImpl implements ReviewModelProviderAbstraction.Interface {
    constructor(private getModel: GetModelUseCase.Interface) {}

    async get(): Promise<CmsModel> {
        const result = await this.getModel.execute(REVIEW_MODEL_ID);
        if (result.isFail()) {
            throw result.error;
        }
        return result.value;
    }
}

export const ReviewModelProvider = ReviewModelProviderAbstraction.createImplementation({
    implementation: ReviewModelProviderImpl,
    dependencies: [GetModelUseCase]
});
