import { DeleteEntryUseCase } from "@webiny/app-headless-cms/features/contentEntry/deleteEntry/abstractions.js";
import type { IDeleteEntryParams } from "@webiny/app-headless-cms/features/contentEntry/deleteEntry/abstractions.js";
import { ActiveReviewGuard } from "@webiny/app-workflows/review/trash/ActiveReviewGuard/abstractions.js";

class DeleteEntryUseCaseReviewDecoratorImpl implements DeleteEntryUseCase.Interface {
    constructor(
        private guard: ActiveReviewGuard.Interface,
        private decoratee: DeleteEntryUseCase.Interface
    ) {}

    async execute(params: IDeleteEntryParams): Promise<boolean> {
        return this.guard.run({
            action: () => this.decoratee.execute(params),
            revisionId: null
        });
    }
}

export const DeleteEntryUseCaseReviewDecorator = DeleteEntryUseCase.createDecorator({
    decorator: DeleteEntryUseCaseReviewDecoratorImpl,
    dependencies: [ActiveReviewGuard]
});
