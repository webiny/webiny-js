import { DeleteEntryRevisionUseCase } from "@webiny/app-headless-cms/features/contentEntry/deleteEntryRevision/abstractions.js";
import type { IDeleteEntryRevisionParams } from "@webiny/app-headless-cms/features/contentEntry/deleteEntryRevision/abstractions.js";
import { ActiveReviewGuard } from "@webiny/app-workflows/review/trash/ActiveReviewGuard/abstractions.js";
import { CmsReviewUseCases } from "~/features/gateway/CmsReviewUseCases/abstractions.js";

class DeleteEntryRevisionUseCaseReviewDecoratorImpl
    implements DeleteEntryRevisionUseCase.Interface
{
    constructor(
        private guard: ActiveReviewGuard.Interface,
        private useCases: CmsReviewUseCases.Interface,
        private decoratee: DeleteEntryRevisionUseCase.Interface
    ) {}

    async execute(params: IDeleteEntryRevisionParams): Promise<boolean> {
        return this.guard.run({
            action: () => this.decoratee.execute(params),
            useCases: this.useCases,
            revisionId: params.revisionId
        });
    }
}

export const DeleteEntryRevisionUseCaseReviewDecorator = DeleteEntryRevisionUseCase.createDecorator(
    {
        decorator: DeleteEntryRevisionUseCaseReviewDecoratorImpl,
        dependencies: [ActiveReviewGuard, CmsReviewUseCases]
    }
);
