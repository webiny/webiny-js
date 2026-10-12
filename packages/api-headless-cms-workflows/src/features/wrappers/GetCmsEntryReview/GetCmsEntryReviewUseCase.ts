import { Result } from "@webiny/feature/api";
import { getReviewViewerFlags } from "@webiny/api-workflows/domain/review/getReviewViewerFlags.js";
import { CmsEntryReviewGuardService } from "../CmsEntryReviewGuardService/index.js";
import { GetCmsEntryReviewUseCase as UseCase } from "./abstractions.js";

class GetCmsEntryReviewUseCaseImpl implements UseCase.Interface {
    public constructor(private guard: CmsEntryReviewGuardService.Interface) {}

    public async execute(input: UseCase.Input): UseCase.Return {
        const authorized = await this.guard.authorize({
            reviewId: input.id,
            action: "view this review"
        });
        if (authorized.isFail()) {
            return Result.fail(authorized.error);
        }

        // The guard has proven read access to the target, so the viewer flags apply as they are.
        const { review, viewer } = authorized.value;
        return Result.ok({ review, flags: getReviewViewerFlags(review, viewer) });
    }
}

export const GetCmsEntryReviewUseCase = UseCase.createImplementation({
    implementation: GetCmsEntryReviewUseCaseImpl,
    dependencies: [CmsEntryReviewGuardService]
});
